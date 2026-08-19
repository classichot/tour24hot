"use client";

import { useRouter } from "next/navigation";
import { agencyById, DATA, type Pkg } from "@/lib/data";
import { useApp } from "@/lib/store";
import { shopLabel, shopLevel, statusInfo, tagLabel, valueBadge, priceIntel } from "@/lib/helpers";
import PhotoSlot from "./PhotoSlot";
import { AlertTriangle } from "./icons";
import { pkgPhoto } from "@/lib/photos";
import { isAgentDirect } from "@/lib/tap";

export default function PackageCard({ p }: { p: Pkg }) {
  const { t, L, money, toggleCompare, inCompare } = useApp();
  const router = useRouter();
  const ag = agencyById(p.agency);
  const dep = p.departures[0];
  const st = statusInfo(dep.status, t);
  const gap = p.real - p.price;
  const intel = priceIntel(p, DATA.packages);
  const deal = intel?.band === "great" ? t.piGreatDeal : valueBadge(p, t);
  const flagNote = p.truth.length
    ? L({ th: `${p.truth.length} ข้อควรตรวจสอบก่อนจอง`, en: `${p.truth.length} points to check before booking` })
    : null;

  return (
    <article className="flex flex-col bg-bg border-2 border-divider h-full">
      <div className="relative aspect-[4/3] bg-surface">
        <PhotoSlot label={L(p.city)} src={pkgPhoto(p.id)} />
        <div className="absolute left-0 top-0 flex flex-col items-start gap-0.5 pointer-events-none">
          <span className={st.cls}>{st.label}</span>
          {p.shopping === 0 && (
            <span className="bg-text text-bg text-[11px] font-extrabold px-2.5 py-1">{t.noShopFlag}</span>
          )}
          {isAgentDirect(p.agency) && (
            <span className="bg-text text-bg text-[11px] font-extrabold px-2.5 py-1">✓ {t.agntBadgeShort}</span>
          )}
          {deal && (
            <span className="bg-accent text-text text-[11px] font-extrabold px-2.5 py-1">{deal}</span>
          )}
        </div>
      </div>
      <div className="px-3.5 pt-3.5 flex flex-col gap-2 flex-1">
        <div className="text-[10px] tracking-[0.12em] uppercase text-accent-700 font-extrabold">
          {L(p.country)} · {L(p.city)}
        </div>
        <h4 className="text-[19px] leading-[1.15] [text-wrap:pretty]">{L(p.title)}</h4>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-700">
          <span>
            {p.days} {t.days} {p.nights} {t.nights}
          </span>
          <span>{p.airlineName}</span>
          <span>
            {p.hotelStar} {t.stars}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((tg) => (
            <span key={tg} className="tag tag-neutral text-[10px]">
              {tagLabel(tg, t, L)}
            </span>
          ))}
        </div>
      </div>
      <div className="px-3.5 pt-3 mt-2.5 border-t-2 border-divider flex items-end justify-between gap-2.5">
        <div>
          <div className="microlabel">{t.realTotal}</div>
          <div className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] leading-[1.05] text-accent-700">
            {money(p.real)}
          </div>
          <div className="text-[11px] text-neutral-700">
            {t.advertised} {money(p.price)} + {money(gap)}
          </div>
        </div>
        <div className="text-right flex-none">
          <div className="text-[11px] text-neutral-700">{L(ag.name)}</div>
          <div className="font-[family-name:var(--font-heading)] font-extrabold text-[15px]">
            {t.trust} {ag.trust}
          </div>
          <div className="text-[11px] text-neutral-700">
            {t.quality} {p.quality.score}
          </div>
          <div className="text-[11px] text-neutral-700">
            {t.shopScore} {shopLabel(shopLevel(p), t)}
          </div>
        </div>
      </div>
      <div className="px-3.5 pb-3 flex flex-col gap-1.5">
        {flagNote && (
          <div className="flex gap-1.5 items-start bg-accent-100 text-accent-800 px-2 py-1.5 text-[11px] leading-[1.35]">
            <AlertTriangle className="flex-none mt-[1px]" width={13} height={13} />
            <span>{flagNote}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-neutral-700">
          <span>{L(dep.date)}</span>
          <span>
            {dep.seats} {t.seats}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => router.push(`/packages/${p.id}`)}
          >
            {t.viewPackage}
          </button>
          <button
            type="button"
            className="btn btn-secondary flex-none"
            onClick={() => toggleCompare(p.id)}
            aria-pressed={inCompare(p.id)}
          >
            {inCompare(p.id) ? t.inCompare : t.addCompare}
          </button>
        </div>
      </div>
    </article>
  );
}
