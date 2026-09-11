"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { agencyById, DATA } from "@/lib/data";
import { useApp } from "@/lib/store";
import { isInbound, matchResults } from "@/lib/helpers";
import ScoreBar from "@/components/ScoreBar";
import { ArrowRight, Check } from "@/components/icons";

export default function MatchPage() {
  const { t, L, money, inboundMode, toggleCompare, inCompare } = useApp();
  const router = useRouter();
  const quiz = DATA.quiz;
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const pool = DATA.packages.filter((p) => isInbound(p) === inboundMode);

  const q = quiz[step];
  const done = step >= quiz.length;
  const results = done ? matchResults(answers, t, L, money, pool) : [];

  const pick = (qid: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
    setStep((s) => s + 1);
  };

  const optBtn = (selected: boolean) =>
    `flex items-center justify-between gap-3 px-3.5 py-[13px] cursor-pointer text-left w-full border-0 font-[family-name:var(--font-heading)] font-extrabold text-[15px] ${
      selected ? "bg-accent text-text" : "bg-bg text-text"
    }`;

  return (
    <main className="max-w-[1000px] mx-auto px-[22px] pb-20">
      <div className="pt-[26px] pb-4 border-b-2 border-divider">
        <div className="kicker">TOUR24 AI</div>
        <h1 className="my-1.5 text-[clamp(28px,3.4vw,44px)] leading-[1.03]">{t.matchTitle}</h1>
        <p className="text-[15px] text-neutral-800 max-w-[560px]">{t.matchSub}</p>
      </div>

      {/* intro */}
      {step < 0 && (
        <div className="pt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 items-start">
          <div className="grid gap-0.5 bg-divider border-2 border-divider">
            {quiz.map((qq, i) => (
              <div key={qq.id} className="bg-bg px-3 py-[9px] flex gap-2.5 text-[13px]">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-accent-700 min-w-[22px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{L(qq.q)}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-3.5 text-sm text-neutral-800">
              {L({
                th: "AI ให้คะแนนจากข้อมูลที่ถูกจัดรูปแบบแล้วของทุกแพ็กเกจ ทั้งราคารวมจริง จังหวะการเดินทาง ร้านช้อป และคะแนนเอเจนซี",
                en: "The AI scores every standardized package on real total cost, pace, shopping stops and agency trust — then tells you why it picked them.",
              })}
            </p>
            <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-primary justify-between min-w-[200px]"
              onClick={() => {
                setStep(0);
                setAnswers({});
              }}
            >
              <span>{t.matchStart}</span>
              <ArrowRight />
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.push(inboundMode ? "/advisor?dir=inbound" : "/advisor?dir=outbound")}>
              {t.navAdvisor}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* quiz */}
      {step >= 0 && !done && q && (
        <div className="pt-6 max-w-[620px]">
          <ScoreBar pct={Math.round((step / quiz.length) * 100)} fill="var(--color-accent)" />
          <div className="mt-3.5 text-[11px] tracking-[0.1em] uppercase font-extrabold text-neutral-700">
            {t.question} {step + 1} / {quiz.length}
          </div>
          <h2 className="my-1.5 text-[clamp(22px,2.8vw,32px)] leading-[1.1]">{L(q.q)}</h2>
          <div className="flex flex-col gap-0.5 bg-divider border-2 border-text">
            {q.opts.map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => pick(q.id, o.v)}
                className={optBtn(answers[q.id] === o.v)}
              >
                <span>{L(o.label)}</span>
                <ArrowRight width={16} height={16} />
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => Math.max(-1, s - 1))}>
              {t.back}
            </button>
          </div>
        </div>
      )}

      {/* results */}
      {done && (
        <div className="pt-6">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
            <h2 className="text-[clamp(22px,2.6vw,30px)]">{t.matchResult}</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep(-1);
                setAnswers({});
              }}
            >
              {t.startOver}
            </button>
          </div>
          <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
            {results.map((m) => (
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
        </div>
      )}
    </main>
  );
}
