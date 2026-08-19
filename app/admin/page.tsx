"use client";

import { useState } from "react";
import { OPS, type TrustBand } from "@/lib/ops";
import { useApp } from "@/lib/store";
import { DEMAND } from "@/lib/tap";

type Tab = "overview" | "agencies" | "packages" | "bookings" | "risk" | "support" | "demand";

function bandCls(b: TrustBand) {
  if (b === "excellent") return "bg-accent text-text";
  if (b === "good") return "bg-accent-200 text-accent-800";
  if (b === "watch") return "bg-neutral-200 text-neutral-800";
  return "bg-neutral-800 text-bg";
}

function bandLabel(b: TrustBand, t: { adExcellent: string; adGood: string; adWatch: string; adHighRisk: string }) {
  if (b === "excellent") return t.adExcellent;
  if (b === "good") return t.adGood;
  if (b === "watch") return t.adWatch;
  return t.adHighRisk;
}

export default function AdminPage() {
  const { t, L, money } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [held, setHeld] = useState<Record<string, string>>({});

  const tabCls = (active: boolean) =>
    `px-4 py-[11px] cursor-pointer border-0 font-[family-name:var(--font-heading)] font-extrabold text-sm ${
      active ? "bg-text text-bg" : "bg-surface text-text"
    }`;

  const mark = (id: string, v: string) => setHeld((h) => ({ ...h, [id]: v }));

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <div className="pt-[22px] pb-3 flex items-end justify-between gap-4 flex-wrap border-b-2 border-divider">
        <div>
          <div className="kicker">{t.adKicker}</div>
          <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">{t.adTitle}</h1>
        </div>
        <div className="text-[13px] text-neutral-700">TOUR24 · classichot</div>
      </div>

      <nav className="flex gap-0.5 flex-wrap bg-bg border-b-2 border-divider">
        {(
          [
            ["overview", t.adOverview],
            ["agencies", t.adAgencies],
            ["packages", t.adPackages],
            ["bookings", t.adBookings],
            ["risk", t.adRisk],
            ["support", t.adSupport],
            ["demand", t.adDemand],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={tabCls(tab === k)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="pt-6 flex flex-col gap-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] border-2 border-divider">
            {[
              { n: money(OPS.gmv), l: t.adGmv },
              { n: String(OPS.bookingCount), l: t.adBookings },
              { n: `${OPS.conversion}%`, l: t.adConv },
              { n: String(OPS.livePackages), l: t.adLive },
              { n: String(OPS.pendingAgencies), l: t.adPendingAg },
              { n: String(OPS.pendingPackages), l: t.adPendingPk },
              { n: String(OPS.disputes), l: t.adDisputes },
            ].map((s) => (
              <div key={s.l} className="p-3.5 border-r border-divider last:border-r-0">
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] leading-none">{s.n}</div>
                <div className="text-[11px] text-neutral-700 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
            <div>
              <h2 className="mb-2.5 text-[17px]">{t.adPendingAg}</h2>
              <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                {OPS.queue.map((a) => (
                  <div key={a.id} className="bg-bg px-3 py-2.5 flex justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-[13px]">{L(a.name)}</div>
                      <div className="text-[11px] text-neutral-700">
                        {a.licence} · {L(a.stage)}
                      </div>
                    </div>
                    <div className="flex gap-1.5 self-start">
                      <button type="button" className="btn btn-primary px-2 py-1 text-xs" onClick={() => mark(a.id, "ok")}>
                        {held[a.id] === "ok" ? "✓" : t.adApprove}
                      </button>
                      <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => mark(a.id, "hold")}>
                        {t.adHold}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2.5 text-[17px]">{t.adRisk}</h2>
              <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
                {OPS.risk.map((r) => (
                  <div key={r.id} className="bg-bg px-3 py-2.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-[0.04em] px-2 py-0.5 ${bandCls(r.level)}`}>
                      {bandLabel(r.level, t)}
                    </span>
                    <div className="font-extrabold text-[13px] mt-1.5">{L(r.title)}</div>
                    <p className="text-xs text-neutral-800 mt-1">{L(r.body)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "agencies" && (
        <section className="pt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[860px]">
            <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
              <span className="flex-1 min-w-[200px]">{t.adAgencies}</span>
              <span className="flex-none w-[110px]">{t.adLicence}</span>
              <span className="flex-none w-[90px]">{t.trust}</span>
              <span className="flex-none w-[90px]">{t.apBookings}</span>
              <span className="flex-none w-[90px]">{t.anCancel}</span>
              <span className="flex-none w-[220px]">{t.bkAction}</span>
            </div>
            {OPS.agencies.map((a) => (
              <div key={a.id} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                <span className="flex-1 min-w-[200px] font-extrabold">{L(a.name)}</span>
                <span className="flex-none w-[110px] text-xs">{a.licence}</span>
                <span className="flex-none w-[90px]">
                  <span className={`text-[11px] font-extrabold uppercase px-2 py-1 ${bandCls(a.band)}`}>
                    {a.trust} · {bandLabel(a.band, t)}
                  </span>
                </span>
                <span className="flex-none w-[90px]">{a.bookings.toLocaleString("en-US")}</span>
                <span className="flex-none w-[90px]">{a.cancel}%</span>
                <span className="flex-none w-[220px] flex gap-1.5">
                  <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => mark(a.id, "watch")}>
                    {t.adWatch}
                  </button>
                  <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={() => mark(a.id, "sus")}>
                    {held[a.id] === "sus" ? "✓" : t.adSuspend}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "packages" && (
        <section className="pt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[760px]">
            <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
              <span className="flex-1 min-w-[240px]">{t.adPackages}</span>
              <span className="flex-none w-[140px]">{t.cAgency}</span>
              <span className="flex-none w-[80px]">{t.adFlag}</span>
              <span className="flex-none w-[220px]">{t.bkAction}</span>
            </div>
            {OPS.packages.map((p) => (
              <div key={p.id} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                <span className="flex-1 min-w-[240px]">
                  <span className="block font-extrabold">{L(p.title)}</span>
                  <span className="text-[11px] text-neutral-700">{p.status}</span>
                </span>
                <span className="flex-none w-[140px] text-xs">{L(p.agency)}</span>
                <span className="flex-none w-[80px]">{p.flags}</span>
                <span className="flex-none w-[220px] flex gap-1.5">
                  <button type="button" className="btn btn-primary px-2 py-1 text-xs" onClick={() => mark(p.id, "ok")}>
                    {held[p.id] === "ok" ? "✓" : t.adApprove}
                  </button>
                  <button type="button" className="btn btn-secondary px-2 py-1 text-xs">
                    {t.adHold}
                  </button>
                  <button type="button" className="btn btn-ghost px-2 py-1 text-xs">
                    {t.adReject}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "bookings" && (
        <section className="pt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[720px]">
            <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
              <span className="flex-none w-[110px]">{t.bkRef}</span>
              <span className="flex-none w-[130px]">{t.bkCustomer}</span>
              <span className="flex-1 min-w-[200px]">{t.agPackages}</span>
              <span className="flex-none w-[110px]">{t.bkValue}</span>
              <span className="flex-none w-[140px]">{t.bkStatus}</span>
            </div>
            {OPS.bookingRows.map((b) => (
              <div key={b.ref} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                <span className="flex-none w-[110px] font-extrabold text-xs">{b.ref}</span>
                <span className="flex-none w-[130px]">{L(b.traveler)}</span>
                <span className="flex-1 min-w-[200px] text-xs">{L(b.pkg)}</span>
                <span className="flex-none w-[110px] font-extrabold">{money(b.value)}</span>
                <span className="flex-none w-[140px] text-xs">{L(b.status)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "risk" && (
        <section className="pt-6 grid gap-0.5 bg-divider border-2 border-divider">
          {OPS.risk.map((r) => (
            <div key={r.id} className="bg-bg p-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <div>
                <span className={`text-[11px] font-extrabold uppercase tracking-[0.04em] px-2.5 py-1 ${bandCls(r.level)}`}>
                  {bandLabel(r.level, t)}
                </span>
                <h3 className="mt-2 text-[18px]">{L(r.title)}</h3>
              </div>
              <p className="text-sm text-neutral-800">{L(r.body)}</p>
            </div>
          ))}
        </section>
      )}

      {tab === "support" && (
        <section className="pt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[700px]">
            <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
              <span className="flex-none w-[80px]">ID</span>
              <span className="flex-1 min-w-[260px]">{t.adSupport}</span>
              <span className="flex-none w-[160px]">{t.cAgency}</span>
              <span className="flex-none w-[90px]">{t.tReminder}</span>
            </div>
            {OPS.tickets.map((d) => (
              <div key={d.id} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-center text-[13px]">
                <span className="flex-none w-[80px] font-extrabold text-xs">{d.id}</span>
                <span className="flex-1 min-w-[260px]">{L(d.subject)}</span>
                <span className="flex-none w-[160px] text-xs">{L(d.agency)}</span>
                <span className="flex-none w-[90px] text-xs">{L(d.age)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "demand" && (
        <section className="pt-6 flex flex-col gap-4">
          <div>
            <h2 className="mb-1 text-[22px]">{t.agntDemand}</h2>
            <p className="text-sm text-neutral-800 max-w-[640px]">{t.agntHomeSub}</p>
          </div>
          <div className="overflow-x-auto border-2 border-divider">
            <div className="min-w-[860px]">
              <div className="flex gap-3 px-3.5 py-2.5 border-b-2 border-divider text-[10px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">
                <span className="flex-none w-[100px]">{t.fCountry}</span>
                <span className="flex-none w-[140px]">{t.fWhen}</span>
                <span className="flex-none w-[110px]">{t.agntSearches}</span>
                <span className="flex-none w-[110px]">{t.agntSeatPool}</span>
                <span className="flex-none w-[110px]">{t.agntGap}</span>
                <span className="flex-1 min-w-[240px]">{t.agntAction}</span>
              </div>
              {DEMAND.map((d) => (
                <div key={d.destination + d.window} className="flex gap-3 px-3.5 py-2.5 border-b border-divider items-start text-[13px]">
                  <span className="flex-none w-[100px] font-extrabold">{d.destination}</span>
                  <span className="flex-none w-[140px] text-xs">
                    {d.window}
                    <br />
                    {d.budget} · {d.duration}
                  </span>
                  <span className="flex-none w-[110px]">{d.searches.toLocaleString("en-US")}</span>
                  <span className="flex-none w-[110px]">{d.seats.toLocaleString("en-US")}</span>
                  <span className="flex-none w-[110px] font-extrabold text-accent-700">{d.gap.toLocaleString("en-US")}</span>
                  <span className="flex-1 min-w-[240px] text-xs">{L(d.action)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
