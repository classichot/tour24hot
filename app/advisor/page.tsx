"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { advisorResults, isInbound, type AdvisorExtras, type AdvisorFollowUp } from "@/lib/helpers";
import { ArrowRight, Check, Sparkle } from "@/components/icons";

const EXAMPLE = {
  th: "อยากไปญี่ปุ่นเดือนตุลา งบราว 35,000 บาท 5–6 วัน พาพ่อแม่ไป ไม่ชอบลงร้านช้อป",
  en: "I want Japan in October, around ฿35,000, 5–6 days, travelling with my parents. I don't want too much shopping.",
};

type Run = ReturnType<typeof advisorResults>;

export default function AdvisorPage() {
  const { t, L, money, lang, inboundMode, toggleCompare, inCompare } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [picks, setPicks] = useState<AdvisorExtras>({});
  const pool = DATA.packages.filter((p) => isInbound(p) === inboundMode);
  const example = inboundMode
    ? L({
        th: "อยากได้ทัวร์เชียงใหม่ เชียงราย สามเหลี่ยมทองคำ กรุ๊ปจีน ไกด์จีน ไม่ลงร้านช้อป",
        en: "Chiang Mai, Chiang Rai, Golden Triangle inbound group, Chinese guide, no shopping.",
        zh: "想走清迈、清莱、金三角，中文导游，不要进店。",
      })
    : EXAMPLE[lang === "th" ? "th" : "en"];

  const apply = (text: string, extras?: AdvisorExtras) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQ(trimmed);
    setBusy(true);
    window.setTimeout(() => {
      setRun(advisorResults(trimmed, t, L, money, pool, extras));
      setBusy(false);
    }, 550);
  };

  const ask = (text: string) => {
    setPicks({});
    setRun(null);
    apply(text);
  };

  const pickOpt = (fu: AdvisorFollowUp, v: string) => {
    const next: AdvisorExtras = { ...picks, [fu.id]: v === "any" && fu.id === "dest" ? "any" : v };
    setPicks(next);
    const remaining = (run?.followups || []).filter((f) => f.id !== fu.id && next[f.id] === undefined);
    if (remaining.length === 0) apply(q, next);
  };

  return (
    <main className="max-w-[1000px] mx-auto px-[22px] pb-20">
      <div className="pt-[26px] pb-4 border-b-2 border-divider">
        <div className="kicker flex items-center gap-2">
          <Sparkle width={14} height={14} />
          TOUR24 AI
        </div>
        <h1 className="my-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03]">{t.advTitle}</h1>
        <p className="text-[15px] text-neutral-800 max-w-[620px]">{t.advSub}</p>
      </div>

      <div className="pt-6 border-2 border-text p-3.5 flex flex-col gap-2.5">
        <label className="text-xs text-neutral-700">{t.navAdvisor}</label>
        <textarea
          className="input min-h-[110px]"
          value={q}
          placeholder={t.advPh}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn btn-primary justify-between min-w-[180px]" onClick={() => ask(q)} disabled={busy}>
            <span>{busy ? t.advThinking : t.advAsk}</span>
            <ArrowRight />
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => ask(example)}>
            {t.advExample}
          </button>
          <Link href={inboundMode ? "/match?dir=inbound" : "/match?dir=outbound"} className="btn btn-ghost no-underline">
            {t.advQuiz}
          </Link>
        </div>
      </div>

      {run && (
        <section className="pt-8">
          <div className="microlabel mb-2">{t.advParsed}</div>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {run.parse.notes.length === 0 ? (
              <span className="tag tag-neutral">{L({ th: "ค้นจากคลังทั้งหมด", en: "Searching all inventory" })}</span>
            ) : (
              run.parse.notes.map((n) => (
                <span key={n.en} className="tag tag-accent">
                  {L(n)}
                </span>
              ))
            )}
          </div>

          {run.followups.length > 0 && (
            <div className="border-2 border-text p-4 mb-6 flex flex-col gap-4">
              <div>
                <div className="kicker">{t.advClarify}</div>
              </div>
              {run.followups.map((fu) => (
                <div key={fu.id}>
                  <div className="text-[15px] font-extrabold mb-2">{L(fu.q)}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(fu.id === "dest"
                      ? fu.opts.filter((o) => (inboundMode ? o.v === "Thailand" || o.v === "any" : o.v !== "Thailand"))
                      : fu.opts
                    ).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        className={`btn ${picks[fu.id] === o.v || (fu.id === "dest" && picks.dest === o.v) ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => pickOpt(fu, o.v)}
                      >
                        {L(o.label)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-ghost self-start" onClick={() => apply(q, picks)}>
                {t.advSkip}
              </button>
            </div>
          )}

          {run.results.length === 0 && run.followups.length === 0 && (
            <div className="border-2 border-divider px-6 py-10">
              <h3 className="mb-1.5">{t.advEmpty}</h3>
              <Link href={inboundMode ? "/inbound" : "/search?dir=outbound"} className="btn btn-primary no-underline">
                {inboundMode ? t.navInbound : t.navSearch}
              </Link>
            </div>
          )}

          {run.results.length > 0 && (
            <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
              {run.results.map((m) => (
                <div
                  key={m.p.id}
                  className="bg-bg p-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[18px] items-start"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] text-accent-700">
                        {m.score}%
                      </span>
                      <span className="text-[11px] tracking-[0.08em] uppercase text-neutral-700 font-extrabold">
                        {t.matchScore}
                      </span>
                    </div>
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-[19px] leading-[1.15]">
                      {L(m.p.title)}
                    </div>
                    <div className="text-xs text-neutral-700 mt-1">
                      {L(m.p.country)} · {m.p.days} {t.days} · {L(agencyById(m.p.agency).name)}
                    </div>
                    <div className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-accent-700 mt-2">
                      {money(m.p.real)}
                    </div>
                    <div className="text-[11px] text-neutral-700">
                      {t.advertised} {money(m.p.price)} · {t.hiddenCost} {money(m.p.real - m.p.price)}
                    </div>
                    <div className="flex gap-1.5 mt-2.5">
                      <button type="button" className="btn btn-primary" onClick={() => router.push(`/packages/${m.p.id}`)}>
                        {t.viewPackage}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => toggleCompare(m.p.id)}>
                        {inCompare(m.p.id) ? t.inCompare : t.addCompare}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="microlabel mb-1.5">{t.matchWhy}</div>
                    <ul className="m-0 p-0 list-none flex flex-col gap-[5px]">
                      {m.why.map((rs, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-[1.4]">
                          <Check className="flex-none mt-[3px]" stroke="var(--color-accent-700)" width={14} height={14} />
                          <span>{rs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
