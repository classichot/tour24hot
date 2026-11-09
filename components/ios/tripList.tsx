"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useIos } from "@/lib/ios/store";
import {
  COMMERCIAL_LABEL,
  FINANCIAL_LABEL,
  OPERATIONAL_LABEL,
  computeReadiness,
  customerLabel,
  daysBetween,
  effectiveQuoteStatus,
  fmtMoney,
  fmtRange,
  guestCount,
  memberName,
  nextAction,
  quoteTotals,
  QUOTE_LABEL,
} from "@/lib/ios/rules";
import type { CommercialStage, IosState, OperationalStage, TripFile } from "@/lib/ios/types";
import { Badge, inputCls, type Tone } from "./ui";

export const COMMERCIAL_TONE: Record<CommercialStage, Tone> = { enquiry: "info", quoting: "info", awaiting: "warn", booked: "good", lost: "neutral", cancelled: "neutral" };
export const OPERATIONAL_TONE: Record<OperationalStage, Tone> = { not_started: "neutral", arranging: "warn", ready: "good", in_progress: "info", completed: "good", cancelled: "neutral" };

/** Filters persist per user and page (NAV04). Read after mount so server and first client render match. */
export function usePersisted<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved filters once after mount
      if (raw) setV({ ...initial, ...(JSON.parse(raw) as T) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [key, v, loaded]);
  return [v, setV];
}

export interface TripFilters {
  q: string;
  owner: string;
  partner: string;
  stage: string;
  destination: string;
  from: string;
  to: string;
  exceptionsOnly: boolean;
}

export const EMPTY_FILTERS: TripFilters = { q: "", owner: "", partner: "", stage: "", destination: "", from: "", to: "", exceptionsOnly: false };

/** Unresolved exceptions on a trip — the same causes Today shows. */
export function tripExceptions(state: IosState, t: TripFile, today: string) {
  const out: string[] = [];
  const q = t.quotes[t.quotes.length - 1];
  if (t.commercial === "enquiry" && !t.ownerId) out.push("Unassigned");
  const fr = state.tasks.find((k) => k.ruleKey === `first_response:${t.id}` && k.status !== "done" && k.status !== "cancelled");
  if (fr && Date.parse(fr.due) < Date.now()) out.push("First response overdue");
  if (q) {
    const st = effectiveQuoteStatus(q, today);
    const m = quoteTotals(q).margin;
    if (st === "expired" && t.commercial === "awaiting") out.push("Quote expired");
    if ((st === "draft" || st === "awaiting_approval") && m !== null && m < state.settings.marginThreshold) out.push("Margin below threshold");
  }
  if (t.commercial === "booked") {
    if (t.incidents.some((i) => i.status !== "resolved" && (i.severity === "critical" || i.severity === "high"))) out.push("Open incident");
    if (t.reservations.some((r) => r.discrepancy)) out.push("Supplier reply differs");
    if (t.reservations.some((r) => r.status === "held" && r.holdExpiry && Date.parse(r.holdExpiry) - Date.now() < 24 * 3600000)) out.push("Hold expiring");
    if (t.operational === "arranging" && t.startDate && daysBetween(today, t.startDate) * 24 <= state.settings.readinessHours && daysBetween(today, t.startDate) >= 0) out.push("Arriving, not ready");
  }
  return out;
}

export function applyFilters(state: IosState, trips: TripFile[], f: TripFilters, today: string) {
  const q = f.q.trim().toLowerCase();
  return trips.filter((t) => {
    if (q && ![t.ref, t.name, customerLabel(state, t), t.externalRef ?? ""].join(" ").toLowerCase().includes(q)) return false;
    if (f.owner && (f.owner === "none" ? !!t.ownerId : t.ownerId !== f.owner)) return false;
    if (f.partner && (f.partner === "direct" ? !!t.partnerId : t.partnerId !== f.partner)) return false;
    if (f.stage && t.commercial !== f.stage && t.operational !== f.stage) return false;
    if (f.destination && !t.destinations.some((d) => d.toLowerCase().includes(f.destination.toLowerCase()))) return false;
    if (f.from && (!t.startDate || t.startDate < f.from)) return false;
    if (f.to && (!t.startDate || t.startDate > f.to)) return false;
    if (f.exceptionsOnly && !tripExceptions(state, t, today).length) return false;
    return true;
  });
}

