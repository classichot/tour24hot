"use client";

import { useState } from "react";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { ArrowRight, Check } from "@/components/icons";

const BIDS = [
  { agency: "siam", price: 43500, days: 6, note: { th: "โรงแรม 4 ดาว มีชื่อ · ไม่ลงร้าน · ไกด์ภาษาไทย", en: "Named 4-star hotels · no shopping · Thai-speaking guide" } },
  { agency: "orient", price: 44900, days: 6, note: { th: "กลุ่มส่วนตัว 16 คน · บิน JAL ตรง", en: "Private group of 16 · JAL direct" } },
  { agency: "vela", price: 46000, days: 7, note: { th: "เพิ่ม 1 วันอิสระ · ออนเซ็น 1 คืน", en: "Extra free day · one onsen night" } },
];

export default function GroupPage() {
  const { t, L, money } = useApp();
  const [sent, setSent] = useState(false);
  const [dest, setDest] = useState("Japan");
  const [pax, setPax] = useState("15");
  const [budget, setBudget] = useState("45000");
  const [notes, setNotes] = useState("");

  return (
    <main className="max-w-[1000px] mx-auto px-[22px] pb-20">
      <div className="pt-[26px] pb-4 border-b-2 border-divider">
        <div className="kicker">{t.navGroup}</div>
        <h1 className="my-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03]">{t.grpTitle}</h1>
        <p className="text-[15px] text-neutral-800 max-w-[620px]">{t.grpSub}</p>
      </div>

      {!sent ? (
        <form
          className="pt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 max-w-[720px]"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="field">
            <label>{t.grpDest}</label>
            <select className="input" value={dest} onChange={(e) => setDest(e.target.value)}>
              {DATA.destinations.map((d) => (
                <option key={d.id} value={d.name.en}>
                  {L(d.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.grpWhen}</label>
            <select className="input" defaultValue="dec">
              <option value="oct">{L({ th: "ตุลาคม 2026", en: "October 2026" })}</option>
              <option value="nov">{L({ th: "พฤศจิกายน 2026", en: "November 2026" })}</option>
              <option value="dec">{L({ th: "ธันวาคม 2026", en: "December 2026" })}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.grpPax}</label>
            <input className="input" type="number" min={8} value={pax} onChange={(e) => setPax(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.grpBudget}</label>
            <input className="input" type="number" step={500} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="field col-span-full">
            <label>{t.grpNotes}</label>
            <textarea className="input min-h-[90px]" value={notes} placeholder={t.grpNotesPh} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary justify-between min-w-[220px]">
            <span>{t.grpSend}</span>
            <ArrowRight />
          </button>
        </form>
      ) : (
        <section className="pt-6">
          <div className="border-2 border-text p-4 mb-6">
            <div className="kicker">{t.grpSent}</div>
            <p className="mt-2 text-sm max-w-[560px]">{t.grpSentSub}</p>
            <div className="text-xs text-neutral-700 mt-2">
              {dest} · {pax} {t.people} · {money(Number(budget))}
            </div>
          </div>
          <h2 className="mb-3 text-[22px]">{t.grpBids}</h2>
          <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
            {BIDS.map((b) => {
              const ag = agencyById(b.agency)!;
              return (
                <div key={b.agency} className="bg-bg p-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 items-start">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.1em] font-extrabold text-accent-700">
                      {t.verifiedBadge} · {t.trust} {ag.trust}
                    </div>
                    <div className="font-extrabold text-[19px] mt-1">{L(ag.name)}</div>
                    <p className="text-[13px] text-neutral-800 mt-1">{L(b.note)}</p>
                  </div>
                  <div>
                    <div className="microlabel">{t.grpBid}</div>
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-[28px] text-accent-700">
                      {money(b.price)}
                    </div>
                    <div className="text-xs text-neutral-700">
                      {b.days} {t.days} · {t.perPerson}
                    </div>
                    <button type="button" className="btn btn-primary mt-3">
                      <Check />
                      <span>{t.grpChoose}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
