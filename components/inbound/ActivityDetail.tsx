"use client";

import Link from "next/link";
import { useState } from "react";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { tagLabel } from "@/lib/helpers";
import { activities, KIND_COPY, KIND_PATH, realPrice, type Activity } from "@/lib/activities";
import PhotoSlot from "@/components/PhotoSlot";
import { AlertTriangle, Check, StarSolid } from "@/components/icons";
import ActivityCard from "./ActivityCard";
import { saveBookingRequest } from "@/lib/auth/requests";
import { AC, hoursLabel } from "./activityCopy";

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px]">{label}</span>
      <div className="inline-flex items-center border border-divider">
        <button type="button" className="h-8 w-8 cursor-pointer border-0 bg-transparent text-[16px] disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${label} −`}>
          −
        </button>
        <span className="w-8 text-center text-[14px] font-extrabold" aria-live="polite">
          {value}
        </span>
        <button type="button" className="h-8 w-8 cursor-pointer border-0 bg-transparent text-[16px] disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label={`${label} +`}>
          +
        </button>
      </div>
    </div>
  );
}

export default function ActivityDetail({ a }: { a: Activity }) {
  const { t, L, lang, money } = useApp();
  const ag = agencyById(a.agency);
  const region = DATA.inboundRegions.find((r) => r.id === a.region);
  const real = realPrice(a);
  const extrasSum = real - a.price;
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const childEach = a.child + extrasSum;
  const total = adults * real + kids * childEach;
  const more = activities.filter((x) => x.kind === a.kind && x.id !== a.id).slice(0, 3);
  const list = KIND_COPY[a.kind];

  const facts = [
    { k: L(AC.pickup), v: L(a.pickup ? AC.pickupYes : AC.pickupNo) },
    { k: L(AC.runs), v: L(a.days) },
    { k: L(AC.shopStops), v: a.shopping ? String(a.shopping) : L(AC.none) },
    { k: L(AC.childPrice), v: a.child ? money(childEach) : L(AC.free) },
    { k: L(AC.cancel), v: L(a.cancel) },
    { k: L(AC.operator), v: `${L(ag.name)} · ${t.trust} ${ag.trust}` },
  ];

  return (
    <main className="mx-auto w-full max-w-[1360px] px-5 pb-24 lg:px-10">
      <nav className="flex flex-wrap items-center gap-1.5 pt-5 text-[13px]" aria-label="Breadcrumb">
        <Link href="/inbound">{t.navInbound}</Link>
        <span className="text-neutral-500">/</span>
        <Link href={KIND_PATH[a.kind]}>{L(list.title)}</Link>
        <span className="text-neutral-500">/</span>
        <span className="text-neutral-700 line-clamp-1">{L(a.title)}</span>
      </nav>

      <div className="grid items-start gap-10 pt-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-10">
          <header>
            <div className="kicker">
              {region ? L(region.name) : ""} · {L(a.place)}
            </div>
            <h1 className="mt-1.5 text-[clamp(28px,3vw,42px)] [text-wrap:balance]">{L(a.title)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-neutral-800">
              <span className="inline-flex items-center gap-1 font-extrabold text-text">
                <StarSolid width={14} height={14} className="text-accent-600" />
                {a.rating.toFixed(1)}
                <span className="font-normal text-neutral-700">
                  ({a.reviews} {L(AC.reviews)})
                </span>
              </span>
              <span>{hoursLabel(a.hours, lang)}</span>
              <span>
                {L(AC.starts)} {a.start}
              </span>
              <span>
                {L(AC.guide)}: {L(a.guide)}
              </span>
              <span>{a.group ? `${L(AC.groupMax)} ${a.group}` : L(AC.ticketOnly)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {a.tags.map((tg) => (
                <span key={tg} className="tag tag-neutral text-[11px]">
                  {tagLabel(tg, t, L)}
                </span>
              ))}
            </div>
          </header>

          <div className="relative aspect-[16/8] border-2 border-text bg-surface">
            <PhotoSlot label={L(a.title)} src={a.photo} />
          </div>

          {a.warn && (
            <section className="border-2 border-accent-700 bg-accent-100 px-5 py-4 text-accent-800">
              <h2 className="flex items-center gap-2 text-[16px]">
                <AlertTriangle width={16} height={16} />
                {L(AC.checkFirst)}
              </h2>
              <ul className="m-0 mt-2 flex list-disc flex-col gap-1 pl-5 text-[14px]">
                {a.warn.map((w, i) => (
                  <li key={i}>{L(w)}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-[21px]">{L(AC.highlights)}</h2>
            <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
              {a.highlights.map((h, i) => (
                <li key={i} className="border-2 border-divider px-4 py-4">
                  <div className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold leading-none text-accent-700">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-2 text-[15px] font-semibold">{L(h)}</div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-[21px]">{L(a.kind === "attraction" ? AC.openTimes : AC.schedule)}</h2>
            <ol className="m-0 list-none border-2 border-divider p-0">
              {a.plan.map((s, i) => (
                <li key={i} className={`grid grid-cols-[88px_minmax(0,1fr)] gap-4 px-5 py-3.5 ${i ? "border-t border-divider" : ""}`}>
                  <span className="font-mono text-[14px] font-semibold text-accent-700">{s.time}</span>
                  <span className="text-[15px]">{L(s.text)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-[18px]">{L(AC.included)}</h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {a.includes.map((x, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px]">
                    <Check className="mt-[3px] flex-none" stroke="var(--color-accent-700)" />
                    {L(x)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-[18px]">{L(AC.payOnDay)}</h2>
              {a.extras.length ? (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {a.extras.map((x, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 border-b border-divider pb-2 text-[14px]">
                      <span>{L(x.label)}</span>
                      <span className="font-extrabold">{money(x.amt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-neutral-700">{L(AC.nothingExtra)}</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[21px]">{L(AC.goodToKnow)}</h2>
            <dl className="m-0 grid border-2 border-divider md:grid-cols-2">
              {facts.map((fct, i) => (
                <div key={i} className={`border-divider px-5 py-3.5 ${i ? "border-t" : ""} ${i === 1 ? "md:border-t-0" : ""} ${i % 2 ? "md:border-l" : ""}`}>
                  <dt className="microlabel">{fct.k}</dt>
                  <dd className="m-0 mt-1 text-[14px]">{fct.v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* booking rail */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[112px]">
          <section className="border-2 border-text bg-bg">
            <div className="border-b border-divider px-5 py-4">
              <div className="microlabel">{t.realTotal}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-heading)] text-[32px] font-extrabold leading-none text-accent-700">{money(real)}</span>
                <span className="text-[13px] text-neutral-700">{L(AC.perAdult)}</span>
              </div>
              {a.extras.length > 0 && (
                <dl className="m-0 mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[13px]">
                  <dt className="text-neutral-700">{t.advertised}</dt>
                  <dd className="m-0 text-right">{money(a.price)}</dd>
                  {a.extras.map((x, i) => (
                    <div key={i} className="contents">
                      <dt className="text-neutral-700">+ {L(x.label)}</dt>
                      <dd className="m-0 text-right">{money(x.amt)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {sentRef ? (
              <div className="flex flex-col gap-3 px-5 py-5" role="status">
                <div className="flex items-center gap-2 text-[17px] font-extrabold">
                  <Check width={18} height={18} stroke="var(--color-accent-700)" />
                  {L(AC.sent)}
                </div>
                <div className="text-[14px]">
                  {L(AC.ref)} <span className="font-mono font-semibold">{sentRef}</span>
                </div>
                <div className="text-[13px] text-neutral-700">
                  {date} · {L(AC.adults)} {adults}
                  {kids ? ` · ${L(AC.children)} ${kids}` : ""} · {money(total)}
                </div>
                <div className="text-[13px] text-neutral-700">
                  {L(AC.confirmsIn)} {ag.response} {L(AC.minutes)}
                </div>
                <button type="button" className="btn btn-secondary self-start" onClick={() => setSentRef(null)}>
                  {L(AC.change)}
                </button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4 px-5 py-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!date) return;
                  const ref = `T24-${a.id.toUpperCase()}-${date.replaceAll("-", "").slice(2)}${adults}${kids}`;
                  setSentRef(ref);
                  saveBookingRequest({ ref, activityId: a.id, href: `${KIND_PATH[a.kind]}/${a.id}`, title: a.title, date, adults, kids, total, at: new Date().toISOString() });
                }}
              >
                <div className="field">
                  <label htmlFor="act-date">{L(AC.date)}</label>
                  <input id="act-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <Stepper label={L(AC.adults)} value={adults} min={1} onChange={setAdults} />
                <Stepper label={L(AC.children)} value={kids} min={0} onChange={setKids} />
                <div className="flex items-baseline justify-between border-t border-divider pt-3">
                  <span className="text-[14px] font-extrabold">{L(AC.total)}</span>
                  <span className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold">{money(total)}</span>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={!date}>
                  {date ? L(AC.request) : L(AC.pickDate)}
                </button>
                <p className="text-[12px] text-neutral-700">{L(a.cancel)}</p>
              </form>
            )}
          </section>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-[21px]">{L(AC.more)}</h2>
            <Link href={KIND_PATH[a.kind]} className="btn btn-ghost no-underline text-[14px]">
              {L(list.title)} →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {more.map((x) => (
              <ActivityCard key={x.id} a={x} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
