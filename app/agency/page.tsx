"use client";

import { useEffect, useRef, useState } from "react";
import { agencyById, DATA, pkgById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { statusInfo } from "@/lib/helpers";
import ScoreBar from "@/components/ScoreBar";
import { Check, Circle, Spinner, UploadIcon } from "@/components/icons";

type Tab = "upload" | "packages" | "inventory" | "bookings" | "analytics";

const BOOKING_STATUS: Record<string, { key: "nearly" | "open" | "confirmed" | "cancelled"; labelKey: "bkNew" | "tPaid" | "bkPending" | "bkConfirmed" | "stCancelled" }> = {
  new: { key: "nearly", labelKey: "bkNew" },
  deposit: { key: "open", labelKey: "tPaid" },
  pending: { key: "open", labelKey: "bkPending" },
  confirmed: { key: "confirmed", labelKey: "bkConfirmed" },
  cancelled: { key: "cancelled", labelKey: "stCancelled" },
};

export default function AgencyWorkspacePage() {
  const { t, L, money } = useApp();
  const me = agencyById("siam");
  const an = DATA.analytics;
  const [tab, setTab] = useState<Tab>("upload");
  const [upStage, setUpStage] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const startUpload = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setUpStage(1);
    [
      [2, 900],
      [3, 1800],
      [4, 2700],
    ].forEach(([stage, ms]) => {
      timers.current.push(setTimeout(() => setUpStage(stage as number), ms as number));
    });
  };

  const tabCls = (active: boolean) =>
    `px-4 py-[11px] cursor-pointer border-0 font-[family-name:var(--font-heading)] font-extrabold text-sm ${
      active ? "bg-text text-bg" : "bg-surface text-text"
    }`;

  const maxTrend = Math.max(...an.trend.concat([1]));
  const bars = an.trend.map((v, i) => {
    const h = Math.round((v / maxTrend) * 118);
    return { x: i * 26.6 + 2, y: 126 - h, w: 22, h, fill: i === an.trend.length - 1 ? "var(--color-accent)" : "var(--color-text)" };
  });

  const pkgRows = DATA.packages.filter((p) => p.agency === "siam");
  const viewsFor = (id: string) => (id === "jp01" ? "6,120" : "4,380");
  const cmpFor = (id: string) => (id === "jp01" ? "2,410" : "1,190");

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      {/* header */}
      <div className="pt-[22px] pb-3 flex items-end justify-between gap-4 flex-wrap border-b-2 border-divider">
        <div>
          <div className="kicker">{L(me.name)}</div>
          <h1 className="mt-1 text-[clamp(24px,3vw,38px)]">{t.agTitle}</h1>
        </div>
        <div className="flex gap-4 flex-wrap">
          {[
            { value: String(me.trust), label: t.trust },
            { value: an.comparisons.toLocaleString("en-US"), label: t.anCompare },
            { value: money(an.revenue), label: t.anRevenue },
          ].map((k) => (
            <div key={k.label}>
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[22px]">{k.value}</div>
              <div className="text-[11px] text-neutral-700">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <nav className="flex gap-0.5 flex-wrap bg-bg border-b-2 border-divider">
        {([
          { key: "upload", label: t.agUpload },
          { key: "packages", label: t.agPackages },
          { key: "inventory", label: t.agInventory },
          { key: "bookings", label: t.agBookings },
          { key: "analytics", label: t.agAnalytics },
        ] as const).map((x) => (
          <button key={x.key} type="button" onClick={() => setTab(x.key)} className={tabCls(tab === x.key)}>
            {x.label}
          </button>
        ))}
      </nav>

      {/* upload tab */}
      {tab === "upload" && (
        <section className="pt-6 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[26px] items-start">
          <div>
            <h2 className="mb-1.5 text-[22px]">{t.upTitle}</h2>
            <p className="mb-4 text-sm text-neutral-800 max-w-[460px]">{t.upSub}</p>
            <button
              type="button"
              onClick={startUpload}
              className={`w-full flex flex-col items-start gap-2.5 p-[26px] cursor-pointer text-left text-text border-2 border-dashed border-divider ${
                upStage > 0 ? "bg-surface" : "bg-bg"
              }`}
            >
              <UploadIcon stroke="var(--color-accent-700)" />
              <span className="font-[family-name:var(--font-heading)] font-extrabold text-[15px]">{t.upDrop}</span>
              <span className="btn btn-primary pointer-events-none">{upStage === 0 ? t.upBrowse : upStage < 4 ? t.upStage2 : t.upAgain}</span>
            </button>
            <div className="mt-[18px] flex flex-col gap-0.5 bg-divider border-2 border-divider">
              {[t.upStage1, t.upStage2, t.upStage3, t.upStage4].map((label, i) => {
                const done = upStage > i + 1 || upStage === 4;
                const active = upStage === i + 1;
                return (
                  <div key={label} className="bg-bg px-3 py-2.5 flex items-center gap-2.5">
                    {done ? (
                      <Check className="flex-none" stroke="var(--color-accent-700)" />
                    ) : active ? (
                      <Spinner className="flex-none" stroke="var(--color-text)" />
                    ) : (
                      <Circle className="flex-none" stroke="var(--color-neutral-400)" />
                    )}
                    <span
                      className={`text-[13px] ${
                        done || active ? "font-extrabold text-text" : "font-normal text-neutral-600"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="ml-auto text-[11px] text-neutral-700">{done ? "✓" : active ? "…" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            {upStage === 4 && (
              <div className="border-2 border-text">
                <div className="px-3.5 py-3 border-b-2 border-divider flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-base">{t.upExtracted}</div>
                    <div className="text-[11px] text-neutral-700">
                      {DATA.extraction.length} {t.upFields} · 38 {t.upSeconds}
                    </div>
                  </div>
                  <span className="tag tag-accent">TOKYO-FUJI-5D3N-OCT26.pdf</span>
                </div>
                <div className="max-h-[420px] overflow-auto">
                  {DATA.extraction.map((f, i) => (
                    <div key={i} className="flex gap-3 px-3.5 py-[9px] border-b border-divider">
                      <div className="flex-none w-[34%] text-xs text-neutral-700">{L(f.field)}</div>
                      <div className="flex-1 text-[13px]">
                        <div>{L(f.value)}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="w-[70px]">
                            <ScoreBar pct={f.conf} fill={f.conf >= 85 ? "var(--color-text)" : "var(--color-accent)"} height={3} />
                          </div>
                          <span className="text-[10px] text-neutral-700">
                            {t.upConfidence} {f.conf}%
                          </span>
                          {"check" in f && f.check && (
                            <span className="tag tag-accent text-[10px]">{t.upNeedsCheck}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3.5 py-3 border-t-2 border-divider flex gap-2 flex-wrap">
                  <button type="button" className="btn btn-primary" onClick={() => setTab("packages")}>
                    {t.upPublish}
                  </button>
                  <button type="button" className="btn btn-secondary">
                    {t.upEdit}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setUpStage(0)}>
                    {t.upAgain}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* bookings tab */}
      {tab === "bookings" && (
        <section className="pt-6">
          <div className="overflow-x-auto border-2 border-divider">
            <div className="min-w-[900px]">
              <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
                <span className="flex-none w-[100px]">{t.bkRef}</span>
                <span className="flex-none w-[110px]">{t.bkCustomer}</span>
                <span className="flex-1 min-w-[180px]">{t.agPackages}</span>
                <span className="flex-none w-[90px]">{t.cDeparture}</span>
                <span className="flex-none w-[50px]">{t.bkPax}</span>
                <span className="flex-none w-[100px]">{t.bkValue}</span>
                <span className="flex-none w-[120px]">{t.bkStatus}</span>
                <span className="flex-none w-[160px]">{t.bkAction}</span>
              </div>
              {DATA.agencyBookings.map((b) => {
                const meta = BOOKING_STATUS[b.status];
                const st = statusInfo(meta.key, t);
                return (
                  <div key={b.ref} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                    <span className="flex-none w-[100px] font-[family-name:var(--font-heading)] font-extrabold text-xs">
                      {b.ref}
                    </span>
                    <span className="flex-none w-[110px]">{L(b.cust)}</span>
                    <span className="flex-1 min-w-[180px] text-xs">{L(pkgById(b.pkg)!.title)}</span>
                    <span className="flex-none w-[90px] text-xs">{L(b.date)}</span>
                    <span className="flex-none w-[50px]">{b.pax}</span>
                    <span className="flex-none w-[100px] font-[family-name:var(--font-heading)] font-extrabold">
                      {money(b.value)}
                    </span>
                    <span className="flex-none w-[120px]">
                      <span className={st.cls}>{t[meta.labelKey]}</span>
                    </span>
                    <span className="flex-none w-[160px] flex gap-1.5">
                      <button type="button" className="btn btn-secondary px-2 py-1 text-xs">
                        {b.status === "new" ? t.bkConfirmSeat : t.bkChat}
                      </button>
                      <button type="button" className="btn btn-ghost px-1.5 py-1 text-xs">
                        {t.bkChat}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* analytics tab */}
      {tab === "analytics" && (
        <section className="pt-6 flex flex-col gap-[26px]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] bg-bg border-2 border-divider">
            {[
              { label: t.anViews, value: an.views.toLocaleString("en-US"), delta: `+${an.viewsDelta}%` },
              { label: t.anCompare, value: an.comparisons.toLocaleString("en-US"), delta: `+${an.comparisonsDelta}%` },
              { label: t.anInquiry, value: `${an.inquiryRate}%`, delta: t.anCheaper },
              { label: t.anBooking, value: `${an.bookingRate}%`, delta: "+0.4%" },
              { label: t.anRevenue, value: money(an.revenue), delta: `${t.anCommission} ${money(an.commission)}` },
              { label: t.anRating, value: an.rating.toFixed(1), delta: `${t.anCancel} ${an.cancelRate}%` },
            ].map((m) => (
              <div key={m.label} className="bg-bg border border-divider p-3.5">
                <div className="text-[10px] tracking-[0.08em] uppercase text-neutral-700 font-extrabold">{m.label}</div>
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] leading-[1.1] mt-1">
                  {m.value}
                </div>
                <div className="text-[11px] text-accent-700">{m.delta}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[26px]">
            <div>
              <h3 className="mb-2.5 text-[17px]">{t.anViews}</h3>
              <svg viewBox="0 0 320 130" className="w-full h-auto block border-b-2 border-divider">
                {bars.map((b, i) => (
                  <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} />
                ))}
              </svg>
              <div className="flex justify-between text-[10px] text-neutral-700 mt-1">
                <span>{L({ th: "ก.ย. 2025", en: "Sep 2025" })}</span>
                <span>{L({ th: "ส.ค. 2026", en: "Aug 2026" })}</span>
              </div>
            </div>
            <div>
              <h3 className="mb-2.5 text-[17px]">{t.anTop}</h3>
              <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                {an.top.map((x) => (
                  <div key={x.pkg} className="bg-bg px-3 py-2.5">
                    <div className="flex justify-between gap-2.5 text-[13px]">
                      <span className="font-[family-name:var(--font-heading)] font-extrabold">{L(pkgById(x.pkg)!.title)}</span>
                      <span>
                        {x.bookings} {L({ th: "การจอง", en: "bookings" })}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-700">
                      {x.views.toLocaleString("en-US")} {t.anViews}
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="my-[18px] mb-2.5 text-[17px]">{t.anPrice}</h3>
              <div className="flex flex-col gap-2">
                {an.pricePosition.map((x) => (
                  <div key={x.pkg} className="flex justify-between gap-2.5 text-[13px] border-b border-divider pb-1.5">
                    <span>{L(pkgById(x.pkg)!.title)}</span>
                    <span
                      className={`font-[family-name:var(--font-heading)] font-extrabold ${
                        x.delta < 0 ? "text-accent-700" : "text-neutral-800"
                      }`}
                    >
                      {Math.abs(x.delta)}% {x.delta < 0 ? t.anCheaper : t.anPricier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "inventory" && (
        <section className="pt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[820px]">
            <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
              <span className="flex-1 min-w-[220px]">{t.agPackages}</span>
              <span className="flex-none w-[160px]">{t.invDate}</span>
              <span className="flex-none w-[110px]">{t.invPrice}</span>
              <span className="flex-none w-[80px]">{t.invSeats}</span>
              <span className="flex-none w-[160px]">{t.invState}</span>
            </div>
            {pkgRows.flatMap((p) =>
              p.departures.map((d, i) => {
                const st = statusInfo(d.status, t);
                return (
                  <div key={`${p.id}-${i}`} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                    <span className="flex-1 min-w-[220px] font-extrabold text-[13px]">{L(p.title)}</span>
                    <span className="flex-none w-[160px] text-xs">{L(d.date)}</span>
                    <span className="flex-none w-[110px] font-extrabold">{money(p.price)}</span>
                    <span className="flex-none w-[80px]">{d.seats}</span>
                    <span className="flex-none w-[160px]">
                      <span className={st.cls}>{st.label}</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* packages tab */}
      {tab === "packages" && (
        <section className="pt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[820px]">
            <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
              <span className="flex-1 min-w-[240px]">{t.agPackages}</span>
              <span className="flex-none w-[110px]">{t.cDeparture}</span>
              <span className="flex-none w-[110px]">{t.cRealTotal}</span>
              <span className="flex-none w-[90px]">{t.anViews}</span>
              <span className="flex-none w-[110px]">{t.anCompare}</span>
              <span className="flex-none w-[70px]">{t.quality}</span>
              <span className="flex-none w-[130px]">{t.bkStatus}</span>
            </div>
            {pkgRows.map((p) => {
              const st = statusInfo(p.departures[0].status, t);
              return (
                <div key={p.id} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                  <span className="flex-1 min-w-[240px]">
                    <span className="block font-[family-name:var(--font-heading)] font-extrabold text-[13px]">
                      {L(p.title)}
                    </span>
                    <span className="block text-[11px] text-neutral-700">{p.code}</span>
                  </span>
                  <span className="flex-none w-[110px] text-xs">
                    {p.departures.length} {L({ th: "รอบ", en: "departures" })}
                  </span>
                  <span className="flex-none w-[110px] font-[family-name:var(--font-heading)] font-extrabold">
                    {money(p.real)}
                  </span>
                  <span className="flex-none w-[90px]">{viewsFor(p.id)}</span>
                  <span className="flex-none w-[110px]">{cmpFor(p.id)}</span>
                  <span className="flex-none w-[70px]">{p.quality.score}</span>
                  <span className="flex-none w-[130px]">
                    <span className={st.cls}>{st.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
