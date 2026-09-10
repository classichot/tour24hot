import type { L10n } from "../data";

export type BookingState = "requested" | "quoted" | "held" | "confirmed" | "cancelled" | "completed";
export type RateClass = "indicative" | "quoted" | "held" | "confirmed";
export type PaxType = "adult" | "child" | "infant";
export type TourKind = "scheduled" | "private" | "inbound" | "outbound" | "corporate" | "incentive";
export type Channel = "website" | "marketplace" | "b2b" | "agent-direct" | "group" | "crm";
export type ServiceModule = "flight" | "bus" | "hotel" | "meal" | "activity" | "guide" | "other";
export type DepStatus = "draft" | "quoting" | "open" | "guaranteed" | "operating" | "closed";
export type DemoStage = "enquiry" | "quoted" | "allocated" | "paxAdded" | "disrupted" | "approved" | "closed";
export type TicketStatus = "none" | "listed" | "ticketed" | "changed" | "refunded";

export interface TourProduct {
  id: string;
  code: string;
  title: L10n;
  kind: TourKind;
  days: number;
  nights: number;
  destination: L10n;
  minPax: number;
  capacity: number;
  marginTarget: number;
  marketplacePkgId?: string;
  itinerary: { d: number; title: L10n; body: L10n; start: string; end: string }[];
}

export interface ChannelAlloc {
  channel: Channel;
  seats: number;
  sold: number;
  commission: number;
}

export interface Departure {
  id: string;
  productId: string;
  dateStart: string;
  dateEnd: string;
  status: DepStatus;
  cutoff: string;
  timezone: string;
  paxTarget: number;
  capacity: number;
  channelAllocations: ChannelAlloc[];
}

export interface Customer {
  id: string;
  name: L10n;
  type: "individual" | "corporate";
  company?: L10n;
  contact: string;
  email: string;
}

export interface Enquiry {
  id: string;
  channel: Channel;
  customerId: string;
  title: L10n;
  brief: L10n;
  pax: number;
  budget: number;
  dest: string;
  stage: "new" | "briefed" | "quoted" | "won" | "lost";
  owner: string;
  created: string;
  followUp: string;
  departureId?: string;
}

export interface Passenger {
  id: string;
  departureId: string;
  bookingId: string;
  name: string;
  namePassport: string;
  type: PaxType;
  passport?: string;
  roomPref: "twin" | "single" | "triple";
  diet: string;
  emergency?: string;
  visaStatus: "na" | "needed" | "submitted" | "ok";
  insurance: boolean;
  docsReady: boolean;
  ticketStatus: TicketStatus;
  addedLate?: boolean;
}

export interface Booking {
  id: string;
  ref: string;
  departureId: string;
  customerId: string;
  channel: Channel;
  paxIds: string[];
  state: BookingState;
  deposit: number;
  balance: number;
  total: number;
}

export interface ServiceLine {
  id: string;
  departureId: string;
  module: ServiceModule;
  supplierId: string;
  name: L10n;
  qty: number;
  unitCost: number;
  unitSell: number;
  currency: "THB";
  rateClass: RateClass;
  state: BookingState;
  holdExpiry?: string;
  deadline?: string;
  notes?: L10n;
  source: string;
  updatedAt: string;
  day?: number;
}

export interface FlightBlock {
  id: string;
  serviceId: string;
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  seats: number;
  sold: number;
  deposit: number;
  releaseAt: string;
  namesDue: string;
  ticketBy: string;
  pnr?: string;
  timezone: string;
  delayed?: boolean;
}

export interface VehicleAssign {
  id: string;
  serviceId: string;
  plate: string;
  owned: boolean;
  seats: number;
  luggage: number;
  driver: string;
  pickup: L10n;
}

export interface HotelAllotment {
  id: string;
  serviceId: string;
  hotel: L10n;
  city: L10n;
  nights: number;
  twins: number;
  singles: number;
  comps: number;
  releaseAt: string;
}

export interface MealService {
  id: string;
  serviceId: string;
  venue: L10n;
  meal: "B" | "L" | "D";
  day: number;
  time: string;
  capacity: number;
  dietNotes: L10n;
}

export interface ActivityService {
  id: string;
  serviceId: string;
  name: L10n;
  slot: string;
  capacity: number;
  voucher: string;
  redeemed: number;
}

export interface GuideAssign {
  id: string;
  serviceId: string;
  name: L10n;
  role: "leader" | "local";
  langs: string[];
  fee: number;
  phone: string;
}

export interface Supplier {
  id: string;
  name: L10n;
  kind: ServiceModule | "consolidator" | "ground";
  terms: L10n;
  rating: number;
  currency: "THB";
}

export interface OsTask {
  id: string;
  departureId: string;
  title: L10n;
  owner: string;
  due: string;
  tz: string;
  module: ServiceModule | "docs" | "finance" | "sales";
  done: boolean;
  ack?: boolean;
}

export interface Incident {
  id: string;
  departureId: string;
  title: L10n;
  body: L10n;
  status: "open" | "recovering" | "closed";
  created: string;
}

export interface QuoteVersion {
  id: string;
  enquiryId: string;
  label: L10n;
  pax: number;
  sell: number;
  cost: number;
  margin: number;
  assumptions: L10n[];
  created: string;
}

export interface Approval {
  id: string;
  title: L10n;
  body: L10n;
  amount: number;
  status: "pending" | "approved" | "rejected";
  impactId?: string;
}

export interface ChangeImpact {
  id: string;
  title: L10n;
  why: L10n;
  finance: L10n;
  next: L10n;
  extraCost: number;
  newMargin: number;
  affected: { id: string; module: ServiceModule; name: L10n; change: L10n }[];
  deadlines: { label: L10n; due: string }[];
}

export interface AiDraft {
  id: string;
  feature: string;
  title: L10n;
  body: L10n;
  editable: string;
  applied: boolean;
}

export interface LedgerLine {
  id: string;
  departureId: string;
  side: "in" | "out";
  label: L10n;
  amount: number;
  due: string;
  status: "expected" | "received" | "paid" | "overdue";
}

export interface OsSnapshot {
  products: TourProduct[];
  departures: Departure[];
  customers: Customer[];
  enquiries: Enquiry[];
  bookings: Booking[];
  passengers: Passenger[];
  services: ServiceLine[];
  flights: FlightBlock[];
  vehicles: VehicleAssign[];
  hotels: HotelAllotment[];
  meals: MealService[];
  activities: ActivityService[];
  guides: GuideAssign[];
  suppliers: Supplier[];
  tasks: OsTask[];
  incidents: Incident[];
  quotes: QuoteVersion[];
  approvals: Approval[];
  impacts: ChangeImpact[];
  drafts: AiDraft[];
  ledger: LedgerLine[];
  demoStage: DemoStage;
  log: { at: string; text: L10n }[];
}
