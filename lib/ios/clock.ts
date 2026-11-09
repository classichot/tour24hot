"use client";

import { useSyncExternalStore } from "react";

/** Current time for overdue checks, refreshed every 30 seconds; render-pure (no Date.now() in render). */
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30000);
  }
  return () => {
    listeners.delete(fn);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(subscribe, () => now || (now = Date.now()), () => 0);
}
