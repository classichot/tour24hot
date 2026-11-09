"use client";

import Link from "next/link";
import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { useNow } from "@/lib/ios/clock";
import { applyChange, changeEffects, completeTrip, createIncident, decideChange, grantReadinessException, markReady, proposeChange, setOpsOwner, startTrip, updateIncident } from "@/lib/ios/ops";
import { allServices, can, computeReadiness, fmtDate, fmtDateTime, headcount, memberName } from "@/lib/ios/rules";
import type { ChangeProposal, Incident, TripFile } from "@/lib/ios/types";
import { Badge, Card, Dialog, ErrorSummary, Field, Notice, Section, btn, inputCls, type Tone } from "../ui";

type Err = { field: string; message: string }[];
const toErr = (e: { message: string; fieldErrors?: Err }): Err => (e.fieldErrors?.length ? e.fieldErrors : [{ field: "x", message: e.message }]);

/** Readiness (TRP04) with the actions that move a booked trip through operations (TRP05). */
export function ReadinessPanel({ trip }: { trip: TripFile }) {
  const { state, me, today, run } = useIos();
  const nowMs = useNow();
  const [errors, setErrors] = useState<Err>([]);
  const [exc, setExc] = useState(false);
  const [f, setF] = useState({ reason: "", scope: "", expires: "" });
  const r = computeReadiness(trip, today, state.trips, nowMs);
  const operate = can(me, "trip.operate");
  const act = (fn: Parameters<typeof run>[0]) => {
    const x = run(fn);
    setErrors(x.ok ? [] : toErr(x.error));
    return x.ok;
  };

  if (trip.commercial !== "booked") {
    return (
      <Section title="Readiness">
        <Card className="p-4 text-[15px] text-[#5b5754]">Readiness is tracked once the customer accepts a quotation and the trip is booked.</Card>
      </Section>
    );
  }

  return (
    <Section title="Readiness" id="readiness">
      <Card className="p-4">
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
          {r.items.map((i) => (
            <li key={i.key} id={`field-ready-${i.key}`} className="flex items-start gap-2">
              <Badge tone={i.ok ? "good" : "warn"}>{i.ok ? "Done" : "Not yet"}</Badge>
              <Link href={`?tab=${i.tab}`} scroll={false} className="text-[#201e1d]">{i.text}</Link>
            </li>
          ))}
        </ul>
        {r.exception && trip.readinessException && (
          <div className="mt-3">
            <Notice tone="warn">
              Manager exception by {memberName(state, trip.readinessException.by)} until {fmtDate(trip.readinessException.expires)}. Scope: {trip.readinessException.scope}. Reason: {trip.readinessException.reason}. The items above stay as they are.
            </Notice>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <ErrorSummary title="Not done" errors={errors} />
          <Field id="ops-owner" label="Operations owner">
            <select id="ops-owner" className={inputCls} disabled={!operate} value={trip.opsOwnerId ?? ""} onChange={(e) => act((s, m, now) => setOpsOwner(s, m, trip.id, e.target.value, now))}>
              <option value="">Unassigned</option>
              {state.members.filter((m) => m.role === "ops" || m.role === "manager").map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          {operate && (
            <div className="flex flex-wrap gap-2">
              {trip.operational === "arranging" && (
                <button type="button" className={btn.primary} aria-disabled={!r.ready} onClick={() => act((s, m, now) => markReady(s, m, trip.id, now))}>
                  Mark trip ready
                </button>
              )}
              {trip.operational === "ready" && <button type="button" className={btn.primary} onClick={() => act((s, m, now) => startTrip(s, m, trip.id, now))}>Start trip</button>}
              {trip.operational === "in_progress" && <button type="button" className={btn.primary} onClick={() => act((s, m, now) => completeTrip(s, m, trip.id, now))}>Complete trip</button>}
              {can(me, "readiness.override") && trip.operational === "arranging" && !r.items.every((i) => i.ok) && (
                <button type="button" className={btn.secondary} onClick={() => setExc(true)}>Record exception</button>
              )}
            </div>
          )}
          {trip.operational === "completed" && <Notice tone="good">Completed {fmtDateTime(trip.completedAt, state.settings.timezone)}. Financial close is separate (milestone D).</Notice>}
          <p className="text-[14px] text-[#6b6764]">Ready requires every item. Paid or booked never implies ready.</p>
        </div>
      </Card>
      <Dialog
        open={exc}
        title="Record readiness exception"
        onClose={() => setExc(false)}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setExc(false)}>Cancel</button>
            <button type="button" className={btn.primary} onClick={() => { if (act((s, m, now) => grantReadinessException(s, m, trip.id, f, now))) setExc(false); }}>Record exception</button>
          </>
        }
      >
        <p className="text-[15px] text-[#5b5754]">An exception lets the trip be marked ready while items are open. It is recorded with your name and expires; the open items stay visible.</p>
        <ErrorSummary errors={errors} />
        <Field id="ex-scope" label="What it covers" required hint="For example: lunch on day 2 confirmed by phone only.">
          <input id="ex-scope" className={inputCls} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} />
        </Field>
        <Field id="ex-reason" label="Reason" required>
          <textarea id="ex-reason" rows={2} className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </Field>
        <Field id="ex-exp" label="Expires" required>
          <input id="ex-exp" type="date" className={inputCls} min={today} value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} />
        </Field>
      </Dialog>
    </Section>
  );
}

