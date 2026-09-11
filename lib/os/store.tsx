"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "../store";
import { applyAddPax, applyDelay, approveAll, buildDrafts, closeDeparture } from "./engines";
import { createSeed } from "./seed";
import { osCopy } from "./copy";
import { agiCopy } from "./agi/copy";
import {
  applyChangeToSnap,
  applyRescueToSnap,
  buildChangePlan,
  buildRescue,
  FLAGSHIP_BRIEF,
  runOneCommand,
  togglePause,
  withMission,
} from "./agi/engine";
import {
  applyIngest,
  authorizeNextRound,
  briefFromTap,
  buildIngest,
  draftsFromIngest,
  FLAGSHIP_TAP,
  hydrateAgi,
  ingestFromFile,
  ingestFromVoice,
  markRoundReplied,
  resumeJobInState,
  runRehearsalCase,
  tryTapBrief,
} from "./agi/features";
import { type AgiIngest, type AgiState, type RehearsalId } from "./agi/types";
import type { AiDraft, DemoStage, OsSnapshot } from "./types";

interface OsApi {
  snap: OsSnapshot;
  o: ReturnType<typeof osCopy>;
  a: ReturnType<typeof agiCopy>;
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
  agi: AgiState;
  setAgiOn: (on: boolean) => void;
  assignObjective: (text?: string) => void;
  pauseMission: (id: string) => void;
  runChangeOnce: () => void;
  applyChangeOnce: () => void;
  runRescue: () => void;
  applyRescue: (optionId: string) => void;
  resetAgi: () => void;
  ingestPaste: (text: string) => void;
  ingestFile: (file: File) => Promise<void>;
  ingestVoice: (text: string) => void;
  resumeJob: (jobId: string) => void;
  authorizeRound: () => void;
  markSupplierReply: (jobId?: string) => void;
  runRehearsalCase: (id: RehearsalId) => void;
  acceptTapBrief: (raw?: string) => void;
  quoteService: (id: string) => void;
}

const Ctx = createContext<OsApi | null>(null);
const KEY = "t24os.gt40";
const AGI_KEY = "t24osAgi.gt40";

function loadSnap(): OsSnapshot {
  if (typeof window === "undefined") return createSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as OsSnapshot;
  } catch {
    /* ignore */
  }
  return createSeed();
}

function loadAgi(): AgiState {
  if (typeof window === "undefined") return hydrateAgi(null);
  try {
    const raw = window.localStorage.getItem(AGI_KEY);
    if (raw) return hydrateAgi(JSON.parse(raw) as AgiState);
  } catch {
    /* ignore */
  }
  return hydrateAgi(null);
}

