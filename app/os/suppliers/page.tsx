"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { LocText, Pill, Source, Table, rateTone } from "@/components/os/ui";
import { money } from "@/lib/os/engines";

export default function SuppliersPage() {
  const { L } = useApp();
  const { o, snap, confirmService } = useOs();
  return (
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.suppliers}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Supplier workspace</h1>
      </div>
      <Table
        heads={["Supplier", "Kind", "Terms", "Rating"]}
        rows={snap.suppliers.map((s) => [L(s.name), s.kind, L(s.terms), String(s.rating)])}
      />
      <section>
        <h2 className="mb-2 text-[20px]">{o.compare}</h2>
        <div className="border-2 border-divider p-3.5 text-[13px]">
          <div className="font-extrabold mb-1">Group air — equivalent offers</div>
          TG consolidator ฿12,500 hold / walk-up ฿14,900 / JL group ฿13,400 no child fare. Missing: name-change fee, infant seat policy.
          <Source src="Extracted from Q-TG-8841.pdf + JL email" at="2026-09-04T16:10:00" />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-[20px]">Reservations</h2>
        <Table
          heads={["Service", "State", "Class", "Deadline", ""]}
          rows={snap.services.map((s) => [
            L(s.name),
            <Pill key={s.id} tone={rateTone(s.state)}>
              {s.state}
            </Pill>,
            s.rateClass,
            s.deadline ? s.deadline.slice(0, 16).replace("T", " ") : "—",
            <button key={`${s.id}-b`} type="button" className="btn btn-secondary" onClick={() => confirmService(s.id)}>
              {o.ack}
            </button>,
          ])}
        />
      </section>
      <div className="text-[13px] text-neutral-700">
        Secure supplier links stay simple — confirm or decline without a full login. Cost {money(snap.services.reduce((a, s) => a + s.qty * s.unitCost, 0))} committed across this departure.
      </div>
    </main>
  );
}
