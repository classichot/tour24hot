"use client";

import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { saveMembers, saveSettings } from "@/lib/ios/domain";
import { ROLE_LABEL, can, fmtDateTime, memberName, type Capability } from "@/lib/ios/rules";
import type { Member, Settings, StaffRole } from "@/lib/ios/types";
import { Badge, Card, Dialog, ErrorSummary, Field, Notice, PageHeader, Section, btn, inputCls } from "@/components/ios/ui";

const CAP_ROWS: { cap: Capability; label: string }[] = [
  { cap: "enquiry.create", label: "Create enquiries" },
  { cap: "enquiry.manage_any", label: "Manage every enquiry" },
  { cap: "enquiry.manage_assigned", label: "Manage assigned enquiries" },
  { cap: "quote.edit", label: "Prepare quotations" },
  { cap: "quote.approve", label: "Approve below-threshold quotations" },
  { cap: "quote.send", label: "Record quotation send" },
  { cap: "quote.accept", label: "Record customer acceptance" },
  { cap: "itinerary.edit", label: "Edit itineraries" },
  { cap: "cost.view", label: "See supplier costs and margin" },
  { cap: "partner.manage", label: "Manage partners and suppliers" },
  { cap: "rate.manage", label: "Manage supplier rates" },
  { cap: "bank.manage", label: "Manage supplier bank details" },
  { cap: "settings.manage", label: "Company settings, staff and roles" },
  { cap: "audit.view", label: "View the audit log" },
];
const ROLES: StaffRole[] = ["manager", "sales", "ops", "finance"];

