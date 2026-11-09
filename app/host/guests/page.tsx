"use client";

import { useHost } from "@/lib/host/store";
import { Table } from "@/components/os/ui";

export default function HostGuestsPage() {
  const { h, snap } = useHost();
  const s = snap.stay;

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-[clamp(28px,3vw,40px)] tracking-[-0.03em]">{h.guests}</h1>
        <p className="mt-2 text-[14px] text-neutral-700">
          {s.guests.length} / {s.pax} · {h.rooms} {s.rooms}
        </p>
      </div>
      <Table
        heads={["Name", "Room", "Status"]}
        rows={s.guests.map((g) => [g.name, g.room, g.status])}
      />
    </main>
  );
}
