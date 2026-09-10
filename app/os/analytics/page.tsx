"use client";

import { useOs } from "@/lib/os/store";
import { money, totals } from "@/lib/os/engines";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import { Stat } from "@/components/os/ui";

export default function AnalyticsPage() {
  const { o, snap } = useOs();
  const t = totals(snap, DEMO_DEP_ID);
  const cap = snap.departures[0].capacity;
  return (
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.analytics}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Management and forecasts</h1>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] border-2 border-divider">
        <Stat n="1 / 1" l="Won corporate enquiries" />
        <Stat n={`${t.margin.toFixed(1)}%`} l="Departure margin" />
        <Stat n={`${Math.round((t.pax / cap) * 100)}%`} l="Capacity used" />
        <Stat n={String(snap.incidents.length)} l="Incidents this trip" />
        <Stat n={money(t.sell)} l="This departure GMV" />
      </div>
      <section className="border-2 border-divider p-3.5 text-[14px] max-w-[720px]">
        <div className="font-extrabold mb-1">AI Tour Memory</div>
        Prior Tokyo red-eye groups missed morning Skytree 4 in 10 times. Next Japan template defaults to afternoon attraction slots and prices driver overtime into the quote. Supplier Toko (guide) kept pace; Asakusa Table confirmed late twice — require T-48h written ack.
      </section>
    </main>
  );
}
