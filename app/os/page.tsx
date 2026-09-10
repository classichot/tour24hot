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
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.os}</div>
        <h1 className="mt-1 text-[clamp(28px,3vw,42px)]">{o.home}</h1>
        <p className="mt-2 text-[15px] max-w-[720px] text-neutral-800">{o.demoLine}</p>
      </div>

      <DemoBar />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-2 border-divider">
        <Stat n={String(t.pax)} l={o.pax} />
        <Stat n={money(t.sell)} l="Sell" />
        <Stat n={money(t.cost)} l="Cost" />
        <Stat n={`${t.margin.toFixed(1)}%`} l={o.margin} />
        <Stat n={String(breakEvenPax(snap, DEMO_DEP_ID))} l="Break-even" />
        <Stat n={money(t.collected)} l="Collected" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="mb-2 text-[20px]">{o.today}</h2>
          <Link href={`/os/departures/${dep.id}`} className="block border-2 border-divider p-3.5 no-underline text-text hover:border-text">
            <div className="flex justify-between gap-2">
              <LocText v={prod.title} />
              <Pill tone="ok">{dep.status}</Pill>
            </div>
            <div className="text-[13px] text-neutral-700 mt-1">
              {dep.dateStart} → {dep.dateEnd} · {t.pax}/{dep.capacity} · ICT / JST
            </div>
          </Link>
        </div>
        <div>
          <h2 className="mb-2 text-[20px]">{o.urgent}</h2>
          <Table
            heads={["Task", "Owner", "Due"]}
            rows={due.map((x) => [L(x.title), x.owner, x.due.slice(0, 16).replace("T", " ") + ` ${x.tz}`])}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[20px]">{o.unconf}</h2>
        <Table
          heads={[o.suppliers, "State", "Class", o.source]}
          rows={pendingSvc.map((s) => [L(s.name), s.state, s.rateClass, <span key={s.id}>{s.source}</span>])}
        />
      </section>

      <section>
        <h2 className="mb-2 text-[20px]">{o.channels}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-0.5 bg-divider border-2 border-divider">
          {dep.channelAllocations.map((c) => (
            <div key={c.channel} className="bg-bg p-3.5">
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
