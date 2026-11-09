"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "../store";
import { hostCopy } from "./copy";
import { createHostSeed } from "./seed";
import { HOST_MAX_DAYS, clampHostDays, type HostState } from "./types";

interface HostApi {
  snap: HostState;
  h: ReturnType<typeof hostCopy>;
  addDay: () => boolean;
  reset: () => void;
  atCap: boolean;
}

const Ctx = createContext<HostApi | null>(null);
const KEY = "t24host.d45";

function load(): HostState {
  if (typeof window === "undefined") return createHostSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as HostState;
  } catch {
    /* ignore */
  }
  return createHostSeed();
}

export function HostProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useApp();
  const [snap, setSnap] = useState<HostState>(createHostSeed);
  const [hydrated, setHydrated] = useState(false);
  const h = hostCopy(lang);

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

  const addDay = useCallback(() => {
    if (snap.stay.days >= HOST_MAX_DAYS) return false;
    const n = clampHostDays(snap.stay.days + 1);
    setSnap((s) => ({
      stay: {
        ...s.stay,
        days: n,
        daysPlan: [
          ...s.stay.daysPlan,
          {
            n,
            title: { th: `วันที่ ${n}`, en: `Day ${n}`, zh: `第${n}天` },
            city: { th: "ยังไม่กำหนด", en: "Unassigned", zh: "未指定" },
            note: { th: "วันที่เพิ่ม — ยังไม่ถือของ", en: "Added day — nothing held", zh: "新增日 — 未锁库存" },
          },
        ],
      },
    }));
    return true;
  }, [snap.stay.days]);

  const reset = useCallback(() => {
    const fresh = createHostSeed();
    setSnap(fresh);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ snap, h, addDay, reset, atCap: snap.stay.days >= HOST_MAX_DAYS }),
    [snap, h, addDay, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHost() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHost must be used inside HostProvider");
  return ctx;
}
