"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { breakEvenPax, money, totals } from "@/lib/os/engines";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import DemoBar from "@/components/os/DemoBar";
import { LocText, Pill, Stat, Table } from "@/components/os/ui";

export default function OsHomePage() {
  const { L } = useApp();
  const { o, snap } = useOs();
  const dep = snap.departures[0];
  const prod = snap.products[0];
  const t = totals(snap, DEMO_DEP_ID);
  const due = snap.tasks.filter((x) => !x.done);
  const pendingSvc = snap.services.filter((s) => s.state === "requested" || s.state === "quoted");

  return (
    <main className="flex flex-col gap-10">
      <div>
        <h1 className="text-[clamp(36px,4.4vw,56px)] tracking-[-0.03em]">{o.home}</h1>
        <p className="mt-3 text-[15px] max-w-[640px] text-neutral-700">{o.demoLine}</p>
      </div>

      <DemoBar />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-6 gap-y-3 border-t border-b border-divider">
        <Stat n={String(t.pax)} l={o.pax} />
        <Stat n={money(t.sell)} l="Sell" />
        <Stat n={money(t.cost)} l="Cost" />
        <Stat n={`${t.margin.toFixed(1)}%`} l={o.margin} />
        <Stat n={String(breakEvenPax(snap, DEMO_DEP_ID))} l="Break-even" />
        <Stat n={money(t.collected)} l="Collected" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{o.today}</h2>
          <div className="flex flex-col gap-0">
            {snap.departures.map((d) => {
              const p = snap.products.find((x) => x.id === d.productId) || prod;
              const tt = totals(snap, d.id);
              return (
                <Link key={d.id} href={`/os/departures/${d.id}`} className="block border border-divider p-4 no-underline text-text hover:border-text -mt-px first:mt-0">
                  <div className="flex justify-between gap-2">
                    <LocText v={p.title} />
                    <Pill tone={d.status === "quoting" ? "warn" : "ok"}>{d.status}</Pill>
                  </div>
                  <div className="text-[13px] text-neutral-700 mt-1">
                    {d.dateStart} → {d.dateEnd} · {tt.pax}/{d.capacity}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{o.urgent}</h2>
          <Table
            heads={["Task", "Owner", "Due"]}
            rows={due.map((x) => [L(x.title), x.owner, x.due.slice(0, 16).replace("T", " ") + ` ${x.tz}`])}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{o.unconf}</h2>
        <Table
          heads={[o.suppliers, "State", "Class", o.source]}
          rows={pendingSvc.map((s) => [L(s.name), s.state, s.rateClass, <span key={s.id}>{s.source}</span>])}
        />
      </section>

      <section>
        <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{o.channels}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {dep.channelAllocations.map((c) => (
            <div key={c.channel} className="border border-divider p-4 -ml-px first:ml-0">
              <div className="font-extrabold capitalize">{c.channel}</div>
              <div className="text-[13px]">
                {c.sold}/{c.seats} · fee {c.commission}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
