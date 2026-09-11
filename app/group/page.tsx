"use client";

import { useEffect, useRef, useState } from "react";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { groupBids, type GroupBid } from "@/lib/helpers";
import { ArrowRight, Check, Spinner } from "@/components/icons";

export default function GroupPage() {
  const { t, L, money, inboundMode } = useApp();
  const destChoices = inboundMode
    ? DATA.destinations.filter((d) => d.id === "th")
    : DATA.destinations.filter((d) => d.id !== "th");
  const [dest, setDest] = useState(inboundMode ? "Thailand" : "Japan");
  const destValue = destChoices.some((d) => d.name.en === dest) ? dest : destChoices[0]?.name.en || dest;
  const [when, setWhen] = useState("dec");
  const [pax, setPax] = useState("15");
  const [budget, setBudget] = useState("45000");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<"form" | "wait" | "bids" | "done">("form");
  const [visible, setVisible] = useState<GroupBid[]>([]);
  const [allBids, setAllBids] = useState<GroupBid[]>([]);
  const [chosen, setChosen] = useState<GroupBid | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const bids = groupBids(destValue, Number(pax) || 15, Number(budget) || 45000, notes);
    setAllBids(bids);
    setVisible([]);
    setChosen(null);
    setPhase("wait");
    bids.forEach((b) => {
      timers.current.push(
        setTimeout(() => {
          setVisible((prev) => [...prev, b]);
          setPhase("bids");
        }, b.delay)
      );
    });
  };

  const whenLabel =
    when === "oct"
      ? L({ th: "ตุลาคม 2026", en: "October 2026" })
      : when === "nov"
        ? L({ th: "พฤศจิกายน 2026", en: "November 2026" })
        : L({ th: "ธันวาคม 2026", en: "December 2026" });

  return (
    <main className="max-w-[1000px] mx-auto px-[22px] pb-20">
      <div className="pt-[26px] pb-4 border-b-2 border-divider">
        <div className="kicker">{t.navGroup}</div>
        <h1 className="my-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03]">{t.grpTitle}</h1>
        <p className="text-[15px] text-neutral-800 max-w-[620px]">{t.grpSub}</p>
        <p className="text-[13px] mt-2">
          <a href="/os/sales" className="font-extrabold">
            {t.navOs}
          </a>
          {" — "}
          {L({ th: "งานกลุ่มเข้าท่อขายของระบบปฏิบัติการ", en: "Group briefs open in the operator sales pipe." })}
        </p>
      </div>

      {phase === "form" && (
        <form
          className="pt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 max-w-[720px]"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="field">
            <label>{t.grpDest}</label>
            <select className="input" value={destValue} onChange={(e) => setDest(e.target.value)}>
              {destChoices.map((d) => (
                <option key={d.id} value={d.name.en}>
                  {L(d.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.grpWhen}</label>
            <select className="input" value={when} onChange={(e) => setWhen(e.target.value)}>
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
      )}

      {phase !== "form" && (
        <section className="pt-6">
          <div className="border-2 border-text p-4 mb-6">
            <div className="kicker">{t.grpSent}</div>
            <p className="mt-2 text-sm max-w-[560px]">{t.grpSentSub}</p>
            <div className="text-xs text-neutral-700 mt-2">
              {destValue} · {whenLabel} · {pax} {t.people} · {money(Number(budget))}
            </div>
            {phase === "wait" && (
              <div className="flex items-center gap-2 mt-3 text-[13px] font-extrabold">
                <Spinner />
                {t.grpWaiting}
              </div>
            )}
            {phase !== "wait" && (
              <div className="text-[13px] mt-2 font-extrabold">
                {visible.length}/{allBids.length} {t.grpIncoming}
              </div>
            )}
          </div>

          {phase === "done" && chosen && (
            <div className="border-2 border-accent p-4 mb-6">
              <div className="kicker">{t.grpAccepted}</div>
              <h2 className="mt-2 text-[22px]">{L(agencyById(chosen.agency).name)}</h2>
              <p className="text-sm mt-1 max-w-[560px]">{t.grpAcceptedSub}</p>
              <div className="font-extrabold text-[28px] text-accent-700 mt-2">{money(chosen.price)}</div>
              <button type="button" className="btn btn-secondary mt-3" onClick={() => setPhase("form")}>
                {t.grpNew}
              </button>
            </div>
          )}

          {visible.length > 0 && phase !== "done" && (
            <>
              <h2 className="mb-3 text-[22px]">{t.grpCompareOffers}</h2>
              <div className="overflow-x-auto border-2 border-divider mb-4">
                <div className="min-w-[720px]">
                  <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
                    <span className="flex-1 min-w-[160px]">{t.cAgency}</span>
                    <span className="flex-none w-[110px]">{t.grpBid}</span>
                    <span className="flex-none w-[70px]">{t.fDuration}</span>
                    <span className="flex-1 min-w-[140px]">{t.grpHotel}</span>
                    <span className="flex-1 min-w-[140px]">{t.grpShop}</span>
                    <span className="flex-none w-[80px]">{t.trust}</span>
                  </div>
                  {visible.map((b) => {
                    const ag = agencyById(b.agency);
                    const lowest = Math.min(...visible.map((x) => x.price));
                    return (
                      <div key={b.agency} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                        <span className="flex-1 min-w-[160px] font-extrabold">{L(ag.name)}</span>
                        <span className={`flex-none w-[110px] font-extrabold ${b.price === lowest ? "text-accent-700" : ""}`}>
                          {money(b.price)}
                        </span>
                        <span className="flex-none w-[70px]">
                          {b.days} {t.days}
                        </span>
                        <span className="flex-1 min-w-[140px] text-xs">{L(b.hotel)}</span>
                        <span className="flex-1 min-w-[140px] text-xs">{L(b.shopping)}</span>
                        <span className="flex-none w-[80px]">{ag.trust}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <h2 className="mb-3 text-[22px]">{t.grpBids}</h2>
              <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                {visible.map((b) => {
                  const ag = agencyById(b.agency);
                  return (
                    <div key={b.agency} className="bg-bg p-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 items-start">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.1em] font-extrabold text-accent-700">
                          {t.verifiedBadge} · {t.trust} {ag.trust}
                        </div>
                        <div className="font-extrabold text-[19px] mt-1">{L(ag.name)}</div>
                        <p className="text-[13px] text-neutral-800 mt-1">{L(b.note)}</p>
                        <div className="text-[12px] text-neutral-700 mt-2">
                          {L(b.airline)} · {L(b.hotel)} · {L(b.shopping)}
                        </div>
                      </div>
                      <div>
                        <div className="microlabel">{t.grpBid}</div>
                        <div className="font-[family-name:var(--font-heading)] font-extrabold text-[28px] text-accent-700">
                          {money(b.price)}
                        </div>
                        <div className="text-xs text-neutral-700">
                          {b.days} {t.days} · {t.perPerson}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary mt-3"
                          onClick={() => {
                            setChosen(b);
                            setPhase("done");
                          }}
                        >
                          <Check />
                          <span>{t.grpChoose}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
