"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "../store";
import { applyAddPax, applyDelay, approveAll, buildDrafts, closeDeparture } from "./engines";
import { createSeed } from "./seed";
import { osCopy } from "./copy";
import type { AiDraft, DemoStage, OsSnapshot } from "./types";

interface OsApi {
  snap: OsSnapshot;
  o: ReturnType<typeof osCopy>;
  ask: string;
  setAsk: (v: string) => void;
  drafts: AiDraft[];
  runAsk: () => void;
  applyDraft: (id: string, text: string) => void;
  addFive: () => void;
  delayFlight: () => void;
  approve: () => void;
  closeTrip: () => void;
  reset: () => void;
  runDemo: () => void;
  toggleTask: (id: string) => void;
  confirmService: (id: string) => void;
}

const Ctx = createContext<OsApi | null>(null);
const KEY = "t24os";

function load(): OsSnapshot {
  if (typeof window === "undefined") return createSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as OsSnapshot;
  } catch {
    /* ignore */
  }
  return createSeed();
}

export function OsProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useApp();
  const [snap, setSnap] = useState<OsSnapshot>(createSeed);
  const [hydrated, setHydrated] = useState(false);
  const [ask, setAsk] = useState("");
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const o = osCopy(lang);

  useEffect(() => {
    setSnap(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(snap));
    } catch {
      /* ignore */
    }
  }, [snap, hydrated]);

  const runAsk = useCallback(() => {
    setDrafts(buildDrafts(snap, ask));
  }, [snap, ask]);

  const applyDraft = useCallback((id: string, text: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, editable: text, applied: true } : d)));
    setSnap((s) => ({
      ...s,
      log: [{ at: new Date().toISOString(), text: { th: `ใช้ร่าง AI: ${id}`, en: `Applied AI draft: ${id}` } }, ...s.log],
    }));
  }, []);

  const addFive = useCallback(() => {
    setSnap((s) => applyAddPax(s).next);
  }, []);

  const delayFlight = useCallback(() => {
    setSnap((s) => applyDelay(s).next);
  }, []);

  const approve = useCallback(() => {
    setSnap((s) => approveAll(s));
  }, []);

  const closeTrip = useCallback(() => {
    setSnap((s) => closeDeparture(s));
  }, []);

  const reset = useCallback(() => {
    const fresh = createSeed();
    setSnap(fresh);
    setDrafts([]);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const runDemo = useCallback(() => {
    const order: DemoStage[] = ["allocated", "paxAdded", "disrupted", "approved", "closed"];
    const i = order.indexOf(snap.demoStage);
    if (i < 0 || snap.demoStage === "allocated") addFive();
    else if (snap.demoStage === "paxAdded") delayFlight();
    else if (snap.demoStage === "disrupted") approve();
    else if (snap.demoStage === "approved") closeTrip();
    else reset();
  }, [snap.demoStage, addFive, delayFlight, approve, closeTrip, reset]);

  const toggleTask = useCallback((id: string) => {
    setSnap((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done, ack: true } : t)) }));
  }, []);

  const confirmService = useCallback((id: string) => {
    setSnap((s) => ({
      ...s,
      services: s.services.map((x) => (x.id === id ? { ...x, state: "confirmed", rateClass: "confirmed" } : x)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      snap,
      o,
      ask,
      setAsk,
      drafts,
      runAsk,
      applyDraft,
      addFive,
      delayFlight,
      approve,
      closeTrip,
      reset,
      runDemo,
      toggleTask,
      confirmService,
    }),
    [snap, o, ask, drafts, runAsk, applyDraft, addFive, delayFlight, approve, closeTrip, reset, runDemo, toggleTask, confirmService]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOs must be used inside OsProvider");
  return ctx;
}
