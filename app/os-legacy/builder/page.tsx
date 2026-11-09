"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { money, serviceCost, totals } from "@/lib/os/engines";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import { LocText, Pill, rateTone, Source } from "@/components/os/ui";

export default function BuilderPage() {
  const { L } = useApp();
  const { o, snap } = useOs();
  const prod = snap.products[0];
  const t = totals(snap, DEMO_DEP_ID);
  const [notes, setNotes] = useState("Named hotels, 0 shopping, child 75%, single +฿6,500, FOC 1/16.");

  return (
    <main className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <div className="kicker">{o.builder}</div>
          <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">
            <LocText v={prod.title} />
          </h1>
          <p className="text-[13px] text-neutral-700 mt-1">
            Template {prod.code} · {prod.kind} · min {prod.minPax} · cap {prod.capacity} · target margin {prod.marginTarget}%
            {prod.marketplacePkgId ? ` · marketplace ${prod.marketplacePkgId}` : ""}
          </p>
        </div>
        {prod.itinerary.map((d) => (
          <div key={d.d} className="border-2 border-divider p-3.5">
            <div className="microlabel">
              Day {d.d} · {d.start}–{d.end}
            </div>
            <div className="font-extrabold text-[17px] mt-1">
              <LocText v={d.title} />
            </div>
            <p className="text-[13px] mt-1">
              <LocText v={d.body} />
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {snap.services
                .filter((s) => s.day === d.d)
                .map((s) => (
                  <Pill key={s.id} tone={rateTone(s.rateClass)}>
                    {L(s.name)}
                  </Pill>
                ))}
            </div>
          </div>
        ))}
      </div>
      <aside className="border-2 border-divider p-3.5 h-fit xl:sticky xl:top-[72px] flex flex-col gap-3">
        <div className="microlabel">Live costing</div>
        <div className="font-[family-name:var(--font-heading)] font-extrabold text-[28px]">{money(t.sell)}</div>
        <div className="text-[13px]">
          Cost {money(t.cost)} · margin {t.margin.toFixed(1)}%
        </div>
        <ul className="text-[12px] flex flex-col gap-1">
          {snap.services.map((s) => (
            <li key={s.id} className="flex justify-between gap-2">
              <span>{L(s.name)}</span>
              <span>{money(serviceCost(s))}</span>
            </li>
          ))}
        </ul>
        <label className="field">
          <span className="text-[12px]">Assumptions (editable)</span>
          <textarea className="input min-h-[88px] mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="text-[11px] text-neutral-700">Unconfirmed items stay amber until a supplier confirmation is stored.</div>
        <Source src="AI Tour Producer + contract rates" at="2026-09-05T14:20:00" />
      </aside>
    </main>
  );
}
