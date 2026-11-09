"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import type { TrustBand } from "@/lib/ops";
import { NAV, type NavDir, type NavItem } from "@/lib/nav";
import {
  advisorFor,
  agenciesFor,
  agencyName,
  agencyTrust,
  agentStatsFor,
  bookingsFor,
  demandFor,
  groupsFor,
  kpiFor,
  listingsFor,
  needsReview,
  queueFor,
  riskFor,
  sectionSummary,
  ticketsFor,
  type ListingStatus,
} from "@/lib/control";
import { BOOKING_STATUS, CC, GROUP_STATUS, KIND, STATUS } from "./copy";

/** Demo-only action state: key → value, kept in the page. */
export type Marks = Record<string, string>;
export type Mark = (key: string, value: string | null) => void;

/** Section counts with this session's moderation actions applied, so badges drop as work gets done. */
export function liveSummary(item: NavItem, marks: Marks) {
  const base = sectionSummary(item);
  const ls = listingsFor(item);
  if (!ls.length) {
    if (item.kind === "group") return { ...base, pending: groupsFor(item.dir).filter((g) => g.status === "new" && !marks[`g:${g.id}`]).length };
    if (item.kind === "agency") return { ...base, pending: queueFor(item.dir).filter((a) => !marks[`q:${a.id}`]).length };
    return base;
  }
  const pending = ls.filter((l) => {
    const status = (marks[`l:${l.id}`] as ListingStatus | undefined) ?? l.status;
    // An explicit decision (approve / hold / reject) clears the item from the review queue.
    return marks[`l:${l.id}`] ? false : needsReview({ ...l, status });
  }).length;
  return { ...base, pending };
}

export function bandCls(b: TrustBand) {
  if (b === "excellent") return "bg-accent text-text";
  if (b === "good") return "bg-accent-200 text-accent-800";
  if (b === "watch") return "bg-neutral-200 text-neutral-800";
  return "bg-neutral-800 text-bg";
}

function useBandLabel() {
  const { t } = useApp();
  return (b: TrustBand) => (b === "excellent" ? t.adExcellent : b === "good" ? t.adGood : b === "watch" ? t.adWatch : t.adHighRisk);
}

