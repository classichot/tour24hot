"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { tagLabel } from "@/lib/helpers";
import { activities, activitiesOf, KIND_COPY, KIND_PATH, realPrice, type ActivityKind } from "@/lib/activities";
import ActivityCard from "./ActivityCard";
import { AC } from "./activityCopy";

type Dur = "any" | "short" | "mid" | "long";
type Flag = "pickup" | "noshop" | "cn" | "family" | "elderly";

interface Filters {
  region: string;
  max: number;
  dur: Dur;
  flags: Flag[];
}

const KINDS: ActivityKind[] = ["daytour", "excursion", "attraction"];

export default function ActivityCatalog({ kind }: { kind: ActivityKind }) {
  const { t, L, money } = useApp();
  const pool = useMemo(() => activitiesOf(kind), [kind]);
  const ceiling = Math.ceil(Math.max(...pool.map(realPrice)) / 100) * 100;
  const defaults: Filters = { region: "any", max: ceiling, dur: "any", flags: [] };
  const [f, setF] = useState<Filters>(defaults);
  const [sort, setSort] = useState<"real" | "rating" | "short">("real");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const toggle = (fl: Flag) => set("flags", f.flags.includes(fl) ? f.flags.filter((x) => x !== fl) : [...f.flags, fl]);

  const results = useMemo(() => {
    const out = pool.filter((a) => {
      if (f.region !== "any" && a.region !== f.region) return false;
      if (realPrice(a) > f.max) return false;
      if (f.dur === "short" && a.hours > 4) return false;
      if (f.dur === "mid" && (a.hours <= 4 || a.hours >= 8)) return false;
      if (f.dur === "long" && a.hours < 8) return false;
      for (const fl of f.flags) {
        if (fl === "pickup" && !a.pickup) return false;
        if (fl === "noshop" && a.shopping > 0) return false;
        if (fl === "cn" && !/Chinese/.test(a.guide.en)) return false;
        if ((fl === "family" || fl === "elderly") && !a.tags.includes(fl)) return false;
      }
      return true;
    });
    return out.sort((a, b) =>
      sort === "rating" ? b.rating - a.rating : sort === "short" ? a.hours - b.hours : realPrice(a) - realPrice(b)
    );
  }, [pool, f, sort]);

  const flagOpts: { v: Flag; label: string }[] = [
    { v: "pickup", label: L(AC.pickup) },
    { v: "noshop", label: tagLabel("noshop", t, L) },
    { v: "cn", label: L(AC.cnGuide) },
    { v: "family", label: tagLabel("family", t, L) },
    { v: "elderly", label: tagLabel("elderly", t, L) },
  ];
  const active = f.region !== "any" || f.max < ceiling || f.dur !== "any" || f.flags.length > 0;
  const copy = KIND_COPY[kind];
  const countLabel = `${results.length} ${L(results.length === 1 ? AC.option : AC.options)}`;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-5 pb-24 lg:px-[22px]">
      <header className="border-b-2 border-text pb-5 pt-7">
        <div className="kicker">{t.navInbound}</div>
        <h1 className="mt-1.5 text-[clamp(30px,3.2vw,44px)]">{L(copy.title)}</h1>
        <p className="mt-2 max-w-[680px] text-[15px] text-neutral-800">{L(copy.sub)}</p>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label={t.navInbound}>
          <Link href="/inbound" className="btn btn-secondary no-underline text-[13px]">
            {L(AC.multiDay)}
          </Link>
          {KINDS.map((k) => (
            <Link
              key={k}
              href={KIND_PATH[k]}
              aria-current={k === kind ? "page" : undefined}
              className={`btn no-underline text-[13px] ${k === kind ? "btn-primary" : "btn-secondary"}`}
            >
              {L(KIND_COPY[k].title)}
              <span className="font-normal opacity-70">{activities.filter((a) => a.kind === k).length}</span>
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 pt-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className={`${filtersOpen ? "block" : "hidden"} border-2 border-divider bg-bg lg:sticky lg:top-[112px] lg:block`}>
          <div className="flex items-center justify-between border-b-2 border-divider px-4 py-3">
            <h2 className="text-[16px]">{t.filters}</h2>
            {active && (
              <button type="button" className="btn btn-ghost text-[12px]" onClick={() => setF(defaults)}>
                {t.reset}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="field">
              <label htmlFor="ac-region">{t.fRegion}</label>
              <select id="ac-region" className="input" value={f.region} onChange={(e) => set("region", e.target.value)}>
                <option value="any">{L(AC.allRegions)}</option>
                {DATA.inboundRegions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {L(r.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ac-max">
                {L(AC.maxPrice)} {money(f.max)}
              </label>
              <input
                id="ac-max"
                type="range"
                min={100}
                max={ceiling}
                step={50}
                value={f.max}
                onChange={(e) => set("max", Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
            <div className="field">
              <label htmlFor="ac-dur">{t.fDuration}</label>
              <select id="ac-dur" className="input" value={f.dur} onChange={(e) => set("dur", e.target.value as Dur)}>
                <option value="any">{L(AC.durAny)}</option>
                <option value="short">{L(AC.durShort)}</option>
                <option value="mid">{L(AC.durMid)}</option>
                <option value="long">{L(AC.durLong)}</option>
              </select>
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 border-t-2 border-divider p-0 pt-3">
              <legend className="mb-1 pt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-neutral-700">{t.fFlags}</legend>
              {flagOpts.map((fl) => (
                <label key={fl.v} className="radio items-start leading-[1.3]">
                  <input type="checkbox" checked={f.flags.includes(fl.v)} onChange={() => toggle(fl.v)} />
                  <span className="dot mt-[1px] rounded-none" />
                  <span className="text-[13px]">{fl.label}</span>
                </label>
              ))}
            </fieldset>
            <button type="button" className="btn btn-primary w-full lg:hidden" onClick={() => setFiltersOpen(false)}>
              {countLabel}
            </button>
          </div>
        </aside>

        <section className="min-w-0" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px]">{countLabel}</h2>
              <button
                type="button"
                className={`btn lg:hidden ${filtersOpen || active ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                {t.filters}
              </button>
            </div>
            <div className="field min-w-[200px]">
              <label htmlFor="ac-sort">{t.sort}</label>
              <select id="ac-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="real">{t.sortReal}</option>
                <option value="rating">{L(AC.sortRating)}</option>
                <option value="short">{L(AC.sortShort)}</option>
              </select>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
              {results.map((a) => (
                <ActivityCard key={a.id} a={a} />
              ))}
            </div>
          ) : (
            <div className="border-2 border-divider px-6 py-10">
              <h3 className="mb-3">{L(AC.noMatch)}</h3>
              <button type="button" className="btn btn-primary" onClick={() => setF(defaults)}>
                {t.reset}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
