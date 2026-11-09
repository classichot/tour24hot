import type { AuditEvent, Channel, Company, DomainError, IosState, ItineraryDay, Member, QuoteLine, QuoteVersion, Rate, Result, Settings, Task, TripFile } from "./types";
import {
  addBusinessDays,
  addDays,
  approvalReasons,
  can,
  canManageTrip,
  effectiveQuoteStatus,
  fmtDate,
  quoteHash,
  sendBlockers,
  todayIn,
  type Capability,
} from "./rules";

/**
 * Domain actions. Each takes the current state and the acting member and returns a new state or a
 * typed error. Permission, version and transition rules live here, never only in the UI (§13, ARC01).
 * In the production build these become server endpoints (§15) with the same rules.
 */

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

export const fail = (code: DomainError["code"], message: string, extra: Partial<DomainError> = {}): { ok: false; error: DomainError } => ({ ok: false, error: { code, message, ...extra } });
export const ok = <T>(state: IosState, value: T): Result<T> => ({ ok: true, value, state });

export function audit(state: IosState, e: Omit<AuditEvent, "id" | "at">, at: string): IosState {
  return { ...state, audit: [{ ...e, id: uid(), at }, ...state.audit].slice(0, 2000) };
}

export function need(actor: Member | undefined, cap: Capability) {
  return can(actor, cap) ? null : fail("forbidden", "Your role does not allow this action.");
}

export function putTrip(state: IosState, trip: TripFile): IosState {
  return { ...state, trips: state.trips.map((t) => (t.id === trip.id ? trip : t)) };
}

export function getTrip(state: IosState, id: string) {
  return state.trips.find((t) => t.id === id);
}

/** Optimistic concurrency (UX09): refuse stale writes and report what changed. */
export function checkVersion(trip: TripFile, expected: number | undefined, fields: string[]) {
  if (expected === undefined || expected === trip.version) return null;
  return fail("conflict", "Someone else changed this trip after you opened it. Review their changes, then reload or merge.", {
    changed: fields.map((f) => ({ field: f, theirs: String((trip as unknown as Record<string, unknown>)[f] ?? "—") })),
  });
}

function nextRef(state: IosState, nowIso: string) {
  const n = state.seq.trip + 1;
  return { ref: `T24-${nowIso.slice(2, 4)}${nowIso.slice(5, 7)}-${String(n).padStart(4, "0")}`, seq: { ...state.seq, trip: n } };
}

export function upsertTask(state: IosState, task: Task): IosState {
  if (task.ruleKey) {
    const existing = state.tasks.find((t) => t.ruleKey === task.ruleKey && t.status !== "done" && t.status !== "cancelled");
    if (existing) return state;
  }
  return { ...state, tasks: [task, ...state.tasks] };
}

export function closeRuleTasks(state: IosState, prefix: string, by: string, at: string, text: string): IosState {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.ruleKey?.startsWith(prefix) && t.status !== "done" && t.status !== "cancelled"
        ? { ...t, status: "done", history: [{ at, by, text }, ...t.history], version: t.version + 1 }
        : t
    ),
  };
}

/* ── Setup (first use) ── */

export function setupCompany(state: IosState, settings: Omit<Settings, "setupDone">, members: Member[], now: string): Result {
  if (!settings.companyName.trim()) return fail("invalid", "Enter the company name.", { fieldErrors: [{ field: "companyName", message: "Required" }] });
  if (!members.some((m) => m.role === "manager")) return fail("invalid", "Add at least one owner or manager.", { fieldErrors: [{ field: "members", message: "Needs a manager" }] });
  let next: IosState = { ...state, settings: { ...settings, setupDone: true }, members };
  next = audit(next, { actorId: members[0].id, action: "settings.setup", recordType: "settings", recordId: "company", summary: `Company set up: ${settings.companyName}, ${settings.country}, ${settings.currency}, ${settings.timezone}` }, now);
  return ok(next, undefined);
}

export function saveSettings(state: IosState, actor: Member | undefined, patch: Partial<Settings>, now: string): Result {
  const denied = need(actor, "settings.manage");
  if (denied) return denied;
  const changes = Object.entries(patch)
    .filter(([k, v]) => (state.settings as unknown as Record<string, unknown>)[k] !== v)
    .map(([k, v]) => ({ field: k, from: String((state.settings as unknown as Record<string, unknown>)[k]), to: String(v) }));
  let next: IosState = { ...state, settings: { ...state.settings, ...patch } };
  next = audit(next, { actorId: actor!.id, action: "settings.update", recordType: "settings", recordId: "company", summary: "Company settings updated", changes }, now);
  return ok(next, undefined);
}

