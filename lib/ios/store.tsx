"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMember } from "@/lib/auth/client";
import { buildSample, emptyState } from "./seed";
import { addSampleOperations } from "./seedOps";
import { expireHolds } from "./ops";
import { migrateState } from "./migrate";
import { setupCompany } from "./domain";
import { todayIn } from "./rules";
import type { DomainError, IosState, Member, Result, Settings } from "./types";

/**
 * Inbound OS store (prototype persistence). The whole tenant lives in this browser under one key;
 * other tabs pick up changes through the `storage` event, so stale writes from a second tab hit
 * the same version-conflict rule a server would enforce (UX09). Swap for API calls in production.
 */

const KEY = "t24ios.v1";

type Action<T> = (state: IosState, me: Member | undefined, now: string) => Result<T>;

interface IosApi {
  state: IosState;
  hydrated: boolean;
  me: Member | undefined;
  today: string;
  online: boolean;
  run: <T>(action: Action<T>) => { ok: true; value: T } | { ok: false; error: DomainError };
  setup: (settings: Omit<Settings, "setupDone">, members: Member[], includeSample: boolean) => { ok: true } | { ok: false; error: DomainError };
  resetWorkspace: () => void;
}

const Ctx = createContext<IosApi | null>(null);

function load(): IosState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return migrateState(JSON.parse(raw) as IosState);
  } catch {
    /* corrupted or blocked storage: start clean */
  }
  return emptyState();
}

export function IosProvider({ children }: { children: React.ReactNode }) {
  const session = useMember();
  const [state, setState] = useState<IosState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  // Kept in step with every commit/load so actions never run on a stale snapshot.
  const ref = useRef(state);

  useEffect(() => {
    const s = load();
    ref.current = s;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser storage after mount
    setState(s);
    setHydrated(true);
    setOnline(navigator.onLine);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const next = migrateState(JSON.parse(e.newValue) as IosState);
        ref.current = next;
        setState(next);
      } catch {
        /* ignore */
      }
    };
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const commit = useCallback((next: IosState) => {
    ref.current = next;
    setState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota or private mode: state still lives for this session */
    }
  }, []);

  const me = useMemo(() => {
    if (!session || session.role !== "os") return undefined;
    return state.members.find((m) => m.id === session.id) ?? state.members.find((m) => m.email.toLowerCase() === session.email.toLowerCase());
  }, [session, state.members]);
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  const run = useCallback(<T,>(action: Action<T>) => {
    // Always act on the newest state, so a concurrent change from another tab is seen by the version check.
    let latest = ref.current;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) latest = migrateState(JSON.parse(raw) as IosState);
    } catch {
      /* ignore */
    }
    const res = action(latest, meRef.current, new Date().toISOString());
    if (!res.ok) {
      // A conflict means newer data exists: show it, so the user can compare and choose (UX09).
      if (res.error.code === "conflict" && latest !== ref.current) {
        ref.current = latest;
        setState(latest);
      }
      return { ok: false as const, error: res.error };
    }
    commit(res.state);
    return { ok: true as const, value: res.value };
  }, [commit]);

  const setup = useCallback((settings: Omit<Settings, "setupDone">, members: Member[], includeSample: boolean) => {
    const now = new Date().toISOString();
    const res = setupCompany(ref.current, settings, members, now);
    if (!res.ok) return { ok: false as const, error: res.error };
    let next = res.state;
    if (includeSample) {
      const today = todayIn(settings.timezone);
      const sample = buildSample(today, members, { ...settings, setupDone: true });
      next = { ...next, ...sample, audit: [...next.audit, ...sample.audit] };
      next = addSampleOperations(next, today);
      next = { ...next, audit: [...next.audit].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)) };
    }
    commit(next);
    return { ok: true as const };
  }, [commit]);

  // Hold expiry job (OPS03): runs on open and every minute; idempotent, so tabs racing each other is harmless.
  useEffect(() => {
    if (!hydrated) return;
    const tick = () => {
      let latest = ref.current;
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) latest = migrateState(JSON.parse(raw) as IosState);
      } catch {
        /* ignore */
      }
      const res = expireHolds(latest, new Date().toISOString());
      if (res.expired) commit(res.state);
    };
    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [hydrated, commit]);

  const resetWorkspace = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    commit(emptyState());
  }, [commit]);

  const today = hydrated ? todayIn(state.settings.timezone) : "";

  const value = useMemo(() => ({ state, hydrated, me, today, online, run, setup, resetWorkspace }), [state, hydrated, me, today, online, run, setup, resetWorkspace]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIos must be used inside IosProvider");
  return ctx;
}
