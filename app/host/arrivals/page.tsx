"use client";

import { useHost } from "@/lib/host/store";
import { LocText } from "@/components/os/ui";

export default function HostArrivalsPage() {
  const { h, snap } = useHost();

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-[clamp(28px,3vw,40px)] tracking-[-0.03em]">{h.arrivals}</h1>
        <p className="mt-2 text-[14px] text-neutral-700">{h.nextIn}</p>
      </div>
      <div className="flex flex-col">
        {snap.stay.arrivals.map((a) => (
          <div key={a.id} className="border border-divider p-4 -mt-px first:mt-0">
            <div className="font-extrabold">{a.flight}</div>
            <p className="text-[13px] text-neutral-700 mt-1">
              {a.at.slice(0, 16).replace("T", " ")} · {a.pax} {h.pax}
            </p>
            <p className="text-[13px] mt-1">
              <LocText v={a.note} />
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