function Chip({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.04em] ${cls}`}>{children}</span>;
}

const th = "px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.06em] text-neutral-700 whitespace-nowrap";
const td = "px-4 py-3 align-top";
const smallBtn = "btn px-2.5 py-1 text-[12px]";

function Table({ heads, min = 760, children }: { heads: React.ReactNode[]; min?: number; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border-2 border-divider bg-bg">
      <table className="w-full border-collapse text-[14px]" style={{ minWidth: min }}>
        <thead className="bg-surface">
          <tr>
            {heads.map((h, i) => (
              <th key={i} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-divider">{children}</tbody>
      </table>
    </div>
  );
}

function Stats({ items }: { items: { v: string; l: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px border-2 border-text bg-divider md:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="min-w-0 bg-bg px-4 py-4 sm:px-5">
          <div className="truncate font-[family-name:var(--font-heading)] text-[21px] font-extrabold leading-none tracking-[-0.02em] sm:text-[26px]">{s.v}</div>
          <div className="mt-1.5 text-[12px] text-neutral-700">{s.l}</div>
        </div>
      ))}
    </div>
  );
}

function SectionHead({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  const { L } = useApp();
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[24px]">{title}</h2>
        {sub && <p className="mt-1 text-[13px] text-neutral-700">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="btn btn-secondary no-underline text-[13px]">
          {L(CC.openPage)} ↗
        </Link>
      )}
    </div>
  );
}

/* ── Overview ── */

export function OverviewView({ dir, open, marks, mark }: { dir: NavDir; open: (id: string) => void; marks: Marks; mark: Mark }) {
  const { t, L, money } = useApp();
  const bandLabel = useBandLabel();
  const kpi = kpiFor(dir);
  const listed = NAV[dir].filter((n) => listingsFor(n).length);
  const live = listed.flatMap((n) => listingsFor(n)).filter((l) => ((marks[`l:${l.id}`] as ListingStatus | undefined) ?? l.status) === "live").length;
  const toReview = listed.reduce((sum, n) => sum + liveSummary(n, marks).pending, 0);
  const tiles = [
    { v: money(kpi.gmv), l: t.adGmv },
    { v: kpi.bookings.toLocaleString("en-US"), l: t.adBookings },
    { v: `${kpi.conversion}%`, l: t.adConv },
    { v: String(live), l: L(CC.liveListings) },
    { v: String(toReview), l: L(CC.toReviewKpi) },
    { v: String(ticketsFor(dir).length), l: t.adDisputes },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-px border-2 border-text bg-divider md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((s, i) => (
          <div key={i} className="min-w-0 bg-bg px-4 py-4 sm:px-5">
            <div className="truncate font-[family-name:var(--font-heading)] text-[19px] font-extrabold leading-none tracking-[-0.02em] sm:text-[22px]">{s.v}</div>
            <div className="mt-1.5 text-[12px] text-neutral-700">{s.l}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-[21px]">{L(CC.menuGroup)}</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          {NAV[dir].map((n) => {
            const s = liveSummary(n, marks);
            return (
              <article key={n.id} className="flex flex-col gap-2 border-2 border-divider bg-bg px-4 py-4 transition-colors hover:border-text">
                <div className="flex items-start justify-between gap-2">
                  <span className="microlabel">{L(KIND[n.kind].tag)}</span>
                  {s.pending > 0 && <Chip cls="bg-accent-700 text-bg">{s.pending} {L(CC.toReview)}</Chip>}
                </div>
                <h3 className="text-[18px] leading-tight">{t[n.label]}</h3>
                <div className="text-[13px] text-neutral-700">
                  <span className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold text-text">{s.total.toLocaleString("en-US")}</span> {L(KIND[n.kind].unit)}
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  <button type="button" className={`${smallBtn} btn-primary`} onClick={() => open(n.id)}>
                    {L(CC.manage)}
                  </button>
                  <Link href={n.href} className={`${smallBtn} btn-secondary no-underline`}>
                    {L(CC.openPage)} ↗
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <QueueList dir={dir} marks={marks} mark={mark} />
        <section>
          <h2 className="mb-3 text-[18px]">{t.adRisk}</h2>
          <div className="flex flex-col border-2 border-divider">
            {riskFor(dir).map((r, i) => (
              <div key={r.id} className={`px-4 py-3 ${i ? "border-t border-divider" : ""}`}>
                <Chip cls={bandCls(r.level)}>{bandLabel(r.level)}</Chip>
                <div className="mt-1.5 text-[14px] font-extrabold">{L(r.title)}</div>
                <p className="mt-0.5 text-[13px] text-neutral-800">{L(r.body)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QueueList({ dir, marks, mark }: { dir: NavDir; marks: Marks; mark: Mark }) {
  const { t, L } = useApp();
  const q = queueFor(dir);
  return (
    <section>
      <h2 className="mb-3 text-[18px]">{t.adPendingAg}</h2>
      <div className="flex flex-col border-2 border-divider">
        {q.map((a, i) => {
          const m = marks[`q:${a.id}`];
          return (
            <div key={a.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${i ? "border-t border-divider" : ""}`}>
              <div>
                <div className="text-[14px] font-extrabold">{L(a.name)}</div>
                <div className="text-[12px] text-neutral-700">
                  {a.licence} · {L(a.stage)}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" className={`${smallBtn} btn-primary`} onClick={() => mark(`q:${a.id}`, m === "ok" ? null : "ok")} aria-pressed={m === "ok"}>
                  {m === "ok" ? "✓ " : ""}
                  {t.adApprove}
                </button>
                <button type="button" className={`${smallBtn} btn-secondary`} onClick={() => mark(`q:${a.id}`, m === "hold" ? null : "hold")} aria-pressed={m === "hold"}>
                  {m === "hold" ? "✓ " : ""}
                  {t.adHold}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Section views ── */

