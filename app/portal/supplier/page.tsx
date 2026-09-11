"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { LocText, Pill } from "@/components/os/ui";

export default function SupplierPortal() {
  const { L } = useApp();
  const { snap, confirmService, quoteService } = useOs();
  const meal = snap.services.find((s) => s.id === "svc-meal-d2");
  const agiLines = snap.services.filter((s) => s.id.startsWith("svc-agi-"));

  return (
    <main className="flex flex-col gap-4">
      <div className="kicker">Secure supplier link</div>
      <h1 className="text-[28px]">{L({ th: "พอร์ทัลซัพพลายเออร์", en: "Supplier portal" })}</h1>
      <p className="text-[13px] text-neutral-800">
        {L({
          th: "ไม่มี API — ตอบใบเสนอที่นี่ คำตอบไม่ใช่การถือห้องหรือที่นั่ง",
          en: "No API. Reply with a quote here. A reply is not a room or seat hold.",
        })}
      </p>

      {meal && (
        <section className="border-2 border-divider p-3.5 flex flex-col gap-2">
          <div className="font-extrabold">Nimman group table</div>
          <p className="text-[14px]">
            <LocText v={meal.name} /> · {meal.qty} heads · {meal.state}
          </p>
          <Pill tone="warn">{meal.notes ? L(meal.notes) : meal.rateClass}</Pill>
          <button type="button" className="btn btn-primary self-start" onClick={() => confirmService(meal.id)}>
            Confirm this service
          </button>
        </section>
      )}

      {agiLines.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="microlabel">{L({ th: "คำขอกรุ๊ปจีนสามเหลี่ยมทองคำ — ยังไม่ถือของ", en: "Golden Triangle inbound requests — nothing held" })}</div>
          {agiLines.map((s) => (
            <div key={s.id} className="border-2 border-divider p-3.5 flex flex-col gap-2">
              <div className="font-extrabold text-[14px]"><LocText v={s.name} /></div>
              <div className="text-[13px]">{s.qty} · {s.rateClass} · {s.state}</div>
              <Pill tone={s.state === "quoted" ? "ok" : "warn"}>{s.state}</Pill>
              <p className="text-[12px] text-neutral-700">{s.source}</p>
              <button
                type="button"
                className="btn btn-primary self-start"
                disabled={s.state === "quoted"}
                onClick={() => quoteService(s.id)}
              >
                {s.state === "quoted" ? "✓" : L({ th: "ส่งใบเสนอ (ไม่ถือของ)", en: "Send quote (no hold)" })}
              </button>
            </div>
          ))}
        </section>
      )}

      {!meal && agiLines.length === 0 && (
        <p className="text-[14px]">{L({ th: "ยังไม่มีคำขอในลิงก์นี้", en: "No requests on this link yet." })}</p>
      )}

      <Link href="/os/agi" className="text-[13px]">
        {L({ th: "กลับโหมด AGI", en: "Back to AGI Mode" })}
      </Link>
    </main>
  );
}
