"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { useMember } from "@/lib/auth/client";
import { DOCS, INBOX, TEAM, buildProjects, daysFromToday, type DocItem, type InboxItem, type PTask } from "@/lib/os/projects";
import { Stat } from "@/components/os/ui";
import { Avatar, PC, SectionTitle, TaskRow } from "@/components/os/projects/bits";

const KIND = { supplier: PC.kindSupplier, client: PC.kindClient, guide: PC.kindGuide, system: PC.kindSystem } as const;
const DOC_STATUS: Record<DocItem["status"], { l: typeof PC.docDraft; cls: string }> = {
  missing: { l: PC.docMissing, cls: "bg-text text-bg" },
  draft: { l: PC.docDraft, cls: "bg-accent-100 text-accent-800" },
  sent: { l: PC.docSent, cls: "bg-surface text-neutral-800" },
  signed: { l: PC.docSigned, cls: "bg-accent text-text" },
};

export default function WorkspacePage() {
  const { L } = useApp();
  const { o, snap, ticks } = useOs();
  const member = useMember();
  // Default to the signed-in staff member's own queue; any explicit pick wins.
  const [picked, setWho] = useState<string | null>(null);
  const who = picked ?? (member?.role === "os" && TEAM.some((m) => m.id === member.id) ? member.id : "all");
  const projects = useMemo(() => buildProjects(snap, ticks), [snap, ticks]);
  const codeOf = (id: string) => projects.find((p) => p.id === id)?.code ?? id;
  const live = projects.filter((p) => p.health !== "closed");

  const mine = (owner: string) => who === "all" || owner === who;
  const tasks = live.flatMap((p) => p.allTasks).filter((x) => mine(x.owner));
  const open = tasks.filter((x) => !x.done);
  const buckets: { key: string; label: typeof PC.bucketLate; items: PTask[] }[] = [
    { key: "late", label: PC.bucketLate, items: open.filter((x) => daysFromToday(x.due) < 0) },
    { key: "soon", label: PC.bucketSoon, items: open.filter((x) => daysFromToday(x.due) >= 0 && daysFromToday(x.due) <= 3) },
    { key: "week", label: PC.bucketWeek, items: open.filter((x) => daysFromToday(x.due) > 3 && daysFromToday(x.due) <= 14) },
    { key: "later", label: PC.bucketLater, items: open.filter((x) => daysFromToday(x.due) > 14) },
    { key: "done", label: PC.bucketDone, items: tasks.filter((x) => x.done) },
  ];
  const inbox = INBOX.filter((m) => mine(m.owner));
  const docs = DOCS.filter((d) => mine(d.owner));
  const allOpen = live.flatMap((p) => p.allTasks).filter((x) => !x.done);
  const feed = live
    .flatMap((p) => p.log.map((l) => ({ ...l, code: p.code, pid: p.id })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <main className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="kicker">{L(PC.inboundDesk)}</div>
          <h1 className="mt-1 text-[clamp(36px,4.4vw,56px)] tracking-[-0.03em]">{o.workspace}</h1>
          <p className="mt-3 max-w-[680px] text-[15px] text-neutral-700">{L(PC.wsSub)}</p>
        </div>
        <div className="field min-w-[220px]">
          <label htmlFor="ws-who">{L(PC.viewingAs)}</label>
          <select id="ws-who" className="input bg-white" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="all">{L(PC.wholeTeam)}</option>
            {TEAM.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {L(m.role)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-6 border-y border-divider">
        <Stat n={String(open.length)} l={L(PC.openTasks)} />
        <Stat n={String(open.filter((x) => daysFromToday(x.due) <= 7).length)} l={L(PC.dueWeek)} />
        <Stat n={String(open.filter((x) => daysFromToday(x.due) < 0).length)} l={L(PC.overdue)} />
        <Stat n={String(inbox.length)} l={L(PC.toAnswer)} />
        <Stat n={String(live.length)} l={L(PC.activeGroups)} />
      </div>

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* work queue */}
        <section>
          <SectionTitle>{L(who === "all" ? PC.teamWork : PC.myWork)}</SectionTitle>
          <div className="flex flex-col gap-6">
            {buckets.map((b) =>
              b.key === "done" && !b.items.length ? null : (
                <div key={b.key}>
                  <div className={`mb-1.5 flex items-center gap-2 text-[12px] font-extrabold ${b.key === "late" && b.items.length ? "text-accent-800" : ""}`}>
                    {L(b.label)} <span className="font-normal text-neutral-600">{b.items.length}</span>
                  </div>
                  {b.items.length ? (
                    <ul className={`m-0 list-none border p-0 ${b.key === "late" ? "border-accent-700" : "border-divider"}`}>
                      {b.items.map((x) => (
                        <TaskRow key={x.id} task={x} showProject projectCode={codeOf(x.projectId)} />
                      ))}
                    </ul>
                  ) : (
                    <div className="border border-dashed border-divider px-4 py-2.5 text-[13px] text-neutral-600">{L(PC.nothing)}</div>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        {/* side rail */}
        <aside className="flex flex-col gap-8">
          <section>
            <SectionTitle>{L(PC.team)}</SectionTitle>
            <ul className="m-0 list-none border border-divider p-0">
              {TEAM.map((m) => {
                const n = allOpen.filter((x) => x.owner === m.id).length;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setWho(who === m.id ? "all" : m.id)}
                      aria-pressed={who === m.id}
                      className={`flex w-full cursor-pointer items-center gap-3 border-0 border-t border-divider px-4 py-2.5 text-left first:border-t-0 ${who === m.id ? "bg-accent-100" : "bg-transparent hover:bg-surface"}`}
                    >
                      <Avatar id={m.id} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-extrabold">{m.name}</span>
                        <span className="block truncate text-[12px] text-neutral-700">
                          {L(m.role)} · {m.langs}
                        </span>
                      </span>
                      <span className="text-right text-[12px]">
                        <span className="block font-extrabold tabular-nums">
                          {n} {L(PC.open)}
                        </span>
                        <span className={`block ${m.onDuty ? "text-accent-800" : "text-neutral-600"}`}>{L(m.onDuty ? PC.onDuty : PC.offDuty)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <SectionTitle>
              {L(PC.inbox)} <span className="font-normal">{inbox.length}</span>
            </SectionTitle>
            <ul className="m-0 list-none border border-divider p-0">
              {inbox.length ? (
                inbox.map((m: InboxItem) => (
                  <li key={m.id} className="border-t border-divider px-4 py-3 first:border-t-0">
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="font-extrabold">{m.from}</span>
                      <span className="text-neutral-600">{m.at.slice(5, 16).replace("T", " ").replace("-", "/")}</span>
                    </div>
                    <p className="mt-1 text-[13px]">{L(m.text)}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px]">
                      <span className="tag bg-surface text-[10px] font-extrabold uppercase text-neutral-800">{L(KIND[m.kind])}</span>
                      <Link href={`/os/projects/${m.projectId}`} className="font-mono text-[11px] font-semibold">
                        {codeOf(m.projectId)} →
                      </Link>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-[13px] text-neutral-600">{L(PC.nothing)}</li>
              )}
            </ul>
          </section>

          <section>
            <SectionTitle>{L(PC.docs)}</SectionTitle>
            <ul className="m-0 list-none border border-divider p-0">
              {docs.length ? (
                docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 border-t border-divider px-4 py-2.5 first:border-t-0">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{L(d.name)}</div>
                      <Link href={`/os/projects/${d.projectId}`} className="font-mono text-[11px]">
                        {codeOf(d.projectId)}
                      </Link>
                    </div>
                    <span className={`tag text-[10px] font-extrabold uppercase ${DOC_STATUS[d.status].cls}`}>{L(DOC_STATUS[d.status].l)}</span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-[13px] text-neutral-600">{L(PC.nothing)}</li>
              )}
            </ul>
          </section>

          <section>
            <SectionTitle>{L(PC.activity)}</SectionTitle>
            <ol className="m-0 list-none border-l-2 border-divider p-0 pl-4">
              {feed.map((f, i) => (
                <li key={i} className="pb-3 text-[13px]">
                  <div className="text-[11px] text-neutral-600">
                    {f.at.slice(0, 16).replace("T", " ")} ·{" "}
                    <Link href={`/os/projects/${f.pid}`} className="font-mono">
                      {f.code}
                    </Link>
                  </div>
                  <div>{L(f.text)}</div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
