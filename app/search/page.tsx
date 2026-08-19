"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DATA, agencyById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { tagLabel } from "@/lib/helpers";
import PackageCard from "@/components/PackageCard";

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

const DEFAULTS: Filters = { q: "", country: "any", dur: "any", price: 80000, air: "any", hotel: "any", type: "any", trust: 0, flags: [] };

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

  // Seed filters from URL (?q= &country= &price= &flag= &dur=)
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
    // Deliberate one-time seed from the URL (external system).
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

  const opt = (v: string, th: string, en: string) => ({ v, label: L({ th, en }) });
  const flagOpts = ["noshop", "freeday", "direct", "smallgroup", "confirmed"].map((v) => ({
    v,
    on: f.flags.includes(v),
    label: v === "confirmed" ? t.confirmedOnly : tagLabel(v, t, L),
  }));

  const countryOpts = [
    opt("any", "ทุกประเทศ", "All countries"),
    ...DATA.destinations
      .filter((d) => DATA.packages.some((p) => p.country.en === d.name.en))
      .map((d) => ({ v: d.name.en, label: L(d.name) })),
  ];

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-[90px]">
      <div className="flex items-end justify-between gap-4 flex-wrap pt-[22px] pb-3 border-b-2 border-divider">
        <div>
          <div className="kicker">{t.navSearch}</div>
          <h1 className="mt-1 text-[clamp(26px,3vw,38px)]">
            {results.length} {t.resultsIn}
          </h1>
        </div>
        <div className="field min-w-[210px]">
          <label>{t.sort}</label>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="real">{t.sortReal}</option>
            <option value="price">{t.sortPrice}</option>
            <option value="trust">{t.sortTrust}</option>
            <option value="quality">{t.sortQuality}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-[26px] flex-wrap items-start pt-5">
        <aside className="flex-1 basis-[250px] max-w-[290px] min-w-[230px] flex flex-col gap-4 sticky top-[88px] self-start">
          <div className="flex items-center justify-between border-b-2 border-divider pb-2">
            <h2 className="text-[17px]">{t.filters}</h2>
            <button type="button" className="btn btn-ghost" onClick={() => setF(DEFAULTS)}>
              {t.reset}
            </button>
          </div>
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
              className="w-full"
            />
          </div>
          <div className="field">
            <label>{t.fDuration}</label>
            <select className="input" value={f.dur} onChange={(e) => set("dur", e.target.value)}>
              <option value="any">{L({ th: "ทั้งหมด", en: "Any" })}</option>
              <option value="short">{L({ th: "3–4 วัน", en: "3–4 days" })}</option>
              <option value="mid">{L({ th: "5–6 วัน", en: "5–6 days" })}</option>
              <option value="long">{L({ th: "7–9 วัน", en: "7–9 days" })}</option>
              <option value="xl">{L({ th: "10 วันขึ้นไป", en: "10+ days" })}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.fAirlineType}</label>
            <select className="input" value={f.air} onChange={(e) => set("air", e.target.value)}>
              <option value="any">{L({ th: "ทั้งหมด", en: "Any" })}</option>
              <option value="full">{L({ th: "ฟูลเซอร์วิส", en: "Full service" })}</option>
              <option value="low">{L({ th: "โลว์คอสต์", en: "Low cost" })}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.fHotel}</label>
            <select className="input" value={f.hotel} onChange={(e) => set("hotel", e.target.value)}>
              <option value="any">{L({ th: "ทั้งหมด", en: "Any" })}</option>
              <option value="3">{L({ th: "3 ดาวขึ้นไป", en: "3-star and up" })}</option>
              <option value="4">{L({ th: "4 ดาวขึ้นไป", en: "4-star and up" })}</option>
              <option value="5">{L({ th: "5 ดาว", en: "5-star" })}</option>
            </select>
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
          <div className="field">
            <label>{t.shopScore}</label>
            <select
              className="input"
              value={f.flags.includes("noshop") ? "none" : "any"}
              onChange={(e) => {
                const next = f.flags.filter((x) => x !== "noshop");
                set("flags", e.target.value === "none" ? [...next, "noshop"] : next);
              }}
            >
              <option value="any">{t.any}</option>
              <option value="none">{t.shopNone}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.fAgency}</label>
            <select className="input" value={String(f.trust)} onChange={(e) => set("trust", Number(e.target.value))}>
              <option value="0">{L({ th: "ทั้งหมด", en: "Any" })}</option>
              <option value="80">{L({ th: "80 ขึ้นไป", en: "80 and above" })}</option>
              <option value="90">{L({ th: "90 ขึ้นไป", en: "90 and above" })}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 border-t-2 border-divider pt-3">
            <div className="text-xs text-neutral-700">{t.fFlags}</div>
            {flagOpts.map((fl) => (
              <label key={fl.v} className="radio items-start leading-[1.3]">
                <input
                  type="checkbox"
                  checked={fl.on}
                  onChange={() =>
                    set("flags", fl.on ? f.flags.filter((x) => x !== fl.v) : [...f.flags, fl.v])
                  }
                />
                <span className="dot rounded-none mt-[1px]" />
                <span>{fl.label}</span>
              </label>
            ))}
          </div>
        </aside>

        <div className="flex-[999] basis-[560px] min-w-[300px] grow">
          {results.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
              {results.map((p) => (
                <PackageCard key={p.id} p={p} />
              ))}
            </div>
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
