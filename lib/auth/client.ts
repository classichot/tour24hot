"use client";

import { useSyncExternalStore } from "react";
import { SESSION_COOKIE, decodeSession, type Role, type Session } from "./session";

const EVENT = "t24-member";
let lastRaw: string | null | undefined;
let lastSession: Session | null = null;

function readCookie(): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return hit ? hit.slice(SESSION_COOKIE.length + 1) : null;
}

function snapshot(): Session | null {
  const raw = readCookie();
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastSession = decodeSession(raw);
  }
  return lastSession;
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("focus", fn);
  document.addEventListener("visibilitychange", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("focus", fn);
    document.removeEventListener("visibilitychange", fn);
  };
}

/** The signed-in member, or null. Always null during server render. */
export function useMember(): Session | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export async function signIn(email: string, password: string, role: Role): Promise<{ ok: true; home: string } | { ok: false; error: "bad" | "role"; role?: Role }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const data = (await res.json().catch(() => ({}))) as { home?: string; error?: "bad" | "role"; role?: Role };
  window.dispatchEvent(new Event(EVENT));
  if (res.ok && data.home) return { ok: true, home: data.home };
  return { ok: false, error: data.error === "role" ? "role" : "bad", role: data.role };
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  // Drop cached member pages so the next person on this device cannot open them offline.
  navigator.serviceWorker?.controller?.postMessage({ type: "clear-pages" });
  window.dispatchEvent(new Event(EVENT));
}
