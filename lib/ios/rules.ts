import type { CommercialStage, IosState, Member, OperationalStage, QuoteLine, QuoteStatus, QuoteVersion, Reservation, ServiceItem, StaffRole, TripFile, DocumentType } from "./types";

/* ── Permissions (spec §13). Checked inside every domain action; UI hiding is only supplementary. ── */

export type Capability =
  | "enquiry.create"
  | "enquiry.manage_any"
  | "enquiry.manage_assigned"
  | "quote.edit"
  | "quote.approve"
  | "quote.send"
  | "quote.accept"
  | "itinerary.edit"
  | "cost.view"
  | "task.manage"
  | "partner.manage"
  | "rate.manage"
  | "bank.manage"
  | "settings.manage"
  | "audit.view"
  | "reservation.manage"
  | "guest.view"
  | "guest.edit"
  | "guest.restricted"
  | "document.issue"
  | "incident.manage"
  | "trip.operate"
  | "change.propose"
  | "change.approve"
  | "readiness.override";

const MATRIX: Record<StaffRole, Capability[]> = {
  manager: ["enquiry.create", "enquiry.manage_any", "enquiry.manage_assigned", "quote.edit", "quote.approve", "quote.send", "quote.accept", "itinerary.edit", "cost.view", "task.manage", "partner.manage", "rate.manage", "settings.manage", "audit.view", "reservation.manage", "guest.view", "guest.edit", "guest.restricted", "document.issue", "incident.manage", "trip.operate", "change.propose", "change.approve", "readiness.override"],
  sales: ["enquiry.create", "enquiry.manage_assigned", "quote.edit", "quote.send", "quote.accept", "itinerary.edit", "cost.view", "task.manage", "guest.view", "guest.edit", "document.issue", "change.propose"],
  ops: ["itinerary.edit", "cost.view", "task.manage", "partner.manage", "rate.manage", "reservation.manage", "guest.view", "guest.edit", "guest.restricted", "document.issue", "incident.manage", "trip.operate", "change.propose"],
  // Finance sees costs and money, not guest records by default (section 13: guest details restricted by default).
  finance: ["cost.view", "task.manage", "bank.manage"],
};

export function can(member: Member | undefined, cap: Capability) {
  return !!member && MATRIX[member.role].includes(cap);
}

/** Sales staff manage enquiries assigned to them; managers manage all (§13 "Create and manage assigned"). */
export function canManageTrip(member: Member | undefined, trip: TripFile) {
  if (!member) return false;
  if (can(member, "enquiry.manage_any")) return true;
  return can(member, "enquiry.manage_assigned") && (!trip.ownerId || trip.ownerId === member.id);
}

export const ROLE_LABEL: Record<StaffRole, string> = { manager: "Owner or manager", sales: "Sales", ops: "Operations", finance: "Finance" };

/* ── Money (FIN02): integer minor units, explicit currency on every display (UX10). ── */

export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

