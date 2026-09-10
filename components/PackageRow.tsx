"use client";

import { useRouter } from "next/navigation";
import { agencyById, type Pkg } from "@/lib/data";
import { useApp } from "@/lib/store";
import { shopLabel, shopLevel, statusInfo, tagLabel, valueBadge, depUnavailable, priceIntel } from "@/lib/helpers";
import PhotoSlot from "./PhotoSlot";
import { AlertTriangle } from "./icons";
import { pkgPhoto } from "@/lib/photos";
import PriceIntel from "./PriceIntel";
import { DATA } from "@/lib/data";
import { isAgentDirect } from "@/lib/tap";

export default function PackageRow({ p }: { p: Pkg }) {
  const { t, L, money, toggleCompare, inCompare } = useApp();
  const router = useRouter();
  const ag = agencyById(p.agency);
  const dep = p.departures[0];
  const st = statusInfo(dep.status, t);
  const gap = p.real - p.price;
  const intel = priceIntel(p, DATA.packages);
  const badge = intel?.band === "great" ? t.piGreatDeal : valueBadge(p, t);
  const flagNote = p.truth.length
    ? L({ th: `${p.truth.length} ข้อควรตรวจสอบก่อนจอง`, en: `${p.truth.length} points to check before booking` })
    : null;
  const go = () => router.push(`/packages/${p.id}`);

  return (
    <article className="grid grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)_196px] border-2 border-divider bg-bg hover:border-text transition-colors">
      <button type="button" onClick={go} className="relative aspect-[16/10] md:aspect-auto md:min-h-[196px] md:h-full bg-surface border-0 p-0 cursor-pointer text-left">
        <PhotoSlot label={L(p.city)} src={pkgPhoto(p.id)} />
        <div className="absolute left-0 top-0 flex flex-col items-start gap-0.5 pointer-events-none">
          <span className={st.cls}>{st.label}</span>
          {p.shopping === 0 && (
            <span className="bg-text text-bg text-[11px] font-extrabold px-2.5 py-1">{t.noShopFlag}</span>
          )}
          {p.direction === "inbound" && (
            <span className="bg-text text-bg text-[11px] font-extrabold px-2.5 py-1">{t.inboundBadge}</span>
          )}
          {isAgentDirect(p.agency) && (
            <span className="bg-text text-bg text-[11px] font-extrabold px-2.5 py-1">✓ {t.agntBadgeShort}</span>
          )}
          {badge && <span className="bg-accent text-text text-[11px] font-extrabold px-2.5 py-1">{badge}</span>}
        </div>
      </button>

      <div className="px-4 py-3.5 flex flex-col gap-2 min-w-0 border-t-2 md:border-t-0 md:border-l-2 border-divider">
        <div className="text-[10px] tracking-[0.12em] uppercase text-accent-700 font-extrabold">
          {L(p.country)} · {L(p.city)}
        </div>
        <button type="button" onClick={go} className="bg-none border-0 p-0 text-left cursor-pointer text-text">
          <h3 className="text-[20px] leading-[1.15] [text-wrap:pretty]">{L(p.title)}</h3>
        </button>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-neutral-800">
          <span>
            {p.days} {t.days} {p.nights} {t.nights}
          </span>
          <span>{L(p.airlineName)}</span>
          <span>
            {p.hotelStar} {t.stars}
          </span>
          <span>
            {t.shopScore} {shopLabel(shopLevel(p), t)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 4).map((tg) => (
            <span key={tg} className="tag tag-neutral text-[10px]">
              {tagLabel(tg, t, L)}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-[12px] text-neutral-700 pt-1">
          <span>
            {L(dep.date)} · {dep.seats} {t.seats}
          </span>
          <span>
            {L(ag.name)} · {t.trust} {ag.trust}
          </span>
        </div>
        {flagNote && (
          <div className="flex gap-1.5 items-start bg-accent-100 text-accent-800 px-2 py-1.5 text-[11px] leading-[1.35]">
            <AlertTriangle className="flex-none mt-[1px]" width={13} height={13} />
            <span>{flagNote}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3.5 flex flex-col gap-2 border-t-2 md:border-t-0 md:border-l-2 border-divider md:text-right">
        <div>
          <div className="microlabel">{t.realTotal}</div>
          <div className="font-[family-name:var(--font-heading)] font-extrabold text-[28px] leading-[1.05] text-accent-700">
            {money(p.real)}
          </div>
          <div className="text-[11px] text-neutral-700">
            {t.advertised} {gap > 0 ? <span className="line-through">{money(p.price)}</span> : money(p.price)}
            {gap > 0 ? ` + ${money(gap)}` : ""}
          </div>
          <PriceIntel p={p} compact />
          {depUnavailable(dep) && <div className="text-[11px] text-accent-800 font-extrabold">{t.altSee}</div>}
        </div>
        <div className="text-[11px] text-neutral-700">
          {t.quality} {p.quality.score} · {t.trust} {ag.trust}
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <button type="button" className="btn btn-primary w-full" onClick={go}>
            {t.viewPackage}
          </button>
          <button
            type="button"
            className="btn btn-secondary w-full"
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
