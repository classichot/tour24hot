"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { agencyById, pkgById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { aiDiffFor, statusInfo, priceIntel } from "@/lib/helpers";
import PhotoSlot from "@/components/PhotoSlot";
import { Check, Sparkle } from "@/components/icons";
import { pkgPhoto } from "@/lib/photos";
import { DATA } from "@/lib/data";

export default function ComparePage() {
  const { t, L, money, compare, toggleCompare } = useApp();
  const router = useRouter();
  const cols = compare.map(pkgById).filter(Boolean) as NonNullable<ReturnType<typeof pkgById>>[];

  const diff = aiDiffFor(cols, t, L, money);
  const minReal = cols.length ? Math.min(...cols.map((c) => c.real)) : 0;
  const maxQ = cols.length ? Math.max(...cols.map((c) => c.quality.score)) : 0;
  const none = L({ th: "ไม่มี", en: "None" });
  const mealsWord = L({ th: "มื้อ", en: "meals" });
  const flagsWord = L({ th: "จุดที่ต้องดู", en: "flags" });
  const cleanWord = L({ th: "ผ่าน", en: "Clean" });

  const rows: { label: string; cells: { text: string; badge?: string | null; strong?: boolean }[] }[] = [
    {
      label: t.cRealTotal,
      cells: cols.map((c) => ({ text: money(c.real), strong: true, badge: c.real === minReal ? t.lowest : null })),
    },
    {
      label: t.cAdvertised,
      cells: cols.map((c) => ({ text: `${money(c.price)}  (+${money(c.real - c.price)})` })),
    },
    {
      label: t.piTitle,
      cells: cols.map((c) => {
        const intel = priceIntel(c, DATA.packages);
        if (!intel) return { text: "—" };
        const line =
          intel.band === "great"
            ? `${Math.abs(intel.pct)}% ${t.piBelow}`
            : intel.band === "high"
              ? `${intel.pct}% ${t.piAbove}`
              : t.piInLine;
        return { text: line, badge: intel.band === "great" ? t.piGreatDeal : null };
      }),
    },
    { label: t.cTrust, cells: cols.map((c) => ({ text: String(agencyById(c.agency).trust) })) },
    {
      label: t.cQuality,
      cells: cols.map((c) => ({ text: String(c.quality.score), badge: c.quality.score === maxQ ? t.best : null })),
    },
    {
      label: t.cDeparture,
      cells: cols.map((c) => ({
        text: `${L(c.departures[0].date)} · ${statusInfo(c.departures[0].status, t).label}`,
      })),
    },
    {
      label: t.cAirline,
      cells: cols.map((c) => ({ text: `${c.airlineName} · ${c.airlineType === "full" ? t.fullService : t.lowCost}` })),
    },
    { label: t.cFlight, cells: cols.map((c) => ({ text: `${c.flight.out}   /   ${c.flight.back}` })) },
    { label: t.cBaggage, cells: cols.map((c) => ({ text: c.baggage })) },
    {
      label: t.cHotels,
      cells: cols.map((c) => ({
        text: c.hotels.map((h) => `${L(h.name)} · ${h.star} ${t.stars} × ${h.nights}`).join("  |  "),
      })),
    },
    { label: t.cMeals, cells: cols.map((c) => ({ text: `${c.meals} ${mealsWord}` })) },
    { label: t.cAttractions, cells: cols.map((c) => ({ text: String(c.attractions) })) },
    { label: t.cFreeDay, cells: cols.map((c) => ({ text: c.freeDays ? `${c.freeDays} ${t.days}` : none })) },
    {
      label: t.cShopping,
      cells: cols.map((c) => ({ text: c.shopping === 0 ? none : String(c.shopping), badge: c.shopping === 0 ? t.best : null })),
    },
    { label: t.cTips, cells: cols.map((c) => ({ text: money(c.tips) })) },
    {
      label: t.cVisa,
      cells: cols.map((c) => ({ text: c.visa ? money(c.visa) : L({ th: "ไม่ต้องขอวีซ่า", en: "Not required" }) })),
    },
    {
      label: t.cOptional,
      cells: cols.map((c) => ({
        text: c.optional.length ? c.optional.map((o) => `${L(o.name)} ${money(o.price)}`).join(", ") : none,
      })),
    },
    { label: t.cGroup, cells: cols.map((c) => ({ text: `${c.group} ${t.people}` })) },
    { label: t.cCancel, cells: cols.map((c) => ({ text: L(c.cancel) })) },
    {
      label: t.truthTitle,
      cells: cols.map((c) => ({ text: c.truth.length ? `${c.truth.length} ${flagsWord}` : cleanWord })),
    },
  ];

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <div className="pt-[22px] pb-3 border-b-2 border-divider flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="kicker">TOUR24 · {cols.length}/4</div>
          <h1 className="mt-1 mb-1 text-[clamp(26px,3vw,40px)]">{t.compareTitle}</h1>
          <p className="text-[13px] text-neutral-700 max-w-[560px]">{t.compareSub}</p>
        </div>
        <Link href="/search" className="btn btn-secondary no-underline">
          {t.addMore}
        </Link>
      </div>

      {diff && (
        <div className="mt-5 border-2 border-accent bg-accent-100">
          <div className="px-4 pt-3.5 flex gap-2.5 items-start border-b-2 border-accent-200">
            <Sparkle className="flex-none mt-0.5" stroke="var(--color-accent-700)" />
            <div className="pb-3">
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[15px] text-accent-800">{t.aiDiff}</div>
              <div className="text-xs text-accent-800">{t.aiDiffSub}</div>
            </div>
          </div>
          <div className="p-4">
            <p className="mb-3 text-[17px] leading-[1.4] font-[family-name:var(--font-heading)] font-extrabold text-accent-900 [text-wrap:pretty]">
              {diff.summary}
            </p>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2 list-none p-0 m-0">
              {diff.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-[1.4] text-accent-900">
                  <Check className="flex-none mt-[3px]" width={14} height={14} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {cols.length > 0 ? (
        <div className="mt-6 overflow-x-auto border-2 border-divider">
          <div className="min-w-[780px]">
            <div className="flex border-b-2 border-divider">
              <div className="flex-none w-[180px] px-3 py-3 microlabel text-[11px]">{t.compareTitle}</div>
              {cols.map((c) => (
                <div key={c.id} className="flex-1 min-w-[200px] px-3 py-3 border-l border-divider">
                  <div className="aspect-[16/10] bg-surface mb-2 relative">
                    <PhotoSlot label={L(c.city)} src={pkgPhoto(c.id)} />
                  </div>
                  <div className="font-[family-name:var(--font-heading)] font-extrabold text-[15px] leading-[1.2]">
                    {L(c.title)}
                  </div>
                  <div className="text-[11px] text-neutral-700 mt-0.5">{L(agencyById(c.agency).name)}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-primary px-2.5 py-1.5 text-xs"
                      onClick={() => router.push(`/book/${c.id}`)}
                    >
                      {t.bookThis}
                    </button>
                    <button type="button" className="btn btn-secondary px-2.5 py-1.5 text-xs" onClick={() => toggleCompare(c.id)}>
                      {t.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {rows.map((row) => (
              <div key={row.label} className="flex border-b border-divider">
                <div className="flex-none w-[180px] px-3 py-[9px] text-[11px] tracking-[0.06em] uppercase text-neutral-700 font-extrabold">
                  {row.label}
                </div>
                {row.cells.map((cell, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[200px] px-3 py-[9px] border-l border-divider flex items-baseline gap-2 flex-wrap text-[13px] align-top"
                  >
                    <span className={cell.strong ? "text-[15px] font-[family-name:var(--font-heading)] font-extrabold" : ""}>
                      {cell.text}
                    </span>
                    {cell.badge && (
                      <span className="tag bg-accent text-text font-extrabold">{cell.badge}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 border-2 border-divider px-6 py-10">
          <h3 className="mb-1.5">{t.trayHint}</h3>
          <Link href="/search" className="btn btn-primary no-underline">
            {t.navSearch}
          </Link>
        </div>
      )}
    </main>
  );
}
