"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useIos } from "@/lib/ios/store";
import { useNow } from "@/lib/ios/clock";
import { createTask, updateTask } from "@/lib/ios/domain";
import { COMMERCIAL_LABEL, OPERATIONAL_LABEL, RESERVATION_LABEL, addDays, allServices, can, computeReadiness, customerLabel, daysBetween, effectiveQuoteStatus, fmtDate, fmtDateTime, fmtMargin, fmtMoney, guestCount, memberName, opsChecks, quoteTotals } from "@/lib/ios/rules";
import type { Task, TaskStatus } from "@/lib/ios/types";
import { Badge, Card, Dialog, Empty, Field, PageHeader, Section, btn, inputCls, type Tone } from "@/components/ios/ui";

interface Row {
  key: string;
  tripId: string;
  ref: string;
  who: string;
  item: string;
  due?: string;
  owner: string;
  status: { text: string; tone: Tone };
  action: { label: string; href: string };
}

const STATUS_TONE: Record<TaskStatus, Tone> = { open: "info", in_progress: "info", waiting: "warn", done: "good", cancelled: "neutral" };

export default function TodayPage() {
  const { state, me, today, run } = useIos();
  const nowMs = useNow();
  const [date, setDate] = useState(today);
  const [scope, setScope] = useState<"mine" | "team">(me?.role === "manager" ? "team" : "mine");
  const [resched, setResched] = useState<Task | null>(null);
  const [newDue, setNewDue] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", tripId: "", due: today, ownerId: me?.id ?? "" });

  const tz = state.settings.timezone;
  const dayEnd = `${date}T23:59:59+07:00`;
  const mine = (owner?: string, team?: string) => scope === "team" || owner === me?.id || (!owner && (team === me?.role || (team === "manager" && me?.role === "manager")));

  const data = useMemo(() => {
    const live = state.trips.filter((t) => t.commercial !== "lost" && t.commercial !== "cancelled");
    const exceptions: Row[] = [];
    // Unanswered enquiry: unassigned or first response overdue — one row per trip (TOD02 dedupe).
    for (const t of live.filter((x) => x.commercial === "enquiry")) {
      const task = state.tasks.find((k) => k.ruleKey === `first_response:${t.id}` && k.status !== "done" && k.status !== "cancelled");
      const overdue = !!task && Date.parse(task.due) < nowMs;
      if (!t.ownerId || overdue) {
        if (!mine(t.ownerId, "sales")) continue;
        exceptions.push({
          key: `unanswered:${t.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t), item: !t.ownerId ? "New enquiry, unassigned" : "First response overdue",
          due: task?.due, owner: memberName(state, t.ownerId), status: { text: overdue ? "Overdue" : "Unassigned", tone: overdue ? "bad" : "warn" },
          action: { label: !t.ownerId ? "Assign owner" : "Prepare quotation", href: `/os/trips/${t.id}?tab=overview` },
        });
      }
    }
    // Margin exception and pending approval on open quotes.
    for (const t of live) {
      const q = t.quotes[t.quotes.length - 1];
      if (!q) continue;
      const st = effectiveQuoteStatus(q, today);
      const tot = quoteTotals(q);
      if ((st === "draft" || st === "awaiting_approval") && tot.margin !== null && tot.margin < state.settings.marginThreshold && mine(t.ownerId, "manager")) {
        exceptions.push({
          key: `margin:${q.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t), item: `Quote v${q.number} margin ${fmtMargin(tot.margin)} (threshold ${state.settings.marginThreshold}%)`,
          owner: memberName(state, t.ownerId), status: { text: st === "awaiting_approval" ? "Awaiting approval" : "Below threshold", tone: "warn" },
          action: { label: can(me, "quote.approve") && st === "awaiting_approval" ? "Review and approve" : "Review costs", href: `/os/trips/${t.id}?tab=money` },
        });
      }
      if (st === "expired" && t.commercial === "awaiting" && mine(t.ownerId, "sales")) {
        exceptions.push({
          key: `expired:${q.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t), item: `Quote v${q.number} expired ${fmtDate(q.validUntil)}`,
          owner: memberName(state, t.ownerId), status: { text: "Expired", tone: "bad" }, action: { label: "Revalidate quotation", href: `/os/trips/${t.id}?tab=money` },
        });
      }
    }
    const booked = live.filter((x) => x.commercial === "booked");
    // Urgent incidents first: critical or high and not resolved (OPS06).
    for (const t of booked) {
      for (const i of t.incidents.filter((x) => x.status !== "resolved" && (x.severity === "critical" || x.severity === "high"))) {
        if (!mine(i.ownerId, "ops")) continue;
        exceptions.push({
          key: `inc:${i.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t), item: `Incident: ${i.title}`, due: i.createdAt, owner: memberName(state, i.ownerId),
          status: { text: `${i.severity[0].toUpperCase()}${i.severity.slice(1)} · ${i.status === "in_progress" ? "in progress" : "open"}`, tone: "bad" }, action: { label: "Handle incident", href: `/os/trips/${t.id}?tab=overview#incidents` },
        });
      }
    }
    // Arriving within the readiness window and not ready (company policy).
    for (const t of booked.filter((x) => x.operational === "arranging" && x.startDate)) {
      const hours = daysBetween(date, t.startDate!) * 24;
      if (hours >= 0 && hours <= state.settings.readinessHours && mine(t.opsOwnerId, "ops")) {
        const r = computeReadiness(t, today, state.trips, nowMs);
        const open = r.items.filter((i) => !i.ok);
        const unconfirmed = r.mandatory - r.confirmed;
        exceptions.push({
          key: `ready:${t.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t),
          item: `Arrives ${fmtDate(t.startDate)} — ${r.ready ? "ready to mark" : `${open.length} readiness item${open.length === 1 ? "" : "s"} open`}${unconfirmed > 0 ? ` (${unconfirmed} service${unconfirmed === 1 ? "" : "s"} unconfirmed)` : ""}`,
          due: `${t.startDate}T00:00:00+07:00`, owner: memberName(state, t.opsOwnerId), status: { text: "Not ready", tone: "bad" },
          action: { label: unconfirmed > 0 ? "Arrange services" : "Review readiness", href: `/os/trips/${t.id}?tab=${unconfirmed > 0 ? "bookings" : "overview"}` },
        });
      }
    }
    // Reservation exceptions: holds about to lapse, replies to review, outdated requests, overlaps, silent suppliers (OPS02-05).
    for (const t of booked.filter((x) => x.operational !== "completed")) {
      if (!mine(t.opsOwnerId, "ops")) continue;
      for (const c of opsChecks(t, state.trips, nowMs).filter((x) => /^(hold|disc|spec|overlap):/.test(x.key))) {
        const kind = c.key.split(":")[0];
        exceptions.push({
          key: `ops:${t.id}:${c.key}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t), item: c.text, owner: memberName(state, t.opsOwnerId),
          status: { text: kind === "hold" ? "Hold expiring" : kind === "disc" ? "Reply differs" : kind === "spec" ? "Request outdated" : "Possible clash", tone: kind === "hold" ? "bad" : "warn" },
          action: { label: "Open bookings", href: `/os/trips/${t.id}?tab=bookings${c.serviceId ? `#svc-${c.serviceId}` : ""}` },
        });
      }
      for (const r of t.reservations.filter((x) => x.active && x.status === "requested")) {
        const sent = r.events.find((e) => e.type === "requested");
        if (!sent || !nowMs || nowMs - Date.parse(sent.at) < 48 * 3600000) continue;
        const svc = allServices(t).find((x) => x.s.id === r.serviceId)?.s;
        exceptions.push({
          key: `silent:${r.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t),
          item: `${svc?.name ?? "Service"}: no reply from ${state.companies.find((c) => c.id === r.supplierId)?.name ?? "supplier"} since ${fmtDateTime(sent.at, tz)}`,
          owner: memberName(state, t.opsOwnerId), status: { text: "Missing confirmation", tone: "warn" }, action: { label: "Chase supplier", href: `/os/trips/${t.id}?tab=bookings#svc-${r.serviceId}` },
        });
      }
    }
    const arrivals = live.filter((t) => t.commercial === "booked" && (t.startDate === date || t.endDate === date));
    // Daily operations list: every service running on the selected date, across trips (OPS05).
    const services = booked
      .flatMap((t) =>
        allServices(t)
          .filter(({ s, date: d }) => d === date || (!!s.spec.checkIn && !!s.spec.checkOut && s.spec.checkIn <= date && date < s.spec.checkOut))
          .map(({ s }) => ({ t, s, r: t.reservations.find((x) => x.serviceId === s.id && x.active && !["cancelled", "declined", "expired"].includes(x.status)) }))
      )
      .sort((a, b) => (a.s.start ?? "99").localeCompare(b.s.start ?? "99"));
    const tasks = state.tasks
      .filter((k) => (k.status === "open" || k.status === "in_progress" || k.status === "waiting") && Date.parse(k.due) <= Date.parse(dayEnd) && mine(k.ownerId, k.team))
      .filter((k) => !exceptions.some((e) => e.key === `unanswered:${k.tripId}` && k.type === "first_response"))
      .sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
    const followUps = live.filter((t) => t.commercial === "awaiting" && t.qual.nextFollowUp && t.qual.nextFollowUp <= date && mine(t.ownerId, "sales"));
    const pipeline = (["enquiry", "quoting", "awaiting", "booked"] as const).map((s) => {
      const ts = live.filter((t) => t.commercial === s);
      const value = ts.reduce((a, t) => {
        const q = [...t.quotes].reverse().find((x) => x.status !== "superseded" && x.status !== "declined");
        return a + (q ? quoteTotals(q).revenue : 0);
      }, 0);
      return { s, n: ts.length, value };
    });
    return { exceptions, arrivals, services, tasks, followUps, pipeline };
  }, [state, today, date, scope, me, nowMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const tripRef = (id?: string) => state.trips.find((t) => t.id === id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        kicker={`${state.settings.companyName} · ${tz}`}
        title="Today"
        sub={`${fmtDate(date)} · ${data.exceptions.length} exception${data.exceptions.length === 1 ? "" : "s"}, ${data.tasks.length} task${data.tasks.length === 1 ? "" : "s"} due`}
        actions={
          <>
            <div role="group" aria-label="Scope" className="inline-flex rounded-[4px] border border-[#c9c5c1] bg-white p-0.5">
              {(["mine", "team"] as const).map((s) => (
                <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)} className={`cursor-pointer rounded-[3px] border-0 px-3 py-1.5 text-[15px] font-semibold ${scope === s ? "bg-[#201e1d] text-white" : "bg-transparent text-[#3b3836]"}`}>
                  {s === "mine" ? "My work" : "Team work"}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="today-date">Date</label>
            <input id="today-date" type="date" className={`${inputCls} w-auto`} value={date} onChange={(e) => setDate(e.target.value || today)} />
            {date !== today && (
              <button type="button" className={btn.ghost} onClick={() => setDate(today)}>
                Back to today
              </button>
            )}
          </>
        }
      />

      {!state.trips.length && (
        <Empty title="Create your first enquiry" body="Paste a customer message, upload a brief or type the details. Suppliers can be added any time in Partners." action={<Link href="/os/sales/new" className={btn.primary}>New enquiry</Link>} />
      )}

      <Section title={<>Urgent exceptions <span className="text-[16px] font-semibold text-[#6b6764]">({data.exceptions.length})</span></>}>
        {data.exceptions.length ? <Rows rows={data.exceptions} tz={tz} /> : <Empty title="No exceptions" body="Nothing is overdue, unassigned, below margin or arriving unconfirmed in this scope." />}
      </Section>

      <Section title={<>Arrivals and departures · {fmtDate(date)} <span className="text-[16px] font-semibold text-[#6b6764]">({data.arrivals.length})</span></>}>
        {data.arrivals.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.arrivals.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] text-[#6b6764]">{t.ref} · {customerLabel(state, t)}</div>
                    <div className="text-[18px] font-bold">{t.name}</div>
                  </div>
                  <Badge tone={t.startDate === date ? "info" : "neutral"}>{t.startDate === date ? "Arriving" : "Departing"}</Badge>
                </div>
                <div className="mt-2 text-[15px]">
                  {guestCount(t)} guests · {t.startDate === date ? t.arrival || "Arrival details not recorded" : t.departure || "Departure details not recorded"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={t.operational === "ready" || t.operational === "in_progress" ? "good" : t.operational === "arranging" ? "bad" : "neutral"}>{OPERATIONAL_LABEL[t.operational]}</Badge>
                  <span className="text-[14px] text-[#5b5754]">Operations: {memberName(state, t.opsOwnerId)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/os/trips/${t.id}?tab=overview#readiness`} className={btn.secondary}>
                    {t.operational === "ready" && t.startDate === date ? "Start trip" : `View ${t.startDate === date ? "arrival" : "departure"} readiness`}
                  </Link>
                  {(() => {
                    const rs = t.documents.find((d) => d.type === "runsheet" && d.status === "issued");
                    return rs ? <Link href={`/os/trips/${t.id}/print/doc/${rs.id}`} target="_blank" className={btn.ghost}>Run sheet</Link> : null;
                  })()}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty title="No arrivals or departures on this date" />
        )}
      </Section>

      {(can(me, "reservation.manage") || me?.role === "manager") && (
        <Section title={<>Services running · {fmtDate(date)} <span className="text-[16px] font-semibold text-[#6b6764]">({data.services.length})</span></>}>
          {data.services.length ? (
            <Card className="relative overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[15px]">
                <thead>
                  <tr className="bg-[#fbfaf9] text-left text-[13px] font-bold uppercase tracking-[0.05em] text-[#6b6764]">
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-2 py-2.5">Service</th>
                    <th className="px-2 py-2.5">Trip</th>
                    <th className="px-2 py-2.5">Supplier</th>
                    <th className="px-2 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.map(({ t, s, r }) => (
                    <tr key={`${t.id}:${s.id}`} className="border-t border-[#ebe8e5] align-top">
                      <td className="whitespace-nowrap px-4 py-2.5">{s.start ?? "—"}{s.end ? `–${s.end}` : ""}</td>
                      <td className="px-2 py-2.5">
                        <Link href={`/os/trips/${t.id}?tab=bookings#svc-${s.id}`} className="font-semibold">{s.name}</Link>
                        {s.location && <div className="text-[14px] text-[#6b6764]">{s.location}</div>}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="font-mono text-[14px]">{t.ref}</span>
                        <div className="text-[14px] text-[#6b6764]">{guestCount(t)} guests · {OPERATIONAL_LABEL[t.operational]}</div>
                      </td>
                      <td className="px-2 py-2.5">
                        {state.companies.find((c) => c.id === (r?.supplierId ?? s.supplierId))?.name ?? "—"}
                        {r?.confirmation && <div className="text-[14px] text-[#6b6764]">Ref {r.confirmation.ref}</div>}
                      </td>
                      <td className="px-2 py-2.5"><Badge tone={r?.status === "confirmed" ? "good" : r ? "warn" : "bad"}>{r ? RESERVATION_LABEL[r.status] : "Not requested"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Empty title="No services running on this date" />
          )}
        </Section>
      )}

      <Section
        title={<>Tasks due by {fmtDate(date)} <span className="text-[16px] font-semibold text-[#6b6764]">({data.tasks.length})</span></>}
        actions={can(me, "task.manage") ? <button type="button" className={btn.secondary} onClick={() => { setDraft({ title: "", tripId: "", due: date, ownerId: me?.id ?? "" }); setErr(""); setAdding(true); }}>Add task</button> : undefined}
      >
        {data.tasks.length ? (
          <Card>
            <ul className="m-0 list-none p-0">
              {data.tasks.map((k) => {
                const t = tripRef(k.tripId);
                const overdue = Date.parse(k.due) < nowMs;
                return (
                  <li key={k.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#ebe8e5] px-4 py-3 first:border-t-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-semibold">{k.title}</div>
                      <div className="text-[14px] text-[#6b6764]">
                        {t ? `${t.ref} · ${customerLabel(state, t)} · ` : ""}Due {fmtDateTime(k.due, tz)} · {k.ownerId ? memberName(state, k.ownerId) : `${k.team} team`}
                        {k.blockedBy && ` · Blocked: ${k.blockedBy}`}
                      </div>
                    </div>
                    <Badge tone={overdue ? "bad" : STATUS_TONE[k.status]}>{overdue ? "Overdue" : k.status.replace("_", " ")}</Badge>
                    <label className="sr-only" htmlFor={`st-${k.id}`}>Status for {k.title}</label>
                    <select
                      id={`st-${k.id}`}
                      className={`${inputCls} w-auto py-1.5 text-[15px]`}
                      value={k.status}
                      onChange={(e) => {
                        const r = run((s, m, now) => updateTask(s, m, k.id, { status: e.target.value as TaskStatus }, "", now));
                        if (!r.ok) setErr(r.error.message);
                      }}
                    >
                      {(["open", "in_progress", "waiting", "done", "cancelled"] as TaskStatus[]).map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                    <button type="button" className={btn.ghost} onClick={() => { setResched(k); setNewDue(k.due.slice(0, 10)); setReason(""); setErr(""); }}>
                      Reschedule
                    </button>
                    {t && (
                      <Link href={`/os/trips/${t.id}?tab=${k.tab ?? "overview"}`} className={btn.secondary}>
                        Open
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <Empty title="No tasks due" body="Tasks created by company policy or by staff show here when they fall due." />
        )}
        {err && <p role="alert" className="text-[15px] font-semibold text-[#8a1f17]">{err}</p>}
      </Section>

      {data.followUps.length > 0 && (
        <Section title={`Sales follow-ups (${data.followUps.length})`}>
          <Rows
            tz={tz}
            rows={data.followUps.map((t) => ({
              key: `fu:${t.id}`, tripId: t.id, ref: t.ref, who: customerLabel(state, t), item: `Waiting for decision on quote v${t.quotes[t.quotes.length - 1]?.number}`,
              due: `${t.qual.nextFollowUp}T09:00:00+07:00`, owner: memberName(state, t.ownerId), status: { text: COMMERCIAL_LABEL[t.commercial], tone: "info" as Tone },
              action: { label: "Record customer decision", href: `/os/trips/${t.id}?tab=money` },
            }))}
          />
        </Section>
      )}

      {me?.role === "manager" && (
        <Section title="Business overview">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.pipeline.map((p) => (
              <Card key={p.s} className="p-4">
                <div className="text-[14px] font-semibold text-[#6b6764]">{COMMERCIAL_LABEL[p.s]}</div>
                <div className="mt-1 text-[26px] font-extrabold">{p.n}</div>
                <div className="text-[14px] text-[#5b5754]">{fmtMoney(p.value, state.settings.currency)} in latest quotes</div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Dialog
        open={!!resched}
        title="Reschedule task"
        onClose={() => setResched(null)}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setResched(null)}>Cancel</button>
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                if (!resched) return;
                const r = run((s, m, now) => updateTask(s, m, resched.id, { due: `${newDue}T10:00:00+07:00` }, reason, now));
                if (!r.ok) setErr(r.error.message);
                else setResched(null);
              }}
            >
              Move to {fmtDate(newDue)}
            </button>
          </>
        }
      >
        <p className="text-[15px]">{resched?.title}</p>
        <Field id="rs-date" label="New due date" required>
          <input id="rs-date" type="date" className={inputCls} value={newDue} min={addDays(today, -365)} onChange={(e) => setNewDue(e.target.value)} />
        </Field>
        <Field id="rs-reason" label="Reason (kept in task history)" required error={err && !reason.trim() ? err : undefined}>
          <input id="rs-reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>

      <Dialog
        open={adding}
        title="Add task"
        onClose={() => setAdding(false)}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setAdding(false)}>Cancel</button>
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                const r = run((s, m, now) => createTask(s, m, { title: draft.title, tripId: draft.tripId || undefined, ownerId: draft.ownerId || undefined, team: draft.ownerId ? undefined : "ops", due: `${draft.due}T10:00:00+07:00`, priority: "normal" }, now));
                if (!r.ok) setErr(r.error.message);
                else setAdding(false);
              }}
            >
              Add task
            </button>
          </>
        }
      >
        {err && <p role="alert" className="text-[15px] font-semibold text-[#8a1f17]">{err}</p>}
        <Field id="nt-title" label="Task" required>
          <input id="nt-title" className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field id="nt-trip" label="Related trip">
          <select id="nt-trip" className={inputCls} value={draft.tripId} onChange={(e) => setDraft({ ...draft, tripId: e.target.value })}>
            <option value="">None</option>
            {state.trips.filter((t) => t.commercial !== "lost").map((t) => (
              <option key={t.id} value={t.id}>{t.ref} · {t.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="nt-owner" label="Owner">
            <select id="nt-owner" className={inputCls} value={draft.ownerId} onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          <Field id="nt-due" label="Due date" required>
            <input id="nt-due" type="date" className={inputCls} value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

function Rows({ rows, tz }: { rows: Row[]; tz: string }) {
  return (
    <Card>
      <ul className="m-0 list-none p-0">
        {rows.map((r) => (
          <li key={r.key} className="grid gap-x-4 gap-y-1 border-t border-[#ebe8e5] px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,1fr)_170px_120px_auto] md:items-center">
            <div className="min-w-0">
              <div className="text-[14px] text-[#6b6764]">
                <span className="font-mono">{r.ref}</span> · {r.who}
              </div>
              <div className="text-[16px] font-semibold">{r.item}</div>
            </div>
            <div className="text-[14px] text-[#5b5754]">
              {r.due ? `Due ${fmtDateTime(r.due, tz)}` : "—"}
              <div>{r.owner}</div>
            </div>
            <div>
              <Badge tone={r.status.tone}>{r.status.text}</Badge>
            </div>
            <Link href={r.action.href} className={btn.secondary}>
              {r.action.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
