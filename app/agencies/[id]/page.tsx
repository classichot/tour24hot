"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DATA, agencyById } from "@/lib/data";
import { useApp } from "@/lib/store";
import PackageCard from "@/components/PackageCard";
import ScoreBar from "@/components/ScoreBar";
import AgentBadge from "@/components/AgentBadge";
import { isAgentDirect } from "@/lib/tap";

export default function AgencyProfilePage() {
  const { t, L } = useApp();
  const params = useParams<{ id: string }>();
  const ag = agencyById(params.id);

  if (!ag) {
    return (
      <main className="max-w-[1400px] mx-auto px-[22px] py-10">
        <h1>404</h1>
        <Link href="/" className="btn btn-primary no-underline">
          TOUR24
        </Link>
      </main>
    );
  }

  const packages = DATA.packages.filter((p) => p.agency === ag.id);

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <div className="pt-[22px] pb-[18px] border-b-2 border-divider grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-text text-bg text-[10px] font-extrabold tracking-[0.08em] uppercase px-[9px] py-1">
              {t.apTitle}
            </span>
            {isAgentDirect(ag.id) && <AgentBadge compact />}
            <span className="text-xs text-neutral-700">
              {t.apLicence} {ag.licence}
            </span>
          </div>
          <h1 className="mb-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03]">{L(ag.name)}</h1>
          <div className="text-sm text-neutral-800">{L(ag.company)}</div>
        </div>
        <div className="flex items-end gap-5">
          <div>
            <div className="microlabel">{t.trust}</div>
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[64px] leading-[0.95] text-accent-700">
              {ag.trust}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-neutral-800">
              {ag.rating.toFixed(1)} / 5 · {ag.reviews} {L({ th: "รีวิวที่ยืนยันแล้ว", en: "verified reviews" })}
            </div>
            <div className="text-xs text-neutral-800">
              {ag.bookings} {t.apBookings}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] bg-bg border-b-2 border-divider">
        {[
          { value: String(ag.years), label: t.apYears },
          { value: String(ag.bookings), label: t.apBookings },
          { value: `${ag.response} ${t.apMin}`, label: t.apResponse },
          { value: `${ag.cancelRate}%`, label: t.apCancelRate },
          { value: `${ag.refundDays} ${t.apDaysAvg}`, label: t.apRefund },
          { value: ag.rating.toFixed(1), label: t.apRating },
        ].map((st) => (
          <div key={st.label} className="bg-bg border border-divider px-4 pt-3.5 pb-4">
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[22px]">{st.value}</div>
            <div className="text-[11px] text-neutral-700 [text-wrap:pretty]">{st.label}</div>
          </div>
        ))}
      </div>

      <section className="pt-[26px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[30px]">
        <div>
          <h2 className="mb-3 text-[22px]">{t.apScoreTitle}</h2>
          <div className="flex flex-col gap-2.5">
            {ag.factors.map((fa, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs">
                  <span>{L(fa.label)}</span>
                  <span className="font-[family-name:var(--font-heading)] font-extrabold">{fa.score}</span>
                </div>
                <ScoreBar pct={fa.score} fill="var(--color-accent)" height={5} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-[22px]">{t.apPackages}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
            {packages.map((p) => (
              <PackageCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
