"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { LocText, Pill, Table } from "@/components/os/ui";
import { money } from "@/lib/os/engines";

export default function SalesPage() {
  const { L } = useApp();
  const { o, snap } = useOs();
  return (
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.os}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">{o.sales}</h1>
        <p className="mt-2 text-[14px] text-neutral-800 max-w-[680px]">
          Enquiries from the website, marketplace, group desk and Agent Direct land in one pipeline. AI Tour Producer turns the message into a brief you can edit.
        </p>
      </div>

      <Table
        heads={["Stage", "Enquiry", "Channel", "Pax", "Budget", "Owner", "Follow-up"]}
        rows={snap.enquiries.map((e) => [
          <Pill key={e.id} tone={e.stage === "won" ? "ok" : "warn"}>
            {e.stage}
          </Pill>,
          <div key={`${e.id}-t`}>
            <div className="font-extrabold">
              <LocText v={e.title} />
            </div>
            <div className="text-neutral-700 text-[12px]">
              <LocText v={e.brief} />
            </div>
          </div>,
          e.channel,
          String(e.pax),
          money(e.budget),
          e.owner,
          e.followUp.slice(0, 16).replace("T", " "),
        ])}
      />

      <section>
        <h2 className="mb-2 text-[20px]">Customers</h2>
        <Table
          heads={["Name", "Type", "Contact"]}
          rows={snap.customers.map((c) => [L(c.name), c.type, `${c.contact} · ${c.email}`])}
        />
      </section>

      <section>
        <h2 className="mb-2 text-[20px]">Quotation versions</h2>
        <Table
          heads={["Version", "Pax", "Sell", "Cost", "Margin", "Assumptions"]}
          rows={snap.quotes.map((q) => [
            L(q.label),
            String(q.pax),
            money(q.sell),
            money(q.cost),
            `${q.margin.toFixed(1)}%`,
            q.assumptions.map((a) => L(a)).join(" · "),
          ])}
        />
      </section>
    </main>
  );
}
