import type { ChangeEffect, ChangeProposal, DocumentType, IosState, Incident, Member, Reservation, ReservationEvent, Result, ServiceItem, Traveller, TripDocument, TripFile } from "./types";
import { audit, closeRuleTasks, fail, getTrip, need, ok, putTrip, uid, upsertTask } from "./domain";
import {
  BASIS_LABEL,
  CATEGORY_LABEL,
  addDays,
  allServices,
  computeReadiness,
  confirmedQty,
  customerLabel,
  docOutdated,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  headcount,
  memberName,
  reservationsVersion,
  todayIn,
} from "./rules";

/**
 * Operations domain (milestone C, spec §7–9): reservations, guests, readiness, change proposals,
 * documents and incidents. Same contract as domain.ts: pure (state, actor, input, now) → result.
 */

type R<T = undefined> = Result<T>;

export const findService = (t: TripFile, id: string): ServiceItem | undefined => t.itinerary.flatMap((d) => d.services).find((s) => s.id === id);

const LIVE: Reservation["status"][] = ["requested", "held", "confirmed", "change_requested"];
const DEAD: Reservation["status"][] = ["cancelled", "declined", "expired"];

/** What we ask the supplier for: dates from the service spec, else the itinerary day. */
function requestedDates(t: TripFile, s: ServiceItem) {
  const day = t.itinerary.findIndex((d) => d.services.some((x) => x.id === s.id));
  const date = t.startDate && day >= 0 ? addDays(t.startDate, day) : undefined;
  return { startDate: s.spec.checkIn || s.spec.mealDate || date, endDate: s.spec.checkOut || s.spec.mealDate || date };
}

