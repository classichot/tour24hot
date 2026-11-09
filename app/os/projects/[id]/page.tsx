"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { money } from "@/lib/os/engines";
import { OS_TODAY, PHASE_LABEL, STREAMS, STREAM_LABEL, buildProjects, daysFromToday, memberById, type Project, type RiskItem } from "@/lib/os/projects";
import { Avatar, HealthPill, PC, PhaseStepper, Progress, SectionTitle, TaskRow, dueLabel } from "@/components/os/projects/bits";

const DAY = 86400000;
const ts = (iso: string) => Date.parse(iso.slice(0, 10));

function Gantt({ p }: { p: Project }) {
  const { L, lang } = useApp();
  const dates = [...p.milestones.map((m) => m.due), p.dateStart, p.dateEnd, OS_TODAY].map(ts);
  const start = Math.min(...dates) - 3 * DAY;
  const end = Math.max(...dates) + 3 * DAY;
  const pct = (iso: string) => ((ts(iso) - start) / (end - start)) * 100;
  const weeks: number[] = [];
  for (let t = start; t <= end; t += 7 * DAY) weeks.push(t);
  const ms = p.milestones.slice().sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="overflow-x-auto border border-divider">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[280px_minmax(0,1fr)] border-b border-divider bg-[#f7f6f5] text-[11px] text-neutral-700">
          <div className="px-4 py-2 font-extrabold">{L(PC.milestone)}</div>
          <div className="relative h-8">
            {weeks.map((w) => (
              <span key={w} className="absolute top-2 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((w - start) / (end - start)) * 100}%` }}>
                {new Date(w).toISOString().slice(5, 10).replace("-", "/")}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          {/* trip window and today line span every row */}
          <div className="pointer-events-none absolute inset-y-0 left-[280px] right-0">
            <div
              className="absolute inset-y-0 bg-accent-100"
              style={{ left: `${pct(p.dateStart)}%`, width: `${Math.max(0.6, pct(p.dateEnd) - pct(p.dateStart))}%` }}
              title={`${p.dateStart} → ${p.dateEnd}`}
            />
            <div className="absolute inset-y-0 w-0 border-l-2 border-dashed border-text" style={{ left: `${pct(OS_TODAY)}%` }}>
              <span className="absolute -top-0 left-1 bg-text px-1 text-[10px] font-extrabold text-bg">{L(PC.today)}</span>
            </div>
          </div>
          {ms.map((m) => {
            const late = !m.done && daysFromToday(m.due) < 0;
            const soon = !m.done && !late && daysFromToday(m.due) <= 3;
            return (
              <div key={m.id} className="relative grid grid-cols-[280px_minmax(0,1fr)] border-b border-divider last:border-b-0">
                <div className="bg-white px-4 py-2.5">
                  <div className={`text-[13px] ${m.done ? "text-neutral-600" : "font-semibold"}`}>{L(m.title)}</div>
                  <div className={`text-[11px] ${late ? "font-extrabold text-accent-800" : "text-neutral-600"}`}>
                    {L(PHASE_LABEL[m.phase])} · {dueLabel(m.due, lang)}
                  </div>
                </div>
                <div className="relative">
                  <span
                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 ${
                      m.done ? "border-text bg-text" : late ? "border-accent-700 bg-accent-700" : soon ? "border-[#f2b01e] bg-[#f2b01e]" : "border-text bg-white"
                    }`}
                    style={{ left: `${pct(m.due)}%` }}
                    aria-label={`${L(m.title)} ${m.due}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const IMPACT: Record<RiskItem["impact"], { l: typeof PC.high; cls: string }> = {
  high: { l: PC.high, cls: "bg-text text-bg" },
  medium: { l: PC.medium, cls: "bg-accent-100 text-accent-800" },
  low: { l: PC.low, cls: "bg-surface text-neutral-800" },
};
const RSTATUS: Record<RiskItem["status"], typeof PC.rOpen> = { open: PC.rOpen, watch: PC.rWatch, closed: PC.rClosed };

export default function ProjectDetailPage() {
  const { L } = useApp();
  const { snap, ticks } = useOs();
  const params = useParams();
  const projects = useMemo(() => buildProjects(snap, ticks), [snap, ticks]);
  const p = projects.find((x) => x.id === String(params.id));

  if (!p) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-[32px]">{L(PC.notFound)}</h1>
        <Link href="/os/projects">← {L(PC.back)}</Link>
      </main>
    );
  }

  const cost = p.committed + p.exposure;
  const variance = p.forecastMargin - p.marginTarget;
  const share = (n: number) => (p.sell ? Math.max(0, (n / p.sell) * 100) : 0);
  const streams = STREAMS.filter((s) => p.allTasks.some((x) => x.stream === s));
  const owner = memberById(p.owner);

  return (
    <main className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <Link href="/os/projects" className="text-[13px] no-underline">
          ← {L(PC.back)}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="kicker">
              <span className="font-mono">{p.code}</span> · {L(p.market)}
            </div>
            <h1 className="mt-1 text-[clamp(30px,3.6vw,46px)] tracking-[-0.02em]">{L(p.title)}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-neutral-800">
              <span className="font-extrabold">{L(p.client)}</span>
              <span>
                {p.dateStart} → {p.dateEnd}
              </span>
              <span>{p.pax} pax</span>
              <span className="inline-flex items-center gap-1.5">
                <Avatar id={p.owner} size={20} /> {owner?.name}
              </span>
              <HealthPill h={p.health} />
            </div>
          </div>
          {p.departureId && (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <Link href={`/os/departures/${p.departureId}`} className="btn btn-primary no-underline">
                {L(PC.openDeparture)}
              </Link>
              <span className="max-w-[300px] text-[12px] text-neutral-700 sm:text-right">{L(PC.liveLinked)}</span>
            </div>
          )}
        </div>
        <PhaseStepper phase={p.phase} />
        <div className="max-w-[420px]">
          <Progress pct={p.progress} />
        </div>
      </header>

      <section>
        <SectionTitle>{L(PC.schedule)}</SectionTitle>
        <Gantt p={p} />
      </section>

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section>
          <SectionTitle>{L(PC.wbs)}</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            {streams.map((s) => {
              const list = p.allTasks.filter((x) => x.stream === s);
              return (
                <div key={s} className="border border-divider">
                  <div className="flex items-center justify-between border-b border-divider bg-[#f7f6f5] px-4 py-2 text-[12px] font-extrabold">
                    <span>{L(STREAM_LABEL[s])}</span>
                    <span className="font-normal text-neutral-600">
                      {list.filter((x) => x.done).length}/{list.length}
                    </span>
                  </div>
                  <ul className="m-0 list-none p-0">
                    {list.map((x) => (
                      <TaskRow key={x.id} task={x} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle>{L(PC.budget)}</SectionTitle>
          <div className="border border-divider">
            <dl className="m-0 grid grid-cols-2">
              {[
                { k: PC.sell, v: money(p.sell) },
                { k: PC.committed, v: money(p.committed) },
                { k: PC.exposure, v: money(p.exposure) },
                { k: PC.forecast, v: cost ? `${p.forecastMargin.toFixed(1)}%` : "—" },
              ].map((r, i) => (
                <div key={r.k.en} className={`border-divider px-4 py-3 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t" : ""}`}>
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-neutral-600">{L(r.k)}</dt>
                  <dd className="os-kpi m-0 mt-1">{r.v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-divider px-4 py-3">
              <div className="flex items-baseline justify-between text-[13px]">
                <span>
                  {L(PC.target)} {p.marginTarget}%
                </span>
                {cost > 0 && (
                  <span className={`font-extrabold ${variance < 0 ? "text-accent-800" : ""}`}>
                    {L(PC.variance)} {variance >= 0 ? "+" : ""}
                    {variance.toFixed(1)} pp
                  </span>
                )}
              </div>
              {p.sell > 0 && (
                <>
                  <div className="mt-3 text-[11px] uppercase tracking-[0.06em] text-neutral-600">{L(PC.costSplit)}</div>
                  <div className="mt-1.5 flex h-3 w-full overflow-hidden bg-surface" aria-hidden>
                    <div className="h-full bg-text" style={{ width: `${share(p.committed)}%` }} />
                    <div className="h-full bg-[#f2b01e]" style={{ width: `${share(p.exposure)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-700">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 bg-text" /> {L(PC.committed)} {share(p.committed).toFixed(0)}%
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 bg-[#f2b01e]" /> {L(PC.exposure)} {share(p.exposure).toFixed(0)}%
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 bg-surface border border-divider" /> {L(PC.marginLeft)} {Math.max(0, 100 - share(cost)).toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <section>
        <SectionTitle>{L(PC.risks)}</SectionTitle>
        {p.risks.length ? (
          <div className="overflow-x-auto border border-divider">
            <table className="w-full min-w-[820px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left">
                  {[PC.risks, PC.impact, PC.mitigation, PC.colOwner, PC.status].map((h) => (
                    <th key={h.en} className="whitespace-nowrap border-b border-divider px-4 py-2.5 font-extrabold">
                      {L(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.risks.map((r) => (
                  <tr key={r.id} className="border-b border-divider align-top last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{L(r.title)}</td>
                    <td className="px-4 py-3">
                      <span className={`tag text-[10px] font-extrabold uppercase ${IMPACT[r.impact].cls}`}>{L(IMPACT[r.impact].l)}</span>
                    </td>
                    <td className="px-4 py-3">{L(r.mitigation)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <Avatar id={r.owner} size={20} /> {memberById(r.owner)?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">{L(RSTATUS[r.status])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-divider px-4 py-3 text-[13px] text-neutral-600">{L(PC.noRisks)}</div>
        )}
      </section>

      <section>
        <SectionTitle>{L(PC.changeLog)}</SectionTitle>
        {p.log.length ? (
          <ol className="m-0 list-none border-l-2 border-divider p-0 pl-4">
            {p.log.map((l, i) => (
              <li key={i} className="pb-3 text-[13px]">
                <div className="text-[11px] text-neutral-600">{l.at.slice(0, 16).replace("T", " ")}</div>
                <div>{L(l.text)}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="border border-dashed border-divider px-4 py-3 text-[13px] text-neutral-600">{L(PC.noLog)}</div>
        )}
      </section>
    </main>
  );
}
