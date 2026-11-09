"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { money } from "@/lib/os/engines";
import { PHASE_LABEL, PHASES, buildProjects, memberById } from "@/lib/os/projects";
import { Stat } from "@/components/os/ui";
import { Avatar, HealthPill, PC, Progress, SectionTitle, dueLabel } from "@/components/os/projects/bits";

export default function ProjectsPage() {
  const { L, lang } = useApp();
  const { o, snap, ticks } = useOs();
  const projects = useMemo(() => buildProjects(snap, ticks), [snap, ticks]);
  const active = projects.filter((p) => p.health !== "closed");
  const sell = active.reduce((a, p) => a + p.sell, 0);
  const costed = active.filter((p) => p.committed + p.exposure > 0);
  const wMargin = costed.reduce((a, p) => a + p.sell, 0)
    ? (costed.reduce((a, p) => a + (p.sell - p.committed - p.exposure), 0) / costed.reduce((a, p) => a + p.sell, 0)) * 100
    : 0;

  return (
    <main className="flex flex-col gap-10">
      <header>
        <div className="kicker">{L(PC.inboundDesk)}</div>
        <h1 className="mt-1 text-[clamp(36px,4.4vw,56px)] tracking-[-0.03em]">{o.projects}</h1>
        <p className="mt-3 max-w-[700px] text-[15px] text-neutral-700">{L(PC.pjSub)}</p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-6 border-y border-divider">
        <Stat n={String(active.length)} l={L(PC.activeProjects)} />
        <Stat n={String(active.reduce((a, p) => a + p.pax, 0))} l={L(PC.paxInWork)} />
        <Stat n={money(sell)} l={L(PC.sellUnder)} />
        <Stat n={`${wMargin.toFixed(1)}%`} l={L(PC.wMargin)} />
        <Stat n={String(active.filter((p) => p.health === "risk" || p.health === "late").length)} l={L(PC.atRisk)} />
      </div>

      <section>
        <SectionTitle>{L(PC.pipeline)}</SectionTitle>
        <div className="overflow-x-auto">
          <div className="grid min-w-[1050px] grid-cols-7 border border-divider">
            {PHASES.map((ph) => {
              const inPhase = projects.filter((p) => p.phase === ph);
              return (
                <div key={ph} className="min-w-0 border-l border-divider first:border-l-0">
                  <div className="flex items-baseline justify-between gap-2 border-b border-divider bg-[#f7f6f5] px-3 py-2">
                    <span className="truncate text-[12px] font-extrabold">{L(PHASE_LABEL[ph])}</span>
                    <span className="text-[12px] text-neutral-600">{inPhase.length}</span>
                  </div>
                  <div className="flex min-h-[132px] flex-col gap-2 p-2">
                    {inPhase.map((p) => (
                      <Link key={p.id} href={`/os-legacy/projects/${p.id}`} className="block border border-divider bg-white p-2.5 text-text no-underline hover:border-text">
                        <div className="font-mono text-[10px] text-neutral-600">{p.code}</div>
                        <div className="mt-0.5 line-clamp-2 text-[13px] font-extrabold leading-snug">{L(p.title)}</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <HealthPill h={p.health} />
                          <span className="text-[11px] text-neutral-700">{p.pax} pax</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>{L(PC.portfolio)}</SectionTitle>
        <div className="overflow-x-auto border border-divider">
          <table className="w-full min-w-[1100px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left">
                {[PC.colProject, PC.colMarket, PC.colPax, PC.colDates, PC.colPhase, PC.colProgress, PC.colHealth, PC.colNext, PC.colMargin, PC.colOwner].map((h) => (
                  <th key={h.en} className="whitespace-nowrap border-b border-divider px-4 py-2.5 font-extrabold">
                    {L(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const under = p.committed + p.exposure > 0 && p.forecastMargin < p.marginTarget;
                return (
                  <tr key={p.id} className="border-b border-divider align-top hover:bg-[#f7f6f5]">
                    <td className="px-4 py-3">
                      <Link href={`/os-legacy/projects/${p.id}`} className="font-extrabold text-text no-underline hover:underline">
                        {L(p.title)}
                      </Link>
                      <div className="mt-0.5 text-[12px] text-neutral-700">
                        <span className="font-mono">{p.code}</span> · {L(p.client)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{L(p.market)}</td>
                    <td className="px-4 py-3 tabular-nums">{p.pax}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {p.dateStart.slice(5).replace("-", "/")} → {p.dateEnd.slice(5).replace("-", "/")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{L(PHASE_LABEL[p.phase])}</td>
                    <td className="min-w-[130px] px-4 py-3">
                      <Progress pct={p.progress} />
                    </td>
                    <td className="px-4 py-3">
                      <HealthPill h={p.health} />
                    </td>
                    <td className="px-4 py-3">
                      {p.nextMilestone ? (
                        <>
                          <div>{L(p.nextMilestone.title)}</div>
                          <div className="text-[12px] text-neutral-700">{dueLabel(p.nextMilestone.due, lang)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {p.marginTarget}% →{" "}
                      <span className={under ? "font-extrabold text-accent-800" : "font-extrabold"}>
                        {p.committed + p.exposure > 0 ? `${p.forecastMargin.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <Avatar id={p.owner} />
                        {memberById(p.owner)?.name}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