export function saveMembers(state: IosState, actor: Member | undefined, members: Member[], now: string): Result {
  const denied = need(actor, "settings.manage");
  if (denied) return denied;
  if (!members.some((m) => m.role === "manager")) return fail("invalid", "Keep at least one owner or manager.");
  let next: IosState = { ...state, members };
  next = audit(next, { actorId: actor!.id, action: "member.update", recordType: "member", recordId: "staff", summary: `Staff and roles updated (${members.length} people)` }, now);
  return ok(next, undefined);
}

/* ── Enquiries (§5) ── */

export type EnquiryInput = Partial<Omit<TripFile, "id" | "ref" | "createdAt" | "updatedAt" | "createdBy" | "version" | "quotes" | "notes" | "itinerary" | "itineraryVersion" | "commercial" | "operational" | "financial">> & {
  name?: string;
  source: TripFile["source"];
  itinerary?: ItineraryDay[];
};

export function createEnquiry(state: IosState, actor: Member | undefined, input: EnquiryInput, now: string, idempotencyKey?: string): Result<TripFile> {
  const denied = need(actor, "enquiry.create");
  if (denied) return denied;
  if (idempotencyKey) {
    const prior = state.trips.find((t) => t.idempotencyKey === idempotencyKey);
    if (prior) return ok(state, prior); // exact retry reuses the original record (ENQ06)
  }
  const { ref, seq } = nextRef(state, now);
  const dests = input.destinations?.filter(Boolean) ?? [];
  const name = input.name?.trim() || `Enquiry ${ref}${dests.length ? ` · ${dests.join(", ")}` : ""}`;
  const trip: TripFile = {
    id: uid(),
    ref,
    name,
    team: input.team ?? "sales",
    destinations: dests,
    ownerId: input.ownerId,
    partnerId: input.partnerId,
    directContact: input.directContact,
    startDate: input.startDate,
    endDate: input.endDate,
    flexibleDates: input.flexibleDates,
    adults: input.adults,
    children: input.children,
    infants: input.infants,
    language: input.language,
    arrival: input.arrival,
    departure: input.departure,
    hotelPref: input.hotelPref,
    roomNeeds: input.roomNeeds,
    dietary: input.dietary,
    accessibility: input.accessibility,
    budget: input.budget,
    externalRef: input.externalRef,
    source: input.source,
    commercial: "enquiry",
    operational: "not_started",
    financial: "open",
    qual: { nextFollowUp: input.qual?.nextFollowUp, leadSource: input.qual?.leadSource ?? input.source.channel },
    itinerary: (input.itinerary ?? []).map((d) => ({ ...d, services: d.services.map((x) => ({ ...x, specVersion: x.specVersion ?? 1 })) })),
    itineraryVersion: 1,
    quotes: [],
    notes: [],
    reservations: [],
    guests: [],
    guestsVersion: 1,
    documents: [],
    incidents: [],
    changes: [],
    sample: input.sample,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
    createdBy: actor!.id,
    version: 1,
  };
  let next: IosState = { ...state, seq, trips: [trip, ...state.trips] };
  next = upsertTask(next, {
    id: uid(),
    type: "first_response",
    title: `First response to ${name}`,
    tripId: trip.id,
    tab: "overview",
    ownerId: trip.ownerId,
    team: "sales",
    due: addBusinessDays(now, state.settings.firstResponseBizDays),
    priority: "high",
    status: "open",
    ruleKey: `first_response:${trip.id}`,
    history: [{ at: now, by: actor!.id, text: "Created by company policy: first response within " + state.settings.firstResponseBizDays + " business day(s)" }],
    version: 1,
  });
  next = audit(next, { actorId: actor!.id, action: "trip.created", recordType: "trip", recordId: trip.id, tripId: trip.id, summary: `Enquiry ${ref} created from ${input.source.channel}` }, now);
  return ok(next, trip);
}

const COMMERCIAL_FIELDS = ["startDate", "endDate", "adults", "children", "infants", "destinations"];