/** A wall-clock time in a supplier's timezone (from a datetime-local input) → UTC ISO (OPS03 stores holds in UTC). */
export function zonedToUtc(local: string, timeZone: string) {
  const guess = new Date(`${local.length === 16 ? `${local}:00` : local}Z`);
  if (Number.isNaN(guess.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(guess);
  const get = (k: string) => Number(parts.find((p) => p.type === k)?.value ?? 0);
  const offset = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - guess.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

const changeKey = (t: TripFile) => JSON.stringify([t.adults ?? 0, t.children ?? 0, t.infants ?? 0, t.startDate ?? "", t.endDate ?? "", t.itineraryVersion]);

function withReservation(state: IosState, tripId: string, resId: string) {
  const trip = getTrip(state, tripId);
  const res = trip?.reservations.find((r) => r.id === resId);
  return { trip, res, service: trip && res ? findService(trip, res.serviceId) : undefined };
}

function putReservation(state: IosState, trip: TripFile, res: Reservation, now: string): IosState {
  return putTrip(state, { ...trip, reservations: trip.reservations.map((r) => (r.id === res.id ? res : r)), updatedAt: now, version: trip.version + 1 });
}

function ev(by: string, at: string, type: ReservationEvent["type"], text: string, extra: Partial<ReservationEvent> = {}): ReservationEvent {
  return { id: uid(), at, by, type, text, ...extra };
}

/* ── Reservations (§8 OPS01–03) ── */

export function createReservation(state: IosState, actor: Member | undefined, tripId: string, serviceId: string, input: { supplierId: string; qty: number; amount: number; currency: string; deadline?: string }, now: string): R<Reservation> {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const s = trip && findService(trip, serviceId);
  if (!trip || !s) return fail("not_found", "Service not found.");
  if (trip.commercial !== "booked") return fail("invalid_transition", "Supplier reservations start after the customer accepts a quotation.");
  if (!input.supplierId) return fail("invalid", "Choose the supplier.", { fieldErrors: [{ field: "rs-supplier", message: "Required" }] });
  if (!(input.qty > 0)) return fail("invalid", "Quantity must be above zero.", { fieldErrors: [{ field: "rs-qty", message: "Required" }] });
  const supplier = state.companies.find((c) => c.id === input.supplierId);
  const activeQty = trip.reservations.filter((r) => r.serviceId === serviceId && r.active && !DEAD.includes(r.status)).reduce((a, r) => a + r.qty, 0);
  const dates = requestedDates(trip, s);
  const res: Reservation = {
    id: uid(),
    serviceId,
    supplierId: input.supplierId,
    // A further enquiry for an already-covered service stays inactive until explicitly selected (OPS01).
    active: activeQty + input.qty <= s.qty,
    requestVersion: s.specVersion,
    qty: input.qty,
    ...dates,
    currency: input.currency,
    amount: input.amount,
    deadline: input.deadline,
    supplierTz: "Asia/Bangkok",
    status: "draft",
    events: [ev(actor!.id, now, "drafted", `Drafted for ${supplier?.name ?? "supplier"}: ${input.qty} × ${s.name}`)],
    version: 1,
  };
  let next = putTrip(state, { ...trip, reservations: [...trip.reservations, res], updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "reservation.drafted", recordType: "reservation", recordId: res.id, tripId, summary: `${s.name}: reservation drafted with ${supplier?.name}${res.active ? "" : " (inactive alternative)"}` }, now);
  return ok(next, res);
}

export function setReservationActive(state: IosState, actor: Member | undefined, tripId: string, resId: string, active: boolean, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  if (active && DEAD.includes(res.status)) return fail("invalid_transition", `A ${res.status} reservation can't be selected. Draft a new request.`);
  const others = trip.reservations.filter((r) => r.id !== resId && r.serviceId === res.serviceId && r.active && !DEAD.includes(r.status)).reduce((a, r) => a + r.qty, 0);
  if (active && others + res.qty > service.qty) return fail("invalid", `Selecting this would cover ${others + res.qty} of ${service.qty}. Deselect another reservation or split quantities first.`);
  let next = putReservation(state, trip, { ...res, active, events: [ev(actor!.id, now, "note", active ? "Selected as active reservation" : "Deselected (kept as alternative)"), ...res.events], version: res.version + 1 }, now);
  next = audit(next, { actorId: actor!.id, action: "reservation.selected", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: reservation ${active ? "selected" : "deselected"}` }, now);
  return ok(next, undefined);
}

export function requestReservation(state: IosState, actor: Member | undefined, tripId: string, resId: string, evidence: string, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  if (res.status !== "draft") return fail("invalid_transition", `This reservation is already ${res.status.replace("_", " ")}.`);
  if (!evidence.trim()) return fail("invalid", "Record how the request was sent (for example the email subject or message).", { fieldErrors: [{ field: "rq-evidence", message: "Required" }] });
  const updated: Reservation = { ...res, status: "requested", requestVersion: service.specVersion, events: [ev(actor!.id, now, "requested", `Requested against specification v${service.specVersion}`, { evidence, requestVersion: service.specVersion }), ...res.events], version: res.version + 1 };
  let next = putReservation(state, trip, updated, now);
  next = audit(next, { actorId: actor!.id, action: "reservation.requested", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: request sent (spec v${service.specVersion})` }, now);
  return ok(next, undefined);
}

export function recordHold(state: IosState, actor: Member | undefined, tripId: string, resId: string, input: { holdExpiry: string; ref: string; evidence: string }, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  if (res.status !== "requested") return fail("invalid_transition", "A hold can only be recorded for a request awaiting reply.");
  if (!input.holdExpiry || Date.parse(input.holdExpiry) <= Date.parse(now)) return fail("invalid", "The hold expiry must be in the future.", { fieldErrors: [{ field: "hd-exp", message: "Required" }] });
  if (!input.evidence.trim()) return fail("invalid", "Paste the supplier's hold message.", { fieldErrors: [{ field: "hd-ev", message: "Required" }] });
  const updated: Reservation = { ...res, status: "held", holdExpiry: new Date(input.holdExpiry).toISOString(), events: [ev(actor!.id, now, "held", `Held until ${fmtDateTime(input.holdExpiry, res.supplierTz)} supplier time (${fmtDateTime(input.holdExpiry, "UTC")} UTC)${input.ref ? `, ref ${input.ref}` : ""}`, { evidence: input.evidence }), ...res.events], version: res.version + 1 };
  let next = putReservation(state, trip, updated, now);
  next = audit(next, { actorId: actor!.id, action: "reservation.held", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: held, provisional until ${fmtDateTime(updated.holdExpiry, res.supplierTz)} supplier time` }, now);
  return ok(next, undefined);
}

export type ReplyOutcome = "confirmed" | "discrepancy" | "conflict" | "rejected_expired";

/**
 * Record a supplier reply (OPS02). It confirms only when it matches the current request; a reply to an
 * outdated request version is logged and refused (AT06); a reply after the hold expired never revives it (AT07).
 */
export function recordReply(
  state: IosState,
  actor: Member | undefined,
  tripId: string,
  resId: string,
  expectedVersion: number,
  reply: { confirmer: string; ref: string; evidence: string; qty: number; startDate?: string; endDate?: string; amount: number; requestVersion: number },
  now: string
): R<ReplyOutcome> {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  // A hold past its expiry is expired even if the expiry job has not run yet (OPS03).
  const before = withReservation(state, tripId, resId).res;
  if (before?.status === "held" && before.holdExpiry && Date.parse(before.holdExpiry) <= Date.parse(now)) {
    state = expireHolds(state, now).state;
    expectedVersion = expectedVersion + 1;
  }
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  const errs: { field: string; message: string }[] = [];
  if (!reply.confirmer.trim()) errs.push({ field: "rp-who", message: "Who at the supplier confirmed?" });
  if (!reply.ref.trim()) errs.push({ field: "rp-ref", message: "Enter the supplier's confirmation reference." });
  if (reply.evidence.trim().length < 15) errs.push({ field: "rp-ev", message: "Paste the supplier's reply. A note such as “emailed hotel” is not evidence." });
  if (errs.length) return fail("invalid", "A confirmation needs the supplier's own words and reference.", { fieldErrors: errs });

  const log = (type: ReservationEvent["type"], text: string): IosState => {
    const r2 = { ...res, events: [ev(actor!.id, now, type, text, { evidence: reply.evidence, requestVersion: reply.requestVersion }), ...res.events], version: res.version + 1 };
    return audit(putReservation(state, trip, r2, now), { actorId: actor!.id, action: `reservation.${type}`, recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: ${text}` }, now);
  };

  // Hold expired (by the expiry job) before this reply was applied: keep both events, never revive (OPS03).
  if (res.status === "expired") {
    return ok(log("note", `Confirmation ${reply.ref} received after the hold expired — not applied. Revalidate availability.`), "rejected_expired");
  }
  if (res.version !== expectedVersion) return fail("conflict", "This reservation changed while you were recording the reply. Review its current state first.");
  if (!["requested", "held", "change_requested"].includes(res.status)) return fail("invalid_transition", `This reservation is ${res.status.replace("_", " ")}; a confirmation can't be applied.`);
  // Reply bound to an older request version than the current specification (PAR07, AT06).
  if (reply.requestVersion < service.specVersion || res.requestVersion < service.specVersion) {
    return ok(log("conflict", `Reply ${reply.ref} answers request v${reply.requestVersion}; the current specification is v${service.specVersion}. Not applied — send a change request.`), "conflict");
  }
  const fields: { field: string; requested: string; replied: string }[] = [];
  if (reply.qty !== res.qty) fields.push({ field: "Quantity", requested: String(res.qty), replied: String(reply.qty) });
  if ((reply.startDate || "") !== (res.startDate || "")) fields.push({ field: "Start", requested: res.startDate ?? "—", replied: reply.startDate ?? "—" });
  if ((reply.endDate || "") !== (res.endDate || "")) fields.push({ field: "End", requested: res.endDate ?? "—", replied: reply.endDate ?? "—" });
  if (reply.amount !== res.amount) fields.push({ field: "Amount", requested: fmtMoney(res.amount, res.currency), replied: fmtMoney(reply.amount, res.currency) });
  if (fields.length) {
    const r2: Reservation = { ...res, discrepancy: { at: now, by: actor!.id, fields, reply }, events: [ev(actor!.id, now, "discrepancy", `Reply ${reply.ref} differs: ${fields.map((f) => f.field).join(", ")}`, { evidence: reply.evidence }), ...res.events], version: res.version + 1 };
    const next = audit(putReservation(state, trip, r2, now), { actorId: actor!.id, action: "reservation.discrepancy", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: supplier reply differs (${fields.map((f) => f.field).join(", ")}) — review needed` }, now);
    return ok(next, "discrepancy");
  }
  return ok(applyConfirmation(state, actor!, trip, res, service, reply, now), "confirmed");
}

function applyConfirmation(state: IosState, actor: Member, trip: TripFile, res: Reservation, service: ServiceItem, reply: { confirmer: string; ref: string; evidence: string; qty: number; startDate?: string; endDate?: string; amount: number }, now: string) {
  const r2: Reservation = {
    ...res,
    status: "confirmed",
    qty: reply.qty,
    startDate: reply.startDate,
    endDate: reply.endDate,
    amount: reply.amount,
    discrepancy: undefined,
    confirmation: { at: now, by: actor.id, confirmer: reply.confirmer, ref: reply.ref, evidence: reply.evidence, qty: reply.qty, startDate: reply.startDate, endDate: reply.endDate, amount: reply.amount },
    events: [ev(actor.id, now, "confirmed", `Confirmed by ${reply.confirmer}, ref ${reply.ref}: ${reply.qty} × ${service.name}, ${fmtMoney(reply.amount, res.currency)}`, { evidence: reply.evidence, requestVersion: res.requestVersion }), ...res.events],
    version: res.version + 1,
  };
  let next = putReservation(state, trip, r2, now);
  const t2 = getTrip(next, trip.id)!;
  // The arrangement task closes because confirmation evidence now exists (TOD05).
  if (confirmedQty(t2, service) >= service.qty) next = closeRuleTasks(next, `arrange:${service.id}`, actor.id, now, `Confirmed by ${reply.confirmer}, ref ${reply.ref}`);
  next = closeRuleTasks(next, `reconfirm:${res.id}`, actor.id, now, `Reconfirmed, ref ${reply.ref}`);
  return audit(next, { actorId: actor.id, action: "reservation.confirmed", recordType: "reservation", recordId: res.id, tripId: trip.id, summary: `${service.name}: confirmed by ${reply.confirmer} (ref ${reply.ref})` }, now);
}

export function resolveDiscrepancy(state: IosState, actor: Member | undefined, tripId: string, resId: string, accept: boolean, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service || !res.discrepancy) return fail("not_found", "No discrepancy to review.");
  if (accept) {
    if (res.discrepancy.reply.qty > service.qty) return fail("invalid", `The reply covers ${res.discrepancy.reply.qty} but the service needs ${service.qty}. Reject it or change the service first.`);
    return ok(applyConfirmation(state, actor!, trip, res, service, res.discrepancy.reply, now), undefined);
  }
  const r2: Reservation = { ...res, discrepancy: undefined, events: [ev(actor!.id, now, "note", "Discrepant reply rejected; request stays open"), ...res.events], version: res.version + 1 };
  return ok(audit(putReservation(state, trip, r2, now), { actorId: actor!.id, action: "reservation.discrepancy_rejected", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: discrepant reply rejected` }, now), undefined);
}

export function requestReservationChange(state: IosState, actor: Member | undefined, tripId: string, resId: string, note: string, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  if (!LIVE.includes(res.status)) return fail("invalid_transition", "Only an open or confirmed reservation can be changed.");
  if (!note.trim()) return fail("invalid", "Describe the change you sent the supplier.", { fieldErrors: [{ field: "ch-note", message: "Required" }] });
  // The request now carries the current specification: dates, and the full quantity when this is the only active reservation.
  const sole = !trip.reservations.some((r) => r.id !== resId && r.serviceId === res.serviceId && r.active && !DEAD.includes(r.status));
  const qty = sole ? service.qty : res.qty;
  const r2: Reservation = {
    ...res,
    ...requestedDates(trip, service),
    qty,
    status: "change_requested",
    requestVersion: service.specVersion,
    events: [ev(actor!.id, now, "change_requested", `Change requested against specification v${service.specVersion} (${qty} × ${service.name}): ${note}`, { requestVersion: service.specVersion, evidence: note }), ...res.events],
    version: res.version + 1,
  };
  return ok(audit(putReservation(state, trip, r2, now), { actorId: actor!.id, action: "reservation.change_requested", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: change requested (spec v${service.specVersion})` }, now), undefined);
}

export function requestCancellation(state: IosState, actor: Member | undefined, tripId: string, resId: string, note: string, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  if (res.status === "draft") {
    const t2 = { ...trip, reservations: trip.reservations.filter((r) => r.id !== resId), updatedAt: now, version: trip.version + 1 };
    return ok(audit(putTrip(state, t2), { actorId: actor!.id, action: "reservation.discarded", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: draft request discarded` }, now), undefined);
  }
  if (!["requested", "held", "confirmed", "change_requested"].includes(res.status)) return fail("invalid_transition", "Nothing to cancel.");
  const r2: Reservation = { ...res, status: "cancellation_requested", events: [ev(actor!.id, now, "cancellation_requested", `Cancellation requested${note ? `: ${note}` : ""}. Commitment remains until the supplier replies.`), ...res.events], version: res.version + 1 };
  return ok(audit(putReservation(state, trip, r2, now), { actorId: actor!.id, action: "reservation.cancellation_requested", recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: cancellation requested` }, now), undefined);
}

export function recordCancelled(state: IosState, actor: Member | undefined, tripId: string, resId: string, input: { evidence: string; penalty: number; declined: boolean }, now: string): R {
  const denied = need(actor, "reservation.manage");
  if (denied) return denied;
  const { trip, res, service } = withReservation(state, tripId, resId);
  if (!trip || !res || !service) return fail("not_found", "Reservation not found.");
  if (!input.evidence.trim()) return fail("invalid", "Paste the supplier's cancellation or decline.", { fieldErrors: [{ field: "cx-ev", message: "Required" }] });
  const status = input.declined ? "declined" : "cancelled";
  const r2: Reservation = { ...res, status, active: false, events: [ev(actor!.id, now, status, `${input.declined ? "Declined by supplier" : "Cancellation acknowledged"}${input.penalty ? `; penalty ${fmtMoney(input.penalty, res.currency)}` : ""}`, { evidence: input.evidence }), ...res.events], version: res.version + 1 };
  return ok(audit(putReservation(state, trip, r2, now), { actorId: actor!.id, action: `reservation.${status}`, recordType: "reservation", recordId: resId, tripId, summary: `${service.name}: ${status}${input.penalty ? `, penalty ${fmtMoney(input.penalty, res.currency)}` : ""}` }, now), undefined);
}

/** Expiry job (OPS03): retry-safe — running it twice changes nothing the second time. */
export function expireHolds(state: IosState, now: string): { state: IosState; expired: number } {
  let expired = 0;
  let next = state;
  for (const trip of state.trips) {
    const due = trip.reservations.filter((r) => r.status === "held" && r.holdExpiry && Date.parse(r.holdExpiry) <= Date.parse(now));
    if (!due.length) continue;
    const t2: TripFile = {
      ...trip,
      reservations: trip.reservations.map((r) =>
        due.includes(r) ? { ...r, status: "expired", events: [ev("system", now, "expired", `Hold expired at ${fmtDateTime(r.holdExpiry, r.supplierTz)} supplier time without confirmation`), ...r.events], version: r.version + 1 } : r
      ),
      updatedAt: now,
      version: trip.version + 1,
    };
    next = putTrip(next, t2);
    for (const r of due) {
      expired++;
      const s = findService(trip, r.serviceId);
      next = audit(next, { actorId: "system", action: "reservation.hold_expired", recordType: "reservation", recordId: r.id, tripId: trip.id, summary: `${s?.name ?? "Service"}: hold expired; revalidate before use` }, now);
    }
  }
  return { state: next, expired };
}

/* ── Guests (§9 GST01–03) ── */

export function saveGuests(state: IosState, actor: Member | undefined, tripId: string, expectedGuestsVersion: number, guests: Traveller[], now: string): R<TripFile> {
  const denied = need(actor, "guest.edit");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (trip.guestsVersion !== expectedGuestsVersion) return fail("conflict", "Someone else changed the guest list. Reload it before saving.");
  const bad = guests.filter((g) => !g.name.trim());
  if (bad.length) return fail("invalid", "Every traveller needs a name.", { fieldErrors: [{ field: "guests", message: `${bad.length} row(s) without a name` }] });
  // Keep restricted fields this user cannot see (they are not in the edited copy).
  const merged = guests.map((g) => (can_(actor, "guest.restricted") ? g : { ...g, restricted: trip.guests.find((o) => o.id === g.id)?.restricted }));
  const t2: TripFile = { ...trip, guests: merged, guestsVersion: trip.guestsVersion + 1, updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, t2);
  next = audit(next, { actorId: actor!.id, action: "guests.saved", recordType: "guest", recordId: tripId, tripId, summary: `Guest list v${t2.guestsVersion}: ${guests.length} travellers (commercial headcount ${headcount(trip)} unchanged)` }, now);
  return ok(next, t2);
}

function can_(actor: Member | undefined, cap: Parameters<typeof need>[1]) {
  return need(actor, cap) === null;
}

export interface GuestRowResult {
  row: number;
  raw: string[];
  guest?: Traveller;
  errors: string[];
}

const CATS = ["adult", "child", "infant"];
const ROOM_TYPES = ["single", "twin", "double", "triple"];
export const GUEST_TEMPLATE = "name,category,language,arrival,room,room_type,pickup_group,service_notes,nationality,passport_no,date_of_birth";

/** Validate a guest CSV (GST02): row-level errors, duplicates, dates. Nothing is committed here. */
export function validateGuestCsv(text: string, existing: Traveller[], today: string): { rows: GuestRowResult[]; header: string[]; missing: string[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  const header = (lines.shift() ?? "").split(",").map((h) => h.trim().toLowerCase());
  const missing = ["name", "category"].filter((h) => !header.includes(h));
  const idx = (k: string) => header.indexOf(k);
  const seen = new Set(existing.map((g) => `${g.name.toLowerCase()}|${g.restricted?.dob ?? ""}`));
  const rows: GuestRowResult[] = lines.map((line, i) => {
    const raw = line.split(",").map((c) => c.trim());
    const get = (k: string) => (idx(k) >= 0 ? raw[idx(k)] ?? "" : "");
    const errors: string[] = [];
    const name = get("name");
    const category = get("category").toLowerCase();
    const dob = get("date_of_birth");
    const roomType = get("room_type").toLowerCase();
    if (!name) errors.push("Name is missing");
    if (!CATS.includes(category)) errors.push(`Category “${get("category")}” must be adult, child or infant`);
    if (dob) {
      const okDate = /^\d{4}-\d{2}-\d{2}$/.test(dob) && !Number.isNaN(Date.parse(`${dob}T00:00:00Z`)) && new Date(`${dob}T00:00:00Z`).toISOString().slice(0, 10) === dob;
      if (!okDate) errors.push(`Date of birth “${dob}” is not a valid date (use YYYY-MM-DD)`);
      else if (dob > today) errors.push(`Date of birth ${dob} is in the future`);
    }
    if (roomType && !ROOM_TYPES.includes(roomType)) errors.push(`Room type “${get("room_type")}” must be single, twin, double or triple`);
    const key = `${name.toLowerCase()}|${dob}`;
    if (name && seen.has(key)) errors.push("Duplicate of another traveller");
    if (name) seen.add(key);
    const guest: Traveller | undefined = errors.length
      ? undefined
      : {
          id: uid(),
          name,
          category: category as Traveller["category"],
          language: get("language") || undefined,
          arrival: get("arrival") || undefined,
          room: get("room") || undefined,
          roomType: (roomType || undefined) as Traveller["roomType"],
          pickupGroup: get("pickup_group") || undefined,
          serviceNotes: get("service_notes") || undefined,
          restricted: get("nationality") || get("passport_no") || dob ? { nationality: get("nationality") || undefined, passportNo: get("passport_no") || undefined, dob: dob || undefined } : undefined,
        };
    return { row: i + 2, raw, guest, errors };
  });
  return { rows, header, missing };
}

export function importGuests(state: IosState, actor: Member | undefined, tripId: string, expectedGuestsVersion: number, selected: Traveller[], totalRows: number, now: string): R {
  const denied = need(actor, "guest.edit");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (trip.guestsVersion !== expectedGuestsVersion) return fail("conflict", "The guest list changed after you validated the file. Validate it again.");
  if (!selected.length) return fail("invalid", "Select at least one valid row to import.");
  const t2: TripFile = { ...trip, guests: [...trip.guests, ...selected], guestsVersion: trip.guestsVersion + 1, updatedAt: now, version: trip.version + 1 };
  let next = putTrip(state, t2);
  // Importing names never changes the commercial headcount (GST03).
  next = audit(next, { actorId: actor!.id, action: "guests.imported", recordType: "guest", recordId: tripId, tripId, summary: `Imported ${selected.length} of ${totalRows} rows. Named ${t2.guests.length}; commercial headcount stays ${headcount(trip)}.` }, now);
  return ok(next, undefined);
}

/* ── Readiness and lifecycle (§7 TRP04–05) ── */

export function setOpsOwner(state: IosState, actor: Member | undefined, tripId: string, ownerId: string, now: string): R {
  const denied = need(actor, "trip.operate");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  let next = putTrip(state, { ...trip, opsOwnerId: ownerId || undefined, updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "trip.ops_owner", recordType: "trip", recordId: tripId, tripId, summary: `Operations owner: ${memberName(state, ownerId)}` }, now);
  return ok(next, undefined);
}

export function markReady(state: IosState, actor: Member | undefined, tripId: string, now: string): R {
  const denied = need(actor, "trip.operate");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (trip.commercial !== "booked" || trip.operational !== "arranging") return fail("invalid_transition", "Only a booked trip that is arranging can be marked ready.");
  const today = todayIn(state.settings.timezone, new Date(now));
  const r = computeReadiness(trip, today, state.trips, Date.parse(now));
  if (!r.ready) return fail("invalid_transition", "Not ready yet.", { fieldErrors: r.items.filter((i) => !i.ok).map((i) => ({ field: `ready-${i.key}`, message: i.text })) });
  let next = putTrip(state, { ...trip, operational: "ready", updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "trip.ready", recordType: "trip", recordId: tripId, tripId, summary: r.exception ? `Marked ready under manager exception: ${trip.readinessException?.reason}` : "Marked ready: all readiness checks passed" }, now);
  return ok(next, undefined);
}

export function grantReadinessException(state: IosState, actor: Member | undefined, tripId: string, input: { reason: string; scope: string; expires: string }, now: string): R {
  const denied = need(actor, "readiness.override");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  const errs: { field: string; message: string }[] = [];
  if (!input.reason.trim()) errs.push({ field: "ex-reason", message: "Give a reason." });
  if (!input.scope.trim()) errs.push({ field: "ex-scope", message: "State what the exception covers." });
  if (!input.expires) errs.push({ field: "ex-exp", message: "Set when it expires." });
  if (errs.length) return fail("invalid", "An exception needs a reason, scope and expiry.", { fieldErrors: errs });
  let next = putTrip(state, { ...trip, readinessException: { by: actor!.id, at: now, ...input }, updatedAt: now, version: trip.version + 1 });
  // The exception does not change the underlying facts; they stay visible as not done.
  next = audit(next, { actorId: actor!.id, action: "trip.readiness_exception", recordType: "trip", recordId: tripId, tripId, summary: `Readiness exception until ${fmtDate(input.expires)} — scope: ${input.scope}; reason: ${input.reason}` }, now);
  return ok(next, undefined);
}

export function startTrip(state: IosState, actor: Member | undefined, tripId: string, now: string): R {
  const denied = need(actor, "trip.operate");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (trip.operational !== "ready") return fail("invalid_transition", "Mark the trip ready (or record a manager exception) before starting it.");
  let next = putTrip(state, { ...trip, operational: "in_progress", startedAt: now, updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "trip.started", recordType: "trip", recordId: tripId, tripId, summary: "Trip started" }, now);
  return ok(next, undefined);
}

export function completeTrip(state: IosState, actor: Member | undefined, tripId: string, now: string): R {
  const denied = need(actor, "trip.operate");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (trip.operational !== "in_progress") return fail("invalid_transition", "Only a trip in progress can be completed.");
  if (trip.incidents.some((i) => i.status !== "resolved" && (i.severity === "critical" || i.severity === "high"))) return fail("invalid_transition", "Resolve the open critical or high incidents first.");
  let next = putTrip(state, { ...trip, operational: "completed", completedAt: now, updatedAt: now, version: trip.version + 1 });
  // Completion is operational only; financial close is separate and later (TRP05).
  next = audit(next, { actorId: actor!.id, action: "trip.completed", recordType: "trip", recordId: tripId, tripId, summary: "Trip completed operationally. Financial state stays open until close." }, now);
  return ok(next, undefined);
}

/* ── Change proposals (§7 TRP06, AT05) ── */

export function changeEffects(state: IosState, trip: TripFile, patch: ChangeProposal["patch"]): ChangeEffect[] {
  const fx: ChangeEffect[] = [];
  const oldN = headcount(trip);
  const newN = (patch.adults ?? trip.adults ?? 0) + (patch.children ?? trip.children ?? 0) + (patch.infants ?? trip.infants ?? 0);
  const datesChanged = (patch.startDate && patch.startDate !== trip.startDate) || (patch.endDate && patch.endDate !== trip.endDate);
  const accepted = trip.quotes.find((q) => q.status === "accepted");
  if (newN !== oldN) {
    fx.push({ kind: "capacity", severity: "info", text: `Headcount ${oldN} → ${newN} (${newN > oldN ? "+" : ""}${newN - oldN})` });
    for (const { s } of allServices(trip)) {
      const seats = Number(s.spec.capacity || 0);
      if (s.category === "transport" && seats && seats < newN) fx.push({ kind: "capacity", severity: "block", text: `${s.name}: ${seats} seats cannot carry ${newN} — add or change vehicles first` });
      if (s.category === "hotel") fx.push({ kind: "capacity", severity: "warn", text: `${s.name}: rooms and room-night cost are not scaled automatically — review the room count (${s.spec.rooms || "?"} rooms today)` });
      else if (s.basis === "per_vehicle") fx.push({ kind: "price", severity: "info", text: `${s.name}: ${CATEGORY_LABEL[s.category].toLowerCase()} cost is ${BASIS_LABEL[s.basis].toLowerCase()} and stays as booked${seats ? ` (${seats} seats)` : ""}` });
      if (s.basis === "per_person") fx.push({ kind: "reservation", severity: "warn", text: `${s.name}: quantity ${s.qty} → ${s.qty === oldN ? newN : s.qty} (${BASIS_LABEL[s.basis].toLowerCase()}) — supplier must reconfirm` });
    }
    if (accepted) {
      const perPerson = accepted.lines.filter((l) => l.basis === "per_person" && !l.optional && l.qty === oldN);
      const delta = perPerson.reduce((a, l) => a + (newN - oldN) * l.unitPrice, 0);
      fx.push({ kind: "price", severity: "warn", text: `Accepted quote v${accepted.number} is not changed. Estimated per-person price difference ${fmtMoney(delta, accepted.currency)} needs a separate customer charge (Money, milestone D).` });
    }
  }
  if (datesChanged) {
    fx.push({ kind: "schedule", severity: "warn", text: `Dates ${fmtDate(trip.startDate)}–${fmtDate(trip.endDate)} → ${fmtDate(patch.startDate ?? trip.startDate)}–${fmtDate(patch.endDate ?? trip.endDate)}: every dated service and hold moves` });
  }
  const live = trip.reservations.filter((r) => r.active && ["requested", "held", "confirmed", "change_requested"].includes(r.status));
  for (const r of live) {
    const s = findService(trip, r.serviceId);
    const sup = state.companies.find((c) => c.id === r.supplierId)?.name ?? "supplier";
    fx.push({ kind: "reservation", severity: "warn", text: `${s?.name ?? "Service"} with ${sup} (${r.status.replace("_", " ")}) must be reconfirmed` });
  }
  if (live.length) fx.push({ kind: "task", severity: "info", text: `${live.length} reconfirmation task${live.length === 1 ? "" : "s"} will be created for operations` });
  const issued = trip.documents.filter((d) => d.status === "issued");
  if (issued.length) fx.push({ kind: "document", severity: "info", text: `${issued.length} issued document${issued.length === 1 ? "" : "s"} will become outdated and need reissue` });
  if (trip.operational === "ready") fx.push({ kind: "schedule", severity: "warn", text: "Trip returns from Ready to Arranging until suppliers reconfirm" });
  return fx;
}

export function proposeChange(state: IosState, actor: Member | undefined, tripId: string, patch: ChangeProposal["patch"], reason: string, now: string): R<ChangeProposal> {
  const denied = need(actor, "change.propose");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (trip.commercial !== "booked") return fail("invalid_transition", "Change proposals are for booked trips; edit the enquiry directly before booking.");
  if (!reason.trim()) return fail("invalid", "Give the reason for the change.", { fieldErrors: [{ field: "cp-reason", message: "Required" }] });
  if (patch.endDate && (patch.startDate ?? trip.startDate) && patch.endDate < (patch.startDate ?? trip.startDate)!) return fail("invalid", "End date is before the start date.", { fieldErrors: [{ field: "cp-end", message: "Invalid" }] });
  const parts: string[] = [];
  const newN = (patch.adults ?? trip.adults ?? 0) + (patch.children ?? trip.children ?? 0) + (patch.infants ?? trip.infants ?? 0);
  if (newN !== headcount(trip)) parts.push(`guests ${headcount(trip)} → ${newN}`);
  if ((patch.startDate && patch.startDate !== trip.startDate) || (patch.endDate && patch.endDate !== trip.endDate)) parts.push("dates");
  if (!parts.length) return fail("invalid", "Nothing would change.");
  const proposal: ChangeProposal = { id: uid(), title: `Change ${parts.join(" and ")}`, patch, baseVersion: trip.version + 1, baseKey: changeKey(trip), effects: changeEffects(state, trip, patch), status: "proposed", createdAt: now, createdBy: actor!.id, reason };
  let next = putTrip(state, { ...trip, changes: [proposal, ...trip.changes], updatedAt: now, version: trip.version + 1 });
  next = upsertTask(next, { id: uid(), type: "approval", title: `Approve change: ${proposal.title} · ${trip.name}`, tripId, tab: "overview", team: "manager", due: `${todayIn(state.settings.timezone, new Date(now))}T17:00:00+07:00`, priority: "high", status: "open", ruleKey: `change:${proposal.id}`, history: [{ at: now, by: actor!.id, text: reason }], version: 1 });
  next = audit(next, { actorId: actor!.id, action: "change.proposed", recordType: "change", recordId: proposal.id, tripId, summary: `${proposal.title}: ${reason}` }, now);
  return ok(next, proposal);
}

export function decideChange(state: IosState, actor: Member | undefined, tripId: string, changeId: string, approve: boolean, now: string): R {
  const denied = need(actor, "change.approve");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const cp = trip?.changes.find((c) => c.id === changeId);
  if (!trip || !cp) return fail("not_found", "Change proposal not found.");
  if (cp.status !== "proposed") return fail("invalid_transition", `This proposal is already ${cp.status}.`);
  if (approve && cp.effects.some((e) => e.severity === "block")) return fail("invalid_transition", "Resolve the blocking effects (for example vehicle capacity) before approving.");
  const updated = { ...cp, status: approve ? ("approved" as const) : ("rejected" as const), approvedBy: actor!.id };
  let next = putTrip(state, { ...trip, changes: trip.changes.map((c) => (c.id === changeId ? updated : c)), updatedAt: now, version: trip.version });
  next = closeRuleTasks(next, `change:${changeId}`, actor!.id, now, approve ? "Approved" : "Rejected");
  next = audit(next, { actorId: actor!.id, action: approve ? "change.approved" : "change.rejected", recordType: "change", recordId: changeId, tripId, summary: `${cp.title}: ${approve ? "approved" : "rejected"}` }, now);
  return ok(next, undefined);
}

export function applyChange(state: IosState, actor: Member | undefined, tripId: string, changeId: string, now: string): R {
  const denied = need(actor, "change.propose");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const cp = trip?.changes.find((c) => c.id === changeId);
  if (!trip || !cp) return fail("not_found", "Change proposal not found.");
  if (cp.status !== "approved") return fail("invalid_transition", "Only an approved proposal can be applied.");
  // Revalidate dependencies immediately before applying (AI03): headcount, dates and itinerary must be as they were when proposed.
  if (changeKey(trip) !== cp.baseKey) return fail("conflict", "Guests, dates or the itinerary changed after this proposal was made. Create a new proposal so the effects are recalculated.");
  if (changeEffects(state, trip, cp.patch).some((e) => e.severity === "block")) return fail("invalid_transition", "A blocking effect appeared since approval (for example vehicle capacity). Resolve it, then propose again.");
  const oldN = headcount(trip);
  const newN = (cp.patch.adults ?? trip.adults ?? 0) + (cp.patch.children ?? trip.children ?? 0) + (cp.patch.infants ?? trip.infants ?? 0);
  const shift = cp.patch.startDate && trip.startDate ? Math.round((Date.parse(cp.patch.startDate) - Date.parse(trip.startDate)) / 86400000) : 0;
  // Per-person quantities follow the headcount; per-room and per-vehicle quantities are never scaled automatically.
  const itinerary = trip.itinerary.map((d) => ({
    ...d,
    services: d.services.map((s) => {
      let x = s;
      if (newN !== oldN && s.basis === "per_person" && s.qty === oldN) x = { ...x, qty: newN };
      if (shift) {
        const spec = { ...x.spec };
        for (const k of ["checkIn", "checkOut", "mealDate"]) if (spec[k]) spec[k] = addDays(spec[k], shift);
        x = { ...x, spec };
      }
      return x === s ? s : { ...x, specVersion: s.specVersion + 1 };
    }),
  }));
  const live = trip.reservations.filter((r) => r.active && LIVE.includes(r.status));
  const reservations = trip.reservations.map((r) =>
    live.includes(r) ? { ...r, status: "change_requested" as const, events: [ev(actor!.id, now, "change_requested", `Trip change applied (${cp.title}); supplier must reconfirm`), ...r.events], version: r.version + 1 } : r
  );
  const updated: TripFile = {
    ...trip,
    adults: cp.patch.adults ?? trip.adults,
    children: cp.patch.children ?? trip.children,
    infants: cp.patch.infants ?? trip.infants,
    startDate: cp.patch.startDate ?? trip.startDate,
    endDate: cp.patch.endDate ?? trip.endDate,
    itinerary,
    itineraryVersion: trip.itineraryVersion + 1,
    reservations,
    operational: trip.operational === "ready" ? "arranging" : trip.operational,
    changes: trip.changes.map((c) => (c.id === changeId ? { ...c, status: "applied" as const, appliedAt: now } : c)),
    updatedAt: now,
    version: trip.version + 1,
  };
  let next = putTrip(state, updated);
  for (const r of live) {
    const s = findService(trip, r.serviceId);
    next = upsertTask(next, { id: uid(), type: "reconfirm", title: `Reconfirm ${s?.name ?? "service"} after: ${cp.title}`, tripId, tab: "bookings", team: "ops", ownerId: trip.opsOwnerId, due: `${todayIn(state.settings.timezone, new Date(now))}T17:00:00+07:00`, priority: "high", status: "open", ruleKey: `reconfirm:${r.id}`, history: [{ at: now, by: actor!.id, text: `Created by applying ${cp.title}` }], version: 1 });
  }
  next = audit(next, { actorId: actor!.id, action: "change.applied", recordType: "change", recordId: changeId, tripId, summary: `${cp.title} applied. ${live.length} reservation(s) need reconfirmation; issued documents are outdated; accepted quote unchanged.` }, now);
  return ok(next, undefined);
}

/* ── Documents (§9 DOC01–03) ── */

export const DOC_LABEL: Record<DocumentType, string> = { itinerary: "Itinerary", voucher: "Service voucher", rooming: "Rooming list", pickup: "Pickup list", runsheet: "Operations run sheet" };

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function buildSnapshot(state: IosState, trip: TripFile, type: DocumentType, serviceId?: string): { snapshot: Record<string, unknown>; missing: string[] } {
  const missing: string[] = [];
  const base = { company: state.settings.companyName, ref: trip.ref, name: trip.name, customer: customerLabel(state, trip), start: trip.startDate, end: trip.endDate, guests: headcount(trip), timezone: state.settings.timezone };
  if (!trip.startDate || !trip.endDate) missing.push("Trip start and end dates");
  if (type === "itinerary") {
    if (!trip.itinerary.length) missing.push("At least one itinerary day");
    return { missing, snapshot: { ...base, days: trip.itinerary.map((d, i) => ({ n: i + 1, date: trip.startDate ? addDays(trip.startDate, i) : undefined, title: d.title, destination: d.destination, notes: d.notes, services: d.services.map((s) => ({ name: s.name, start: s.start, end: s.end, location: s.location })) })) } };
  }
  if (type === "voucher") {
    const s = serviceId ? findService(trip, serviceId) : undefined;
    const r = trip.reservations.find((x) => x.serviceId === serviceId && x.active && x.status === "confirmed");
    if (!s) missing.push("The service");
    if (!r) missing.push("A confirmed reservation for this service");
    const sup = state.companies.find((c) => c.id === r?.supplierId);
    return { missing, snapshot: { ...base, service: s?.name, category: s?.category, spec: s?.spec, start: r?.startDate, end: r?.endDate, qty: r?.confirmation?.qty, supplier: sup?.name, supplierContact: sup?.contacts[0] ? `${sup.contacts[0].name} ${sup.contacts[0].phone ?? sup.contacts[0].email ?? ""}` : undefined, confirmationRef: r?.confirmation?.ref, confirmer: r?.confirmation?.confirmer } };
  }
  if (type === "rooming") {
    const roomed = trip.guests.filter((g) => g.room);
    if (!roomed.length) missing.push("Guests with room assignments");
    const hotels = allServices(trip).filter((x) => x.s.category === "hotel").map((x) => ({ name: x.s.name, checkIn: x.s.spec.checkIn, checkOut: x.s.spec.checkOut }));
    if (!hotels.length) missing.push("A hotel service");
    const rooms = Array.from(new Set(roomed.map((g) => g.room!))).map((room) => ({ room, type: roomed.find((g) => g.room === room)?.roomType, guests: roomed.filter((g) => g.room === room).map((g) => ({ name: g.name, category: g.category, notes: g.serviceNotes })) }));
    return { missing, snapshot: { ...base, hotels, rooms } };
  }
  if (type === "pickup") {
    const grouped = trip.guests.filter((g) => g.pickupGroup);
    if (!grouped.length) missing.push("Guests with pickup groups");
    if (!trip.arrival && !grouped.every((g) => g.arrival)) missing.push("Arrival details (trip or per guest)");
    const groups = Array.from(new Set(grouped.map((g) => g.pickupGroup!))).map((group) => ({ group, guests: grouped.filter((g) => g.pickupGroup === group).map((g) => ({ name: g.name, arrival: g.arrival ?? trip.arrival, notes: g.serviceNotes })) }));
    return { missing, snapshot: { ...base, arrival: trip.arrival, groups } };
  }
  // run sheet
  if (!trip.itinerary.length) missing.push("At least one itinerary day");
  const rows = allServices(trip).map(({ s, date }) => {
    const r = trip.reservations.find((x) => x.serviceId === s.id && x.active && !["cancelled", "declined", "expired"].includes(x.status));
    const sup = state.companies.find((c) => c.id === (r?.supplierId ?? s.supplierId));
    return { date, start: s.start, end: s.end, service: s.name, location: s.location, supplier: sup?.name, contact: sup?.contacts[0]?.phone ?? sup?.contacts[0]?.email, status: r?.status ?? "not requested", ref: r?.confirmation?.ref };
  });
  return { missing, snapshot: { ...base, opsOwner: memberName(state, trip.opsOwnerId), rows, incidents: trip.incidents.filter((i) => i.status !== "resolved").map((i) => i.title) } };
}

export function generateDocument(state: IosState, actor: Member | undefined, tripId: string, type: DocumentType, serviceId: string | undefined, now: string): R<TripDocument> {
  const denied = need(actor, "document.issue");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  const { snapshot, missing } = buildSnapshot(state, trip, type, serviceId);
  // Missing required values block the document with a clear explanation (DOC01).
  if (missing.length) return fail("invalid", `Can't prepare the ${DOC_LABEL[type].toLowerCase()} yet.`, { fieldErrors: missing.map((m) => ({ field: "doc", message: `Missing: ${m}` })) });
  const sameKind = trip.documents.filter((d) => d.type === type && d.serviceId === serviceId);
  const doc: TripDocument = {
    id: uid(), type, serviceId, version: sameKind.length + 1, status: "draft", generatedAt: now, generatedBy: actor!.id,
    sources: { itinerary: trip.itineraryVersion, guests: trip.guestsVersion, reservations: reservationsVersion(trip, serviceId), trip: trip.version },
    snapshot, checksum: hash(JSON.stringify(snapshot)), visibility: type === "voucher" ? "supplier" : type === "itinerary" ? "customer" : "internal", deliveries: [],
  };
  let next = putTrip(state, { ...trip, documents: [doc, ...trip.documents.filter((d) => !(d.type === type && d.serviceId === serviceId && d.status === "draft"))], updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "document.drafted", recordType: "document", recordId: doc.id, tripId, summary: `${DOC_LABEL[type]} v${doc.version} drafted` }, now);
  return ok(next, doc);
}

export function issueDocument(state: IosState, actor: Member | undefined, tripId: string, docId: string, now: string): R {
  const denied = need(actor, "document.issue");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const doc = trip?.documents.find((d) => d.id === docId);
  if (!trip || !doc) return fail("not_found", "Document not found.");
  if (doc.status !== "draft") return fail("invalid_transition", "Only a draft can be issued.");
  if (docOutdated(trip, doc)) return fail("invalid_transition", "The trip changed after this draft was prepared. Prepare it again so the issued version is current.");
  const documents = trip.documents.map((d): TripDocument => {
    if (d.id === docId) return { ...d, status: "issued", generatedAt: now, checksum: hash(JSON.stringify(d.snapshot)) };
    if (d.type === doc.type && d.serviceId === doc.serviceId && d.status === "issued") return { ...d, status: "superseded" };
    return d;
  });
  let next = putTrip(state, { ...trip, documents, updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "document.issued", recordType: "document", recordId: docId, tripId, summary: `${DOC_LABEL[doc.type]} v${doc.version} issued (checksum ${doc.checksum}); earlier issued versions superseded` }, now);
  return ok(next, undefined);
}

export function revokeDocument(state: IosState, actor: Member | undefined, tripId: string, docId: string, reason: string, now: string): R {
  const denied = need(actor, "document.issue");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const doc = trip?.documents.find((d) => d.id === docId);
  if (!trip || !doc) return fail("not_found", "Document not found.");
  if (doc.status !== "issued") return fail("invalid_transition", "Only an issued document can be revoked.");
  let next = putTrip(state, { ...trip, documents: trip.documents.map((d) => (d.id === docId ? { ...d, status: "revoked" } : d)), updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "document.revoked", recordType: "document", recordId: docId, tripId, summary: `${DOC_LABEL[doc.type]} v${doc.version} revoked: ${reason || "no reason"}. Copies already downloaded cannot be recalled.` }, now);
  return ok(next, undefined);
}

export function recordDelivery(state: IosState, actor: Member | undefined, tripId: string, docId: string, to: string, channel: string, now: string): R {
  const denied = need(actor, "document.issue");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const doc = trip?.documents.find((d) => d.id === docId);
  if (!trip || !doc) return fail("not_found", "Document not found.");
  if (doc.status !== "issued") return fail("invalid_transition", "Issue the document before recording delivery.");
  if (!to.trim()) return fail("invalid", "Who received it?", { fieldErrors: [{ field: "dl-to", message: "Required" }] });
  let next = putTrip(state, { ...trip, documents: trip.documents.map((d) => (d.id === docId ? { ...d, deliveries: [...d.deliveries, { at: now, by: actor!.id, to, channel }] } : d)), updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "document.delivered", recordType: "document", recordId: docId, tripId, summary: `${DOC_LABEL[doc.type]} v${doc.version} delivered to ${to} by ${channel}` }, now);
  return ok(next, undefined);
}

export const docChecksumFor = (snapshot: Record<string, unknown>) => hash(JSON.stringify(snapshot));

/* ── Incidents (§8 OPS06) ── */

export function createIncident(state: IosState, actor: Member | undefined, tripId: string, input: Pick<Incident, "title" | "category" | "severity" | "serviceId" | "ownerId" | "description" | "evidence">, now: string): R {
  const denied = need(actor, "incident.manage");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  if (!trip) return fail("not_found", "Trip not found.");
  if (!input.title.trim()) return fail("invalid", "Give the incident a short title.", { fieldErrors: [{ field: "in-title", message: "Required" }] });
  const inc: Incident = { id: uid(), ...input, status: "open", actions: [], createdAt: now, createdBy: actor!.id };
  let next = putTrip(state, { ...trip, incidents: [inc, ...trip.incidents], updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: "incident.opened", recordType: "incident", recordId: inc.id, tripId, summary: `${input.severity.toUpperCase()} incident: ${input.title}` }, now);
  return ok(next, undefined);
}

export function updateIncident(state: IosState, actor: Member | undefined, tripId: string, incidentId: string, input: { action?: string; status?: Incident["status"]; resolution?: string; ownerId?: string }, now: string): R {
  const denied = need(actor, "incident.manage");
  if (denied) return denied;
  const trip = getTrip(state, tripId);
  const inc = trip?.incidents.find((i) => i.id === incidentId);
  if (!trip || !inc) return fail("not_found", "Incident not found.");
  if (input.status === "resolved" && !input.resolution?.trim()) return fail("invalid", "Describe the resolution.", { fieldErrors: [{ field: "in-res", message: "Required" }] });
  const updated: Incident = {
    ...inc,
    status: input.status ?? inc.status,
    ownerId: input.ownerId ?? inc.ownerId,
    resolution: input.resolution ?? inc.resolution,
    actions: input.action?.trim() ? [{ at: now, by: actor!.id, text: input.action }, ...inc.actions] : inc.actions,
  };
  let next = putTrip(state, { ...trip, incidents: trip.incidents.map((i) => (i.id === incidentId ? updated : i)), updatedAt: now, version: trip.version + 1 });
  next = audit(next, { actorId: actor!.id, action: input.status === "resolved" ? "incident.resolved" : "incident.updated", recordType: "incident", recordId: incidentId, tripId, summary: `${inc.title}: ${input.status === "resolved" ? `resolved — ${input.resolution}` : input.action ?? input.status ?? "updated"}` }, now);
  return ok(next, undefined);
}
