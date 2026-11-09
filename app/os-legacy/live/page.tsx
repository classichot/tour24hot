"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { simulateDay2 } from "@/lib/os/engines";
import DemoBar from "@/components/os/DemoBar";
import { LocText, Pill } from "@/components/os/ui";

export default function LivePage() {
  const { L } = useApp();
  const { o, snap, toggleTask } = useOs();
  const sim = simulateDay2(snap);
  const fl = snap.flights[0];
  return (
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.live}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Live trip command centre</h1>
      </div>
      <DemoBar />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4">
        <div className="border-2 border-divider p-4">
          <div className="microlabel mb-2">Timeline · day 1 Chiang Mai</div>
          <svg viewBox="0 0 640 220" className="w-full h-auto bg-surface">
            <path d="M40 160 H600" stroke="#201e1d" strokeWidth="2" />
            {[
              ["CNX", 80, fl?.delayed ? "11:40" : "07:10"],
              ["Coach", 200, "wait"],
              ["Nimman", 340, sim.delayed ? "13:30" : "12:15"],
              ["Doi Suthep", 480, sim.delayed ? "15:30" : "10:30"],
              ["Hotel", 580, "late"],
            ].map(([label, x, t]) => (
              <g key={String(label)}>
                <circle cx={x} cy="160" r="7" fill="#f2b01e" />
                <text x={Number(x)} y="120" textAnchor="middle" fontSize="12" fontWeight="800">
                  {label}
                </text>
                <text x={Number(x)} y="198" textAnchor="middle" fontSize="11">
                  {t}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-3 flex flex-col gap-1 text-[13px]">
            {sim.conflicts.map((c) => (
              <div key={c.en} className="bg-accent-100 px-2 py-1">
                <LocText v={c} />
              </div>
            ))}
            {sim.alts.map((c) => (
              <div key={c.en} className="px-2 py-1">
                → <LocText v={c} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-[18px]">Incidents</h2>
          {snap.incidents.length === 0 && <div className="text-[13px] text-neutral-700">No open incidents.</div>}
          {snap.incidents.map((i) => (
            <div key={i.id} className="border-2 border-divider p-3">
              <Pill tone={i.status === "open" ? "warn" : "ok"}>{i.status}</Pill>
              <div className="font-extrabold mt-1">
                <LocText v={i.title} />
              </div>
              <p className="text-[13px]">
                <LocText v={i.body} />
              </p>
            </div>
          ))}
          <h2 className="text-[18px] mt-3">Acknowledgements</h2>
          {snap.tasks.map((t) => (
            <label key={t.id} className="flex gap-2 items-start text-[13px]">
              <input type="checkbox" checked={!!t.ack || t.done} onChange={() => toggleTask(t.id)} />
              <span>
                {L(t.title)} · {t.owner}
              </span>
            </label>
          ))}
        </div>
      </div>
    </main>
  );
}