const SEV_TONE: Record<"info" | "warn" | "block", Tone> = { info: "info", warn: "warn", block: "bad" };
const CP_TONE: Record<ChangeProposal["status"], Tone> = { proposed: "warn", approved: "info", applied: "good", rejected: "neutral" };

/** Change proposals for booked trips (TRP06): effects first, approval, then apply after revalidation. */
export function ChangePanel({ trip }: { trip: TripFile }) {
  const { state, me, run } = useIos();
  const init = () => ({ adults: String(trip.adults ?? 0), children: String(trip.children ?? 0), infants: String(trip.infants ?? 0), startDate: trip.startDate ?? "", endDate: trip.endDate ?? "", reason: "" });
  const [f, setF] = useState(init);
  const [errors, setErrors] = useState<Err>([]);
  const [msg, setMsg] = useState("");
  // When the booked values change (a proposal was applied), restart the form from them; keep the message.
  const valuesKey = `${trip.adults}:${trip.children}:${trip.infants}:${trip.startDate}:${trip.endDate}`;
  const [seenKey, setSeenKey] = useState(valuesKey);
  if (seenKey !== valuesKey) {
    setSeenKey(valuesKey);
    setF(init());
  }
  if (trip.commercial !== "booked") return null;
  const propose = can(me, "change.propose");
  const approve = can(me, "change.approve");
  const patch: ChangeProposal["patch"] = {
    adults: Number(f.adults) || 0,
    children: Number(f.children) || 0,
    infants: Number(f.infants) || 0,
    startDate: f.startDate || undefined,
    endDate: f.endDate || undefined,
  };
  const newN = (patch.adults ?? 0) + (patch.children ?? 0) + (patch.infants ?? 0);
  const changed = newN !== headcount(trip) || (patch.startDate ?? "") !== (trip.startDate ?? "") || (patch.endDate ?? "") !== (trip.endDate ?? "");
  const effects = changed ? changeEffects(state, trip, patch) : [];
  const act = (fn: Parameters<typeof run>[0], ok: string) => {
    const x = run(fn);
    setErrors(x.ok ? [] : toErr(x.error));
    setMsg(x.ok ? ok : "");
    return x.ok;
  };

  return (
    <Section title="Change proposals" id="changes">
      {msg && (
        <div role="status" aria-live="polite">
          <Notice tone="good">{msg}</Notice>
        </div>
      )}
      <ErrorSummary errors={errors} />
      {propose && (
        <Card className="flex flex-col gap-4 p-4">
          <p className="text-[15px] text-[#5b5754]">Booked dates and guest counts change here, so suppliers, documents and price are reviewed before anything moves. The accepted quote is never edited.</p>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-[1fr_1fr_1fr_1.7fr_1.7fr]">
            <Field id="cp-a" label="Adults"><input id="cp-a" type="number" min={0} className={inputCls} value={f.adults} onChange={(e) => setF({ ...f, adults: e.target.value })} /></Field>
            <Field id="cp-c" label="Children"><input id="cp-c" type="number" min={0} className={inputCls} value={f.children} onChange={(e) => setF({ ...f, children: e.target.value })} /></Field>
            <Field id="cp-i" label="Infants"><input id="cp-i" type="number" min={0} className={inputCls} value={f.infants} onChange={(e) => setF({ ...f, infants: e.target.value })} /></Field>
            <Field id="cp-start" label="Start"><input id="cp-start" type="date" className={inputCls} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
            <Field id="cp-end" label="End"><input id="cp-end" type="date" className={inputCls} min={f.startDate || undefined} value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
          </div>
          {changed && (
            <div>
              <div className="text-[14px] font-bold">What this would affect</div>
              <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0 text-[15px]">
                {effects.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge tone={SEV_TONE[e.severity]}>{e.severity === "block" ? "Blocks" : e.severity === "warn" ? "Review" : "Info"}</Badge>
                    {e.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Field id="cp-reason" label="Reason" required>
            <input id="cp-reason" className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="For example: partner added 4 guests by email 10 Nov" />
          </Field>
          <div>
            <button type="button" className={btn.primary} disabled={!changed} onClick={() => { if (act((s, m, now) => proposeChange(s, m, trip.id, patch, f.reason, now), "Proposal submitted for manager approval.")) setF(init()); }}>
              Submit for approval
            </button>
          </div>
        </Card>
      )}
      {trip.changes.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CP_TONE[c.status]}>{c.status[0].toUpperCase() + c.status.slice(1)}</Badge>
                <span className="text-[16px] font-bold">{c.title}</span>
              </div>
              <div className="mt-1 text-[14px] text-[#6b6764]">
                {memberName(state, c.createdBy)} · {fmtDateTime(c.createdAt, state.settings.timezone)} · {c.reason}
                {c.approvedBy && ` · ${c.status === "rejected" ? "Rejected" : "Approved"} by ${memberName(state, c.approvedBy)}`}
                {c.appliedAt && ` · Applied ${fmtDateTime(c.appliedAt, state.settings.timezone)}`}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.status === "proposed" && approve && (
                <>
                  <button type="button" className={btn.primary} onClick={() => act((s, m, now) => decideChange(s, m, trip.id, c.id, true, now), "Approved. Apply it when you are ready to update suppliers and documents.")}>Approve</button>
                  <button type="button" className={btn.ghost} onClick={() => act((s, m, now) => decideChange(s, m, trip.id, c.id, false, now), "Rejected.")}>Reject</button>
                </>
              )}
              {c.status === "approved" && propose && (
                <button type="button" className={btn.primary} onClick={() => act((s, m, now) => applyChange(s, m, trip.id, c.id, now), "Applied. Affected reservations need reconfirmation; tasks were created and issued documents are outdated.")}>Apply change</button>
              )}
            </div>
          </div>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[15px]">
            {c.effects.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <Badge tone={SEV_TONE[e.severity]}>{e.severity === "block" ? "Blocks" : e.severity === "warn" ? "Review" : "Info"}</Badge>
                {e.text}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </Section>
  );
}

const INC_TONE: Record<Incident["severity"], Tone> = { critical: "bad", high: "bad", medium: "warn", low: "neutral" };

/** Incidents (OPS06): severity, owner, actions and resolution; urgent ones surface on Today. */
export function IncidentPanel({ trip }: { trip: TripFile }) {
  const { state, me, run } = useIos();
  const manage = can(me, "incident.manage");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Err>([]);
  const blank = { title: "", category: "transport" as Incident["category"], severity: "medium" as Incident["severity"], serviceId: "", ownerId: me?.id ?? "", description: "", evidence: "" };
  const [f, setF] = useState(blank);
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (trip.commercial !== "booked") return null;
  const list = [...trip.incidents].sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved"));

  return (
    <Section title={`Incidents (${trip.incidents.filter((i) => i.status !== "resolved").length} open)`} id="incidents" actions={manage ? <button type="button" className={btn.secondary} onClick={() => { setF(blank); setErrors([]); setOpen(true); }}>Report incident</button> : undefined}>
      {list.length === 0 && <Card className="p-4 text-[15px] text-[#6b6764]">No incidents recorded.</Card>}
      {list.map((i) => (
        <Card key={i.id} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={INC_TONE[i.severity]}>{i.severity[0].toUpperCase() + i.severity.slice(1)}</Badge>
            <Badge tone={i.status === "resolved" ? "good" : "warn"}>{i.status === "in_progress" ? "In progress" : i.status[0].toUpperCase() + i.status.slice(1)}</Badge>
            <span className="text-[16px] font-bold">{i.title}</span>
          </div>
          <div className="mt-1 text-[14px] text-[#6b6764]">
            {fmtDateTime(i.createdAt, state.settings.timezone)} · reported by {memberName(state, i.createdBy)} · owner {memberName(state, i.ownerId)}
            {i.serviceId && ` · ${allServices(trip).find((x) => x.s.id === i.serviceId)?.s.name ?? "service"}`}
          </div>
          {i.description && <p className="mt-2 text-[15px]">{i.description}</p>}
          {i.actions.length > 0 && (
            <ol className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[15px]">
              {i.actions.map((a, k) => (
                <li key={k} className="border-l-2 border-[#dcd9d6] pl-3">
                  <span className="text-[13px] text-[#6b6764]">{fmtDateTime(a.at, state.settings.timezone)} · {memberName(state, a.by)}</span>
                  <div>{a.text}</div>
                </li>
              ))}
            </ol>
          )}
          {i.status === "resolved" && i.resolution && <Notice tone="good">Resolved: {i.resolution}</Notice>}
          {manage && i.status !== "resolved" && (
            <div className="mt-3 flex flex-col gap-2">
              <label htmlFor={`in-act-${i.id}`} className="text-[14px] font-semibold">Add action or resolution</label>
              <textarea id={`in-act-${i.id}`} rows={2} className={inputCls} value={notes[i.id] ?? ""} onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn.secondary} disabled={!notes[i.id]?.trim()} onClick={() => { const x = run((s, m, now) => updateIncident(s, m, trip.id, i.id, { action: notes[i.id], status: "in_progress" }, now)); if (x.ok) setNotes({ ...notes, [i.id]: "" }); setErrors(x.ok ? [] : toErr(x.error)); }}>
                  Log action
                </button>
                <button type="button" className={btn.primary} disabled={!notes[i.id]?.trim()} onClick={() => { const x = run((s, m, now) => updateIncident(s, m, trip.id, i.id, { status: "resolved", resolution: notes[i.id] }, now)); if (x.ok) setNotes({ ...notes, [i.id]: "" }); setErrors(x.ok ? [] : toErr(x.error)); }}>
                  Resolve with this note
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}
      {!open && <ErrorSummary errors={errors} />}
      <Dialog
        open={open}
        title="Report incident"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className={btn.primary} onClick={() => {
              const x = run((s, m, now) => createIncident(s, m, trip.id, { ...f, serviceId: f.serviceId || undefined, ownerId: f.ownerId || undefined, evidence: f.evidence || undefined }, now));
              if (x.ok) setOpen(false);
              setErrors(x.ok ? [] : toErr(x.error));
            }}>Report</button>
          </>
        }
      >
        <ErrorSummary errors={errors} />
        <Field id="in-title" label="What happened" required>
          <input id="in-title" className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="in-sev" label="Severity">
            <select id="in-sev" className={inputCls} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as Incident["severity"] })}>
              <option value="critical">Critical: trip cannot continue safely</option>
              <option value="high">High: service failed</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
          <Field id="in-cat" label="Category">
            <select id="in-cat" className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Incident["category"] })}>
              {["transport", "hotel", "guest", "supplier", "health", "weather", "other"].map((c) => (
                <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field id="in-svc" label="Affected service">
          <select id="in-svc" className={inputCls} value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>
            <option value="">None</option>
            {allServices(trip).map(({ s }) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field id="in-owner" label="Owner">
          <select id="in-owner" className={inputCls} value={f.ownerId} onChange={(e) => setF({ ...f, ownerId: e.target.value })}>
            <option value="">Unassigned</option>
            {state.members.filter((m) => m.role !== "finance").map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field id="in-desc" label="Details">
          <textarea id="in-desc" rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field id="in-ev" label="Evidence or source" hint="For example: call from driver at 09:05.">
          <input id="in-ev" className={inputCls} value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} />
        </Field>
      </Dialog>
    </Section>
  );
}
