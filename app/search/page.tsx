"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DATA, agencyById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { tagLabel } from "@/lib/helpers";
import PackageRow from "@/components/PackageRow";

interface Filters {
  q: string;
  country: string;
  dur: string;
  price: number;
  air: string;
  hotel: string;
  type: string;
  trust: number;
  flags: string[];
}

const DEFAULTS: Filters = {
  q: "",
  country: "any",
  dur: "any",
  price: 80000,
  air: "any",
  hotel: "any",
  type: "any",
  trust: 0,
  flags: [],
};

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="max-w-[1400px] mx-auto px-[22px] pt-[22px]" />}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const { t, L, money } = useApp();
  const params = useSearchParams();
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [sort, setSort] = useState("real");
  const [initialized, setInitialized] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const next: Filters = { ...DEFAULTS };
    const q = params.get("q");
    if (q) next.q = q;
    const country = params.get("country");
    if (country) next.country = country;
    const price = params.get("price");
    if (price && !isNaN(Number(price))) next.price = Number(price);
    const dur = params.get("dur");
    if (dur) next.dur = dur;
    const flag = params.get("flag");
    if (flag) next.flags = [flag];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF(next);
    setInitialized(true);
  }, [params]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const results = useMemo(() => {
    if (!initialized) return [];
    const q = f.q.trim().toLowerCase();
    let out = DATA.packages.filter((p) => {
      if (q) {
        const hay = [p.title.th, p.title.en, p.city.th, p.city.en, p.country.th, p.country.en, p.airlineName]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.country !== "any" && p.country.en !== f.country) return false;
      if (f.dur === "short" && (p.days < 3 || p.days > 4)) return false;
      if (f.dur === "mid" && (p.days < 5 || p.days > 6)) return false;
      if (f.dur === "long" && (p.days < 7 || p.days > 9)) return false;
      if (f.dur === "xl" && p.days < 10) return false;
      if (p.real > f.price) return false;
      if (f.air !== "any" && p.airlineType !== f.air) return false;
      if (f.hotel !== "any" && p.hotelStar < Number(f.hotel)) return false;
      if (f.type !== "any" && !p.tags.includes(f.type)) return false;
      if (f.trust > 0 && agencyById(p.agency).trust < f.trust) return false;
      for (const fl of f.flags) {
        if (fl === "confirmed") {
          if (!p.departures.some((d) => d.status === "confirmed")) return false;
        } else if (!p.tags.includes(fl)) return false;
      }
      return true;
    });
    out = out.slice().sort((a, b) => {
      if (sort === "price") return a.price - b.price;
      if (sort === "trust") return agencyById(b.agency).trust - agencyById(a.agency).trust;
      if (sort === "quality") return b.quality.score - a.quality.score;
      return a.real - b.real;
    });
    return out;
  }, [f, sort, initialized]);

  const flagOpts = ["noshop", "freeday", "direct", "smallgroup", "confirmed"].map((v) => ({
    v,
    on: f.flags.includes(v),
    label: v === "confirmed" ? t.confirmedOnly : tagLabel(v, t, L),
  }));

  const countryOpts = [
    { v: "any", label: L({ th: "ทุกประเทศ", en: "All countries" }) },
    ...DATA.destinations
      .filter((d) => DATA.packages.some((p) => p.country.en === d.name.en))
      .map((d) => ({ v: d.name.en, label: L(d.name) })),
  ];

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (f.q.trim()) chips.push({ key: "q", label: f.q.trim(), clear: () => set("q", "") });
  if (f.country !== "any") {
    const c = countryOpts.find((o) => o.v === f.country);
    chips.push({ key: "country", label: c?.label || f.country, clear: () => set("country", "any") });
  }
  if (f.dur !== "any") {
    const durLabel =
      f.dur === "short"
        ? L({ th: "3–4 วัน", en: "3–4 days" })
        : f.dur === "mid"
          ? L({ th: "5–6 วัน", en: "5–6 days" })
          : f.dur === "long"
            ? L({ th: "7–9 วัน", en: "7–9 days" })
            : L({ th: "10 วันขึ้นไป", en: "10+ days" });
    chips.push({ key: "dur", label: durLabel, clear: () => set("dur", "any") });
  }
  if (f.price < 80000) chips.push({ key: "price", label: `${t.fPrice} ${money(f.price)}`, clear: () => set("price", 80000) });
  if (f.air !== "any") chips.push({ key: "air", label: f.air === "full" ? t.fullService : t.lowCost, clear: () => set("air", "any") });
  if (f.hotel !== "any") chips.push({ key: "hotel", label: `${f.hotel} ${t.stars}+`, clear: () => set("hotel", "any") });
  if (f.type !== "any") chips.push({ key: "type", label: tagLabel(f.type, t, L), clear: () => set("type", "any") });
  if (f.trust > 0) chips.push({ key: "trust", label: `${t.trust} ${f.trust}+`, clear: () => set("trust", 0) });
  for (const fl of flagOpts.filter((x) => x.on)) {
    chips.push({
      key: fl.v,
      label: fl.label,
      clear: () => set("flags", f.flags.filter((x) => x !== fl.v)),
    });
  }

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-[100px]">
      <div className="pt-5 pb-4 border-b-2 border-divider">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="kicker">{t.navSearch}</div>
            <h1 className="mt-1 text-[clamp(26px,3vw,36px)]">
              {results.length} {t.resultsIn}
            </h1>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <button
              type="button"
              className={`btn lg:hidden ${filtersOpen || chips.length ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              {t.filters}
              {chips.length > 0 ? ` (${chips.length})` : ""}
            </button>
            <div className="field min-w-[200px]">
              <label>{t.sort}</label>
              <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="real">{t.sortReal}</option>
                <option value="price">{t.sortPrice}</option>
                <option value="trust">{t.sortTrust}</option>
                <option value="quality">{t.sortQuality}</option>
              </select>
            </div>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="tag tag-outline cursor-pointer border-0 bg-accent-100 text-accent-800"
              >
                {c.label} ×
              </button>
            ))}
            <button type="button" className="btn btn-ghost text-[12px]" onClick={() => setF(DEFAULTS)}>
              {t.reset}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5 lg:gap-6 items-start pt-5">
        <aside
          className={`${filtersOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-[76px] border-2 border-divider bg-bg`}
        >
          <div className="flex items-center justify-between px-3.5 py-3 border-b-2 border-divider">
            <h2 className="text-[16px]">{t.filters}</h2>
            <button type="button" className="btn btn-ghost text-[12px]" onClick={() => setF(DEFAULTS)}>
              {t.reset}
            </button>
          </div>
          <div className="p-3.5 flex flex-col gap-3.5 lg:max-h-[calc(100vh-168px)] lg:overflow-auto">
            <div className="field">
              <label>{t.fWhere}</label>
              <input className="input" type="text" value={f.q} placeholder={t.fWherePh} onChange={(e) => set("q", e.target.value)} />
            </div>
            <div className="field">
              <label>{t.fCountry}</label>
              <select className="input" value={f.country} onChange={(e) => set("country", e.target.value)}>
                {countryOpts.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>
                {t.fPrice} {money(f.price)}
              </label>
              <input
                type="range"
                min={15000}
                max={80000}
                step={1000}
                value={f.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="field">
                <label>{t.fDuration}</label>
                <select className="input" value={f.dur} onChange={(e) => set("dur", e.target.value)}>
                  <option value="any">{t.any}</option>
                  <option value="short">{L({ th: "3–4 วัน", en: "3–4 days" })}</option>
                  <option value="mid">{L({ th: "5–6 วัน", en: "5–6 days" })}</option>
                  <option value="long">{L({ th: "7–9 วัน", en: "7–9 days" })}</option>
                  <option value="xl">{L({ th: "10+", en: "10+" })}</option>
                </select>
              </div>
              <div className="field">
                <label>{t.fAirlineType}</label>
                <select className="input" value={f.air} onChange={(e) => set("air", e.target.value)}>
                  <option value="any">{t.any}</option>
                  <option value="full">{t.fullService}</option>
                  <option value="low">{t.lowCost}</option>
                </select>
              </div>
              <div className="field">
                <label>{t.fHotel}</label>
                <select className="input" value={f.hotel} onChange={(e) => set("hotel", e.target.value)}>
                  <option value="any">{t.any}</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="field">
                <label>{t.fAgency}</label>
                <select className="input" value={String(f.trust)} onChange={(e) => set("trust", Number(e.target.value))}>
                  <option value="0">{t.any}</option>
                  <option value="80">80+</option>
                  <option value="90">90+</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>{t.fType}</label>
              <select className="input" value={f.type} onChange={(e) => set("type", e.target.value)}>
                <option value="any">{L({ th: "ทุกประเภท", en: "All types" })}</option>
                {["family", "elderly", "honeymoon", "luxury", "budget", "adventure", "food"].map((v) => (
                  <option key={v} value={v}>
                    {tagLabel(v, t, L)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 border-t-2 border-divider pt-3">
              <div className="text-[11px] tracking-[0.08em] uppercase font-extrabold text-neutral-700">{t.fFlags}</div>
              {flagOpts.map((fl) => (
                <label key={fl.v} className="radio items-start leading-[1.3]">
                  <input
                    type="checkbox"
                    checked={fl.on}
                    onChange={() => set("flags", fl.on ? f.flags.filter((x) => x !== fl.v) : [...f.flags, fl.v])}
                  />
                  <span className="dot rounded-none mt-[1px]" />
                  <span className="text-[13px]">{fl.label}</span>
                </label>
              ))}
            </div>
            <button type="button" className="btn btn-primary w-full lg:hidden" onClick={() => setFiltersOpen(false)}>
              {results.length} {t.resultsIn}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex flex-col gap-3">
          {results.length > 0 ? (
            results.map((p) => <PackageRow key={p.id} p={p} />)
          ) : (
            <div className="border-2 border-divider px-6 py-10">
              <h3 className="mb-1.5">{t.noResults}</h3>
              <p className="mb-3.5 text-sm text-neutral-700">{t.noResultsSub}</p>
              <button type="button" className="btn btn-primary" onClick={() => setF(DEFAULTS)}>
                {t.reset}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
