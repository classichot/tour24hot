"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { readiness, totals } from "@/lib/os/engines";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import DemoBar from "@/components/os/DemoBar";
import { LocText, Money, Pill, Table, rateTone } from "@/components/os/ui";

const TABS = ["overview", "pax", "flights", "buses", "rooms", "meals", "acts", "guides", "docs", "finance"] as const;

export default function DeparturePage() {
  const { L } = useApp();
  const { o, snap } = useOs();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const dep = snap.departures.find((d) => d.id === DEMO_DEP_ID)!;
  const prod = snap.products[0];
  const t = totals(snap, DEMO_DEP_ID);
  const ready = readiness(snap, DEMO_DEP_ID);

  return (
    <main className="flex flex-col gap-5">
      <div>
        <div className="kicker">{o.departure}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">
          <LocText v={prod.title} />
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 text-[13px]">
          <Pill tone="ok">{dep.status}</Pill>
          <span>
            {dep.dateStart} → {dep.dateEnd}
          </span>
          <span>
            {t.pax}/{dep.capacity} pax · cutoff {dep.cutoff.slice(0, 10)} · {dep.timezone}
          </span>
        </div>
      </div>
      <DemoBar />
      <nav className="flex flex-wrap gap-0.5 border-b-2 border-divider">
        {TABS.map((k) => (
          <button key={k} type="button" className={`px-3 py-2 border-0 font-extrabold text-[13px] ${tab === k ? "bg-text text-bg" : "bg-surface"}`} onClick={() => setTab(k)}>
            {o[k] || k}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <Table
          heads={["Service", "Supplier", "Qty", "Cost", "Class", "State"]}
          rows={snap.services.map((s) => [
            L(s.name),
            L(snap.suppliers.find((x) => x.id === s.supplierId)?.name || s.supplierId),
            String(s.qty),
            <Money key={s.id} n={s.qty * s.unitCost} />,
            <Pill key={`${s.id}-c`} tone={rateTone(s.rateClass)}>
              {s.rateClass}
            </Pill>,
            s.state,
          ])}
        />
      )}
      {tab === "pax" && (
        <Table
          heads={["Name", "Passport", "Room", "Diet", "Ticket", "Ready"]}
          rows={snap.passengers.map((p) => [
            `${p.name}${p.addedLate ? " +" : ""}`,
            p.passport || "—",
            p.roomPref,
            p.diet,
            p.ticketStatus,
            p.docsReady ? "ok" : "flag",
          ])}
        />
      )}
      {tab === "flights" && (
        <Table
          heads={["Flight", "Route", "Seats", "PNR", "Names", "Ticket by"]}
          rows={snap.flights.map((f) => [
            `${f.airline} ${f.flightNo}${f.delayed ? " DELAYED" : ""}`,
            `${f.from}→${f.to} ${f.departAt.slice(11, 16)}`,
            `${f.sold}/${f.seats}`,
            f.pnr || "—",
            f.namesDue.slice(0, 16).replace("T", " "),
            f.ticketBy.slice(0, 16).replace("T", " "),
          ])}
        />
      )}
      {tab === "buses" && (
        <Table
          heads={["Plate", "Seats", "Driver", "Pickup"]}
          rows={snap.vehicles.map((v) => [v.plate, String(v.seats), v.driver, L(v.pickup)])}
        />
      )}
      {tab === "rooms" && (
        <Table
          heads={["Hotel", "Nights", "Twin", "Single", "FOC", "Release"]}
          rows={snap.hotels.map((h) => [L(h.hotel), String(h.nights), String(h.twins), String(h.singles), String(h.comps), h.releaseAt.slice(0, 10)])}
        />
      )}
      {tab === "meals" && (
        <Table
          heads={["Venue", "Day", "Time", "Cap", "Diet"]}
          rows={snap.meals.map((m) => [L(m.venue), String(m.day), m.time, String(m.capacity), L(m.dietNotes)])}
        />
      )}
      {tab === "acts" && (
        <Table
          heads={["Activity", "Slot", "Cap", "Voucher"]}
          rows={snap.activities.map((a) => [L(a.name), a.slot, String(a.capacity), a.voucher])}
        />
      )}
      {tab === "guides" && (
        <Table
          heads={["Name", "Role", "Lang", "Fee"]}
          rows={snap.guides.map((g) => [L(g.name), g.role, g.langs.join("/"), <Money key={g.id} n={g.fee} />])}
        />
      )}
      {tab === "docs" && (
        <div className="text-[14px]">
          Readiness {ready.score}/100 · missing passports {ready.missingPass.length} · name mismatches {ready.nameMismatch.length} · no insurance {ready.noIns.length}
        </div>
      )}
      {tab === "finance" && (
        <Table
          heads={["Line", "Side", "Amount", "Due", "Status"]}
          rows={snap.ledger.map((l) => [L(l.label), l.side, <Money key={l.id} n={l.amount} />, l.due, l.status])}
        />
      )}
    </main>
  );
}
