"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { breakEvenPax, money, totals } from "@/lib/os/engines";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import { LocText, Money, Stat, Table } from "@/components/os/ui";

export default function FinancePage() {
  const { L } = useApp();
  const { o, snap } = useOs();
  const t = totals(snap, DEMO_DEP_ID);
  const quote = snap.quotes[snap.quotes.length - 1];
  return (
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.finance}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Finance dashboard</h1>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-2 border-divider">
        <Stat n={money(t.sell)} l="Expected sell" />
        <Stat n={money(t.cost)} l="Actual / committed cost" />
        <Stat n={`${t.margin.toFixed(1)}%`} l="Margin now" />
        <Stat n={`${quote?.margin.toFixed(1)}%`} l="Quoted margin" />
        <Stat n={money(t.collected)} l="Collected" />
        <Stat n={money(t.payableSoon)} l="Supplier due" />
      </div>
      <p className="text-[14px]">
        Quote vs actual: quoted cost {money(quote?.cost || 0)} vs live {money(t.cost)}. Break-even {breakEvenPax(snap, DEMO_DEP_ID)} passengers.
        Cash gap if balances slip: {money(Math.max(0, t.payableSoon - t.collected))}.
      </p>
      <Table
        heads={["Line", "In/Out", "Amount", "Due", "Status"]}
        rows={snap.ledger.map((l) => [
          <LocText key={l.id} v={l.label} />,
          l.side,
          <Money key={`${l.id}-a`} n={l.amount} />,
          l.due,
          l.status,
        ])}
      />
      <div className="text-[12px] text-neutral-700">Export-ready journal: same identifiers as bookings, services and supplier confirmations. Multi-currency costs stay in THB for this departure.</div>
    </main>
  );
}
