import type { L10n } from "../data";

export const HOST_MAX_DAYS = 45;
export const HOST_STAY_ID = "hst-gt40";

export interface HostDay {
  n: number;
  title: L10n;
  city: L10n;
  note: L10n;
}

export interface HostGuest {
  id: string;
  name: string;
  room: string;
  status: "arriving" | "inhouse" | "departed";
}

export interface HostArrival {
  id: string;
  flight: string;
  at: string;
  pax: number;
  note: L10n;
}

export interface HostStay {
  id: string;
  title: L10n;
  host: L10n;
  dateStart: string;
  dateEnd: string;
  days: number;
  pax: number;
  rooms: number;
  sell: number;
  daysPlan: HostDay[];
  guests: HostGuest[];
  arrivals: HostArrival[];
}

export interface HostState {
  stay: HostStay;
}

export function clampHostDays(n: number) {
  return Math.min(HOST_MAX_DAYS, Math.max(1, Math.round(n)));
}