export function updateTrip(state: IosState, actor: Member | undefined, id: string, expectedVersion: number, patch: Partial<TripFile>, now: string): Result<TripFile> {
  const trip = getTrip(state, id);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!canManageTrip(actor, trip) && !can(actor, "itinerary.edit")) return fail("forbidden", "Your role does not allow editing this trip.");
  const fields = Object.keys(patch);
  const conflict = checkVersion(trip, expectedVersion, fields);
  if (conflict) return conflict;
  if ((trip.commercial === "booked" || trip.commercial === "cancelled") && fields.some((f) => COMMERCIAL_FIELDS.includes(f))) {
    return fail("invalid_transition", "This trip is booked. Change dates, guests or route through a change proposal so suppliers and documents are reviewed.");
  }
  const changes = fields
    .filter((f) => JSON.stringify((trip as unknown as Record<string, unknown>)[f]) !== JSON.stringify((patch as Record<string, unknown>)[f]))
    .map((f) => ({ field: f, from: JSON.stringify((trip as unknown as Record<string, unknown>)[f] ?? "") , to: JSON.stringify((patch as Record<string, unknown>)[f] ?? "") }));
  if (!changes.length) return ok(state, trip);
  const updated: TripFile = { ...trip, ...patch, updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  if (patch.ownerId && patch.ownerId !== trip.ownerId) {
    next = { ...next, tasks: next.tasks.map((t) => (t.tripId === id && t.team === "sales" && t.status !== "done" && t.status !== "cancelled" ? { ...t, ownerId: patch.ownerId, history: [{ at: now, by: actor!.id, text: "Reassigned with trip owner" }, ...t.history], version: t.version + 1 } : t)) };
  }
  next = audit(next, { actorId: actor!.id, action: "trip.updated", recordType: "trip", recordId: id, tripId: id, summary: `Updated ${changes.map((c) => c.field).join(", ")}`, changes }, now);
  return ok(next, updated);
}

export function markLost(state: IosState, actor: Member | undefined, id: string, reason: string, now: string): Result {
  const trip = getTrip(state, id);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!canManageTrip(actor, trip)) return fail("forbidden", "Your role does not allow this.");
  if (trip.commercial === "booked") return fail("invalid_transition", "A booked trip is cancelled through the cancellation process, not marked lost.");
  if (!reason.trim()) return fail("invalid", "Give a lost reason.", { fieldErrors: [{ field: "reason", message: "Required" }] });
  let next = putTrip(state, { ...trip, commercial: "lost", qual: { ...trip.qual, lostReason: reason }, updatedAt: now, version: trip.version + 1 });
  next = closeRuleTasks(next, `first_response:${id}`, actor!.id, now, "Closed: enquiry lost");
  next = closeRuleTasks(next, `quote_follow_up:${id}`, actor!.id, now, "Closed: enquiry lost");
  next = audit(next, { actorId: actor!.id, action: "trip.lost", recordType: "trip", recordId: id, tripId: id, summary: `Marked lost: ${reason}` }, now);
  return ok(next, undefined);
}

export function reopen(state: IosState, actor: Member | undefined, id: string, reason: string, now: string): Result {
  const trip = getTrip(state, id);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!canManageTrip(actor, trip)) return fail("forbidden", "Your role does not allow this.");
  if (trip.commercial !== "lost") return fail("invalid_transition", "Only lost enquiries reopen here.");
  if (!reason.trim()) return fail("invalid", "Give a reason for reopening.");
  let next = putTrip(state, { ...trip, commercial: trip.quotes.length ? "quoting" : "enquiry", qual: { ...trip.qual, lostReason: undefined }, updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "trip.reopened", recordType: "trip", recordId: id, tripId: id, summary: `Reopened on the same TripFile: ${reason}` }, now);
  return ok(next, undefined);
}

export function addNote(state: IosState, actor: Member | undefined, id: string, text: string, external: boolean, now: string): Result {
  const trip = getTrip(state, id);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!actor) return fail("forbidden", "Sign in first.");
  if (!text.trim()) return fail("invalid", "Write something first.");
  let next = putTrip(state, { ...trip, notes: [{ id: uid(), at: now, by: actor.id, text, external }, ...trip.notes], updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor.id, action: external ? "trip.correspondence" : "trip.note", recordType: "trip", recordId: id, tripId: id, summary: external ? "Correspondence added" : "Internal note added" }, now);
  return ok(next, undefined);
}

/* ── Itinerary (§6 QUO01–02) ── */

