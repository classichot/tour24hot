"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { agencyById, DATA, pkgById } from "@/lib/data";
import { useApp, useInboundScope } from "@/lib/store";
import { airLabel, similarTours, statusInfo, tagLabel, depUnavailable } from "@/lib/helpers";
import PhotoSlot from "@/components/PhotoSlot";
import ScoreBar from "@/components/ScoreBar";
import PriceIntel from "@/components/PriceIntel";
import SoldOutAlts from "@/components/SoldOutAlts";
import { AlertTriangle, Check, ChevronLeft, ShieldCheck, Sparkle, StarSolid, X } from "@/components/icons";
import { pkgPhoto, pkgPhotos } from "@/lib/photos";
import AgentBadge from "@/components/AgentBadge";
import { isAgentDirect } from "@/lib/tap";

export default function PackageDetailPage() {
  const { t, L, money, toggleCompare, inCompare, toggleSaved, saved } = useApp();
  const routeParams = useParams<{ id: string }>();
  const router = useRouter();
  const p = pkgById(routeParams.id);
  const [depIndex, setDepIndex] = useState(0);
  useInboundScope(!!p && p.direction === "inbound");

  if (!p) {
    return (
      <main className="max-w-[1400px] mx-auto px-[22px] py-10">
        <h1>404</h1>
        <Link href="/search" className="btn btn-primary no-underline">
          {t.navSearch}
        </Link>
      </main>
    );
  }

  const ag = agencyById(p.agency);
  const maxLine = Math.max(...p.cost.map((c) => c.amt));
  const isSaved = saved.includes(p.id);
  const dep = p.departures[depIndex] || p.departures[0];
  const blocked = depUnavailable(dep);

  const none = L({ th: "ไม่มี", en: "None", zh: "无" });
  const facts = [
    { label: t.fDuration, value: `${p.days} ${t.days} ${p.nights} ${t.nights}` },
    { label: t.cAirline, value: `${L(p.airlineName)} · ${airLabel(p, t)}` },
    { label: t.fHotel, value: `${p.hotelStar} ${t.stars}` },
    { label: t.cMeals, value: `${p.meals} ${L({ th: "มื้อ", en: "meals", zh: "餐" })}` },
    { label: t.cAttractions, value: String(p.attractions) },
    { label: t.cFreeDay, value: p.freeDays ? `${p.freeDays} ${t.days}` : none },
    { label: t.cShopping, value: p.shopping === 0 ? none : String(p.shopping) },
    { label: t.cGroup, value: `${p.group} ${t.people}` },
    ...(p.market ? [{ label: t.inboundMarket, value: L(p.market) }] : []),
    ...(p.guideLang ? [{ label: t.inboundGuide, value: L(p.guideLang) }] : []),
  ];

  const depBtn = (selected: boolean) =>
    `flex items-center justify-between gap-2.5 px-[11px] py-[9px] cursor-pointer text-left w-full border text-text ${
      selected ? "bg-surface border-2 border-text" : "bg-bg border border-divider"
    }`;

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <div className="pt-4">
        <Link href={p.direction === "inbound" ? "/inbound" : "/search"} className="btn btn-ghost pl-0 no-underline">
          <ChevronLeft />
          <span>{p.direction === "inbound" ? t.navInbound : t.navSearch}</span>
        </Link>
      </div>

      {/* header */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 border-b-2 border-divider pb-[18px]">
        <div>
          <div className="kicker">
            {L(p.country)} · {L(p.city)}
          </div>
          <h1 className="my-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03] [text-wrap:pretty]">{L(p.title)}</h1>
          <div className="flex gap-2 flex-wrap mb-2.5">
            {isAgentDirect(p.agency) && <AgentBadge />}
            {p.tags.map((tg) => (
              <span key={tg} className="tag tag-outline">
                {tagLabel(tg, t, L)}
              </span>
            ))}
          </div>
          <div className="flex gap-4 flex-wrap text-[13px] text-neutral-800">
            <span>{p.code}</span>
            <span>
              {p.review.score.toFixed(1)} / 5 · {p.review.count} {L({ th: "รีวิว", en: "reviews" })}
            </span>
            <Link href={`/agencies/${ag.id}`} className="btn btn-ghost p-0 no-underline">
              {L(ag.name)}
            </Link>
          </div>
          <div className="flex gap-2 items-center mt-2.5 text-[11px] text-neutral-700">
            <Sparkle stroke="var(--color-accent-700)" width={14} height={14} />
            <span>
              {t.normalized} · {t.sourceDoc}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 min-h-[260px]">
          <div className="row-span-2 relative bg-surface">
            <PhotoSlot label={L(p.city)} src={pkgPhotos(p.id)[0]} />
          </div>
          <div className="relative bg-surface">
            <PhotoSlot label={L(p.city)} src={pkgPhotos(p.id)[1]} />
          </div>
          <div className="relative bg-surface">
            <PhotoSlot label={L(p.city)} src={pkgPhotos(p.id)[2]} />
          </div>
        </div>
      </div>

      <div className="flex gap-7 flex-wrap items-start pt-[22px]">
        <div className="flex-[999] basis-[540px] min-w-[300px] flex flex-col gap-[30px]">
          {/* overview */}
          <section>
            <h2 className="mb-3 text-[22px]">{t.dOverview}</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-0.5 bg-divider border-2 border-divider">
              {facts.map((fa) => (
                <div key={fa.label} className="bg-bg px-3 py-2.5">
                  <div className="text-[10px] tracking-[0.1em] uppercase text-neutral-700 font-extrabold">{fa.label}</div>
                  <div className="font-[family-name:var(--font-heading)] font-extrabold text-[15px] mt-0.5">{fa.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* itinerary */}
          <section>
            <h2 className="mb-3 text-[22px]">{t.dItinerary}</h2>
            <div className="flex flex-col">
              {p.itinerary.map((it) => (
                <div key={it.d} className="grid grid-cols-[64px_1fr] gap-3.5 py-3.5 border-t-2 border-divider">
                  <div className="font-[family-name:var(--font-heading)] font-extrabold text-[13px] text-accent-700">
                    {t.day} {it.d}
                  </div>
                  <div>
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-[17px] leading-[1.2]">
                      {L(it.title)}
                    </div>
                    <p className="my-1 text-[13px] text-neutral-800">{L(it.body)}</p>
                    <div className="flex gap-3.5 flex-wrap text-[11px] text-neutral-700">
                      <span>
                        {t.mealsLabel}: {it.meals}
                      </span>
                      <span>
                        {t.stay}: {L(it.hotel)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* flights & hotels */}
          <section>
            <h2 className="mb-3 text-[22px]">
              {t.dFlights} · {t.dHotels}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-0.5 bg-divider border-2 border-divider">
              <div className="bg-bg p-3.5">
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[15px] mb-1.5">
                  {L(p.airlineName)} · {p.airlineType === "land" ? t.landPackage : p.direct ? t.directFlight : L({ th: "ต่อเครื่อง", en: "With connection", zh: "转机" })}
                </div>
                <div className="text-[13px] text-neutral-800">
                  {L({ th: "ขาไป", en: "Outbound" })} {p.flight.out}
                </div>
                <div className="text-[13px] text-neutral-800">
                  {L({ th: "ขากลับ", en: "Return" })} {p.flight.back}
                </div>
                <div className="text-xs text-neutral-700 mt-1.5">
                  {t.cBaggage} {p.baggage}
                </div>
              </div>
              <div className="bg-bg p-3.5 flex flex-col gap-2">
                {p.hotels.map((h, i) => (
                  <div key={i}>
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-sm">{L(h.name)}</div>
                    <div className="text-xs text-neutral-700">
                      {h.star} {t.stars} · {h.nights} {t.nights}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* included / excluded */}
          <section>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
              <div>
                <h3 className="mb-2 text-[17px]">{t.dInclude}</h3>
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                  {[
                    p.airlineType === "land"
                      ? L({ th: L(p.airlineName), en: L(p.airlineName), zh: L(p.airlineName) })
                      : L({ th: `ตั๋วเครื่องบินไป-กลับ ${L(p.airlineName)}`, en: `Return flights on ${L(p.airlineName)}`, zh: `往返机票 ${L(p.airlineName)}` }),
                    L({ th: `ที่พัก ${p.nights} คืน`, en: `${p.nights} nights accommodation`, zh: `住宿 ${p.nights} 晚` }),
                    L({ th: `อาหาร ${p.meals} มื้อ`, en: `${p.meals} meals`, zh: `${p.meals} 餐` }),
                    L({ th: `ค่าเข้าสถานที่ ${p.attractions} แห่ง`, en: `Entrance to ${p.attractions} attractions`, zh: `景点门票 ${p.attractions} 处` }),
                    L({ th: "หัวหน้าทัวร์และไกด์ท้องถิ่น", en: "Tour leader and local guide", zh: "领队与当地导游" }),
                    L({ th: "รถโค้ชปรับอากาศตลอดรายการ", en: "Air-conditioned coach throughout", zh: "全程空调大巴" }),
                  ].map((i, idx) => (
                    <li key={idx} className="flex gap-2 text-[13px]">
                      <Check className="flex-none mt-[3px]" stroke="var(--color-accent-700)" width={14} height={14} />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-[17px]">{t.dExclude}</h3>
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                  {[
                    L({ th: `ทิปไกด์และคนขับ ${money(p.tips)}`, en: `Guide and driver tips ${money(p.tips)}`, zh: `导游司机小费 ${money(p.tips)}` }),
                    p.visa
                      ? L({ th: `ค่าวีซ่า ${money(p.visa)}`, en: `Visa fee ${money(p.visa)}`, zh: `签证费 ${money(p.visa)}` })
                      : L({ th: "ค่าวีซ่า (ไม่ต้องขอวีซ่า)", en: "Visa (not required for this destination)", zh: "签证（本线路无需签证）" }),
                    L({ th: "ค่าห้องพักเดี่ยว 6,500 บาท", en: "Single room supplement ฿6,500", zh: "单房差 ฿6,500" }),
                    L({ th: "ค่าใช้จ่ายส่วนตัวและทัวร์เสริม", en: "Personal expenses and optional tours", zh: "个人消费与自费项目" }),
                  ].map((e, idx) => (
                    <li key={idx} className="flex gap-2 text-[13px] text-neutral-800">
                      <X className="flex-none mt-[3px]" width={14} height={14} />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* cancellation */}
          <section className="border-t-2 border-divider pt-[18px]">
            <h2 className="mb-2.5 text-[22px]">{t.dCancel}</h2>
            <p className="text-sm">{L(p.cancel)}</p>
          </section>

          {/* agency */}
          <section className="border-t-2 border-divider pt-[18px]">
            <h2 className="mb-3 text-[22px]">{t.dAgency}</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 items-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="bg-text text-bg text-[10px] font-extrabold tracking-[0.08em] uppercase px-[9px] py-[3px]">
                    {t.verifiedBadge}
                  </span>
                  {isAgentDirect(p.agency) && <AgentBadge compact />}
                  <span className="font-[family-name:var(--font-heading)] font-extrabold text-lg">{L(ag.name)}</span>
                </div>
                <div className="text-[13px] text-neutral-800">{L(ag.company)}</div>
                <div className="text-xs text-neutral-700 mt-1">
                  {t.apLicence} {ag.licence} · {t.apExpiry} {ag.expiry}
                </div>
                <Link href={`/agencies/${ag.id}`} className="btn btn-secondary no-underline mt-2.5">
                  {t.seeAgency}
                </Link>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-0.5 bg-divider border-2 border-divider self-start">
                {[
                  { value: String(ag.trust), label: t.trust },
                  { value: String(ag.bookings), label: t.apBookings },
                  { value: `${ag.response} ${t.apMin}`, label: t.apResponse },
                  { value: `${ag.cancelRate}%`, label: t.apCancelRate },
                ].map((st) => (
                  <div key={st.label} className="bg-bg p-2.5">
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-xl">{st.value}</div>
                    <div className="text-[10px] tracking-[0.06em] uppercase text-neutral-700">{st.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* reviews */}
          <section className="border-t-2 border-divider pt-[18px]">
            <h2 className="mb-3 text-[22px]">{t.dReviews}</h2>
            <div className="flex flex-col gap-3.5">
              {DATA.reviews.map((r, i) => (
                <div key={i} className="border-l-2 border-accent pl-3">
                  <div className="flex items-center gap-1 font-[family-name:var(--font-heading)] font-extrabold text-sm text-accent-700">
                    <StarSolid width={13} height={13} />
                    {r.score.toFixed(1)}
                  </div>
                  <p className="my-0.5 text-sm leading-[1.5]">{L(r.text)}</p>
                  <div className="text-[11px] text-neutral-700">
                    {L(r.name)} · {L(r.trip)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="flex-1 basis-[320px] min-w-[290px] max-w-[400px] flex flex-col gap-[18px] sticky top-[88px] self-start">
          {/* real cost */}
          <div className="border-2 border-text">
            <div className="px-4 pt-3.5 pb-3 border-b-2 border-divider">
              <div className="microlabel">{t.realCostTitle}</div>
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[38px] leading-[1.05] text-accent-700">
                {money(p.real)}
              </div>
              <div className="text-xs text-neutral-700">
                {t.advertised} {money(p.price)} + {money(p.real - p.price)}{" "}
                {L({ th: "ที่โผล่มาทีหลัง", en: "added later" })}
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-[9px] border-b-2 border-divider">
              {p.cost.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between gap-2.5 text-xs">
                    <span>{L(c.label)}</span>
                    <span className="font-[family-name:var(--font-heading)] font-extrabold">{money(c.amt)}</span>
                  </div>
                  <ScoreBar
                    pct={Math.round((c.amt / maxLine) * 100)}
                    fill={i === 0 ? "var(--color-text)" : "var(--color-accent)"}
                  />
                </div>
              ))}
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <div className="microlabel">{t.dDates}</div>
              {p.departures.map((dp, i) => {
                const st = statusInfo(dp.status, t);
                return (
                  <button key={i} type="button" onClick={() => setDepIndex(i)} className={depBtn(i === depIndex)}>
                    <div className="flex flex-col items-start gap-[3px]">
                      <span className="font-[family-name:var(--font-heading)] font-extrabold text-[13px]">{L(dp.date)}</span>
                      <span className="text-[11px]">
                        {dp.seats} {t.seats}
                      </span>
                    </div>
                    <span className={st.cls}>{st.label}</span>
                  </button>
                );
              })}
              {blocked ? (
                <>
                  <SoldOutAlts p={p} depIndex={depIndex} onPickDate={setDepIndex} />
                  <button type="button" className="btn btn-secondary btn-block" onClick={() => toggleCompare(p.id)}>
                    {inCompare(p.id) ? t.inCompare : t.addCompare}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-primary btn-block" onClick={() => router.push(`/book/${p.id}?dep=${depIndex}`)}>
                    {t.dBook}
                  </button>
                  <div className="flex gap-1.5">
                    <button type="button" className="btn btn-secondary flex-1" onClick={() => router.push(`/book/${p.id}?dep=${depIndex}`)}>
                      {t.dInquire}
                    </button>
                    <button type="button" className="btn btn-secondary flex-1" onClick={() => toggleCompare(p.id)}>
                      {inCompare(p.id) ? t.inCompare : t.addCompare}
                    </button>
                  </div>
                </>
              )}
              <button type="button" className="btn btn-secondary btn-block" onClick={() => toggleSaved(p.id)}>
                {isSaved ? t.tSaved : t.dSave}
              </button>
              <div className="flex gap-1.5 items-center text-[11px] text-neutral-700">
                <ShieldCheck stroke="var(--color-accent-700)" />
                <span>{t.bkProtect}</span>
              </div>
            </div>
          </div>

          <PriceIntel p={p} />

          {/* quality score */}
          <div className="border-2 border-divider px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-2.5 mb-2.5">
              <div className="microlabel">{t.qualityTitle}</div>
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] text-accent-700">
                {p.quality.score}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {p.quality.factors.map((qf, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px]">
                    <span>{L(qf.label)}</span>
                    <span>{qf.score}</span>
                  </div>
                  <ScoreBar pct={qf.score} height={4} />
                </div>
              ))}
            </div>
          </div>

          {/* truth checker */}
          <div className="border-2 border-accent px-4 py-3.5">
            <div className="text-[10px] tracking-[0.1em] uppercase font-extrabold text-accent-800 mb-0.5">{t.truthTitle}</div>
            <div className="text-xs text-neutral-700 mb-2.5">{t.truthSub}</div>
            <div className="flex flex-col gap-2">
              {p.truth.map((tr, i) => (
                <div key={i} className="flex gap-2 text-xs leading-[1.4]">
                  <AlertTriangle
                    className="flex-none mt-0.5"
                    stroke={tr.level === "warn" ? "var(--color-accent-700)" : "var(--color-neutral-600)"}
                  />
                  <span>{L(tr.text)}</span>
                </div>
              ))}
              {p.truth.length === 0 && (
                <div className="flex gap-2 text-xs leading-[1.4]">
                  <Check className="flex-none mt-0.5" stroke="var(--color-accent-700)" />
                  <span>{t.truthClean}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-10 pt-6 border-t-2 border-divider">
        <h2 className="mb-1 text-[clamp(22px,2.4vw,30px)]">{t.similar}</h2>
        <p className="mb-4 text-[13px] text-neutral-700">{t.similarSub}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
          {similarTours(p, DATA.packages).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/packages/${s.id}`)}
              className="bg-bg border-2 border-divider text-left cursor-pointer text-text overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-surface">
                <PhotoSlot label={L(s.city)} src={pkgPhoto(s.id)} />
              </div>
              <div className="p-3.5">
              <div className="text-[10px] tracking-[0.12em] uppercase text-accent-700 font-extrabold">
                {L(s.country)} · {L(s.city)}
              </div>
              <div className="font-extrabold text-[17px] mt-1 leading-[1.2]">{L(s.title)}</div>
              <div className="text-xs text-neutral-700 mt-1">
                {s.days} {t.days} · {L(s.airlineName)} · {t.shopScore} {s.shopping === 0 ? t.shopNone : s.shopping}
              </div>
              <div className="font-extrabold text-[22px] text-accent-700 mt-2">{money(s.real)}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