export function fmtMoney(minor: number | undefined, currency: string) {
  if (minor === undefined || Number.isNaN(minor)) return `${currency} —`;
  const major = minor / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  return `${currency} ${major.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
}

/* ── Dates (UX10): unambiguous month labels; local trip dates are YYYY-MM-DD. ── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function fmtDateTime(iso?: string, timeZone = "Asia/Bangkok") {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(dt);
  return parts;
}

export function fmtRange(start?: string, end?: string, flexible?: string) {
  if (start && end) return `${fmtDate(start)} – ${fmtDate(end)}`;
  if (start) return `From ${fmtDate(start)}`;
  return flexible ? `Flexible: ${flexible}` : "Dates not set";
}

/** Today's local date in the company timezone, YYYY-MM-DD. */
export function todayIn(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86400000);
}

/** Add business days (Mon–Fri) to a timestamp; returns ISO. Company policy default helper (TOD04). */
export function addBusinessDays(fromIso: string, n: number) {
  const d = new Date(fromIso);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d.toISOString();
}

export function tripDays(trip: Pick<TripFile, "startDate" | "endDate">) {
  return trip.startDate && trip.endDate ? daysBetween(trip.startDate, trip.endDate) + 1 : undefined;
}

export function guestCount(trip: Pick<TripFile, "adults" | "children" | "infants">) {
  return (trip.adults || 0) + (trip.children || 0) + (trip.infants || 0);
}

/* ── Stage labels (TRP02): three separate states, always with text (UX01). ── */

export const COMMERCIAL_LABEL: Record<CommercialStage, string> = {
  enquiry: "Enquiry",
  quoting: "Quoting",
  awaiting: "Awaiting customer",
  booked: "Booked",
  lost: "Lost",
  cancelled: "Cancelled",
};
export const OPERATIONAL_LABEL: Record<OperationalStage, string> = {
  not_started: "Not started",
  arranging: "Arranging",
  ready: "Ready",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const FINANCIAL_LABEL = { open: "Open", ready_close: "Ready for close", closed: "Closed" } as const;
export const QUOTE_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  superseded: "Superseded",
};

/* ── Quote maths (§6 acceptance, §11 required calculations). ── */

/** Chargeable units on a line: quantity minus complimentary units, never below zero. */
export const chargeableQty = (l: QuoteLine) => Math.max(0, l.qty - (l.foc || 0));

export function lineRevenue(l: QuoteLine) {
  if (l.optional) return 0;
  return Math.max(0, chargeableQty(l) * l.unitPrice - (l.discount || 0));
}

export function lineCost(l: QuoteLine) {
  if (l.optional) return 0;
  return l.qty * (l.unitCost || 0);
}

export interface QuoteTotals {
  revenue: number;
  cost: number;
  profit: number;
  /** Gross margin %, or null when revenue is zero (display N/A). */
  margin: number | null;
}

export function quoteTotals(q: Pick<QuoteVersion, "lines">): QuoteTotals {
  const revenue = q.lines.reduce((a, l) => a + lineRevenue(l), 0);
  const cost = q.lines.reduce((a, l) => a + lineCost(l), 0);
  const profit = revenue - cost;
  return { revenue, cost, profit, margin: revenue ? (profit / revenue) * 100 : null };
}

export function fmtMargin(m: number | null) {
  return m === null ? "N/A" : `${m.toFixed(1)}%`;
}

/** Reasons a quote needs manager approval before send (QUO06). */
export function approvalReasons(q: QuoteVersion, settings: { marginThreshold: number }) {
  const t = quoteTotals(q);
  const reasons: string[] = [];
  if (t.margin !== null && t.margin < 0) reasons.push("Negative margin");
  else if (t.margin !== null && t.margin < settings.marginThreshold) reasons.push(`Margin below ${settings.marginThreshold}% threshold`);
  return reasons;
}

/** Stable content hash binding approvals and sends to an exact version (QUO05, AI04). */
export function quoteHash(q: QuoteVersion) {
  const payload = JSON.stringify({
    c: q.currency,
    l: q.lines.map((l) => [l.description, l.basis, l.qty, l.unitPrice, l.discount, l.optional, l.foc]),
    v: q.validUntil,
    p: q.paymentTerms,
    x: q.cancellationTerms,
    i: q.inclusions,
    e: q.exclusions,
    a: q.assumptions,
  });
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** A sent quote past its validity date is displayed and treated as expired. */
export function effectiveQuoteStatus(q: QuoteVersion, today: string): QuoteStatus {
  if (q.status === "sent" && q.validUntil && q.validUntil < today) return "expired";
  return q.status;
}

/** Fields required before a quotation may be sent (ENQ01 table, UX06). */
export function sendBlockers(trip: TripFile, q: QuoteVersion, today: string, settings: { marginThreshold: number }) {
  const errs: { field: string; message: string }[] = [];
  if (!q.recipientName?.trim() || !q.recipientEmail?.trim()) errs.push({ field: "recipient", message: "Add the recipient name and email." });
  if (!trip.partnerId && !trip.directContact?.name) errs.push({ field: "customer", message: "Choose the sales partner or direct customer." });
  if (!q.currency) errs.push({ field: "currency", message: "Choose the quote currency." });
  const t = quoteTotals(q);
  if (t.revenue <= 0) errs.push({ field: "lines", message: "Add at least one priced line; the total must be above zero." });
  if (!q.validUntil) errs.push({ field: "validUntil", message: "Set a validity date." });
  else if (q.validUntil < today) errs.push({ field: "validUntil", message: "The validity date has already passed." });
  if (!trip.startDate || !trip.endDate) errs.push({ field: "dates", message: "Set the trip start and end dates." });
  if (!trip.destinations.length) errs.push({ field: "destinations", message: "Add at least one destination." });
  if (!guestCount(trip)) errs.push({ field: "guests", message: "Enter the guest counts." });
  if (!q.paymentTerms.trim()) errs.push({ field: "paymentTerms", message: "Add the payment terms." });
  if (!q.inclusions.trim() || !q.exclusions.trim()) errs.push({ field: "inclusions", message: "Review the inclusions and exclusions." });
  if (q.lines.some((l) => l.rateExpired && !l.optional)) errs.push({ field: "lines", message: "A line uses an expired supplier rate. Revalidate the rate before sending." });
  const reasons = approvalReasons(q, settings);
  if (reasons.length && (!q.approval || q.approval.hash !== quoteHash(q))) errs.push({ field: "approval", message: `Manager approval needed: ${reasons.join(", ")}.` });
  return errs;
}

/* ── Service helpers ── */

export const CATEGORY_LABEL: Record<ServiceItem["category"], string> = {
  hotel: "Hotel",
  transport: "Transport",
  guide: "Guide",
  meal: "Meal",
  attraction: "Attraction",
  other: "Other",
};
export const BASIS_LABEL: Record<ServiceItem["basis"], string> = {
  per_person: "per person",
  per_room_night: "per room night",
  per_vehicle: "per vehicle",
  per_group: "per group",
  per_unit: "per unit",
};

/* ── Next useful action (TRP03): computed from stage and blockers. ── */

export type TripTab = "overview" | "itinerary" | "bookings" | "guests" | "money" | "files";

export function nextAction(trip: TripFile, today: string): { label: string; tab: TripTab; reason?: string } {
  const latest = trip.quotes[trip.quotes.length - 1];
  if (trip.commercial === "lost" || trip.commercial === "cancelled") return { label: "View history", tab: "overview" };
  if (trip.commercial === "booked") {
    if (trip.operational === "completed") return { label: "Review final costs", tab: "money" };
    if (trip.operational === "in_progress")
      return trip.incidents.some((i) => i.status !== "resolved") ? { label: "Handle open incident", tab: "overview" } : { label: "Check running services", tab: "bookings" };
    const r = computeReadiness(trip, today);
    if (r.confirmed < r.mandatory) return { label: "Arrange services", tab: "bookings", reason: `${r.mandatory - r.confirmed} mandatory service${r.mandatory - r.confirmed === 1 ? "" : "s"} not confirmed` };
    if (!r.items.find((i) => i.key === "guests")?.ok) return { label: "Complete the guest list", tab: "guests" };
    if (!r.items.find((i) => i.key === "docs")?.ok) return { label: "Prepare trip documents", tab: "files" };
    if (trip.operational !== "ready") return { label: "Mark trip ready", tab: "overview" };
    return trip.startDate === today ? { label: "Start trip", tab: "overview" } : { label: "Review readiness", tab: "overview" };
  }
  if (!trip.itinerary.some((d) => d.services.length)) return { label: "Draft the itinerary", tab: "itinerary" };
  if (!latest || latest.status === "declined" || latest.status === "superseded") return { label: "Prepare quotation", tab: "money" };
  const st = effectiveQuoteStatus(latest, today);
  if (st === "expired") return { label: "Revalidate quotation", tab: "money", reason: "Quote validity passed" };
  if (st === "sent") return { label: "Record customer decision", tab: "money" };
  if (st === "awaiting_approval") return { label: "Approve quotation", tab: "money" };
  return { label: "Review and send", tab: "money" };
}

export const memberName = (s: IosState, id?: string) => s.members.find((m) => m.id === id)?.name ?? "Unassigned";
export const companyName = (s: IosState, id?: string) => s.companies.find((c) => c.id === id)?.name;
export const customerLabel = (s: IosState, t: TripFile) => companyName(s, t.partnerId) ?? t.directContact?.name ?? "Customer not set";


/* ── Operations (milestone C): reservations, readiness and checks (OPS01–04, TRP04, GST03). ── */

export const RESERVATION_LABEL: Record<Reservation["status"], string> = {
  draft: "Draft",
  requested: "Awaiting supplier reply",
  held: "Held (provisional)",
  confirmed: "Confirmed",
  change_requested: "Change requested",
  cancellation_requested: "Cancellation requested",
  cancelled: "Cancelled",
  declined: "Declined",
  expired: "Hold expired",
};

export const allServices = (t: TripFile) => t.itinerary.flatMap((d, i) => d.services.map((s) => ({ s, day: i, date: t.startDate ? addDays(t.startDate, i) : undefined })));

/** Confirmed quantity for a service: active, confirmed reservations made against the current specification. */
export function confirmedQty(t: TripFile, s: ServiceItem) {
  return t.reservations
    .filter((r) => r.serviceId === s.id && r.active && r.status === "confirmed" && r.requestVersion === s.specVersion)
    .reduce((a, r) => a + (r.confirmation?.qty ?? r.qty), 0);
}

export const headcount = (t: TripFile) => (t.adults || 0) + (t.children || 0) + (t.infants || 0);

const ROOM_CAP = { single: 1, twin: 2, double: 2, triple: 3 } as const;

export interface OpsCheck {
  key: string;
  severity: "block" | "warn";
  text: string;
  serviceId?: string;
  tab: TripTab;
}

/** Operational validations (OPS04) plus reservation and guest-list discrepancies. Hard violations block readiness. */
export function opsChecks(t: TripFile, all: TripFile[] = [], nowMs = 0): OpsCheck[] {
  const out: OpsCheck[] = [];
  const people = Math.max(headcount(t), t.guests.length);
  for (const { s, date } of allServices(t)) {
    const seats = Number(s.spec.capacity || 0);
    if (s.category === "transport" && seats && seats < people) out.push({ key: `seats:${s.id}`, severity: "block", text: `${s.name}: ${seats} seats for ${people} travellers`, serviceId: s.id, tab: "itinerary" });
    if (s.category === "guide" && s.spec.language && t.language && !s.spec.language.toLowerCase().includes(t.language.toLowerCase()))
      out.push({ key: `lang:${s.id}`, severity: "warn", text: `${s.name}: guide language ${s.spec.language}, trip needs ${t.language}`, serviceId: s.id, tab: "itinerary" });
    for (const k of ["checkIn", "checkOut", "mealDate"]) {
      const v = s.spec[k];
      if (v && t.startDate && t.endDate && (v < t.startDate || v > addDays(t.endDate, 1)))
        out.push({ key: `date:${s.id}:${k}`, severity: "block", text: `${s.name}: ${k === "mealDate" ? "meal date" : k === "checkIn" ? "check-in" : "check-out"} ${fmtDate(v)} is outside the trip dates`, serviceId: s.id, tab: "itinerary" });
    }
    for (const r of t.reservations.filter((x) => x.serviceId === s.id && x.active)) {
      if (["requested", "held", "confirmed"].includes(r.status) && r.requestVersion < s.specVersion)
        out.push({ key: `spec:${r.id}`, severity: "warn", text: `${s.name}: specification changed after the request to the supplier — send a change request`, serviceId: s.id, tab: "bookings" });
      if (nowMs && r.status === "held" && r.holdExpiry && Date.parse(r.holdExpiry) - nowMs < 24 * 3600000)
        out.push({ key: `hold:${r.id}`, severity: "warn", text: `${s.name}: hold expires ${fmtDateTime(r.holdExpiry)}`, serviceId: s.id, tab: "bookings" });
      if (r.discrepancy) out.push({ key: `disc:${r.id}`, severity: "warn", text: `${s.name}: supplier reply differs from the request — review`, serviceId: s.id, tab: "bookings" });
    }
    // Resource overlap: the same guide or vehicle supplier confirmed on another trip on the same day.
    if ((s.category === "guide" || s.category === "transport") && s.supplierId && date && confirmedQty(t, s) > 0) {
      for (const o of all.filter((x) => x.id !== t.id && x.commercial === "booked")) {
        const clash = allServices(o).find((x) => x.s.supplierId === s.supplierId && x.date === date && x.s.category === s.category && confirmedQty(o, x.s) > 0);
        if (clash) out.push({ key: `overlap:${s.id}:${o.id}`, severity: "warn", text: `${s.name}: same supplier also confirmed on ${o.ref} on ${fmtDate(date)} — check availability`, serviceId: s.id, tab: "bookings" });
      }
    }
  }
  // Rooms: occupancy against room type.
  const rooms = new Map<string, { type?: keyof typeof ROOM_CAP; n: number }>();
  for (const g of t.guests.filter((x) => x.room && x.category !== "infant")) {
    const r = rooms.get(g.room!) ?? { type: g.roomType, n: 0 };
    rooms.set(g.room!, { type: r.type ?? g.roomType, n: r.n + 1 });
  }
  for (const [label, r] of rooms) if (r.type && r.n > ROOM_CAP[r.type]) out.push({ key: `room:${label}`, severity: "block", text: `Room ${label}: ${r.n} guests in a ${r.type} room`, tab: "guests" });
  // GST03: named travellers versus commercial headcount.
  if (t.guests.length && t.guests.length !== headcount(t))
    out.push({ key: "named", severity: "warn", text: `${t.guests.length} named travellers, ${headcount(t)} booked — propose a headcount change if it is real`, tab: "guests" });
  return out;
}

const NEEDED_DOCS = (t: TripFile) => {
  const cats = new Set(allServices(t).map((x) => x.s.category));
  return ["itinerary", "runsheet", ...(cats.has("hotel") ? ["rooming"] : []), ...(cats.has("transport") ? ["pickup"] : [])];
};

/** A stable fingerprint of reservation state (optionally for one service), so vouchers and run sheets notice confirmations and cancellations. */
export function reservationsVersion(t: TripFile, serviceId?: string) {
  let h = 2166136261;
  for (const r of t.reservations) {
    if (serviceId && r.serviceId !== serviceId) continue;
    const k = `${r.id}:${r.version};`;
    for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Which records each document is built from (DOC03): only those make it outdated. */
const DOC_DEPS: Record<DocumentType, ("itinerary" | "guests" | "reservations")[]> = {
  itinerary: ["itinerary"],
  voucher: ["itinerary", "reservations"],
  rooming: ["itinerary", "guests"],
  pickup: ["itinerary", "guests"],
  runsheet: ["itinerary", "guests", "reservations"],
};

export function docOutdated(t: TripFile, d: TripFile["documents"][number]) {
  const deps = DOC_DEPS[d.type];
  return (
    (deps.includes("itinerary") && d.sources.itinerary !== t.itineraryVersion) ||
    (deps.includes("guests") && d.sources.guests !== t.guestsVersion) ||
    (deps.includes("reservations") && d.sources.reservations !== reservationsVersion(t, d.serviceId))
  );
}

export interface Readiness {
  items: { key: string; ok: boolean; text: string; tab: TripTab }[];
  ready: boolean;
  exception: boolean;
  confirmed: number;
  mandatory: number;
}

/** TRP04: confirmed mandatory services, reviewed travellers and pickup, documents, ops owner, no critical exception. */
export function computeReadiness(t: TripFile, today: string, all: TripFile[] = [], nowMs = 0): Readiness {
  const mand = allServices(t).filter((x) => x.s.mandatory);
  const confirmed = mand.filter((x) => confirmedQty(t, x.s) >= x.s.qty).length;
  const hasTransport = allServices(t).some((x) => x.s.category === "transport");
  const named = t.guests.length;
  const guestsOk = named > 0 && named === headcount(t) && (!hasTransport || t.guests.every((g) => g.pickupGroup)) && (!!t.arrival || t.guests.every((g) => g.arrival));
  const issued = t.documents.filter((d) => d.status === "issued" && !docOutdated(t, d));
  const missingDocs = NEEDED_DOCS(t).filter((type) => !issued.some((d) => d.type === type));
  const checks = opsChecks(t, all, nowMs);
  const critical = t.incidents.filter((i) => i.status !== "resolved" && i.severity === "critical").length + checks.filter((c) => c.severity === "block").length;
  const items = [
    { key: "services", ok: mand.length > 0 && confirmed === mand.length, text: `Mandatory services confirmed with evidence (${confirmed} of ${mand.length})`, tab: "bookings" as TripTab },
    {
      key: "guests",
      ok: guestsOk,
      text: named === headcount(t) ? `Traveller and pickup information reviewed (${named} named${hasTransport ? `, ${t.guests.filter((g) => g.pickupGroup).length} with a pickup group` : ""})` : `Traveller list complete (${named} of ${headcount(t)} named)`,
      tab: "guests" as TripTab,
    },
    { key: "docs", ok: missingDocs.length === 0, text: missingDocs.length ? `Trip documents issued and current (missing: ${missingDocs.join(", ")})` : "Trip documents issued and current", tab: "files" as TripTab },
    { key: "owner", ok: !!t.opsOwnerId, text: "Operations owner assigned", tab: "overview" as TripTab },
    { key: "critical", ok: critical === 0, text: critical ? `No unresolved critical exception (${critical} open)` : "No unresolved critical exception", tab: "overview" as TripTab },
  ];
  const allOk = items.every((i) => i.ok);
  const exception = !allOk && !!t.readinessException && t.readinessException.expires >= today;
  return { items, ready: allOk || exception, exception, confirmed, mandatory: mand.length };
}