export default function CompanyPage() {
  const { state, me, run, resetWorkspace } = useIos();
  const [s, setS] = useState<Settings>(state.settings);
  const [members, setMembers] = useState<Member[]>(state.members);
  const [errs, setErrs] = useState<{ field: string; message: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [reset, setReset] = useState(false);
  const manage = can(me, "settings.manage");
  const [auditQ, setAuditQ] = useState("");
  const audit = state.audit.filter((e) => !auditQ || `${e.action} ${e.summary} ${memberName(state, e.actorId)}`.toLowerCase().includes(auditQ.toLowerCase())).slice(0, 200);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader kicker="Company" title={state.settings.companyName} sub="Settings, staff and roles, and the audit history. Integrations and templates arrive with P1." />
      {!manage && <Notice tone="warn">Only owners and managers can change company settings or roles.</Notice>}
      <ErrorSummary errors={errs} />
      {msg && <Notice tone="good">{msg}</Notice>}

      <Section title="Settings" actions={manage ? <button type="button" className={btn.primary} onClick={() => {
        const r = run((st, m, now) => saveSettings(st, m, s, now));
        if (!r.ok) setErrs([{ field: "set-name", message: r.error.message }]);
        else { setErrs([]); setMsg("Settings saved."); }
      }}>Save settings</button> : undefined}>
        <Card className="grid gap-4 p-5 md:grid-cols-3">
          <Field id="set-name" label="Company name"><input id="set-name" className={inputCls} disabled={!manage} value={s.companyName} onChange={(e) => setS({ ...s, companyName: e.target.value })} /></Field>
          <Field id="set-country" label="Destination country"><input id="set-country" className={inputCls} disabled={!manage} value={s.country} onChange={(e) => setS({ ...s, country: e.target.value })} /></Field>
          <Field id="set-tz" label="Timezone"><input id="set-tz" className={inputCls} disabled={!manage} value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} /></Field>
          <Field id="set-cur" label="Base currency"><input id="set-cur" maxLength={3} className={inputCls} disabled={!manage} value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value.toUpperCase() })} /></Field>
          <Field id="set-thr" label="Margin threshold (%)" hint="Below this, quotes need manager approval and show as exceptions."><input id="set-thr" type="number" min={0} max={90} className={inputCls} disabled={!manage} value={s.marginThreshold} onChange={(e) => setS({ ...s, marginThreshold: Number(e.target.value) })} /></Field>
          <Field id="set-mk" label="Default mark-up (%)" hint="Starting selling price from cost; staff adjust before sending."><input id="set-mk" type="number" min={0} max={200} className={inputCls} disabled={!manage} value={s.defaultMarkupPct} onChange={(e) => setS({ ...s, defaultMarkupPct: Number(e.target.value) })} /></Field>
          <Field id="set-fr" label="First response (business days)" hint="Company policy default."><input id="set-fr" type="number" min={0} className={inputCls} disabled={!manage} value={s.firstResponseBizDays} onChange={(e) => setS({ ...s, firstResponseBizDays: Number(e.target.value) })} /></Field>
          <Field id="set-fu" label="Quote follow-up (business days)"><input id="set-fu" type="number" min={0} className={inputCls} disabled={!manage} value={s.quoteFollowUpBizDays} onChange={(e) => setS({ ...s, quoteFollowUpBizDays: Number(e.target.value) })} /></Field>
          <Field id="set-rd" label="Readiness check (hours before arrival)"><input id="set-rd" type="number" min={0} className={inputCls} disabled={!manage} value={s.readinessHours} onChange={(e) => setS({ ...s, readinessHours: Number(e.target.value) })} /></Field>
        </Card>
      </Section>

      <Section title={`Staff and roles (${members.length})`} actions={manage ? (
        <div className="flex gap-2">
          <button type="button" className={btn.secondary} onClick={() => setMembers([...members, { id: `m-${Date.now().toString(36)}`, name: "", email: "", role: "sales" }])}>Add staff member</button>
          <button type="button" className={btn.primary} onClick={() => {
            if (members.some((m) => !m.name.trim() || !m.email.trim())) { setErrs([{ field: "staff", message: "Every staff member needs a name and email." }]); return; }
            const r = run((st, m, now) => saveMembers(st, m, members, now));
            if (!r.ok) setErrs([{ field: "staff", message: r.error.message }]);
            else { setErrs([]); setMsg("Staff and roles saved."); }
          }}>Save staff</button>
        </div>
      ) : undefined}>
        <Card id="field-staff" className="flex flex-col gap-3 p-5">
          {members.map((m, i) => (
            <div key={m.id} className="grid items-end gap-2 md:grid-cols-[1fr_1.4fr_1fr_auto]">
              <Field id={`sm-n-${i}`} label="Name"><input id={`sm-n-${i}`} className={inputCls} disabled={!manage} value={m.name} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
              <Field id={`sm-e-${i}`} label="Email (sign-in)"><input id={`sm-e-${i}`} className={inputCls} disabled={!manage} value={m.email} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} /></Field>
              <Field id={`sm-r-${i}`} label="Role">
                <select id={`sm-r-${i}`} className={inputCls} disabled={!manage || m.id === me?.id} value={m.role} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, role: e.target.value as StaffRole } : x)))}>
                  {ROLES.map((r) => (<option key={r} value={r}>{ROLE_LABEL[r]}</option>))}
                </select>
              </Field>
              {manage && m.id !== me?.id ? <button type="button" className={btn.ghost} onClick={() => setMembers(members.filter((_, j) => j !== i))}>Remove</button> : <span className="pb-2 text-[14px] text-[#6b6764]">{m.id === me?.id ? "You" : ""}</span>}
            </div>
          ))}
        </Card>

        <div className="overflow-x-auto rounded-[6px] border border-[#dcd9d6] bg-white" role="region" aria-label="Permission matrix" tabIndex={0}>
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <caption className="px-4 pt-3 text-left text-[15px] font-bold">What each role can do (enforced in every action, not only hidden in the screen)</caption>
            <thead>
              <tr className="border-b border-[#dcd9d6] text-left text-[14px] text-[#5b5754]">
                <th className="px-4 py-2">Capability</th>
                {ROLES.map((r) => (<th key={r} className="px-4 py-2">{ROLE_LABEL[r]}</th>))}
              </tr>
            </thead>
            <tbody>
              {CAP_ROWS.map((row) => (
                <tr key={row.cap} className="border-b border-[#ebe8e5]">
                  <td className="px-4 py-2">{row.label}</td>
                  {ROLES.map((r) => {
                    const yes = can({ id: "x", name: "", email: "", role: r }, row.cap);
                    return <td key={r} className="px-4 py-2"><Badge tone={yes ? "good" : "neutral"}>{yes ? "Yes" : "No"}</Badge></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {can(me, "audit.view") && (
        <Section title="Audit history" actions={<input aria-label="Filter audit history" className={`${inputCls} w-[260px]`} placeholder="Filter" value={auditQ} onChange={(e) => setAuditQ(e.target.value)} />}>
          <Card>
            <ol className="m-0 list-none p-0">
              {audit.map((e) => (
                <li key={e.id} className="grid gap-1 border-t border-[#ebe8e5] px-4 py-2.5 text-[15px] first:border-t-0 md:grid-cols-[190px_120px_minmax(0,1fr)]">
                  <span className="text-[14px] text-[#6b6764]">{fmtDateTime(e.at, state.settings.timezone)}</span>
                  <span className="font-semibold">{memberName(state, e.actorId)}</span>
                  <span>
                    <code className="mr-2 text-[13px] text-[#875e00]">{e.action}</code>
                    {e.summary}
                  </span>
                </li>
              ))}
              {!audit.length && <li className="px-4 py-3 text-[15px] text-[#6b6764]">No events.</li>}
            </ol>
          </Card>
          <p className="text-[14px] text-[#6b6764]">Audit history is append-only; staff cannot edit it.</p>
        </Section>
      )}

      {manage && (
        <Section title="Prototype workspace">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="max-w-[640px] text-[15px] text-[#5b5754]">This prototype keeps the company workspace in this browser. Resetting removes every trip, partner and audit event here and returns to first-use setup.</p>
            <button type="button" className={btn.danger} onClick={() => setReset(true)}>Reset workspace</button>
          </Card>
        </Section>
      )}

      <Dialog open={reset} title="Reset this workspace?" onClose={() => setReset(false)} footer={<><button type="button" className={btn.secondary} onClick={() => setReset(false)}>Keep everything</button><button type="button" className={btn.danger} onClick={() => { setReset(false); resetWorkspace(); }}>Delete {state.trips.length} trips and {state.companies.length} companies</button></>}>
        <p className="text-[15px]">This deletes the whole prototype workspace in this browser. It cannot be undone.</p>
      </Dialog>
    </div>
  );
}
