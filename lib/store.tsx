"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { htmlLang, I18N, isLang, type Dict, type Lang } from "./i18n";
import { resolveLoc } from "./l10n-pack";
import { pkgById, type Loc } from "./data";

function inboundPath(path: string) {
  return path.startsWith("/inbound") || /^\/(packages|book)\/th\d+/.test(path);
}

function inboundFromUrl(path: string, params: { get: (k: string) => string | null }) {
  if (inboundPath(path)) return true;
  const dir = params.get("dir");
  if (dir === "outbound") return false;
  if (dir === "inbound") return true;
  if (path === "/search" && params.get("country") === "Thailand") return true;
  return false;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  inboundMode: boolean;
  setInboundMode: (v: boolean) => void;
  t: Dict;
  L: (v: Loc | null | undefined) => string;
  money: (n: number) => string;
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  inCompare: (id: string) => boolean;
  saved: string[];
  toggleSaved: (id: string) => void;
}

const AppCtx = createContext<AppState | null>(null);

function pickLoc(v: { th: string; en: string; zh?: string; ru?: string } | string, lang: Lang) {
  return resolveLoc(v, lang);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const params = useSearchParams();
  const [lang, setLangState] = useState<Lang>("th");
  const [inboundMode, setInboundMode] = useState(false);
  const [inboundLang, setInboundLangState] = useState<Lang>("zh");
  const inboundDesk = inboundFromUrl(path, params) || (path !== "/search" && inboundMode);
  const inboundDeskRef = useRef(inboundDesk);
  inboundDeskRef.current = inboundDesk;
  const [compare, setCompare] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>(["jp03"]);

  const setHydrated = useCallback((h: { lang: Lang | null; inboundLang: Lang | null; compare: string[] | null; saved: string[] | null }) => {
    if (h.lang) setLangState(h.lang);
    if (h.inboundLang) setInboundLangState(h.inboundLang);
    if (h.compare) setCompare(h.compare);
    if (h.saved) setSaved(h.saved);
  }, []);

  useEffect(() => {
    try {
      const l = window.localStorage.getItem("t24lang");
      const ib = window.localStorage.getItem("t24inblang");
      const c = window.localStorage.getItem("t24compare");
      const s = window.localStorage.getItem("t24saved");
      const lang = isLang(l) ? l : null;
      const inboundLang = isLang(ib) ? ib : "zh";
      const compare = c ? (JSON.parse(c) as string[]) : null;
      const saved = s ? (JSON.parse(s) as string[]) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated({ lang, inboundLang, compare, saved });
    } catch {
      /* storage unavailable */
    }
  }, [setHydrated]);

  useEffect(() => {
    try {
      window.localStorage.setItem("t24compare", JSON.stringify(compare));
    } catch { /* noop */ }
  }, [compare]);

  useEffect(() => {
    try {
      window.localStorage.setItem("t24saved", JSON.stringify(saved));
    } catch { /* noop */ }
  }, [saved]);

  const setLang = useCallback((l: Lang) => {
    if (inboundDeskRef.current) {
      setInboundLangState(l);
      try {
        window.localStorage.setItem("t24inblang", l);
      } catch { /* noop */ }
      return;
    }
    setLangState(l);
    try {
      window.localStorage.setItem("t24lang", l);
    } catch { /* noop */ }
  }, []);

  const activeLang: Lang = inboundDesk ? inboundLang : lang;

  useEffect(() => {
    document.documentElement.lang = htmlLang(activeLang);
  }, [activeLang]);

  const t = useMemo<Dict>(() => ({ ...I18N.en, ...I18N[activeLang] }), [activeLang]);

  const L = useCallback(
    (v: Loc | null | undefined) => {
      if (v === null || v === undefined) return "";
      return pickLoc(v, activeLang);
    },
    [activeLang]
  );

  const money = useCallback((n: number) => "฿" + Number(n || 0).toLocaleString("en-US"), []);

  const toggleCompare = useCallback((id: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);

  const inCompare = useCallback((id: string) => compare.includes(id), [compare]);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      if (!pkgById(id)) return prev;
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, []);

  const value = useMemo(
    () => ({
      lang: activeLang,
      setLang,
      inboundMode: inboundDesk,
      setInboundMode,
      t,
      L,
      money,
      compare,
      toggleCompare,
      clearCompare,
      inCompare,
      saved,
      toggleSaved,
    }),
    [activeLang, setLang, inboundDesk, t, L, money, compare, toggleCompare, clearCompare, inCompare, saved, toggleSaved]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useInboundScope(on: boolean) {
  const { setInboundMode } = useApp();
  useEffect(() => {
    setInboundMode(on);
    return () => setInboundMode(false);
  }, [on, setInboundMode]);
}