export function saveItinerary(state: IosState, actor: Member | undefined, id: string, expectedVersion: number, days: ItineraryDay[], now: string): Result<TripFile> {
  const trip = getTrip(state, id);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!can(actor, "itinerary.edit")) return fail("forbidden", "Your role does not allow itinerary edits.");
  const conflict = checkVersion(trip, expectedVersion, ["itinerary"]);
  if (conflict) return conflict;
  const oldById = new Map(trip.itinerary.flatMap((d) => d.services.map((x) => [x.id, x] as const)));
  if (trip.commercial === "booked" || trip.commercial === "cancelled") {
    // After acceptance only operational details may change here; scope, quantities and costs go through a change proposal (TRP06).
    const newIds = days.flatMap((d) => d.services.map((x) => x.id));
    const scopeChanged =
      days.length !== trip.itinerary.length ||
      newIds.length !== oldById.size ||
      newIds.some((sid) => !oldById.has(sid)) ||
      days.some((d) => d.services.some((x) => { const o = oldById.get(x.id)!; return x.qty !== o.qty || x.basis !== o.basis || x.unitCost !== o.unitCost || x.mandatory !== o.mandatory || x.category !== o.category; }));
    if (scopeChanged) return fail("invalid_transition", "This trip is booked. Adding or removing days or services, or changing quantities or costs, goes through a change proposal.");
  }
  // What we ask a supplier for changed → bump the service spec version so older requests are flagged (OPS01, AT06).
  const material = (a: ItineraryDay["services"][number], b: ItineraryDay["services"][number]) =>
    a.name !== b.name || a.qty !== b.qty || a.basis !== b.basis || a.start !== b.start || a.end !== b.end || a.location !== b.location || JSON.stringify(a.spec) !== JSON.stringify(b.spec);
  const stamped = days.map((d) => ({
    ...d,
    services: d.services.map((x) => {
      const o = oldById.get(x.id);
      const v = o?.specVersion ?? x.specVersion ?? 1;
      return { ...x, specVersion: o && material(o, x) ? v + 1 : v };
    }),
  }));
  const updated: TripFile = { ...trip, itinerary: stamped, itineraryVersion: trip.itineraryVersion + 1, updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = audit(next, { actorId: actor!.id, action: "itinerary.saved", recordType: "trip", recordId: id, tripId: id, summary: `Itinerary v${updated.itineraryVersion}: ${days.length} days, ${days.reduce((a, d) => a + d.services.length, 0)} services` }, now);
  return ok(next, updated);
}

/* ── Quotations (§6 QUO03–08) ── */

function roundUp(minor: number, step = 1000) {
  return Math.ceil(minor / step) * step;
}

function linesFromItinerary(state: IosState, trip: TripFile, prior?: QuoteVersion): QuoteLine[] {
  const markup = 1 + state.settings.defaultMarkupPct / 100;
  const lines: QuoteLine[] = [];
  trip.itinerary.forEach((day, i) =>
    day.services.forEach((s) => {
      const before = prior?.lines.find((l) => l.serviceId === s.id);
      const rate = s.rateId ? state.companies.find((c) => c.id === s.supplierId)?.rates.find((r) => r.id === s.rateId) : undefined;
      const expired = !!rate && !!trip.startDate && rate.validTo < trip.startDate;
      lines.push({
        id: uid(),
        serviceId: s.id,
        description: `Day ${i + 1} · ${s.name}`,
        basis: s.basis,
        qty: s.qty,
        unitCost: s.unitCost ?? 0,
        unitPrice: before?.unitPrice ?? roundUp((s.unitCost ?? 0) * markup),
        discount: before?.discount ?? 0,
        optional: before?.optional ?? !s.mandatory,
        foc: before?.foc ?? 0,
        rateExpired: expired || !!s.revalidate,
      });
    })
  );
  return lines;
}

export function createQuoteVersion(state: IosState, actor: Member | undefined, tripId: string, now: string, fromQuoteId?: string): Result<QuoteVersion> {
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!can(actor, "quote.edit") || !canManageTrip(actor, trip)) return fail("forbidden", "Your role does not allow preparing quotations for this trip.");
  if (trip.commercial === "booked" || trip.commercial === "lost" || trip.commercial === "cancelled") return fail("invalid_transition", `This trip is ${trip.commercial}; a new quotation is not allowed here.`);
  const open = trip.quotes.find((q) => q.status === "draft" || q.status === "awaiting_approval" || q.status === "approved");
  if (open) return ok(state, open);
  const base = (fromQuoteId && trip.quotes.find((q) => q.id === fromQuoteId)) || trip.quotes[trip.quotes.length - 1];
  const number = trip.quotes.length + 1;
  const today = todayIn(state.settings.timezone, new Date(now));
  const q: QuoteVersion = {
    id: uid(),
    number,
    status: "draft",
    currency: base?.currency ?? trip.budget?.currency ?? state.settings.currency,
    lines: fromQuoteId && base ? base.lines.map((l) => ({ ...l, id: uid() })) : linesFromItinerary(state, trip, base),
    validUntil: addDays(today, 14),
    paymentTerms: base?.paymentTerms ?? "30% deposit within 7 days of acceptance; balance 30 days before arrival.",
    cancellationTerms: base?.cancellationTerms ?? "Over 30 days before arrival: deposit retained. 15–30 days: 50%. Under 15 days: 100%.",
    inclusions: base?.inclusions ?? "",
    exclusions: base?.exclusions ?? "International flights, visas, personal expenses, gratuities.",
    assumptions: base?.assumptions ?? "Rates subject to supplier availability at the time of booking.",
    recipientName: base?.recipientName,
    recipientEmail: base?.recipientEmail,
    fromItineraryVersion: trip.itineraryVersion,
    createdAt: now,
    createdBy: actor!.id,
  };
  const updated: TripFile = { ...trip, quotes: [...trip.quotes, q], commercial: trip.commercial === "enquiry" ? "quoting" : trip.commercial, updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = audit(next, { actorId: actor!.id, action: "quote.created", recordType: "quote", recordId: q.id, tripId, summary: `Quote v${number} drafted from itinerary v${trip.itineraryVersion}${fromQuoteId ? ` (copy of v${base?.number})` : ""}` }, now);
  return ok(next, q);
}

