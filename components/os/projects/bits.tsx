"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { HEALTH_LABEL, PHASE_LABEL, PHASES, daysFromToday, memberById, type Health, type Phase, type PTask } from "@/lib/os/projects";
import { STREAM_LABEL } from "@/lib/os/projects";
import { useOs } from "@/lib/os/store";
import { PC } from "@/lib/os/projectCopy";

const HEALTH_CLS: Record<Health, string> = {
  ontrack: "bg-accent text-text",
  risk: "bg-accent-100 text-accent-800 border border-accent-700",
  late: "bg-text text-bg",
  closed: "bg-surface text-neutral-700",
};

export function HealthPill({ h }: { h: Health }) {
  const { L } = useApp();
  return <span className={`tag text-[10px] font-extrabold uppercase tracking-[0.06em] ${HEALTH_CLS[h]}`}>{L(HEALTH_LABEL[h])}</span>;
}

export function Progress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-[60px] bg-surface" aria-hidden>
        <div className="h-full bg-text" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-[12px] tabular-nums">{pct}%</span>
    </div>
  );
}

export function Avatar({ id, size = 24 }: { id: string; size?: number }) {
  const m = memberById(id);
  const name = m?.name ?? "?";
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#141312] font-extrabold text-[#f3f2f2]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function PhaseStepper({ phase }: { phase: Phase }) {
  const { L } = useApp();
  const at = PHASES.indexOf(phase);
  return (
    <ol className="m-0 grid list-none grid-cols-7 gap-0 p-0" aria-label="Phase">
      {PHASES.map((p, i) => {
        const done = i < at;
        const cur = i === at;
        return (
          <li key={p} className="min-w-0" aria-current={cur ? "step" : undefined}>
            <div className={`h-1.5 ${done ? "bg-text" : cur ? "bg-[#f2b01e]" : "bg-surface"}`} />
            <div className={`mt-1.5 truncate pr-2 text-[11px] ${cur ? "font-extrabold text-text" : done ? "text-neutral-800" : "text-neutral-600"}`}>
              {L(PHASE_LABEL[p])}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function dueLabel(iso: string, lang: string) {
  const d = daysFromToday(iso);
  const date = iso.slice(5, 10).replace("-", "/");
  if (d === 0) return lang === "th" ? `${date} · วันนี้` : lang === "zh" ? `${date} · 今天` : `${date} · today`;
  if (d < 0) return lang === "th" ? `${date} · เลย ${-d} วัน` : lang === "zh" ? `${date} · 逾期 ${-d} 天` : `${date} · ${-d}d late`;
  return lang === "th" ? `${date} · อีก ${d} วัน` : lang === "zh" ? `${date} · 还有 ${d} 天` : `${date} · in ${d}d`;
}

/** One task row, shared by Workspace and Project control so a tick shows in both. */
export function TaskRow({ task, showProject, projectCode }: { task: PTask; showProject?: boolean; projectCode?: string }) {
  const { L, lang } = useApp();
  const { toggleProjectTask } = useOs();
  const late = !task.done && daysFromToday(task.due) < 0;
  return (
    <li className="flex items-start gap-3 border-t border-divider px-4 py-2.5 first:border-t-0">
      <input
        type="checkbox"
        className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer accent-[#f2b01e]"
        checked={task.done}
        onChange={() => toggleProjectTask(task.id, task.done, task.snapTask)}
        aria-label={L(task.title)}
      />
      <div className="min-w-0 flex-1">
        <div className={`text-[14px] ${task.done ? "text-neutral-600 line-through" : ""}`}>{L(task.title)}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-neutral-700">
          {showProject && projectCode && (
            <Link href={`/os/projects/${task.projectId}`} className="font-mono text-[11px] font-semibold">
              {projectCode}
            </Link>
          )}
          <span>{L(STREAM_LABEL[task.stream])}</span>
          <span className={late ? "font-extrabold text-accent-800" : ""}>{dueLabel(task.due, lang)}</span>
        </div>
      </div>
      <Avatar id={task.owner} />
    </li>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-neutral-600">{children}</h2>
      {aside}
    </div>
  );
}

export { PC };
