"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { LocText, Pill } from "@/components/os/ui";

export default function TravelerPortal() {
  const { L } = useApp();
  const { snap } = useOs();
  const me = snap.passengers[0];
  const prod = snap.products[0];
  return (
    <main className="flex flex-col gap-4">
      <div className="kicker">Traveller</div>
      <h1 className="text-[28px]">{me.name}</h1>
      <p className="text-[14px]">
        <LocText v={prod.title} /> · {snap.departures[0].dateStart}
      </p>
      <Pill tone={me.docsReady ? "ok" : "warn"}>{me.docsReady ? "Documents ready" : "Passport still needed"}</Pill>
      <ol className="flex flex-col gap-2">
        {prod.itinerary.map((d) => (
          <li key={d.d} className="border-2 border-divider p-3">
            <div className="microlabel">Day {d.d}</div>
            <div className="font-extrabold">{L(d.title)}</div>
            <p className="text-[13px]">{L(d.body)}</p>
          </li>
        ))}
      </ol>
      <div className="text-[13px]">Voucher SKY-OS-4012 · payment: deposit received, balance due 12 Sep.</div>
    </main>
  );
}