export function saveQuoteDraft(state: IosState, actor: Member | undefined, tripId: string, quoteId: string, expectedVersion: number, patch: Partial<QuoteVersion>, now: string): Result<QuoteVersion> {
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!can(actor, "quote.edit") || !canManageTrip(actor, trip)) return fail("forbidden", "Your role does not allow editing this quotation.");
  const conflict = checkVersion(trip, expectedVersion, ["quotes"]);
  if (conflict) return conflict;
  const q = trip.quotes.find((x) => x.id === quoteId);
  if (!q) return fail("not_found", "Quote not found.");
  if (!["draft", "awaiting_approval", "approved"].includes(q.status)) return fail("invalid_transition", `Quote v${q.number} is ${q.status} and frozen. Create a new version to change it.`);
  let updatedQ: QuoteVersion = { ...q, ...patch };
  // Material change invalidates an approval bound to the reviewed version (QUO06).
  if (q.approval && quoteHash(updatedQ) !== q.approval.hash) updatedQ = { ...updatedQ, approval: undefined, status: "draft" };
  const updated: TripFile = { ...trip, quotes: trip.quotes.map((x) => (x.id === quoteId ? updatedQ : x)), updatedAt: now, version: trip.version + 1 };
  const next = putTrip(state, updated);
  return ok(next, updatedQ);
}

