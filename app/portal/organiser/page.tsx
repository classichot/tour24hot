"use client";

import { useOs } from "@/lib/os/store";
import { LocText } from "@/components/os/ui";

export default function OrganiserPortal() {
  const { snap } = useOs();
  return (
    <main className="flex flex-col gap-4">
      <div className="kicker">Organiser</div>
      <h1 className="text-[28px]">
        <LocText v={snap.customers[0].name} />
      </h1>
      <p className="text-[14px]">{snap.passengers.length} names on the list. Room twins {snap.hotels[0].twins} / singles {snap.hotels[0].singles}.</p>
      <ul className="text-[13px] flex flex-col gap-1">
        {snap.passengers.map((p) => (
          <li key={p.id} className="flex justify-between border-b border-divider py-1">
            <span>{p.name}</span>
            <span>{p.passport ? "OK" : "passport?"}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
