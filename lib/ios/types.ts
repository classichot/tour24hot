/**
 * TOUR24 Inbound OS — domain types (spec v1.0, sections 1–14).
 * Money is stored as integer minor units (FIN02); dates as ISO strings; local trip dates as YYYY-MM-DD.
 * Every record carries a row `version` for optimistic concurrency (UX09).
 */

export type StaffRole = "manager" | "sales" | "ops" | "finance";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface Settings {
  setupDone: boolean;
  companyName: string;
  country: string;
  timezone: string;
  currency: string;
  /** Projected margin below this (%) needs manager approval and shows as an exception. */
  marginThreshold: number;
  /** Company policy defaults, not industry rules (TOD04). */
  firstResponseBizDays: number;
  quoteFollowUpBizDays: number;
  readinessHours: number;
  /** Default mark-up used to suggest selling prices from cost (deterministic pricing). */
  defaultMarkupPct: number;
}

export type Channel = "email" | "whatsapp" | "wechat" | "line" | "phone" | "website" | "partner_portal" | "walk_in" | "other";

export type CommercialStage = "enquiry" | "quoting" | "awaiting" | "booked" | "lost" | "cancelled";
export type OperationalStage = "not_started" | "arranging" | "ready" | "in_progress" | "completed" | "cancelled";
export type FinancialState = "open" | "ready_close" | "closed";

export type ServiceCategory = "hotel" | "transport" | "guide" | "meal" | "attraction" | "other";
export type PricingBasis = "per_person" | "per_room_night" | "per_vehicle" | "per_group" | "per_unit";
export type CostSource = "contract" | "manual" | "estimate" | "none";

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  name: string;
  start?: string; // HH:MM local
  end?: string;
  location?: string;
  basis: PricingBasis;
  qty: number;
  supplierId?: string;
  rateId?: string;
  costSource: CostSource;
  /** Unit cost in minor units of costCurrency. */
  unitCost?: number;
  costCurrency: string;
  mandatory: boolean;
  /** Category-specific fields (QUO02). */
  spec: Record<string, string>;
  notes?: string;
  /** Set when copied from another trip or a rate changed: price/availability must be revalidated (ENQ05). */
  revalidate?: boolean;
  /** Bumped whenever what we ask the supplier for changes; reservations bind to the version they requested (OPS01, PAR07). */
  specVersion: number;
}

export interface ItineraryDay {
  id: string;
  title: string;
  destination: string;
  notes?: string;
  services: ServiceItem[];
}

export type QuoteStatus = "draft" | "awaiting_approval" | "approved" | "sent" | "accepted" | "declined" | "expired" | "superseded";

export interface QuoteLine {
  id: string;
  serviceId?: string;
  description: string;
  basis: PricingBasis;
  qty: number;
  /** Selling unit price, minor units of the quote currency. */
  unitPrice: number;
  discount: number;
  optional: boolean;
  /** Complimentary units (QUO03): priced lines minus FOC. */
  foc: number;
  /** Estimated unit cost snapshot (minor), internal only. */
  unitCost: number;
  rateExpired?: boolean;
}

export interface QuoteVersion {
  id: string;
  number: number;
  status: QuoteStatus;
  currency: string;
  lines: QuoteLine[];
  validUntil?: string;
  paymentTerms: string;
  cancellationTerms: string;
  inclusions: string;
  exclusions: string;
  assumptions: string;
  recipientName?: string;
  recipientEmail?: string;
  fromItineraryVersion: number;
  createdAt: string;
  createdBy: string;
  approval?: { by: string; at: string; hash: string; reasons: string[] };
  sent?: { at: string; by: string; channel: Channel; recipient: string; hash: string };
  accepted?: { at: string; by: string; person: string; date: string; evidence: string };
  declined?: { at: string; by: string; reason: string };
  supersededBy?: number;
}

