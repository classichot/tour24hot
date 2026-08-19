"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { agencyById, pkgById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { statusInfo, depUnavailable } from "@/lib/helpers";
import { Check, ShieldCheck } from "@/components/icons";
import SoldOutAlts from "@/components/SoldOutAlts";

export default function BookPage() {
  return (
    <Suspense fallback={<main className="max-w-[1200px] mx-auto px-[22px] pt-6" />}>
      <BookInner />
    </Suspense>
  );
}

function BookInner() {
  const { t, L, money } = useApp();
  const routeParams = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const p = pkgById(routeParams.id);

  const [step, setStep] = useState(1);
  const [depIndex, setDepIndex] = useState(() => {
    const d = searchParams.get("dep");
    return d !== null && !isNaN(Number(d)) ? Number(d) : 0;
  });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [room, setRoom] = useState<"twin" | "triple" | "single">("twin");
  const [pay, setPay] = useState<"deposit" | "full">("deposit");
  const [method, setMethod] = useState<"qr" | "card" | "transfer">("qr");

  if (!p) {
    return (
      <main className="max-w-[1200px] mx-auto px-[22px] py-10">
        <h1>404</h1>
        <Link href="/search" className="btn btn-primary no-underline">
          {t.navSearch}
        </Link>
      </main>
    );
  }

  const ag = agencyById(p.agency);
  const dep = p.departures[depIndex] || p.departures[0];
  const blocked = depUnavailable(dep);
  const pax = adults + children;
  const childPrice = p.real - 2000;
  const roomSup = room === "single" ? 6500 : 0;
  const total = adults * p.real + children * childPrice + roomSup;
  const deposit = 5000 * pax;
  const due = pay === "deposit" ? deposit : total;
  const ref = `T24-9${String(90000 + (adults * 137 + children * 41 + depIndex * 7)).slice(1)}`;

  const stepCls = (active: boolean) =>
    `px-3.5 py-3 flex flex-col gap-0.5 ${active ? "bg-text text-bg" : "bg-bg text-neutral-700"}`;

  const depBtn = (selected: boolean) =>
    `flex items-center justify-between gap-2.5 px-[11px] py-[9px] cursor-pointer text-left w-full border text-text ${
      selected ? "bg-surface border-2 border-text" : "bg-bg border border-divider"
    }`;

  const methodBtn = (selected: boolean) =>
    `flex items-center justify-between gap-2.5 px-[11px] py-[9px] cursor-pointer text-left w-full border text-text ${
      selected ? "bg-surface border-2 border-text" : "bg-bg border border-divider"
    }`;

  const paxRows = Array.from({ length: pax }, (_, i) => ({
    label: `${i < adults ? t.bkAdults : t.bkChildren} ${i + 1}`,
  }));

  return (
    <main className="max-w-[1200px] mx-auto px-[22px] pb-20">
      <div className="pt-6 pb-3.5 border-b-2 border-divider">
        <h1 className="text-[clamp(24px,3vw,38px)]">{t.bookTitle}</h1>
      </div>
      {blocked ? (
        <div className="pt-6 max-w-[640px]">
          <SoldOutAlts p={p} depIndex={depIndex} onPickDate={setDepIndex} />
        </div>
      ) : (
      <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-0 bg-divider border-b-2 border-divider">
        {[
          { n: "01", label: t.bkStep1 },
          { n: "02", label: t.bkStep2 },
          { n: "03", label: t.bkStep3 },
          { n: "04", label: t.bkStep4 },
        ].map((s, i) => (
          <div key={s.n} className={stepCls(step === i + 1)}>
            <span className="text-[11px] tracking-[0.08em] font-extrabold">{s.n}</span>
            <span className="font-[family-name:var(--font-heading)] font-extrabold text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-7 flex-wrap items-start pt-6">
        <div className="flex-[999] basis-[480px] min-w-[290px]">
          {/* step 1 — travelers */}
          {step === 1 && (
            <div className="flex flex-col gap-[18px]">
              <div>
                <h2 className="mb-2.5 text-[19px]">{t.dDates}</h2>
                <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                  {p.departures.map((dp, i) => {
                    const st = statusInfo(dp.status, t);
                    return (
                      <button key={i} type="button" onClick={() => setDepIndex(i)} className={depBtn(i === depIndex)}>
                        <span className="font-[family-name:var(--font-heading)] font-extrabold text-[13px]">{L(dp.date)}</span>
                        <span className={st.cls}>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                <div className="field">
                  <label>{t.bkAdults}</label>
                  <select className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {t.people}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>{t.bkChildren}</label>
                  <select className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n} {t.people}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-700 mb-1.5">{t.bkRoom}</div>
                <div className="flex gap-4 flex-wrap">
                  {([
                    { v: "twin", label: t.bkTwin },
                    { v: "triple", label: t.bkTriple },
                    { v: "single", label: t.bkSingle },
                  ] as const).map((r) => (
                    <label key={r.v} className="radio">
                      <input type="radio" name="t24room" checked={room === r.v} onChange={() => setRoom(r.v)} />
                      <span className="dot" />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn-primary self-start" onClick={() => setStep(2)}>
                {t.next}
              </button>
            </div>
          )}

          {/* step 2 — passenger details */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[19px]">{t.bkStep2}</h2>
              {paxRows.map((px, i) => (
                <div key={i} className="border-2 border-divider p-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                  <div className="col-span-full text-[11px] tracking-[0.08em] uppercase font-extrabold text-accent-700">
                    {px.label}
                  </div>
                  <div className="field">
                    <label>{t.bkName}</label>
                    <input className="input" type="text" placeholder="SOMCHAI TANAKA" />
                  </div>
                  <div className="field">
                    <label>{t.bkPassport}</label>
                    <input className="input" type="text" placeholder="AA1234567" />
                  </div>
                </div>
              ))}
              <div className="border-2 border-divider p-3 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
                <div className="field">
                  <label>{t.bkPhone}</label>
                  <input className="input" type="tel" placeholder="081 234 5678" />
                </div>
                <div className="field">
                  <label>{t.bkEmail}</label>
                  <input className="input" type="email" placeholder="name@email.com" />
                </div>
                <div className="field">
                  <label>{t.bkLine}</label>
                  <input className="input" type="text" placeholder="@tour24" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  {t.back}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                  {t.next}
                </button>
              </div>
            </div>
          )}

          {/* step 3 — payment */}
          {step === 3 && (
            <div className="flex flex-col gap-[18px]">
              <h2 className="text-[19px]">{t.bkStep3}</h2>
              <div>
                <div className="text-xs text-neutral-700 mb-1.5">{t.bkTotal}</div>
                <div className="flex gap-4 flex-wrap">
                  <label className="radio">
                    <input type="radio" name="t24pay" checked={pay === "deposit"} onChange={() => setPay("deposit")} />
                    <span className="dot" />
                    <span>
                      {t.bkDeposit} · {money(deposit)}
                    </span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="t24pay" checked={pay === "full"} onChange={() => setPay("full")} />
                    <span className="dot" />
                    <span>
                      {t.bkFull} · {money(total)}
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-700 mb-1.5">{t.bkStep3}</div>
                <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                  {([
                    { v: "qr", label: t.bkQr },
                    { v: "card", label: t.bkCard },
                    { v: "transfer", label: t.bkTransfer },
                  ] as const).map((m) => (
                    <button key={m.v} type="button" onClick={() => setMethod(m.v)} className={methodBtn(method === m.v)}>
                      <span>{m.label}</span>
                      {method === m.v && <Check />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                  {t.back}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
                  {t.bkConfirm}
                </button>
              </div>
            </div>
          )}

          {/* step 4 — confirmed */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="bg-accent text-text p-[22px]">
                <h2 className="mb-1.5 text-[clamp(24px,3vw,34px)]">{t.bkDone}</h2>
                <p className="text-sm max-w-[520px]">{t.bkDoneSub}</p>
                <div className="mt-3.5 text-[11px] tracking-[0.1em] uppercase font-extrabold">{t.bkRef}</div>
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[26px]">{ref}</div>
              </div>
              <div>
                <h3 className="mb-2 text-[17px]">{t.bkNext}</h3>
                <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                  {[
                    L({ th: "เอเจนซียืนยันที่นั่งภายใน 24 ชั่วโมง", en: "The agency confirms your seats within 24 hours" }),
                    L({ th: "ส่งสำเนาหนังสือเดินทางในหน้าทริปของฉัน", en: "Upload passport copies in My trips" }),
                    L({ th: "ชำระส่วนที่เหลือก่อนเดินทาง 30 วัน", en: "Pay the balance 30 days before departure" }),
                    L({ th: "รับใบนัดหมายและเอกสารเดินทาง 7 วันก่อนออกเดินทาง", en: "Receive final documents 7 days before departure" }),
                  ].map((txt, i) => (
                    <div key={i} className="bg-bg px-3 py-2.5 flex gap-2.5 text-[13px]">
                      <span className="font-[family-name:var(--font-heading)] font-extrabold text-accent-700 min-w-[22px]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{txt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn-primary self-start" onClick={() => router.push("/trips")}>
                {t.bkTrips}
              </button>
            </div>
          )}
        </div>

        {/* summary sidebar */}
        <aside className="flex-1 basis-[300px] min-w-[280px] max-w-[380px] border-2 border-text sticky top-[88px] self-start">
          <div className="px-4 pt-3.5 pb-3 border-b-2 border-divider">
            <div className="microlabel">{t.bkSummary}</div>
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[17px] leading-[1.2] mt-1">
              {L(p.title)}
            </div>
            <div className="text-xs text-neutral-700">
              {L(ag.name)} · {L(dep.date)}
            </div>
          </div>
          <div className="px-4 py-3 flex flex-col gap-[7px] border-b-2 border-divider">
            {[
              { label: `${t.bkAdults} × ${adults}`, value: money(adults * p.real) },
              { label: `${t.bkChildren} × ${children}`, value: money(children * childPrice) },
              { label: t.bkRoom, value: roomSup ? `+${money(roomSup)}` : money(0) },
              { label: `${t.realTotal} / ${t.perPerson}`, value: money(p.real) },
              { label: t.bkFull, value: money(total) },
            ].map((l, i) => (
              <div key={i} className="flex justify-between gap-2.5 text-[13px]">
                <span className="text-neutral-800">{l.label}</span>
                <span className="font-[family-name:var(--font-heading)] font-extrabold">{l.value}</span>
              </div>
            ))}
          </div>
          <div className="px-4 pt-3.5 pb-3.5">
            <div className="microlabel">{t.bkTotal}</div>
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[34px] leading-[1.05] text-accent-700">
              {money(due)}
            </div>
            <div className="text-xs text-neutral-700">
              {pay === "deposit"
                ? L({
                    th: `มัดจำ 5,000 บาท ต่อคน · ส่วนที่เหลือ ${money(total - deposit)}`,
                    en: `฿5,000 deposit per person · balance ${money(total - deposit)}`,
                  })
                : L({ th: `ชำระเต็มจำนวน ${pax} ท่าน`, en: `Paid in full for ${pax} travellers` })}
            </div>
            <div className="flex gap-1.5 items-center text-[11px] text-neutral-700 mt-2.5">
              <ShieldCheck stroke="var(--color-accent-700)" />
              <span>{t.bkProtect}</span>
            </div>
          </div>
        </aside>
      </div>
      </>
      )}
    </main>
  );
}