export function requestApproval(state: IosState, actor: Member | undefined, tripId: string, quoteId: string, now: string): Result {
  const trip = getTrip(state, tripId);
  const q = trip?.quotes.find((x) => x.id === quoteId);
  if (!trip || !q) return fail("not_found", "Quote not found.");
  if (!can(actor, "quote.edit")) return fail("forbidden", "Your role does not allow this.");
  if (q.status !== "draft") return fail("invalid_transition", "Only a draft can be sent for approval.");
  const reasons = approvalReasons(q, state.settings);
  const updated: TripFile = { ...trip, quotes: trip.quotes.map((x) => (x.id === quoteId ? { ...x, status: "awaiting_approval" } : x)), updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = upsertTask(next, {
    id: uid(), type: "approval", title: `Approve quote v${q.number} · ${trip.name}`, tripId, tab: "money", team: "manager",
    due: addBusinessDays(now, 1), priority: "high", status: "open", ruleKey: `approval:${q.id}`,
    history: [{ at: now, by: actor!.id, text: `Requested: ${reasons.join(", ") || "manual review"}` }], version: 1,
  });
  next = audit(next, { actorId: actor!.id, action: "quote.approval_requested", recordType: "quote", recordId: quoteId, tripId, summary: `Approval requested for v${q.number}: ${reasons.join(", ") || "manual review"}` }, now);
  return ok(next, undefined);
}

export function approveQuote(state: IosState, actor: Member | undefined, tripId: string, quoteId: string, now: string): Result {
  const trip = getTrip(state, tripId);
  const q = trip?.quotes.find((x) => x.id === quoteId);
  if (!trip || !q) return fail("not_found", "Quote not found.");
  const denied = need(actor, "quote.approve");
  if (denied) return denied;
  if (q.status !== "awaiting_approval" && q.status !== "draft") return fail("invalid_transition", `Quote v${q.number} is ${q.status}.`);
  const reasons = approvalReasons(q, state.settings);
  const approval = { by: actor!.id, at: now, hash: quoteHash(q), reasons };
  const updated: TripFile = { ...trip, quotes: trip.quotes.map((x) => (x.id === quoteId ? { ...x, status: "approved", approval } : x)), updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = closeRuleTasks(next, `approval:${q.id}`, actor!.id, now, "Approved");
  next = audit(next, { actorId: actor!.id, action: "quote.approved", recordType: "quote", recordId: quoteId, tripId, summary: `Approved v${q.number} (version hash ${approval.hash})${reasons.length ? ` despite: ${reasons.join(", ")}` : ""}` }, now);
  return ok(next, undefined);
}

export function recordSend(state: IosState, actor: Member | undefined, tripId: string, quoteId: string, channel: Channel, now: string): Result {
  const trip = getTrip(state, tripId);
  const q = trip?.quotes.find((x) => x.id === quoteId);
  if (!trip || !q) return fail("not_found", "Quote not found.");
  if (!can(actor, "quote.send") || !canManageTrip(actor, trip)) return fail("forbidden", "Your role does not allow sending this quotation.");
  if (!["draft", "approved"].includes(q.status)) return fail("invalid_transition", q.status === "awaiting_approval" ? "This version is waiting for manager approval." : `Quote v${q.number} is ${q.status}.`);
  const today = todayIn(state.settings.timezone, new Date(now));
  const blockers = sendBlockers(trip, q, today, state.settings);
  if (blockers.length) return fail("invalid", "This quotation can't be sent yet.", { fieldErrors: blockers });
  const hash = quoteHash(q);
  const recipient = `${q.recipientName} <${q.recipientEmail}>`;
  const quotes = trip.quotes.map((x): QuoteVersion => {
    if (x.id === quoteId) return { ...x, status: "sent", sent: { at: now, by: actor!.id, channel, recipient, hash } };
    if (x.status === "sent") return { ...x, status: "superseded", supersededBy: q.number };
    return x;
  });
  const updated: TripFile = { ...trip, quotes, commercial: "awaiting", qual: { ...trip.qual, nextFollowUp: todayIn(state.settings.timezone, new Date(addBusinessDays(now, state.settings.quoteFollowUpBizDays))) }, updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = closeRuleTasks(next, `first_response:${tripId}`, actor!.id, now, `Responded: quote v${q.number} sent`);
  next = closeRuleTasks(next, `quote_follow_up:${tripId}`, actor!.id, now, `Superseded by quote v${q.number}`);
  next = upsertTask(next, {
    id: uid(), type: "quote_follow_up", title: `Follow up quote v${q.number} with ${q.recipientName}`, tripId, tab: "money", ownerId: trip.ownerId ?? actor!.id, team: "sales",
    due: addBusinessDays(now, state.settings.quoteFollowUpBizDays), priority: "normal", status: "open", ruleKey: `quote_follow_up:${tripId}:${q.number}`,
    history: [{ at: now, by: actor!.id, text: `Company policy: follow up after ${state.settings.quoteFollowUpBizDays} business days` }], version: 1,
  });
  next = audit(next, { actorId: actor!.id, action: "quote.sent", recordType: "quote", recordId: quoteId, tripId, summary: `Recorded send of v${q.number} to ${recipient} by ${channel} (hash ${hash})` }, now);
  return ok(next, undefined);
}

export function createRevision(state: IosState, actor: Member | undefined, tripId: string, fromQuoteId: string, now: string): Result<QuoteVersion> {
  return createQuoteVersion(state, actor, tripId, now, fromQuoteId);
}

export function recordAcceptance(state: IosState, actor: Member | undefined, tripId: string, quoteId: string, input: { person: string; date: string; evidence: string }, now: string): Result {
  const trip = getTrip(state, tripId);
  const q = trip?.quotes.find((x) => x.id === quoteId);
  if (!trip || !q) return fail("not_found", "Quote not found.");
  if (!can(actor, "quote.accept") || !canManageTrip(actor, trip)) return fail("forbidden", "Your role does not allow recording acceptance.");
  const errs: { field: string; message: string }[] = [];
  if (!input.person.trim()) errs.push({ field: "person", message: "Who accepted?" });
  if (!input.date) errs.push({ field: "date", message: "When was it accepted?" });
  if (!input.evidence.trim()) errs.push({ field: "evidence", message: "Paste or describe the acceptance evidence." });
  if (errs.length) return fail("invalid", "Acceptance needs the person, date and evidence.", { fieldErrors: errs });
  if (q.status === "superseded") return fail("invalid_transition", `v${q.number} was superseded by v${q.supersededBy}. Acceptance must reference the current valid version.`);
  if (q.status !== "sent") return fail("invalid_transition", `Only a sent quotation can be accepted; v${q.number} is ${q.status}.`);
  if (effectiveQuoteStatus(q, input.date) === "expired") return fail("invalid_transition", `v${q.number} expired on ${fmtDate(q.validUntil)}. Revalidate prices and availability, then send a valid version first.`);
  const quotes = trip.quotes.map((x): QuoteVersion => {
    if (x.id === quoteId) return { ...x, status: "accepted", accepted: { at: now, by: actor!.id, person: input.person, date: input.date, evidence: input.evidence } };
    if (x.status === "sent" || x.status === "draft" || x.status === "approved" || x.status === "awaiting_approval") return { ...x, status: "superseded", supersededBy: q.number };
    return x;
  });
  // Booked — not confirmed, not paid (QUO08, D04).
  const updated: TripFile = { ...trip, quotes, commercial: "booked", operational: "arranging", financial: "open", updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = closeRuleTasks(next, `quote_follow_up:${tripId}`, actor!.id, now, `Customer accepted v${q.number}`);
  for (const day of trip.itinerary) {
    for (const s of day.services.filter((x) => x.mandatory)) {
      next = upsertTask(next, {
        id: uid(), type: "arrange_service", title: `Arrange ${s.name}`, tripId, tab: "itinerary", team: "ops",
        due: trip.startDate ? `${addDays(trip.startDate, -14)}T10:00:00.000Z` : addBusinessDays(now, 3), priority: "normal", status: "open", ruleKey: `arrange:${s.id}`,
        history: [{ at: now, by: actor!.id, text: `Created on acceptance of v${q.number}. Reservation still unconfirmed.` }], version: 1,
      });
    }
  }
  next = audit(next, { actorId: actor!.id, action: "quote.accepted", recordType: "quote", recordId: quoteId, tripId, summary: `${input.person} accepted v${q.number} on ${fmtDate(input.date)}. Trip booked; suppliers not yet confirmed; nothing paid.` }, now);
  return ok(next, undefined);
}

export function recordDecline(state: IosState, actor: Member | undefined, tripId: string, quoteId: string, reason: string, now: string): Result {
  const trip = getTrip(state, tripId);
  const q = trip?.quotes.find((x) => x.id === quoteId);
  if (!trip || !q) return fail("not_found", "Quote not found.");
  if (!can(actor, "quote.accept")) return fail("forbidden", "Your role does not allow this.");
  if (q.status !== "sent") return fail("invalid_transition", "Only a sent quotation can be declined.");
  const updated: TripFile = { ...trip, quotes: trip.quotes.map((x) => (x.id === quoteId ? { ...x, status: "declined", declined: { at: now, by: actor!.id, reason } } : x)), commercial: "quoting", updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, updated);
  next = closeRuleTasks(next, `quote_follow_up:${tripId}`, actor!.id, now, `Customer declined v${q.number}`);
  next = audit(next, { actorId: actor!.id, action: "quote.declined", recordType: "quote", recordId: quoteId, tripId, summary: `v${q.number} declined: ${reason || "no reason given"}` }, now);
  return ok(next, undefined);
}

/* ── Reuse a trip (ENQ05) ── */

export function reuseTrip(state: IosState, actor: Member | undefined, sourceId: string, now: string): Result<TripFile> {
  const src = getTrip(state, sourceId);
  if (!src) return fail("not_found", "Trip not found.");
  const itinerary: ItineraryDay[] = src.itinerary.map((d) => ({
    ...d,
    id: uid(),
    services: d.services.map((s) => ({ ...s, id: uid(), revalidate: true, specVersion: 1 })),
  }));
  return createEnquiry(state, actor, {
    name: `${src.name} (reuse)`,
    destinations: src.destinations,
    language: src.language,
    hotelPref: src.hotelPref,
    team: "sales",
    ownerId: actor?.id,
    itinerary,
    source: { channel: "other", original: `Reused itinerary structure from ${src.ref}. Guests, payments, confirmations and correspondence were not copied.`, files: [] },
  }, now);
}

/* ── Duplicate suggestions (ENQ06): partner, dates, guest count, external reference. Never auto-merged. ── */

export function findDuplicates(state: IosState, draft: Partial<TripFile>) {
  const guests = (draft.adults || 0) + (draft.children || 0) + (draft.infants || 0);
  return state.trips.filter((t) => {
    if (t.commercial === "lost" || t.commercial === "cancelled") return false;
    if (draft.externalRef && t.externalRef && draft.externalRef === t.externalRef) return true;
    let score = 0;
    if (draft.partnerId && draft.partnerId === t.partnerId) score++;
    if (draft.startDate && t.startDate && Math.abs(Date.parse(draft.startDate) - Date.parse(t.startDate)) <= 3 * 86400000) score++;
    const tg = (t.adults || 0) + (t.children || 0) + (t.infants || 0);
    if (guests && tg && guests === tg) score++;
    return score >= 2;
  });
}

export function linkTrip(state: IosState, actor: Member | undefined, id: string, toId: string, now: string): Result {
  const trip = getTrip(state, id);
  if (!trip) return fail("not_found", "Trip not found.");
  let next = putTrip(state, { ...trip, linkedTripId: toId, updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "trip.linked", recordType: "trip", recordId: id, tripId: id, summary: `Linked as possible duplicate of ${getTrip(state, toId)?.ref}` }, now);
  return ok(next, undefined);
}

/* ── Tasks (§4 TOD03) ── */

export function updateTask(state: IosState, actor: Member | undefined, id: string, patch: Partial<Pick<Task, "status" | "ownerId" | "due" | "priority">>, reason: string, now: string): Result {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return fail("not_found", "Task not found.");
  const denied = need(actor, "task.manage");
  if (denied) return denied;
  if (patch.due && patch.due !== task.due && !reason.trim()) return fail("invalid", "Give a reason for rescheduling.", { fieldErrors: [{ field: "reason", message: "Required" }] });
  const bits: string[] = [];
  if (patch.status && patch.status !== task.status) bits.push(`status ${task.status} → ${patch.status}`);
  if (patch.ownerId !== undefined && patch.ownerId !== task.ownerId) bits.push("reassigned");
  if (patch.due && patch.due !== task.due) bits.push(`due moved to ${patch.due.slice(0, 10)}`);
  const text = bits.join("; ") + (reason ? ` — ${reason}` : "");
  const updated: Task = { ...task, ...patch, history: [{ at: now, by: actor!.id, text }, ...task.history], version: task.version + 1 };
  let next: IosState = { ...state, tasks: state.tasks.map((t) => (t.id === id ? updated : t)) };
  next = audit(next, { actorId: actor!.id, action: "task.updated", recordType: "task", recordId: id, tripId: task.tripId, summary: `${task.title}: ${text}` }, now);
  return ok(next, undefined);
}

export function createTask(state: IosState, actor: Member | undefined, input: Pick<Task, "title" | "tripId" | "ownerId" | "team" | "due" | "priority">, now: string): Result {
  const denied = need(actor, "task.manage");
  if (denied) return denied;
  if (!input.title.trim()) return fail("invalid", "Give the task a title.");
  if (!input.ownerId && !input.team) return fail("invalid", "Assign an owner or team.");
  const task: Task = { id: uid(), type: "manual", ...input, status: "open", history: [{ at: now, by: actor!.id, text: "Created" }], version: 1, tab: "overview" };
  let next: IosState = { ...state, tasks: [task, ...state.tasks] };
  next = audit(next, { actorId: actor!.id, action: "task.created", recordType: "task", recordId: task.id, tripId: task.tripId, summary: `Task: ${task.title}` }, now);
  return ok(next, undefined);
}

/* ── Partners and rates (§10) ── */

export function saveCompany(state: IosState, actor: Member | undefined, company: Company, expectedVersion: number | undefined, now: string): Result<Company> {
  const denied = need(actor, "partner.manage");
  if (denied) return denied;
  if (!company.name.trim()) return fail("invalid", "Enter the company name.", { fieldErrors: [{ field: "name", message: "Required" }] });
  if (!company.roles.length) return fail("invalid", "Tick sales partner, supplier or both.", { fieldErrors: [{ field: "roles", message: "Required" }] });
  const existing = state.companies.find((c) => c.id === company.id);
  if (existing && expectedVersion !== undefined && existing.version !== expectedVersion) return fail("conflict", "Someone else changed this company. Reload to see their changes.");
  const saved: Company = { ...company, version: (existing?.version ?? 0) + 1 };
  let next: IosState = { ...state, companies: existing ? state.companies.map((c) => (c.id === company.id ? saved : c)) : [saved, ...state.companies] };
  next = audit(next, { actorId: actor!.id, action: existing ? "company.updated" : "company.created", recordType: "company", recordId: company.id, summary: `${existing ? "Updated" : "Added"} ${company.name} (${company.roles.join(" + ")})` }, now);
  return ok(next, saved);
}

export function saveRate(state: IosState, actor: Member | undefined, companyId: string, rate: Rate, now: string): Result {
  const denied = need(actor, "rate.manage");
  if (denied) return denied;
  const c = state.companies.find((x) => x.id === companyId);
  if (!c) return fail("not_found", "Supplier not found.");
  const errs: { field: string; message: string }[] = [];
  if (!rate.name.trim()) errs.push({ field: "name", message: "Name the rate." });
  if (!(rate.amount > 0)) errs.push({ field: "amount", message: "Enter an amount above zero." });
  if (!rate.validFrom || !rate.validTo || rate.validTo < rate.validFrom) errs.push({ field: "validTo", message: "Validity must end after it starts." });
  if (errs.length) return fail("invalid", "Check the rate.", { fieldErrors: errs });
  const prior = c.rates.find((r) => r.id === rate.id);
  const saved: Rate = { ...rate, rateVersion: (prior?.rateVersion ?? 0) + 1 };
  const updated: Company = { ...c, rates: prior ? c.rates.map((r) => (r.id === rate.id ? saved : r)) : [...c.rates, saved], version: c.version + 1 };
  let next: IosState = { ...state, companies: state.companies.map((x) => (x.id === companyId ? updated : x)) };
  next = audit(next, { actorId: actor!.id, action: prior ? "rate.updated" : "rate.created", recordType: "rate", recordId: rate.id, summary: `${c.name}: ${rate.name} v${saved.rateVersion} (${fmtDate(rate.validFrom)} → ${fmtDate(rate.validTo)})` }, now);
  return ok(next, undefined);
}
