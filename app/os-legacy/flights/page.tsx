"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { flightExposure, money } from "@/lib/os/engines";
import { LocText, Pill, Table } from "@/components/os/ui";

export default function FlightsDeskPage() {
  const { L } = useApp();
  const { o, snap } = useOs();
  const rows = flightExposure(snap);
  return (
    <main className="flex flex-col gap-6">
      <div>
        <div className="kicker">{o.flights}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Group flight desk</h1>
        <p className="mt-2 text-[14px] max-w-[680px] text-neutral-800">
          Seat blocks, sold vs unsold, name-list readiness, deposits, release and ticketing deadlines, and contractual exposure. AI Flight and Seat Advisor recommends keep vs release.
        </p>
      </div>
      <Table
        heads={["Block", "Seats", o.sold, o.unsold, "PNR", o.names, o.ticket, o.exposure, "Advice"]}
        rows={rows.map((f) => [
          `${f.airline} ${f.flightNo} ${f.from}→${f.to}${f.delayed ? " · DELAY" : ""}`,
          String(f.seats),
          String(f.sold),
          String(f.unsold),
          f.pnr || "—",
          f.namesDue.slice(5, 16).replace("T", " "),
          f.ticketBy.slice(5, 16).replace("T", " "),
          money(f.leak),
          f.keep ? "KEEP" : "REVIEW RELEASE",
        ])}
      />
      <section>
        <h2 className="mb-2 text-[20px]">Passenger-name readiness</h2>
        <Table
          heads={["Passenger", "Passport name", "Ticket"]}
          rows={snap.passengers.slice(0, 12).map((p) => [p.name, p.namePassport, p.ticketStatus])}
        />
        <div className="text-[12px] text-neutral-700 mt-2">Showing first 12 of {snap.passengers.length}. Full list lives on the departure workspace.</div>
      </section>
      <section>
        <h2 className="mb-2 text-[20px]">Consolidator terms</h2>
        {snap.suppliers
          .filter((s) => s.kind === "consolidator")
          .map((s) => (
            <div key={s.id} className="border-2 border-divider p-3.5">
              <div className="font-extrabold">
                <LocText v={s.name} />
              </div>
              <p className="text-[13px] mt-1">{L(s.terms)}</p>
              <Pill>quoted</Pill>
            </div>
          ))}
      </section>
    </main>
  );
}