export function FilterBar({ f, setF, stages }: { f: TripFilters; setF: (v: TripFilters) => void; stages: { value: string; label: string }[] }) {
  const { state } = useIos();
  const set = <K extends keyof TripFilters>(k: K, v: TripFilters[K]) => setF({ ...f, [k]: v });
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);
  return (
    <div className="flex flex-col gap-3 rounded-[6px] border border-[#dcd9d6] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="fl-q" className="text-[14px] font-semibold">Search</label>
          <input id="fl-q" className={inputCls} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Ref, name, customer" />
        </div>
        <div>
          <label htmlFor="fl-owner" className="text-[14px] font-semibold">Owner</label>
          <select id="fl-owner" className={inputCls} value={f.owner} onChange={(e) => set("owner", e.target.value)}>
            <option value="">Anyone</option>
            <option value="none">Unassigned</option>
            {state.members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="fl-partner" className="text-[14px] font-semibold">Partner</label>
          <select id="fl-partner" className={inputCls} value={f.partner} onChange={(e) => set("partner", e.target.value)}>
            <option value="">Any</option>
            <option value="direct">Direct customers</option>
            {state.companies.filter((c) => c.roles.includes("partner")).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="fl-stage" className="text-[14px] font-semibold">Stage</label>
          <select id="fl-stage" className={inputCls} value={f.stage} onChange={(e) => set("stage", e.target.value)}>
            <option value="">All stages</option>
            {stages.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="fl-dest" className="text-[14px] font-semibold">Destination</label>
          <input id="fl-dest" className={inputCls} value={f.destination} onChange={(e) => set("destination", e.target.value)} />
        </div>
        <div>
          <label htmlFor="fl-from" className="text-[14px] font-semibold">Travel from</label>
          <input id="fl-from" type="date" className={inputCls} value={f.from} onChange={(e) => set("from", e.target.value)} />
        </div>
        <div>
          <label htmlFor="fl-to" className="text-[14px] font-semibold">Travel to</label>
          <input id="fl-to" type="date" className={inputCls} value={f.to} onChange={(e) => set("to", e.target.value)} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-[15px] font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[#f2b01e]" checked={f.exceptionsOnly} onChange={(e) => set("exceptionsOnly", e.target.checked)} />
          Only with unresolved exceptions
        </label>
      </div>
      {active && (
        <button type="button" className="self-start cursor-pointer border-0 bg-transparent p-0 text-[15px] font-semibold text-[#875e00] underline" onClick={() => setF(EMPTY_FILTERS)}>
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function TripTable({ trips, mode }: { trips: TripFile[]; mode: "sales" | "trips" }) {
  const { state, today } = useIos();
  const cur = state.settings.currency;
  return (
    <div className="overflow-x-auto rounded-[6px] border border-[#dcd9d6] bg-white" role="region" aria-label={mode === "sales" ? "Enquiries" : "Trips"} tabIndex={0}>
      <table className="w-full min-w-[980px] border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-[#dcd9d6] bg-[#fbfaf9] text-left text-[14px] text-[#5b5754]">
            <th className="px-4 py-3">Trip</th>
            <th className="px-4 py-3">Customer or agency</th>
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3 text-right">Guests</th>
            {mode === "sales" ? <th className="px-4 py-3">Stage and quote</th> : <th className="px-4 py-3">Commercial · Operational · Financial</th>}
            {mode === "sales" && <th className="px-4 py-3 text-right">Latest quote</th>}
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Next action</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => {
            const q = t.quotes[t.quotes.length - 1];
            const exc = tripExceptions(state, t, today);
            const na = nextAction(t, today);
            return (
              <tr key={t.id} className="border-b border-[#ebe8e5] align-top hover:bg-[#fbfaf9]">
                <td className="px-4 py-3">
                  <Link href={`/os/trips/${t.id}`} className="font-semibold text-[#201e1d] no-underline hover:underline">{t.name}</Link>
                  <div className="text-[14px] text-[#6b6764]">
                    <span className="font-mono">{t.ref}</span>
                    {t.sample && <> · <Badge>Sample</Badge></>}
                  </div>
                  {exc.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{exc.map((e) => <Badge key={e} tone="bad">{e}</Badge>)}</div>}
                </td>
                <td className="px-4 py-3">{customerLabel(state, t)}</td>
                <td className="whitespace-nowrap px-4 py-3">{fmtRange(t.startDate, t.endDate, t.flexibleDates)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{guestCount(t) || "—"}</td>
                <td className="px-4 py-3">
                  {mode === "sales" ? (
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={COMMERCIAL_TONE[t.commercial]}>{COMMERCIAL_LABEL[t.commercial]}</Badge>
                      {q && <Badge tone="neutral">v{q.number} {QUOTE_LABEL[effectiveQuoteStatus(q, today)]}</Badge>}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={COMMERCIAL_TONE[t.commercial]}>{COMMERCIAL_LABEL[t.commercial]}</Badge>
                      <Badge tone={OPERATIONAL_TONE[t.operational]}>{OPERATIONAL_LABEL[t.operational]}</Badge>
                      {t.commercial === "booked" && (() => {
                        const r = computeReadiness(t, today);
                        return r.mandatory ? <Badge tone={r.confirmed === r.mandatory ? "good" : "warn"}>{r.confirmed}/{r.mandatory} confirmed</Badge> : null;
                      })()}
                      <Badge tone="neutral">Finance {FINANCIAL_LABEL[t.financial]}</Badge>
                    </div>
                  )}
                </td>
                {mode === "sales" && <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{q ? fmtMoney(quoteTotals(q).revenue, q.currency) : `${cur} —`}</td>}
                <td className="px-4 py-3">{memberName(state, t.ownerId)}</td>
                <td className="px-4 py-3">
                  <Link href={`/os/trips/${t.id}?tab=${na.tab}`} className="font-semibold text-[#875e00]">{na.label}</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