export function SectionView({ item, marks, mark }: { item: NavItem; marks: Marks; mark: Mark }) {
  const { t, L } = useApp();
  const title = t[item.label];
  const sub = L(KIND[item.kind].tag);
  switch (item.kind) {
    case "catalog":
    case "daytour":
    case "excursion":
    case "attraction":
    case "deals":
      return (
        <>
          <SectionHead title={title} sub={sub} href={item.href} />
          <ListingsTable item={item} marks={marks} mark={mark} />
        </>
      );
    case "advisor":
      return (
        <>
          <SectionHead title={title} sub={sub} href={item.href} />
          <AdvisorView dir={item.dir} />
        </>
      );
    case "agents":
      return (
        <>
          <SectionHead title={title} sub={sub} href={item.href} />
          <AgentsView dir={item.dir} />
        </>
      );
    case "group":
      return (
        <>
          <SectionHead title={title} sub={sub} href={item.href} />
          <GroupView dir={item.dir} marks={marks} mark={mark} />
        </>
      );
    case "trips":
      return (
        <>
          <SectionHead title={title} sub={sub} href={item.href} />
          <TripsView dir={item.dir} />
        </>
      );
    case "agency":
      return (
        <>
          <SectionHead title={title} sub={sub} href={item.href} />
          <AgencyView dir={item.dir} marks={marks} mark={mark} />
        </>
      );
  }
}

