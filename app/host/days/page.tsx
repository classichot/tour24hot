"use client";

import { useHost } from "@/lib/host/store";
import { HOST_MAX_DAYS } from "@/lib/host/types";
import { LocText } from "@/components/os/ui";

export default function HostDaysPage() {
  const { h, snap, addDay, atCap } = useHost();
  const s = snap.stay;

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[clamp(28px,3vw,40px)] tracking-[-0.03em]">{h.days}</h1>
          <p className="mt-2 text-[14px] text-neutral-700">
            {s.days} / {HOST_MAX_DAYS} · {h.rule}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => addDay()} disabled={atCap}>
          {atCap ? h.atCap : h.addDay}
        </button>
      </div>
      <ol className="flex flex-col list-none p-0 m-0">
        {s.daysPlan.map((d) => (
          <li key={d.n} className="border border-divider p-4 -mt-px first:mt-0 grid grid-cols-[48px_minmax(0,1fr)] gap-4">
            <div className="os-kpi">{d.n}</div>
            <div>
              <div className="font-extrabold">
                <LocText v={d.title} />
              </div>
              <p className="text-[13px] text-neutral-700 mt-1">
                <LocText v={d.city} />
              </p>
              <p className="text-[13px] mt-1 text-neutral-700">
                <LocText v={d.note} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