export interface TripFile {
  id: string;
  ref: string;
  name: string;
  sample?: boolean;
  partnerId?: string;
  directContact?: { name: string; email?: string; phone?: string };
  ownerId?: string;
  team: "sales" | "ops";
  startDate?: string;
  endDate?: string;
  flexibleDates?: string;
  destinations: string[];
  adults?: number;
  children?: number;
  infants?: number;
  language?: string;
  arrival?: string;
  departure?: string;
  hotelPref?: string;
  roomNeeds?: string;
  dietary?: string;
  accessibility?: string;
  budget?: { amount: number; currency: string; basis: "per_person" | "total" };
  externalRef?: string;
  source: { channel: Channel; original: string; files: { name: string; size: number; type: string; status: "parsed" | "kept" }[] };
  commercial: CommercialStage;
  operational: OperationalStage;
  financial: FinancialState;
  qual: { nextFollowUp?: string; leadSource?: string; lostReason?: string };
  itinerary: ItineraryDay[];
  itineraryVersion: number;
  quotes: QuoteVersion[];
  notes: { id: string; at: string; by: string; text: string; external: boolean }[];
  linkedTripId?: string;
  idempotencyKey?: string;
  /* ── Operations (milestone C) ── */
  opsOwnerId?: string;
  reservations: Reservation[];
  guests: Traveller[];
  /** Bumped on any guest, room or pickup change; documents record the version they were built from. */
  guestsVersion: number;
  documents: TripDocument[];
  incidents: Incident[];
  changes: ChangeProposal[];
  readinessException?: { by: string; at: string; reason: string; scope: string; expires: string };
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

export type ReservationStatus = "draft" | "requested" | "held" | "confirmed" | "change_requested" | "cancellation_requested" | "cancelled" | "declined" | "expired";

export interface ReservationEvent {
  id: string;
  at: string;
  by: string;
  type: "drafted" | "requested" | "held" | "confirmed" | "discrepancy" | "change_requested" | "cancellation_requested" | "cancelled" | "declined" | "expired" | "conflict" | "note";
  text: string;
  evidence?: string;
  requestVersion?: number;
}

export interface Reservation {
  id: string;
  serviceId: string;
  supplierId: string;
  /** Explicitly selected to fulfil the service; other enquiries for the same service stay inactive (OPS01). */
  active: boolean;
  /** Service specVersion this request was made against. */
  requestVersion: number;
  qty: number;
  startDate?: string;
  endDate?: string;
  currency: string;
  /** Agreed amount for this reservation, minor units. */
  amount: number;
  deadline?: string;
  /** Hold expiry, stored in UTC (OPS03). */
  holdExpiry?: string;
  supplierTz: string;
  status: ReservationStatus;
  confirmation?: { at: string; by: string; confirmer: string; ref: string; evidence: string; qty: number; startDate?: string; endDate?: string; amount: number };
  /** Supplier reply that differs from the request, awaiting staff review (OPS02). */
  discrepancy?: { at: string; by: string; fields: { field: string; requested: string; replied: string }[]; reply: { confirmer: string; ref: string; evidence: string; qty: number; startDate?: string; endDate?: string; amount: number } };
  events: ReservationEvent[];
  version: number;
}

export type GuestCategory = "adult" | "child" | "infant";

export interface Traveller {
  id: string;
  name: string;
  category: GuestCategory;
  language?: string;
  arrival?: string;
  room?: string;
  roomType?: "single" | "twin" | "double" | "triple";
  pickupGroup?: string;
  /** Operational notes guides may see: dietary, access, contact (GST04). */
  serviceNotes?: string;
  /** Restricted identity fields, only for roles with a purpose (GST01, GST04). */
  restricted?: { nationality?: string; passportNo?: string; dob?: string };
}

export type DocumentType = "itinerary" | "voucher" | "rooming" | "pickup" | "runsheet";

export interface TripDocument {
  id: string;
  type: DocumentType;
  serviceId?: string;
  version: number;
  status: "draft" | "issued" | "superseded" | "revoked";
  generatedAt: string;
  generatedBy: string;
  /** Record versions the content was built from; any difference later marks it outdated (DOC03). */
  sources: { itinerary: number; guests: number; reservations: number; trip: number };
  /** Frozen content at issue time; issued documents are never re-rendered from live data (DOC02). */
  snapshot: Record<string, unknown>;
  checksum: string;
  visibility: "internal" | "customer" | "supplier";
  deliveries: { at: string; by: string; to: string; channel: string }[];
}

export interface Incident {
  id: string;
  title: string;
  category: "transport" | "hotel" | "guest" | "supplier" | "health" | "weather" | "other";
  severity: "critical" | "high" | "medium" | "low";
  serviceId?: string;
  ownerId?: string;
  status: "open" | "in_progress" | "resolved";
  description: string;
  evidence?: string;
  actions: { at: string; by: string; text: string }[];
  resolution?: string;
  createdAt: string;
  createdBy: string;
}

export interface ChangeEffect {
  kind: "reservation" | "capacity" | "price" | "task" | "document" | "schedule";
  severity: "info" | "warn" | "block";
  text: string;
}

export interface ChangeProposal {
  id: string;
  title: string;
  /** Proposed new values for commercial fields. */
  patch: { adults?: number; children?: number; infants?: number; startDate?: string; endDate?: string; destinations?: string[] };
  /** Trip version the proposal was computed against; applying re-validates against the current version (AI03). */
  baseVersion: number;
  /** Fingerprint of headcount, dates and itinerary version when proposed; any difference at apply time means the effects are stale. */
  baseKey: string;
  effects: ChangeEffect[];
  status: "proposed" | "approved" | "applied" | "rejected";
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  appliedAt?: string;
  reason: string;
}

export type TaskStatus = "open" | "in_progress" | "waiting" | "done" | "cancelled";
export type TaskType = "first_response" | "quote_follow_up" | "arrange_service" | "readiness_check" | "approval" | "reconfirm" | "manual";

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  tripId?: string;
  /** Deep link target inside the trip workspace (NAV05). */
  tab?: "overview" | "itinerary" | "bookings" | "guests" | "money" | "files";
  ownerId?: string;
  team?: "sales" | "ops" | "finance" | "manager";
  due: string;
  priority: "high" | "normal" | "low";
  status: TaskStatus;
  blockedBy?: string;
  /** Rule key for de-duplication of generated tasks (TOD02/TOD04). */
  ruleKey?: string;
  history: { at: string; by: string; text: string }[];
  version: number;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  emergency?: boolean;
}

