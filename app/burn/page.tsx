"use client";

import { useRouter } from "next/navigation";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { burnDeals, statusInfo } from "@/lib/helpers";
import PhotoSlot from "@/components/PhotoSlot";
import { pkgPhoto } from "@/lib/photos";

export default function BurnPage() {
  const { t, L, money } = useApp();
  const router = useRouter();
  const deals = burnDeals(DATA.packages);

  return (
    <main className="max-w-[1200px] mx-auto px-[22px] pb-[90px]">
      <div className="pt-6 pb-[18px] border-b-2 border-divider">
        <div className="kicker">
          {deals.length} {t.bnCount}
        </div>
        <h1 className="my-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03] max-w-[820px] [text-wrap:pretty]">{t.bnTitle}</h1>
        <p className="text-[15px] text-neutral-800 max-w-[660px]">{t.bnSub}</p>
      </div>

      <div className="flex flex-col">
        {deals.map((b) => {
          const dep = b.p.departures[b.depIndex] || b.p.departures[0];
          const st = statusInfo(dep.status, t);
          const why =
            b.need > 0
              ? L({
                  th: `กลุ่มยังขาดอีก ${b.need} ที่นั่งจึงจะยืนยันออกเดินทาง เอเจนซีจึงลดราคาที่นั่งที่เหลือเพื่อปิดกลุ่มให้ทันกำหนด${
                    b.atCost ? " ราคานี้เท่าต้นทุนตั๋วและโรงแรม" : ""
                  }`,
                  en: `The group is ${b.need} seats short of confirming, so the agency has cut the remaining seats to close it in time${
                    b.atCost ? " — this price is the bare cost of flights and hotels." : "."
                  }`,
                })
              : L({
                  th: `กลุ่มยืนยันออกเดินทางแล้ว แต่ยังเหลือที่นั่งว่าง ${dep.seats} ที่ เอเจนซีจึงปล่อยราคาลดล้วน ๆ`,
                  en: `The departure is already confirmed with ${dep.seats} seats still unsold, so this is a straight discount.`,
                });
          return (
            <article
              key={b.p.id}
              className="border-b-2 border-divider py-5 grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[22px] items-start"
            >
              <div className="relative min-h-[160px] aspect-[16/10] bg-surface">
                <PhotoSlot label={L(b.p.city)} src={pkgPhoto(b.p.id)} />
              </div>
              <div className="flex gap-4">
                <div className="flex-none w-[78px]">
                  <div className="font-[family-name:var(--font-heading)] font-extrabold text-[46px] leading-[0.9] text-accent-700">
                    {b.days}
                  </div>
                  <div className="text-[10px] tracking-[0.06em] uppercase text-neutral-700">{t.bnDaysLeft}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.12em] uppercase font-extrabold text-accent-700">
                    {L(b.p.country)} · {L(b.p.city)}
                  </div>
                  <div className="font-[family-name:var(--font-heading)] font-extrabold text-[19px] leading-[1.2] my-[3px]">
                    {L(b.p.title)}
                  </div>
                  <div className="text-xs text-neutral-700">
                    {L(dep.date)} · {L(agencyById(b.p.agency).name)}
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    <span className={st.cls}>{st.label}</span>
                    <span className="tag tag-neutral text-[11px]">
                      {dep.seats} {t.bnSeats}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="microlabel mb-1">{t.bnWhy}</div>
                <p className="mb-2 text-[13px] leading-[1.45] text-neutral-800 [text-wrap:pretty]">{why}</p>
                {b.atCost && (
                  <span className="bg-text text-bg text-[10px] font-extrabold tracking-[0.08em] uppercase px-[9px] py-1">
                    {t.bnAtCost}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="bg-accent text-text font-[family-name:var(--font-heading)] font-extrabold text-sm px-[9px] py-[3px] flex-none">
                    −{Math.round(b.disc * 100)}%
                  </span>
                  <span className="text-[11px] text-neutral-700 line-through">
                    {t.bnWas} {money(b.p.real)}
                  </span>
                </div>
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-[36px] leading-[1.05] text-accent-700 mt-1">
                  {money(b.now)}
                </div>
                <div className="text-xs text-neutral-800">
                  {t.bnSave} {money(b.save)} / {t.perPerson} · {b.need > 0 ? `${b.need} ${t.bnNeed}` : t.bnConfirmed}
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <button type="button" className="btn btn-primary" onClick={() => router.push(`/book/${b.p.id}?dep=${b.depIndex}`)}>
                    {t.bnBook}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => router.push(`/packages/${b.p.id}`)}>
                    {t.viewPackage}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-[18px] text-xs leading-[1.5] text-neutral-700 max-w-[660px]">{t.bnNote}</p>
    </main>
  );
}