function ListingsTable({ item, marks, mark }: { item: NavItem; marks: Marks; mark: Mark }) {
  const { t, L, money } = useApp();
  const rows = listingsFor(item);
  if (!rows.length) return <p className="border-2 border-divider px-5 py-8 text-[14px] text-neutral-700">{L(CC.none)}</p>;
  return (
    <Table heads={[L(CC.listing), t.cAgency, t.realTotal, t.adFlag, t.bkStatus, t.bkAction]} min={940}>
      {rows.map((l) => {
        const status = (marks[`l:${l.id}`] as ListingStatus | undefined) ?? l.status;
        const featured = !!marks[`f:${l.id}`] && status === "live";
        const st = STATUS[status];
        return (
          <tr key={l.id}>
            <td className={`${td} min-w-[280px]`}>
              <div className="font-extrabold">{L(l.title)}</div>
              {l.note && <div className="mt-0.5 text-[12px] text-neutral-700">{L(l.note)}</div>}
              {l.href && (
                <Link href={l.href} className="text-[12px]">
                  {L(CC.view)} ↗
                </Link>
              )}
            </td>
            <td className={td}>
              <div>{L(agencyName(l.agency))}</div>
              <div className="text-[12px] text-neutral-700">
                {t.trust} {agencyTrust(l.agency)}
              </div>
            </td>
            <td className={`${td} whitespace-nowrap font-extrabold`}>{money(l.real)}</td>
            <td className={td}>{l.flags ? <Chip cls="bg-accent-100 text-accent-800">{l.flags}</Chip> : <span className="text-neutral-500">—</span>}</td>
            <td className={td}>
              <div className="flex flex-col items-start gap-1">
                <Chip cls={st.cls}>{L(st.label)}</Chip>
                {featured && <Chip cls="border border-accent-700 text-accent-700">{L(CC.featured)}</Chip>}
              </div>
            </td>
            <td className={td}>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={`${smallBtn} btn-primary`} onClick={() => mark(`l:${l.id}`, "live")} disabled={status === "live"}>
                  {t.adApprove}
                </button>
                <button type="button" className={`${smallBtn} btn-secondary`} onClick={() => mark(`l:${l.id}`, "held")} disabled={status === "held"}>
                  {t.adHold}
                </button>
                <button type="button" className={`${smallBtn} btn-secondary`} onClick={() => mark(`f:${l.id}`, featured ? null : "1")} aria-pressed={featured} disabled={status !== "live"}>
                  {L(CC.feature)}
                </button>
                <button type="button" className={`${smallBtn} btn-ghost`} onClick={() => mark(`l:${l.id}`, "rejected")} disabled={status === "rejected"}>
                  {t.adReject}
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

function AdvisorView({ dir }: { dir: NavDir }) {
  const { L } = useApp();
  const a = advisorFor(dir);
  return (
    <div className="flex flex-col gap-6">
      <Stats
        items={[
          { v: a.questions.toLocaleString("en-US"), l: L(CC.questions) },
          { v: `${a.aiAnswered}%`, l: L(CC.aiAnswered) },
          { v: a.handoffs.toLocaleString("en-US"), l: `${L(CC.handoffs)} · ${a.openHandoffs} ${L(CC.openHandoffs)}` },
          { v: `${a.replySec} ${L(CC.sec)}`, l: L(CC.reply) },
        ]}
      />
      <div>
        <h3 className="mb-3 text-[17px]">{L(CC.topQuestions)}</h3>
        <Table heads={[L(CC.topQuestions), L(CC.asked), L(CC.booked)]} min={560}>
          {a.top.map((q, i) => (
            <tr key={i}>
              <td className={td}>{L(q.q)}</td>
              <td className={`${td} whitespace-nowrap`}>{q.asked.toLocaleString("en-US")}</td>
              <td className={`${td} whitespace-nowrap font-extrabold`}>{q.booked}%</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}

function AgentsView({ dir }: { dir: NavDir }) {
  const { t, L } = useApp();
  const s = agentStatsFor(dir);
  const rows = demandFor(dir);
  return (
    <div className="flex flex-col gap-6">
      <Stats
        items={[
          { v: s.calls.toLocaleString("en-US"), l: L(CC.agentCalls) },
          { v: String(s.bookings), l: L(CC.agentBookings) },
          { v: String(s.direct), l: L(CC.directOps) },
          { v: rows.reduce((n, d) => n + d.gap, 0).toLocaleString("en-US"), l: t.agntGap },
        ]}
      />
      <div>
        <h3 className="mb-1 text-[17px]">{t.agntDemand}</h3>
        <p className="mb-3 max-w-[680px] text-[13px] text-neutral-700">{t.agntHomeSub}</p>
        <Table heads={[t.fCountry, t.fWhen, t.agntSearches, t.agntSeatPool, t.agntGap, t.agntAction]} min={900}>
          {rows.map((d) => (
            <tr key={d.destination + d.window}>
              <td className={`${td} font-extrabold`}>{d.destination}</td>
              <td className={`${td} text-[13px]`}>
                {d.window}
                <div className="text-neutral-700">
                  {d.budget} · {d.duration}
                </div>
              </td>
              <td className={td}>{d.searches.toLocaleString("en-US")}</td>
              <td className={td}>{d.seats.toLocaleString("en-US")}</td>
              <td className={`${td} font-extrabold text-accent-700`}>{d.gap.toLocaleString("en-US")}</td>
              <td className={`${td} min-w-[260px] text-[13px]`}>{L(d.action)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}

function GroupView({ dir, marks, mark }: { dir: NavDir; marks: Marks; mark: Mark }) {
  const { t, L, money } = useApp();
  return (
    <Table heads={["ID", L(CC.requester), L(CC.destination), L(CC.pax), L(CC.budget), L(CC.when), t.bkStatus, t.bkAction]} min={1000}>
      {groupsFor(dir).map((g) => {
        const m = marks[`g:${g.id}`];
        const status = m === "quoted" ? "quoted" : g.status;
        const st = GROUP_STATUS[status];
        return (
          <tr key={g.id}>
            <td className={`${td} font-mono text-[13px] font-semibold`}>{g.id}</td>
            <td className={`${td} min-w-[200px] font-extrabold`}>{L(g.requester)}</td>
            <td className={`${td} min-w-[180px]`}>{L(g.destination)}</td>
            <td className={td}>{g.pax}</td>
            <td className={`${td} whitespace-nowrap`}>{money(g.budget)}</td>
            <td className={`${td} whitespace-nowrap`}>{L(g.when)}</td>
            <td className={td}>
              <div className="flex flex-col items-start gap-1">
                <Chip cls={st.cls}>{L(st.label)}</Chip>
                {m === "assigned" && <Chip cls="border border-accent-700 text-accent-700">{L(CC.assigned)}</Chip>}
              </div>
            </td>
            <td className={td}>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={`${smallBtn} btn-primary`} onClick={() => mark(`g:${g.id}`, "assigned")} disabled={!!m || status !== "new"}>
                  {L(CC.assign)}
                </button>
                <button type="button" className={`${smallBtn} btn-secondary`} onClick={() => mark(`g:${g.id}`, "quoted")} disabled={status !== "new"}>
                  {L(CC.markQuoted)}
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

function TripsView({ dir }: { dir: NavDir }) {
  const { t, L, money } = useApp();
  const kindLabel = (k: string) => {
    const n = NAV[dir].find((x) => x.kind === k);
    return n ? t[n.label] : k;
  };
  return (
    <Table heads={[t.bkRef, t.bkCustomer, L(CC.bookedItem), L(CC.sectionOf), L(CC.pax), t.bkValue, t.bkStatus]} min={980}>
      {bookingsFor(dir).map((b) => {
        const st = BOOKING_STATUS[b.status];
        return (
          <tr key={b.ref}>
            <td className={`${td} whitespace-nowrap font-mono text-[13px] font-semibold`}>{b.ref}</td>
            <td className={`${td} whitespace-nowrap`}>{L(b.traveler)}</td>
            <td className={`${td} min-w-[240px]`}>
              {b.href ? (
                <Link href={b.href} className="text-text">
                  {L(b.item)}
                </Link>
              ) : (
                L(b.item)
              )}
            </td>
            <td className={`${td} whitespace-nowrap text-[13px] text-neutral-700`}>{kindLabel(b.kind)}</td>
            <td className={td}>{b.pax}</td>
            <td className={`${td} whitespace-nowrap font-extrabold`}>{money(b.value)}</td>
            <td className={td}>
              <Chip cls={st.cls}>{L(st.label)}</Chip>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

function AgencyView({ dir, marks, mark }: { dir: NavDir; marks: Marks; mark: Mark }) {
  const { t, L } = useApp();
  const bandLabel = useBandLabel();
  return (
    <div className="flex flex-col gap-8">
      <Table heads={[L(CC.operators), t.adLicence, t.trust, L(CC.listingsHere), t.apBookings, L(CC.cancelRate), t.bkAction]} min={940}>
        {agenciesFor(dir).map((a) => {
          const m = marks[`a:${a.id}`];
          return (
            <tr key={a.id}>
              <td className={`${td} font-extrabold`}>
                {L(a.name)}
                {m === "suspended" && <div className="text-[12px] font-normal text-accent-800">{t.adSuspend} ✓</div>}
                {m === "watch" && <div className="text-[12px] font-normal text-accent-800">{t.adWatch} ✓</div>}
              </td>
              <td className={`${td} text-[13px]`}>{a.licence}</td>
              <td className={td}>
                <Chip cls={bandCls(a.band)}>
                  {a.trust} · {bandLabel(a.band)}
                </Chip>
              </td>
              <td className={td}>{a.listings}</td>
              <td className={td}>{a.bookings.toLocaleString("en-US")}</td>
              <td className={td}>{a.cancel}%</td>
              <td className={td}>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className={`${smallBtn} btn-secondary`} onClick={() => mark(`a:${a.id}`, m === "watch" ? null : "watch")} aria-pressed={m === "watch"}>
                    {t.adWatch}
                  </button>
                  <button type="button" className={`${smallBtn} btn-ghost`} onClick={() => mark(`a:${a.id}`, m === "suspended" ? null : "suspended")} aria-pressed={m === "suspended"}>
                    {t.adSuspend}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      <QueueList dir={dir} marks={marks} mark={mark} />
    </div>
  );
}

export function RiskView({ dir }: { dir: NavDir }) {
  const { t, L } = useApp();
  const bandLabel = useBandLabel();
  const rows = riskFor(dir);
  return (
    <>
      <SectionHead title={t.adRisk} />
      {rows.length ? (
        <div className="flex flex-col border-2 border-divider">
          {rows.map((r, i) => (
            <div key={r.id} className={`grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${i ? "border-t border-divider" : ""}`}>
              <div>
                <Chip cls={bandCls(r.level)}>{bandLabel(r.level)}</Chip>
                <h3 className="mt-2 text-[17px]">{L(r.title)}</h3>
              </div>
              <p className="text-[14px] text-neutral-800">{L(r.body)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-2 border-divider px-5 py-8 text-[14px] text-neutral-700">{L(CC.noRisk)}</p>
      )}
    </>
  );
}

export function SupportView({ dir }: { dir: NavDir }) {
  const { t, L } = useApp();
  return (
    <>
      <SectionHead title={t.adSupport} />
      <Table heads={["ID", t.adSupport, t.cAgency, L(CC.openFor)]} min={700}>
        {ticketsFor(dir).map((d) => (
          <tr key={d.id}>
            <td className={`${td} font-mono text-[13px] font-semibold`}>{d.id}</td>
            <td className={`${td} min-w-[280px]`}>{L(d.subject)}</td>
            <td className={`${td} whitespace-nowrap`}>{L(d.agency)}</td>
            <td className={`${td} whitespace-nowrap`}>{L(d.age)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
