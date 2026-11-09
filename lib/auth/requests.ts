"use client";

import { useSyncExternalStore } from "react";
import type { L10n } from "../data";

/** Activity booking requests sent from inbound day tour / excursion / attraction pages (demo: kept on this device). */
export interface BookingRequest {
  ref: string;
  activityId: string;
  href: string;
  title: L10n;
  date: string;
  adults: number;
  kids: number;
  total: number;
  at: string;
}

const KEY = "t24_requests";
const EVENT = "t24-requests";
let lastRaw: string | null = null;
let lastList: BookingRequest[] = [];
const EMPTY: BookingRequest[] = [];

function snapshot(): BookingRequest[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      lastList = raw ? (JSON.parse(raw) as BookingRequest[]) : [];
    } catch {
      lastList = [];
    }
  }
  return lastList;
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

export function useBookingRequests() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function saveBookingRequest(r: BookingRequest) {
  try {
    const list = snapshot().filter((x) => x.ref !== r.ref);
    window.localStorage.setItem(KEY, JSON.stringify([r, ...list].slice(0, 30)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable — the request still shows its confirmation on the page */
  }
}
