import type { L10n } from "../../data";
import type { ServiceModule } from "../types";

export const AGI_DEP_ID = "dep-th40-se";
export const AGI_PRD_ID = "prd-th6-se";
export const AGI_ENQ_ID = "enq-se40";
export const AGI_CUS_ID = "cus-nordic";
export const AGI_BOOK_ID = "bk-se40";

export type AgiAgentId =
  | "director"
  | "sales"
  | "itinerary"
  | "flight"
  | "hotel"
  | "bus"
  | "venue"
  | "guide"
  | "service"
  | "finance"
  | "quality";

export type FactClass = "confirmed" | "estimate" | "missing";
export type MissionStatus = "idle" | "planning" | "working" | "blocked" | "awaiting_approval" | "paused" | "done";
export type JobStatus = "queued" | "working" | "waiting" | "done" | "blocked";

export interface AgiFact {
  id: string;
  label: L10n;
  value: L10n;
  klass: FactClass;
  source: string;
  module?: ServiceModule | "sales" | "finance" | "docs";
}

export type IngestKind = "paste" | "txt" | "csv" | "json" | "pdf" | "voice" | "spreadsheet";
export type NegRoundStatus = "draft" | "sent" | "waiting" | "replied";
export type AutopilotAction = "price" | "release" | "promote" | "vehicle";
export type RehearsalId = "late-arrival" | "slow-board" | "rain" | "missed-meal";

export interface AgiJob {
  id: string;
  agent: AgiAgentId;
  title: L10n;
  status: JobStatus;
  note: L10n;
  deadline?: string;
  waitingOn?: string;
}

export interface AgiIngest {
  id: string;
  kind: IngestKind;
  name: string;
  at: string;
  rawPreview: string;
  facts: AgiFact[];
  note: L10n;
}

export interface AgiMemory {
  id: string;
  topic: L10n;
  body: L10n;
  source: string;
  validFrom: string;
  validTo: string;
  region: string;
}

export interface AgiScorecard {
  agent: AgiAgentId;
  completed: number;
  waiting: number;
  corrections: number;
  costImpact: number;
  note: L10n;
}

export interface AgiOffer {
  id: string;
  supplier: L10n;
  module: string;
  inclusions: L10n[];
  exclusions: L10n[];
  unit: number;
  total: number;
  klass: FactClass;
  via: "portal" | "email" | "extract";
  round: number;
}

export interface AgiNegRound {
  n: number;
  status: NegRoundStatus;
  note: L10n;
  authorized: boolean;
}

export interface AgiNegotiation {
  offers: AgiOffer[];
  rounds: AgiNegRound[];
}

export interface AgiAutopilotRec {
  id: string;
  action: AutopilotAction;
  title: L10n;
  marginDelta: number;
  cashDelta: number;
  penalty: number;
  assumption: L10n;
}

export interface AgiAutopilot {
  sold: number;
  committedCost: number;
  estimatedCost: number;
  margin: number;
  cash: number;
  releases: { label: L10n; due: string; risk: L10n }[];
  recs: AgiAutopilotRec[];
}

export interface AgiRehearsalCase {
  id: RehearsalId;
  label: L10n;
  trigger: L10n;
  fragile: L10n;
  assumption: L10n;
  outcome: L10n;
  ran: boolean;
}

export interface AgiTapBrief {
  protocol: "TAP";
  version: string;
  channel: "agent-direct";
  agency: string;
  objective: string;
  pax: number;
  days: number;
  dest: string;
  nationality: string;
  hotelClass: number;
  visibility: { sell: boolean; cost: boolean; margin: boolean };
  sellHint?: number;
}

export interface AgiOption {
  id: string;
  label: L10n;
  pax: number;
  sell: number;
  cost: number;
  margin: number;
  nights: number;
  hotelClass: string;
  notes: L10n[];
}

export interface AgiChangeLine {
  module: string;
  what: L10n;
  cost: number;
  reconfirm: boolean;
}

export interface AgiChangePlan {
  fromPax: number;
  toPax: number;
  extraCost: number;
  newSell: number;
  newCost: number;
  newMargin: number;
  lines: AgiChangeLine[];
  applied: boolean;
}

export interface AgiRescueOption {
  id: string;
  title: L10n;
  availability: L10n;
  extraCost: number;
  customerImpact: L10n;
  needsApproval: boolean;
  autoAllowed: boolean;
}

export interface AgiRescue {
  incident: L10n;
  options: AgiRescueOption[];
  chosen?: string;
}

export interface AgiAuthority {
  spendLimit: number;
  discountFloor: number;
  canConfirm: boolean;
  canHold: boolean;
  canRequestQuote: boolean;
  canDraftMessage: boolean;
}

export interface AgiLog {
  at: string;
  agent: AgiAgentId;
  text: L10n;
}

export interface AgiMission {
  id: string;
  objective: string;
  status: MissionStatus;
  created: string;
  departureId?: string;
  enquiryId?: string;
  facts: AgiFact[];
  jobs: AgiJob[];
  options: AgiOption[];
  changePlan?: AgiChangePlan;
  rescue?: AgiRescue;
  blockers: L10n[];
  deadlines: { label: L10n; due: string }[];
  log: AgiLog[];
  paused: boolean;
}

export interface AgiState {
  on: boolean;
  authority: AgiAuthority;
  missions: AgiMission[];
  activeId?: string;
  ingests: AgiIngest[];
  memory: AgiMemory[];
  negotiation?: AgiNegotiation;
  rehearsal?: { cases: AgiRehearsalCase[]; lastId?: RehearsalId };
  tapInbox: AgiTapBrief[];
  adapter: "local-engine";
}

export const DEFAULT_AUTHORITY: AgiAuthority = {
  spendLimit: 20000,
  discountFloor: 18,
  canConfirm: false,
  canHold: false,
  canRequestQuote: true,
  canDraftMessage: true,
};

export function emptyAgi(on = false): AgiState {
  return {
    on,
    authority: DEFAULT_AUTHORITY,
    missions: [],
    ingests: [],
    memory: [],
    tapInbox: [],
    adapter: "local-engine",
  };
}
