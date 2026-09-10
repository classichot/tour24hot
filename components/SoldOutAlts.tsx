"use client";

import { useRouter } from "next/navigation";
import { DATA, type Pkg } from "@/lib/data";
import { useApp } from "@/lib/store";
import { soldOutAlts, statusInfo } from "@/lib/helpers";

export default function SoldOutAlts({
  p,
  depIndex,
  onPickDate,
}: {
  p: Pkg;
  depIndex: number;
  onPickDate?: (i: number) => void;
}) {
  const { t, L, money } = useApp();
  const router = useRouter();
  const alts = soldOutAlts(p, depIndex, DATA.packages);

  return (
    <div className="border-2 border-accent px-4 py-3.5 flex flex-col gap-3">
      <div>
        <div className="text-[10px] tracking-[0.1em] uppercase font-extrabold text-accent-800">{t.altTitle}</div>
        <p className="text-[13px] text-neutral-800 mt-1 leading-[1.4]">{t.altSub}</p>
      </div>

      {alts.dates.length > 0 && (
        <div>
          <div className="microlabel mb-1.5">{t.altDates}</div>
          <div className="flex flex-col gap-1">
            {alts.dates.map(({ d, i }) => {
              const st = statusInfo(d.status, t);
              return (
                <button
                  key={i}
                  type="button"
                  className="flex items-center justify-between gap-2 px-3 py-2 border border-divider bg-bg text-left cursor-pointer text-text"
                  onClick={() => {
                    if (onPickDate) onPickDate(i);
                    else router.push(`/book/${p.id}?dep=${i}`);
                  }}
                >
                  <span className="font-extrabold text-[13px]">{L(d.date)}</span>
                  <span className="flex items-center gap-2">
                    <span className={st.cls}>{st.label}</span>
                    <span className="text-[11px] text-neutral-700">
                      {d.seats} {t.seats}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {alts.tours.length > 0 && (
        <div>
          <div className="microlabel mb-1.5">{t.altTours}</div>
          <div className="flex flex-col gap-1">
            {alts.tours.slice(0, 3).map((s) => {
              const open = s.departures.find((d) => d.status !== "sold" && d.seats > 0) || s.departures[0];
              return (
                <button
                  key={s.id}
                  type="button"
                  className="flex items-start justify-between gap-2 px-3 py-2 border border-divider bg-bg text-left cursor-pointer text-text"
                  onClick={() => router.push(`/packages/${s.id}`)}
                >
                  <span>
                    <span className="block font-extrabold text-[13px] leading-[1.2]">{L(s.title)}</span>
                    <span className="block text-[11px] text-neutral-700 mt-0.5">
                      {L(open.date)} · {L(s.airlineName)}
                    </span>
                  </span>
                  <span className="font-extrabold text-[15px] text-accent-700 flex-none">{money(s.real)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
