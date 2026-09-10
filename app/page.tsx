"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DATA, agencyById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { burnDeals } from "@/lib/helpers";
import PackageCard from "@/components/PackageCard";
import PhotoSlot from "@/components/PhotoSlot";
import { ArrowRight, Check, StarSolid } from "@/components/icons";
import { destPhoto, PHOTO, pkgPhoto } from "@/lib/photos";

export default function HomePage() {
  const { t, L, money } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("any");
  const [from, setFrom] = useState("BKK");
  const [dur, setDur] = useState("any");
  const [budget, setBudget] = useState("80000");

  const D = DATA;
  const outbound = D.packages.filter((p) => p.direction !== "inbound");
  const deals = burnDeals(outbound);
  const byReal = outbound.slice().sort((a, b) => a.real - b.real);
  const confirmed = outbound.filter((p) => p.departures.some((d) => d.status === "confirmed" || d.status === "nearly"));
  const noShop = outbound.filter((p) => p.shopping === 0);

  const goSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (month !== "any") params.set("month", month);
    if (from !== "BKK") params.set("from", from);
    if (dur !== "any") params.set("dur", dur);
    if (budget !== "80000") params.set("price", budget);
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <main>
      {/* — hero + search — */}
      <section className="max-w-[1400px] mx-auto px-[22px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] border-b-2 border-divider">
          <div className="py-11 flex flex-col gap-[18px] max-w-[640px]">
            <div className="kicker">{t.heroKicker}</div>
            <h1 className="text-[clamp(34px,4.4vw,58px)] leading-[1.03] [text-wrap:pretty]">{t.heroTitle}</h1>
            <p className="text-base max-w-[520px] text-neutral-800">{t.heroSub}</p>
            <div className="border-2 border-text p-3.5 flex flex-col gap-2.5 max-w-[560px]">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
                <div className="field">
                  <label>{t.fWhere}</label>
                  <input className="input" type="text" value={q} placeholder={t.fWherePh} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="field">
                  <label>{t.fWhen}</label>
                  <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
                    <option value="any">{L({ th: "ยืดหยุ่นได้", en: "Flexible" })}</option>
                    <option value="oct">{L({ th: "ตุลาคม 2026", en: "October 2026" })}</option>
                    <option value="nov">{L({ th: "พฤศจิกายน 2026", en: "November 2026" })}</option>
                    <option value="dec">{L({ th: "ธันวาคม 2026", en: "December 2026" })}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t.fFrom}</label>
                  <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
                    <option value="BKK">{t.fromBkk}</option>
                    <option value="CNX">{t.fromCnx}</option>
                    <option value="HKT">{t.fromHkt}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t.fDays}</label>
                  <select className="input" value={dur} onChange={(e) => setDur(e.target.value)}>
                    <option value="any">{L({ th: "ทั้งหมด", en: "Any" })}</option>
                    <option value="short">{L({ th: "4–5 วัน", en: "4–5 days" })}</option>
                    <option value="mid">{L({ th: "5–6 วัน", en: "5–6 days" })}</option>
                    <option value="long">{L({ th: "6 วันขึ้นไป", en: "6+ days" })}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t.fBudget}</label>
                  <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)}>
                    <option value="25000">{L({ th: "ไม่เกิน 25,000", en: "Up to ฿25,000" })}</option>
                    <option value="40000">{L({ th: "ไม่เกิน 40,000", en: "Up to ฿40,000" })}</option>
                    <option value="60000">{L({ th: "ไม่เกิน 60,000", en: "Up to ฿60,000" })}</option>
                    <option value="80000">{L({ th: "ไม่จำกัด", en: "No limit" })}</option>
                  </select>
                </div>
              </div>
              <button type="button" className="btn btn-primary justify-between px-3.5 py-[11px]" onClick={goSearch}>
                <span>{t.searchBtn}</span>
                <ArrowRight width={18} height={18} />
              </button>
            </div>
          </div>
          <div className="min-h-[340px] border-l-2 border-divider relative">
            <PhotoSlot label={t.heroPhoto} src={PHOTO.hero} />
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] border-b-2 border-divider">
          {[
            { n: "312", label: t.heroStat1 },
            { n: "340", label: t.heroStat2 },
            { n: "฿6,400", label: t.heroStat3 },
          ].map((s) => (
            <div key={s.label} className="py-5 pr-[22px] flex flex-col gap-0.5">
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[38px] leading-none">{s.n}</div>
              <div className="text-xs text-neutral-700 max-w-[220px]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* — Agent Direct — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[30px]">
        <div className="border-2 border-text p-5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 items-end">
          <div>
            <div className="kicker">{t.agntHomeKicker}</div>
            <h2 className="mt-2 mb-2 text-[clamp(24px,2.8vw,36px)] max-w-[520px]">{t.agntHomeTitle}</h2>
            <p className="text-sm text-neutral-800 max-w-[520px]">{t.agntHomeSub}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/agents" className="btn btn-primary no-underline">
              {t.agntHomeCta}
            </Link>
            <Link href="/agent-direct" className="btn btn-secondary no-underline">
              {t.agntHomeDev}
            </Link>
          </div>
        </div>
      </section>

      {/* — burn strip — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[30px]">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-3.5 border-b-2 border-divider pb-2.5">
          <div>
            <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.navBurn}</h2>
            <p className="text-[13px] text-neutral-700 max-w-[620px]">{t.bnSub}</p>
          </div>
          <Link href="/burn" className="btn btn-ghost no-underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))]">
          {deals.slice(0, 3).map((b) => {
            const dep = b.p.departures[b.depIndex] || b.p.departures[0];
            return (
              <button
                key={b.p.id}
                type="button"
                onClick={() => router.push(`/packages/${b.p.id}`)}
                className="bg-bg border border-divider p-0 cursor-pointer text-left flex flex-col text-text"
              >
                <div className="relative aspect-[16/9] bg-surface">
                  <PhotoSlot label={L(b.p.city)} src={pkgPhoto(b.p.id)} />
                </div>
                <div className="px-4 pt-3.5 pb-4 flex flex-col gap-[5px]">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-[family-name:var(--font-heading)] font-extrabold text-[30px] leading-none text-accent-700">
                    {b.days}
                  </span>
                  <span className="text-[11px] text-neutral-700">{t.bnDaysLeft}</span>
                  <span className="bg-accent text-text font-extrabold text-xs px-[9px] py-[3px] flex-none">
                    −{Math.round(b.disc * 100)}%
                  </span>
                </div>
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[17px] leading-[1.2]">
                  {L(b.p.title)}
                </div>
                <div className="text-xs text-neutral-700">
                  {L(dep.date)} · {L(agencyById(b.p.agency).name)}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-accent-700">
                    {money(b.now)}
                  </span>
                  <span className="text-xs text-neutral-700 line-through">{money(b.p.real)}</span>
                </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* — popular destinations — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[34px]">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.popular}</h2>
            <p className="text-[13px] text-neutral-700">{t.popularSub}</p>
          </div>
          <Link href="/search" className="btn btn-ghost no-underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] bg-bg border-2 border-divider">
          {D.destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => router.push(d.id === "th" ? "/inbound" : `/search?country=${encodeURIComponent(d.name.en)}`)}
              className="bg-bg border border-divider p-0 cursor-pointer text-left flex flex-col"
            >
              <div className="aspect-[5/4] relative bg-surface">
                <PhotoSlot label={L(d.name)} src={destPhoto(d.id)} />
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-lg">{L(d.name)}</div>
                <div className="text-[11px] text-neutral-700">
                  {d.count} {t.resultsIn} · {t.from} {money(d.from)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* — inbound Thailand — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[34px]">
        <div className="border-2 border-text p-5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 items-end">
          <div>
            <div className="kicker">{t.inbKicker}</div>
            <h2 className="mt-2 mb-2 text-[clamp(24px,2.8vw,36px)] max-w-[560px]">{t.inbTitle}</h2>
            <p className="text-sm text-neutral-800 max-w-[520px]">{t.inbSub}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/inbound" className="btn btn-primary no-underline">
              {t.navInbound}
            </Link>
            <Link href="/search?dir=inbound" className="btn btn-secondary no-underline">
              {t.inbCta}
            </Link>
          </div>
        </div>
      </section>

      {/* — confirmed departures — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[34px]">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4 border-b-2 border-divider pb-2.5">
          <div>
            <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.confirmed}</h2>
            <p className="text-[13px] text-neutral-700">{t.confirmedSub}</p>
          </div>
          <Link href="/search?flag=confirmed" className="btn btn-ghost no-underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] gap-[18px]">
          {confirmed.slice(0, 3).map((p) => (
            <PackageCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* — best value — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[34px]">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4 border-b-2 border-divider pb-2.5">
          <div>
            <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.bestValue}</h2>
            <p className="text-[13px] text-neutral-700">{t.bestValueSub}</p>
          </div>
          <Link href="/search" className="btn btn-ghost no-underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] gap-[18px]">
          {byReal.slice(0, 3).map((p) => (
            <PackageCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* — no compulsory shopping — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-[34px]">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4 border-b-2 border-divider pb-2.5">
          <div>
            <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.noShop}</h2>
            <p className="text-[13px] text-neutral-700">{t.noShopSub}</p>
          </div>
          <Link href="/search?flag=noshop" className="btn btn-ghost no-underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] gap-[18px]">
          {noShop.slice(0, 3).map((p) => (
            <PackageCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* — how comparison works — */}
      <section className="max-w-[1400px] mx-auto px-[22px] mt-11">
        <div className="border-t-2 border-divider pt-[22px]">
          <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.howWorks}</h2>
          <p className="mb-5 text-[13px] text-neutral-700 max-w-[560px]">{t.howSub}</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
            {[
              { n: "01", title: t.how1t, body: t.how1b },
              { n: "02", title: t.how2t, body: t.how2b },
              { n: "03", title: t.how3t, body: t.how3b },
              { n: "04", title: t.how4t, body: t.how4b },
            ].map((h) => (
              <div key={h.n} className="bg-bg border border-divider px-4 pt-[18px] pb-5 flex flex-col gap-2">
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[13px] text-accent-700">{h.n}</div>
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-lg leading-[1.15]">{h.title}</div>
                <p className="text-[13px] text-neutral-800">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* — verified agencies — */}
      <section className="max-w-[1400px] mx-auto px-[22px] mt-11">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[34px] border-t-2 border-divider pt-[22px]">
          <div>
            <h2 className="mb-2.5 text-[clamp(22px,2.4vw,30px)] max-w-[440px]">{t.verified}</h2>
            <p className="mb-3.5 text-sm text-neutral-800 max-w-[520px]">{t.verifiedSub}</p>
            <Link href="/agencies/siam" className="btn btn-secondary no-underline">
              {t.seeAgency}
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[2px] bg-divider content-start self-start">
            {[t.vf1, t.vf2, t.vf3, t.vf4, t.vf5, t.vf6].map((v) => (
              <div key={v} className="bg-bg px-3.5 py-3 flex gap-2 items-center text-[13px]">
                <Check className="flex-none" stroke="var(--color-accent-700)" />
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* — guarantee banner — */}
      <section className="mt-12 bg-accent text-text">
        <div className="max-w-[1400px] mx-auto px-[22px] pt-10 pb-11 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-7 items-end">
          <h2 className="text-[clamp(30px,4vw,52px)] leading-[1.02] max-w-[520px]">{t.guarantee}</h2>
          <p className="text-[15px] max-w-[520px]">{t.guaranteeSub}</p>
        </div>
      </section>

      {/* — reviews — */}
      <section className="max-w-[1400px] mx-auto px-[22px] pt-10">
        <h2 className="mb-1 text-[clamp(24px,2.6vw,32px)]">{t.reviewsTitle}</h2>
        <p className="mb-[18px] text-[13px] text-neutral-700">{t.reviewsSub}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] border-t-2 border-divider">
          {D.reviews.map((r, i) => (
            <div key={i} className="bg-bg border border-divider px-4 pt-[18px] pb-[18px] flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 font-[family-name:var(--font-heading)] font-extrabold text-[15px] text-accent-700">
                <StarSolid />
                <span>{r.score.toFixed(1)}</span>
              </div>
              <p className="text-sm leading-[1.5] [text-wrap:pretty]">{L(r.text)}</p>
              <div className="mt-auto text-[11px] text-neutral-700">
                {L(r.name)} · {L(r.trip)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* — agency CTA — */}
      <section className="max-w-[1400px] mx-auto px-[22px] mt-11 pb-[60px]">
        <div className="border-t-2 border-text pt-[22px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-7 items-end">
          <div>
            <h2 className="mb-2 text-[clamp(24px,2.8vw,36px)] max-w-[460px]">{t.agencyCta}</h2>
            <p className="text-sm max-w-[520px] text-neutral-800">{t.agencyCtaSub}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/agency" className="btn btn-primary no-underline">
              {t.agencyCtaBtn}
            </Link>
            <Link href="/agency" className="btn btn-secondary no-underline">
              {t.agencyCtaAlt}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