export function OsProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useApp();
  const [snap, setSnap] = useState<OsSnapshot>(createSeed);
  const [agi, setAgi] = useState<AgiState>(() => hydrateAgi(null));
  const [hydrated, setHydrated] = useState(false);
  const [ask, setAsk] = useState("");
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const o = osCopy(lang);
  const a = agiCopy(lang);

  useEffect(() => {
    const storedAgi = loadAgi();
    const storedSnap = loadSnap();
    setSnap(storedSnap);
    setAgi((current) => (current.on && !storedAgi.on ? { ...storedAgi, on: true } : storedAgi));
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(AGI_KEY, JSON.stringify(agi));
    } catch {
      /* ignore */
    }
  }, [agi, hydrated]);

  const assignObjective = useCallback((text?: string) => {
    const incoming = (text ?? ask).trim() || FLAGSHIP_BRIEF;
    const tap = tryTapBrief(incoming);
    const raw = tap ? briefFromTap(tap) : incoming;
    const out = runOneCommand(snap, tap ? JSON.stringify(tap) : raw);
    setSnap(out.snap);
    setAgi((s) => {
      const next = withMission({ ...s, on: true }, out.mission, true);
      return tap ? { ...next, tapInbox: [tap, ...next.tapInbox.filter((t) => t.agency !== tap.agency)] } : next;
    });
    setAsk(raw);
  }, [ask, snap]);

  const runAsk = useCallback(() => {
    if (agi.on) {
      assignObjective(ask);
      return;
    }
    setDrafts(buildDrafts(snap, ask));
  }, [agi.on, ask, snap, assignObjective]);

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

  const resetAgi = useCallback(() => {
    setAgi((s) => hydrateAgi(null, s.on));
    try {
      window.localStorage.removeItem(AGI_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    const fresh = createSeed();
    setSnap(fresh);
    setDrafts([]);
    setAgi((s) => hydrateAgi(null, s.on));
    try {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(AGI_KEY);
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

  const quoteService = useCallback((id: string) => {
    setSnap((s) => ({
      ...s,
      services: s.services.map((x) =>
        x.id === id ? { ...x, state: "quoted", rateClass: "quoted", notes: { th: "ใบเสนอจากพอร์ทัล — ยังไม่ถือของ", en: "Portal quote — nothing held" }, updatedAt: new Date().toISOString() } : x
      ),
    }));
    setAgi((st) => markRoundReplied(st));
  }, []);

  const commitIngest = useCallback((ingest: AgiIngest, preview?: string, agiOn?: boolean) => {
    const on = agiOn ?? agi.on;
    const text = (preview || ingest.rawPreview || "").trim();
    if (on && text) assignObjective(text);
    setAgi((s) => applyIngest(s, ingest));
    if (preview) setAsk(preview);
    if (!on) setDrafts(draftsFromIngest(ingest));
  }, [agi.on, assignObjective]);

  const ingestPaste = useCallback(
    (text: string) => {
      const ingest = buildIngest("paste", "paste.txt", text);
      commitIngest(ingest, text);
    },
    [commitIngest]
  );

  const ingestFile = useCallback(
    async (file: File) => {
      const ingest = await ingestFromFile(file);
      commitIngest(ingest, ingest.rawPreview);
    },
    [commitIngest]
  );

  const ingestVoice = useCallback(
    (text: string) => {
      const ingest = ingestFromVoice(text);
      commitIngest(ingest, text);
    },
    [commitIngest]
  );

  const resumeJob = useCallback((jobId: string) => {
    setAgi((s) => resumeJobInState(s, jobId));
  }, []);

  const authorizeRound = useCallback(() => {
    setAgi((s) => authorizeNextRound(s));
  }, []);

  const markSupplierReply = useCallback((jobId?: string) => {
    setAgi((s) => {
      const next = markRoundReplied(s);
      return jobId ? resumeJobInState(next, jobId) : next;
    });
  }, []);

  const runRehearsal = useCallback((id: RehearsalId) => {
    setAgi((s) => runRehearsalCase(s, id));
  }, []);

  const acceptTapBrief = useCallback((raw?: string) => {
    assignObjective(raw || JSON.stringify(FLAGSHIP_TAP, null, 2));
  }, [assignObjective]);

  const setAgiOn = useCallback((on: boolean) => {
    setAgi((s) => ({ ...s, on }));
  }, []);

  const pauseMission = useCallback((id: string) => {
    setAgi((s) => togglePause(s, id));
  }, []);

  const runChangeOnce = useCallback(() => {
    setAgi((s) => {
      const id = s.activeId;
      return {
        ...s,
        missions: s.missions.map((m) =>
          m.id === id
            ? {
                ...m,
                status: "awaiting_approval",
                changePlan: buildChangePlan(m.options[0]?.pax || 40, 32, 18),
                log: [{ at: new Date().toISOString(), agent: "director", text: { th: "ลูกค้าเหลือ 32 คน — ทำแผนผลกระทบทั้งทริป", en: "Client is now 32 — built a full-trip change plan" } }, ...m.log],
              }
            : m
        ),
      };
    });
  }, []);

  const applyChangeOnce = useCallback(() => {
    const m = agi.missions.find((x) => x.id === agi.activeId);
    if (!m?.changePlan) return;
    setSnap((s) => applyChangeToSnap(s, m.changePlan!));
    setAgi((s) => ({
      ...s,
      missions: s.missions.map((x) =>
        x.id === m.id
          ? {
              ...x,
              changePlan: { ...x.changePlan!, applied: true },
              options: x.options.map((o, i) => (i === 0 ? { ...o, pax: 32, sell: x.changePlan!.newSell, cost: x.changePlan!.newCost, margin: x.changePlan!.newMargin } : o)),
              status: "working",
              log: [{ at: new Date().toISOString(), agent: "director", text: { th: "อนุมัติแผนเปลี่ยนแล้ว — รอซัพพลายเออร์คอนเฟิร์ม", en: "Change plan authorized — suppliers must reconfirm" } }, ...x.log],
            }
          : x
      ),
    }));
  }, [agi.activeId, agi.missions]);

  const runRescue = useCallback(() => {
    setAgi((s) => ({
      ...s,
      missions: s.missions.map((m) =>
        m.id === s.activeId
          ? {
              ...m,
              status: "awaiting_approval",
              rescue: buildRescue(),
              log: [{ at: new Date().toISOString(), agent: "director", text: { th: "ไฟลต์ดีเลย์ — เปิดห้องกู้ทริป", en: "Arrival delay — opened Trip Rescue" } }, ...m.log],
            }
          : m
      ),
    }));
  }, []);

  const applyRescue = useCallback((optionId: string) => {
    setSnap((s) => applyRescueToSnap(s, optionId));
    setAgi((s) => ({
      ...s,
      missions: s.missions.map((m) =>
        m.id === s.activeId && m.rescue
          ? {
              ...m,
              rescue: { ...m.rescue, chosen: optionId },
              status: "working",
              log: [{ at: new Date().toISOString(), agent: "guide", text: { th: `ใช้แผนกู้ ${optionId}`, en: `Applied recovery ${optionId}` } }, ...m.log],
            }
          : m
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      snap,
      o,
      a,
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
      agi,
      setAgiOn,
      assignObjective,
      pauseMission,
      runChangeOnce,
      applyChangeOnce,
      runRescue,
      applyRescue,
      resetAgi,
      ingestPaste,
      ingestFile,
      ingestVoice,
      resumeJob,
      authorizeRound,
      markSupplierReply,
      runRehearsalCase: runRehearsal,
      acceptTapBrief,
      quoteService,
    }),
    [
      snap,
      o,
      a,
      ask,
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
      quoteService,
      agi,
      setAgiOn,
      assignObjective,
      pauseMission,
      runChangeOnce,
      applyChangeOnce,
      runRescue,
      applyRescue,
      resetAgi,
      ingestPaste,
      ingestFile,
      ingestVoice,
      resumeJob,
      authorizeRound,
      markSupplierReply,
      runRehearsal,
      acceptTapBrief,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOs must be used inside OsProvider");
  return ctx;
}
