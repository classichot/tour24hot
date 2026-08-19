"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { I18N, type Dict, type Lang } from "./i18n";
import { pkgById, type Loc } from "./data";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");
  const [compare, setCompare] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>(["jp03"]);

  const setHydrated = useCallback((h: { lang: Lang | null; compare: string[] | null; saved: string[] | null }) => {
    if (h.lang) setLangState(h.lang);
    if (h.compare) setCompare(h.compare);
    if (h.saved) setSaved(h.saved);
  }, []);

  // Restore persisted state on mount (client only, avoids SSR mismatch).
  useEffect(() => {
    try {
      const l = window.localStorage.getItem("t24lang") as Lang | null;
      const c = window.localStorage.getItem("t24compare");
      const s = window.localStorage.getItem("t24saved");
      const lang = l === "th" || l === "en" ? l : null;
      const compare = c ? (JSON.parse(c) as string[]) : null;
      const saved = s ? (JSON.parse(s) as string[]) : null;
      // One deliberate re-sync from the external store (localStorage) after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated({ lang, compare, saved });
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
    setLangState(l);
    try {
      window.localStorage.setItem("t24lang", l);
    } catch { /* noop */ }
  }, []);

  const t = useMemo<Dict>(() => ({ ...I18N.en, ...I18N[lang] }), [lang]);

  const L = useCallback(
    (v: Loc | null | undefined) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return v[lang] !== undefined ? v[lang] : v.en;
      return v;
    },
    [lang]
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
    () => ({ lang, setLang, t, L, money, compare, toggleCompare, clearCompare, inCompare, saved, toggleSaved }),
    [lang, setLang, t, L, money, compare, toggleCompare, clearCompare, inCompare, saved, toggleSaved]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
