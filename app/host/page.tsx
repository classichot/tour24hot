"use client";

import Link from "next/link";
import { useHost } from "@/lib/host/store";
import { HOST_MAX_DAYS } from "@/lib/host/types";
import { LocText } from "@/components/os/ui";
import { money } from "@/lib/os/engines";

export default function HostHomePage() {
  const { h, snap } = useHost();
  const s = snap.stay;
  const next = s.arrivals[0];

  return (
    <main className="flex flex-col gap-10">
      <div>
        <h1 className="text-[clamp(32px,3.6vw,48px)] tracking-[-0.03em]">{h.desk}</h1>
        <p className="mt-2 text-[15px] text-neutral-700 max-w-[640px]">
          <LocText v={s.title} /> · {h.rule}
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-6 gap-y-3 border-t border-b border-divider">
        <Kpi n={`${s.days} / ${HOST_MAX_DAYS}`} l={h.usedDays} />
        <Kpi n={String(s.pax)} l={h.pax} />
        <Kpi n={String(s.rooms)} l={h.rooms} />
        <Kpi n={money(s.sell)} l="Sell" />
        <Kpi n={`${HOST_MAX_DAYS}`} l={h.maxDays} />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{h.stay}</h2>
          <Link href="/host/days" className="block border border-divider p-4 no-underline text-text hover:border-text">
            <div className="font-extrabold">
              <LocText v={s.title} />
            </div>
            <p className="text-[13px] text-neutral-700 mt-1">
              {s.dateStart} → {s.dateEnd} · {s.days} {h.days}
            </p>
          </Link>
        </div>
        <div>
          <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{h.nextIn}</h2>
          {next && (
            <Link href="/host/arrivals" className="block border border-divider p-4 no-underline text-text hover:border-text">
              <div className="font-extrabold">{next.flight}</div>
              <p className="text-[13px] text-neutral-700 mt-1">
                {next.at.slice(0, 16).replace("T", " ")} · {next.pax} {h.pax}
              </p>
              <p className="text-[13px] mt-1">
                <LocText v={next.note} />
              </p>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({ n, l }: { n: string; l: string }) {
  return (
    <div className="py-3 pr-10 min-w-[120px]">
      <div className="os-kpi">{n}</div>
      <div className="text-[11px] text-neutral-600 mt-1.5 uppercase tracking-[0.06em]">{l}</div>
    </div>
  );
}
