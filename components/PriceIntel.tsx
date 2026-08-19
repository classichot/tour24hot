"use client";

import { DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { priceIntel } from "@/lib/helpers";
import type { Pkg } from "@/lib/data";

export default function PriceIntel({ p, compact = false }: { p: Pkg; compact?: boolean }) {
  const { t, money } = useApp();
  const intel = priceIntel(p, DATA.packages);
  if (!intel) return null;

  const line =
    intel.band === "great"
      ? `${Math.abs(intel.pct)}% ${t.piBelow}`
      : intel.band === "high"
        ? `${intel.pct}% ${t.piAbove}`
        : t.piInLine;

  if (compact) {
    return (
      <div className={`text-[11px] leading-[1.35] ${intel.band === "great" ? "text-accent-700 font-extrabold" : "text-neutral-700"}`}>
        {intel.band === "great" ? `${t.piGreatDeal} · ` : ""}
        {line}
      </div>
    );
  }

  const span = Math.max(1, intel.high - intel.low);
  const mark = Math.min(100, Math.max(0, ((p.real - intel.low) / span) * 100));

  return (
    <div className="border-2 border-divider px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="microlabel">{t.piTitle}</div>
        {intel.band === "great" && (
          <span className="bg-accent text-text text-[10px] font-extrabold tracking-[0.08em] uppercase px-2 py-0.5">
            {t.piGreatDeal}
          </span>
        )}
      </div>
      <div className={`font-[family-name:var(--font-heading)] font-extrabold text-[15px] leading-[1.2] ${intel.band === "great" ? "text-accent-700" : ""}`}>
        {line}
      </div>
      <div className="relative h-[6px] bg-surface mt-3 mb-2">
        <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${mark}%` }} />
        <div className="absolute top-[-3px] w-[2px] h-[12px] bg-text" style={{ left: `calc(${mark}% - 1px)` }} />
      </div>
      <div className="flex justify-between text-[11px] text-neutral-700">
        <span>
          {t.piLow} {money(intel.low)}
        </span>
        <span>
          {t.piAvg} {money(intel.avg)}
        </span>
        <span>
          {t.piHigh} {money(intel.high)}
        </span>
      </div>
      <div className="text-[11px] text-neutral-700 mt-1.5">
        {intel.n} {t.piPeers}
      </div>
    </div>
  );
}
