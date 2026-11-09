"use client";

import Link from "next/link";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { tagLabel } from "@/lib/helpers";
import { KIND_PATH, realPrice, type Activity } from "@/lib/activities";
import PhotoSlot from "@/components/PhotoSlot";
import { StarSolid } from "@/components/icons";
import { AC, hoursLabel } from "./activityCopy";

export default function ActivityCard({ a }: { a: Activity }) {
  const { t, L, lang, money } = useApp();
  const ag = agencyById(a.agency);
  const region = DATA.inboundRegions.find((r) => r.id === a.region);
  const real = realPrice(a);
  const extra = real - a.price;
  const href = `${KIND_PATH[a.kind]}/${a.id}`;

  return (
    <article className="flex h-full flex-col border-2 border-divider bg-bg transition-colors hover:border-text">
      <Link href={href} className="relative block aspect-[4/3] bg-surface no-underline" tabIndex={-1} aria-hidden>
        <PhotoSlot label={L(a.title)} src={a.photo} />
        <div className="pointer-events-none absolute left-0 top-0 flex flex-col items-start gap-0.5">
          {a.shopping === 0 ? (
            <span className="bg-text px-2.5 py-1 text-[11px] font-extrabold text-bg">{t.noShopFlag}</span>
          ) : (
            <span className="bg-accent-700 px-2.5 py-1 text-[11px] font-extrabold text-bg">
              {a.shopping} {L(AC.shops)}
            </span>
          )}
          {a.pickup && <span className="bg-accent px-2.5 py-1 text-[11px] font-extrabold text-text">{L(AC.pickup)}</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-700">
          {region ? L(region.name) : ""} · {L(a.place)}
        </div>
        <h3 className="text-[18px] leading-[1.2] [text-wrap:pretty]">
          <Link href={href} className="text-text no-underline hover:underline">
            {L(a.title)}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-neutral-800">
          <span>{hoursLabel(a.hours, lang)}</span>
          <span>
            {L(AC.starts)} {a.start}
          </span>
          <span>{L(a.guide)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {a.tags.slice(0, 3).map((tg) => (
            <span key={tg} className="tag tag-neutral text-[10px]">
              {tagLabel(tg, t, L)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t-2 border-divider px-4 pt-3">
        <div>
          <div className="microlabel">{t.realTotal}</div>
          <div className="font-[family-name:var(--font-heading)] text-[24px] font-extrabold leading-[1.05] text-accent-700">
            {money(real)}
          </div>
          <div className="text-[11px] text-neutral-700">
            {extra > 0 ? `${t.advertised} ${money(a.price)} + ${money(extra)}` : L(AC.perAdult)}
          </div>
        </div>
        <div className="flex-none text-right text-[12px]">
          <div className="inline-flex items-center gap-1 font-extrabold">
            <StarSolid width={12} height={12} className="text-accent-600" />
            {a.rating.toFixed(1)}
            <span className="font-normal text-neutral-700">({a.reviews})</span>
          </div>
          <div className="text-[11px] text-neutral-700">
            {L(ag.name)} · {t.trust} {ag.trust}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <Link href={href} className="btn btn-primary w-full no-underline">
          {L(AC.view)}
        </Link>
      </div>
    </article>
  );
}
