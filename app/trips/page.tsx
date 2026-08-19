"use client";

import { useRouter } from "next/navigation";
import { agencyById, pkgById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import PackageCard from "@/components/PackageCard";
import ScoreBar from "@/components/ScoreBar";
import { Check, X } from "@/components/icons";

export default function TripsPage() {
  const { t, L, money, saved } = useApp();
  const router = useRouter();
  const up = DATA.trips[0];
  const past = DATA.trips[1];
  const upPkg = pkgById(up.pkg)!;
  const pastPkg = pkgById(past.pkg)!;
  const savedList = saved.map(pkgById).filter(Boolean) as NonNullable<ReturnType<typeof pkgById>>[];

  return (
    <main className="max-w-[1200px] mx-auto px-[22px] pb-20">
      <div className="pt-6 pb-3.5 border-b-2 border-divider">
        <h1 className="text-[clamp(26px,3vw,40px)]">{t.tripsTitle}</h1>
      </div>

      {/* upcoming */}
      <section className="pt-[22px]">
        <h2 className="mb-3 text-[19px]">{t.tUpcoming}</h2>
        <div className="border-2 border-text grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div className="p-[18px] flex flex-col gap-2 border-r-2 border-divider">
            <div className="text-[11px] tracking-[0.1em] uppercase font-extrabold text-accent-700">
              {t.bkRef} {up.ref}
            </div>
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[21px] leading-[1.15]">
              {L(upPkg.title)}
            </div>
            <div className="text-[13px] text-neutral-800">
              {L(up.date)} · {up.pax} {t.people}
            </div>
            <div className="text-[13px] text-neutral-800">{L(agencyById(upPkg.agency).name)}</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-heading)] font-extrabold text-[40px] leading-none text-accent-700">
                {up.daysAway}
              </span>
              <span className="text-xs text-neutral-700">{L({ th: "วันก่อนออกเดินทาง", en: "days to departure" })}</span>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button type="button" className="btn btn-primary" onClick={() => router.push(`/packages/${upPkg.id}`)}>
                {t.viewPackage}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => router.push(`/packages/${upPkg.id}`)}>
                {t.tSupport}
              </button>
            </div>
          </div>
          <div className="p-[18px] flex flex-col gap-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-extrabold">{t.tPayment}</span>
                <span>
                  {money(up.paid)} / {money(up.total)}
                </span>
              </div>
              <ScoreBar pct={Math.round((up.paid / up.total) * 100)} fill="var(--color-accent)" height={6} />
              <div className="text-[11px] text-neutral-700 mt-1">
                {L({
                  th: `ส่วนที่เหลือ ${money(up.total - up.paid)} ครบกำหนด 30 วันก่อนเดินทาง`,
                  en: `Balance ${money(up.total - up.paid)} due 30 days before departure`,
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-extrabold mb-1.5">{t.tDocs}</div>
              <div className="flex flex-col gap-1.5">
                {up.docs.map((d, i) => (
                  <div key={i} className="flex gap-2 text-[13px] items-start">
                    {d.done ? (
                      <Check className="flex-none mt-[3px]" stroke="var(--color-accent-700)" />
                    ) : (
                      <X className="flex-none mt-[3px]" stroke="var(--color-neutral-600)" />
                    )}
                    <span className={d.done ? "" : "text-neutral-700"}>{L(d.label)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* saved */}
      <section className="pt-7">
        <h2 className="mb-3 text-[19px]">{t.tSaved}</h2>
        {savedList.length ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[18px]">
            {savedList.map((p) => (
              <PackageCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-divider px-6 py-8 text-sm text-neutral-700">{t.noResultsSub}</div>
        )}
      </section>

      {/* past */}
      <section className="pt-7">
        <h2 className="mb-3 text-[19px]">{t.tHistory}</h2>
        <div className="border-2 border-divider p-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 items-center">
          <div>
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[17px]">{L(pastPkg.title)}</div>
            <div className="text-xs text-neutral-700">
              {L(past.date)} · {past.ref}
            </div>
          </div>
          <div className="text-[13px] text-neutral-800">
            {L({
              th: "เดินทางเรียบร้อยแล้ว · รีวิวได้เพราะจองผ่าน TOUR24",
              en: "Completed · you can review because you booked on TOUR24",
            })}
          </div>
          <button type="button" className="btn btn-primary justify-self-start" onClick={() => router.push(`/packages/${pastPkg.id}`)}>
            {t.tReview}
          </button>
        </div>
      </section>
    </main>
  );
}