export interface Rate {
  id: string;
  serviceType: ServiceCategory;
  name: string;
  basis: PricingBasis;
  amount: number;
  currency: string;
  taxMode: "incl" | "excl" | "none";
  validFrom: string;
  validTo: string;
  source: "contract" | "manual" | "external";
  sourceRef: string;
  rateVersion: number;
}

export interface Company {
  id: string;
  name: string;
  sample?: boolean;
  roles: ("partner" | "supplier")[];
  country: string;
  city: string;
  languages: string;
  currencies: string;
  contacts: Contact[];
  partnerTerms?: { accountOwnerId?: string; model: "net" | "commission"; commissionPct?: number; creditLimit?: number; creditCurrency: string; paymentDays: number; refConvention?: string };
  supplierTerms?: { categories: ServiceCategory[]; locations: string; cancellation: string; childRules: string; paymentDays: number };
  rates: Rate[];
  version: number;
}

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  action: string;
  recordType: "trip" | "quote" | "task" | "company" | "rate" | "settings" | "member" | "reservation" | "guest" | "document" | "incident" | "change";
  recordId: string;
  tripId?: string;
  summary: string;
  changes?: { field: string; from: string; to: string }[];
}

export interface IosState {
  settings: Settings;
  members: Member[];
  companies: Company[];
  trips: TripFile[];
  tasks: Task[];
  audit: AuditEvent[];
  seq: { trip: number };
}

export type Result<T = undefined> = { ok: true; value: T; state: IosState } | { ok: false; error: DomainError };

export interface DomainError {
  code: "forbidden" | "conflict" | "invalid" | "not_found" | "invalid_transition";
  message: string;
  fieldErrors?: { field: string; message: string }[];
  changed?: { field: string; theirs: string }[];
}
