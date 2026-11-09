"use client";

import { useSyncExternalStore } from "react";

/** Chromium's install prompt event (not in the DOM lib types). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaState = {
  canInstall: boolean;
  installed: boolean;
  offlineReady: boolean;
  online: boolean;
  ios: boolean;
};

const SERVER_STATE: PwaState = { canInstall: false, installed: false, offlineReady: false, online: true, ios: false };

let deferred: InstallPromptEvent | null = null;
let justInstalled = false;
let state: PwaState = SERVER_STATE;
const listeners = new Set<() => void>();

function read(): PwaState {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    canInstall: !!deferred,
    installed: justInstalled || window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true,
    offlineReady: !!navigator.serviceWorker?.controller,
    online: navigator.onLine,
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
  };
}

function emit() {
  const next = read();
  const same = (Object.keys(next) as (keyof PwaState)[]).every((k) => next[k] === state[k]);
  if (!same) state = next;
  listeners.forEach((fn) => fn());
}

// Listen at module load: `beforeinstallprompt` can fire before any component mounts.
if (typeof window !== "undefined") {
  state = read();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    justInstalled = true;
    emit();
  });
  window.addEventListener("online", emit);
  window.addEventListener("offline", emit);
  window.matchMedia("(display-mode: standalone)").addEventListener("change", emit);
  navigator.serviceWorker?.addEventListener("controllerchange", emit);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function usePwa() {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  return { ...snap, install: promptInstall };
}

export async function promptInstall() {
  if (!deferred) return false;
  const ev = deferred;
  deferred = null;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  if (outcome === "accepted") justInstalled = true;
  emit();
  return outcome === "accepted";
}

/** Register the service worker and hand it the files this page already loaded, so the first visit works offline too. */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    const reg = await navigator.serviceWorker.ready;
    const urls = [
      location.pathname + location.search,
      ...performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => u.startsWith(location.origin)),
    ];
    reg.active?.postMessage({ type: "warm", urls });
    emit();
  } catch {
    /* service workers unavailable (private mode, blocked) — the site still works online */
  }
}
