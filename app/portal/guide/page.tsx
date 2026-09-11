"use client";

import { useState } from "react";
import { useOs } from "@/lib/os/store";
import { LocText } from "@/components/os/ui";

export default function GuidePortal() {
  const { snap } = useOs();
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <main className="flex flex-col gap-4">
      <div className="kicker">Guide</div>
      <h1 className="text-[28px]">
        <LocText v={snap.guides[0].name} />
      </h1>
      <div className="text-[14px]">Manifest {snap.passengers.length} · coaches 2 · Doi Suthep {snap.activities[0]?.slot || "—"}</div>
      <ul className="text-[13px]">
        {snap.tasks.filter((t) => t.module === "docs" || t.module === "meal").map((t) => (
          <li key={t.id}>☐ <LocText v={t.title} /></li>
        ))}
      </ul>
      <textarea className="input min-h-[80px]" placeholder="Incident / delay note" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="btn btn-primary" onClick={() => setSent(true)}>
        File incident
      </button>
      {sent && <div className="text-[13px]">Logged to the departure command centre (demo).</div>}
    </main>
  );
}
