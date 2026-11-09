"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { approveQuote, createQuoteVersion, createRevision, recordAcceptance, recordDecline, recordSend, requestApproval, saveQuoteDraft, uid } from "@/lib/ios/domain";
import {
  BASIS_LABEL,
  QUOTE_LABEL,
  approvalReasons,
  can,
  canManageTrip,
  effectiveQuoteStatus,
  fmtDate,
  fmtDateTime,
  fmtMargin,
  fmtMoney,
  lineCost,
  lineRevenue,
  memberName,
  quoteHash,
  quoteTotals,
  sendBlockers,
  toMajor,
  toMinor,
} from "@/lib/ios/rules";
import type { Channel, PricingBasis, QuoteLine, QuoteStatus, QuoteVersion, TripFile } from "@/lib/ios/types";
import { Badge, Card, Dialog, Empty, ErrorSummary, Field, Notice, Saving, Section, btn, inputCls, type Tone } from "../ui";
import { useAutosave } from "./useAutosave";

const Q_TONE: Record<QuoteStatus, Tone> = { draft: "neutral", awaiting_approval: "warn", approved: "info", sent: "info", accepted: "good", declined: "neutral", expired: "bad", superseded: "neutral" };
const CHANNELS: Channel[] = ["email", "whatsapp", "wechat", "line", "phone", "other"];
const BASES: PricingBasis[] = ["per_person", "per_room_night", "per_vehicle", "per_group", "per_unit"];

export default function Money({ trip, quoteId }: { trip: TripFile; quoteId?: string }) {
  const { me, today, run } = useIos();
  const router = useRouter();
  const [err, setErr] = useState<{ field: string; message: string }[]>([]);
  const selected = trip.quotes.find((q) => q.id === quoteId) ?? trip.quotes[trip.quotes.length - 1];
  const manage = canManageTrip(me, trip);
  const showCost = can(me, "cost.view");

  const go = (id: string) => router.replace(`?tab=money&quote=${id}`, { scroll: false });

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Quotations"
        actions={
          manage && can(me, "quote.edit") && !["booked", "lost", "cancelled"].includes(trip.commercial) && !trip.quotes.some((q) => ["draft", "awaiting_approval", "approved"].includes(q.status)) ? (
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                const r = run((s, m, now) => createQuoteVersion(s, m, trip.id, now));
                if (r.ok) go(r.value.id);
                else setErr([{ field: "quote", message: r.error.message }]);
              }}
            >
              {trip.quotes.length ? "Prepare a new version from the itinerary" : "Prepare quotation"}
            </button>
          ) : undefined
        }
      >
        <ErrorSummary errors={err} title="Couldn't complete that" />
        {trip.quotes.length ? (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Quote versions">
            {trip.quotes.map((q) => {
              const st = effectiveQuoteStatus(q, today);
              const on = q.id === selected?.id;
              return (
                <button key={q.id} role="tab" type="button" aria-selected={on} onClick={() => go(q.id)} className={`cursor-pointer rounded-[6px] border px-3 py-2 text-left ${on ? "border-[#201e1d] bg-white" : "border-[#dcd9d6] bg-[#fbfaf9]"}`}>
                  <div className="flex items-center gap-2 text-[15px] font-bold">
                    v{q.number} <Badge tone={Q_TONE[st]}>{QUOTE_LABEL[st]}</Badge>
                  </div>
                  <div className="text-[14px] text-[#5b5754]">{fmtMoney(quoteTotals(q).revenue, q.currency)}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <Empty title="No quotation yet" body={trip.itinerary.some((d) => d.services.length) ? "Prepare one from the itinerary. Lines start at cost plus the company mark-up; adjust before sending." : "Add services to the itinerary first, or prepare an empty quotation and add lines by hand."} />
        )}
      </Section>

      {selected && (
        <QuoteEditor
          key={`${selected.id}:${selected.status}`}
          trip={trip}
          q={selected}
          showCost={showCost}
          onError={setErr}
          onNewVersion={(id) => go(id)}
        />
      )}
      {!showCost && <Notice tone="info">Supplier costs and margin are hidden for your role.</Notice>}
      <Notice tone="neutral">Receipts, supplier bills, payments and final margin arrive in milestone D (Money). Accepting a quotation never marks the customer paid.</Notice>
    </div>
  );
}

function QuoteEditor({ trip, q, showCost, onError, onNewVersion }: { trip: TripFile; q: QuoteVersion; showCost: boolean; onError: (e: { field: string; message: string }[]) => void; onNewVersion: (id: string) => void }) {
  const { state, me, today, run } = useIos();
  const [draft, setDraft] = useState<QuoteVersion>(q);
  const [base, setBase] = useState(trip.version);
  const [dlg, setDlg] = useState<"" | "send" | "accept" | "decline">("");
  const [channel, setChannel] = useState<Channel>("email");
  const [acc, setAcc] = useState({ person: q.recipientName ?? "", date: today, evidence: "" });
  const [declineReason, setDeclineReason] = useState("");
  const [dlgErr, setDlgErr] = useState<{ field: string; message: string }[]>([]);
  const status = effectiveQuoteStatus(q, today);
  const editable = ["draft", "awaiting_approval", "approved"].includes(q.status) && can(me, "quote.edit") && canManageTrip(me, trip);
  const view = editable ? draft : q;
  const t = quoteTotals(view);
  const reasons = approvalReasons(view, state.settings);
  const blockers = sendBlockers(trip, view, today, state.settings);
  const approvedForThis = !!view.approval && view.approval.hash === quoteHash(view);

  const auto = useAutosave<{ d: QuoteVersion; v: number }>(({ d, v }) => {
    const r = run((s, m, now) => saveQuoteDraft(s, m, trip.id, q.id, v, d, now));
    if (r.ok) {
      setBase(trip.version + 1);
      return { ok: true };
    }
    return r;
  });
  // Adopt newer versions (ours or another user's) whenever no edit is pending, so we never write stale content.
  if (auto.status !== "saving" && auto.status !== "conflict" && trip.version !== base) {
    setBase(trip.version);
    setDraft(q);
  }

  const update = (patch: Partial<QuoteVersion>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    auto.queue({ d: next, v: base });
  };
  const setLine = (i: number, patch: Partial<QuoteLine>) => update({ lines: draft.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  const act = (fn: Parameters<typeof run>[0], after?: () => void) => {
    auto.flush();
    const r = run(fn);
    if (!r.ok) {
      onError(r.error.fieldErrors?.length ? r.error.fieldErrors : [{ field: "quote", message: r.error.message }]);
      return false;
    }
    onError([]);
    after?.();
    return true;
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[20px] font-extrabold">Quote v{q.number}</h3>
              <p className="text-[14px] text-[#5b5754]">
                From itinerary v{q.fromItineraryVersion} · created {fmtDateTime(q.createdAt, state.settings.timezone)} by {memberName(state, q.createdBy)}
                {q.sent && <> · sent {fmtDateTime(q.sent.at, state.settings.timezone)} to {q.sent.recipient} by {q.sent.channel} · hash {q.sent.hash}</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={Q_TONE[status]}>{QUOTE_LABEL[status]}</Badge>
              {editable && <Saving state={auto.status} />}
            </div>
          </div>
          {!editable && ["sent", "accepted", "declined", "superseded", "expired"].includes(status) && (
            <Notice tone="neutral">
              This version is frozen{q.supersededBy ? ` and was superseded by v${q.supersededBy}` : ""}. {status === "accepted" && q.accepted ? `Accepted by ${q.accepted.person} on ${fmtDate(q.accepted.date)}. Evidence: ${q.accepted.evidence}` : "Edits create a new version."}
            </Notice>
          )}
          {auto.status === "conflict" && (
            <Notice tone="bad">
              Another user changed this trip. Your last edit was not saved.{" "}
              <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-bold text-[#8a1f17] underline" onClick={() => { setDraft(q); setBase(trip.version); auto.reset(); }}>Reload the current version</button>
            </Notice>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="q-cur" label="Currency"><input id="q-cur" className={inputCls} maxLength={3} disabled={!editable} value={view.currency} onChange={(e) => update({ currency: e.target.value.toUpperCase() })} /></Field>
            <Field id="validUntil" label="Valid until"><input id="validUntil" type="date" className={inputCls} disabled={!editable} value={view.validUntil ?? ""} onChange={(e) => update({ validUntil: e.target.value })} /></Field>
            <div id="field-recipient" className="contents">
              <Field id="q-rn" label="Recipient name"><input id="q-rn" className={inputCls} disabled={!editable} value={view.recipientName ?? ""} onChange={(e) => update({ recipientName: e.target.value })} /></Field>
              <Field id="q-re" label="Recipient email"><input id="q-re" type="email" className={inputCls} disabled={!editable} value={view.recipientEmail ?? ""} onChange={(e) => update({ recipientEmail: e.target.value })} /></Field>
            </div>
          </div>
        </Card>

        <Card className="p-0" >
          <div id="field-lines" className="overflow-x-auto" role="region" aria-label="Quotation lines" tabIndex={0}>
            <table className="w-full min-w-[900px] border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-[#dcd9d6] bg-[#fbfaf9] text-left text-[14px] text-[#5b5754]">
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Basis</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Free (FOC)</th>
                  <th className="px-3 py-2 text-right">Unit price</th>
                  <th className="px-3 py-2 text-right">Discount</th>
                  <th className="px-3 py-2">Optional</th>
                  <th className="px-3 py-2 text-right">Line total</th>
                  {showCost && <th className="px-3 py-2 text-right">Est. cost (internal)</th>}
                  {editable && <th className="px-3 py-2"><span className="sr-only">Remove</span></th>}
                </tr>
              </thead>
              <tbody>
                {view.lines.map((l, i) => (
                  <tr key={l.id} className={`border-b border-[#ebe8e5] align-top ${l.rateExpired ? "bg-[#fdeceb]" : ""}`}>
                    <td className="px-3 py-2">
                      <input aria-label="Description" className={inputCls} disabled={!editable} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                      {l.rateExpired && <div className="mt-1 text-[13px] font-semibold text-[#8a1f17]">Rate expired or needs reconfirmation — revalidate in the itinerary</div>}
                    </td>
                    <td className="px-3 py-2">
                      <select aria-label="Basis" className={inputCls} disabled={!editable} value={l.basis} onChange={(e) => setLine(i, { basis: e.target.value as PricingBasis })}>
                        {BASES.map((b) => (<option key={b} value={b}>{BASIS_LABEL[b]}</option>))}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input aria-label="Quantity" type="number" min={0} className={`${inputCls} w-[80px] text-right`} disabled={!editable} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(0, Math.floor(Number(e.target.value))) })} /></td>
                    <td className="px-3 py-2"><input aria-label="Complimentary units" type="number" min={0} className={`${inputCls} w-[72px] text-right`} disabled={!editable} value={l.foc} onChange={(e) => setLine(i, { foc: Math.max(0, Math.floor(Number(e.target.value))) })} /></td>
                    <td className="px-3 py-2"><input aria-label="Unit price" type="number" min={0} className={`${inputCls} w-[120px] text-right`} disabled={!editable} value={toMajor(l.unitPrice)} onChange={(e) => setLine(i, { unitPrice: toMinor(Number(e.target.value)) })} /></td>
                    <td className="px-3 py-2"><input aria-label="Discount" type="number" min={0} className={`${inputCls} w-[100px] text-right`} disabled={!editable} value={toMajor(l.discount)} onChange={(e) => setLine(i, { discount: toMinor(Number(e.target.value)) })} /></td>
                    <td className="px-3 py-2"><input aria-label="Optional" type="checkbox" className="mt-2 h-5 w-5 accent-[#f2b01e]" disabled={!editable} checked={l.optional} onChange={(e) => setLine(i, { optional: e.target.checked })} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{l.optional ? "Optional" : fmtMoney(lineRevenue(l), view.currency)}</td>
                    {showCost && <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-[#5b5754]">{fmtMoney(lineCost(l), view.currency)}</td>}
                    {editable && (
                      <td className="px-3 py-2">
                        <button type="button" className={btn.ghost} onClick={() => update({ lines: draft.lines.filter((_, j) => j !== i) })} aria-label={`Remove ${l.description}`}>Remove</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editable && (
            <div className="border-t border-[#ebe8e5] p-3">
              <button type="button" className={btn.secondary} onClick={() => update({ lines: [...draft.lines, { id: uid(), description: "New line", basis: "per_person", qty: 1, unitPrice: 0, unitCost: 0, discount: 0, optional: false, foc: 0 }] })}>
                Add line
              </button>
            </div>
          )}
        </Card>

        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <Field id="paymentTerms" label="Payment schedule"><textarea id="paymentTerms" className={`${inputCls} min-h-[70px]`} disabled={!editable} value={view.paymentTerms} onChange={(e) => update({ paymentTerms: e.target.value })} /></Field>
          <Field id="cancellationTerms" label="Cancellation terms"><textarea id="cancellationTerms" className={`${inputCls} min-h-[70px]`} disabled={!editable} value={view.cancellationTerms} onChange={(e) => update({ cancellationTerms: e.target.value })} /></Field>
          <Field id="inclusions" label="Inclusions"><textarea id="inclusions" className={`${inputCls} min-h-[70px]`} disabled={!editable} value={view.inclusions} onChange={(e) => update({ inclusions: e.target.value })} /></Field>
          <Field id="exclusions" label="Exclusions"><textarea id="exclusions" className={`${inputCls} min-h-[70px]`} disabled={!editable} value={view.exclusions} onChange={(e) => update({ exclusions: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Field id="assumptions" label="Material availability assumptions"><textarea id="assumptions" className={`${inputCls} min-h-[60px]`} disabled={!editable} value={view.assumptions} onChange={(e) => update({ assumptions: e.target.value })} /></Field>
          </div>
        </Card>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-[88px]">
        <Card className="p-5">
          <h3 className="text-[17px] font-extrabold">Totals</h3>
          <dl className="m-0 mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-[15px]">
            <dt>Net revenue (before tax)</dt>
            <dd className="m-0 text-right font-bold tabular-nums">{fmtMoney(t.revenue, view.currency)}</dd>
            {showCost && (
              <>
                <dt className="text-[#5b5754]">Estimated direct cost</dt>
                <dd className="m-0 text-right tabular-nums">{fmtMoney(t.cost, view.currency)}</dd>
                <dt className="text-[#5b5754]">Estimated gross profit</dt>
                <dd className="m-0 text-right tabular-nums">{fmtMoney(t.profit, view.currency)}</dd>
                <dt className="font-semibold">Margin</dt>
                <dd className={`m-0 text-right font-extrabold tabular-nums ${t.margin !== null && t.margin < state.settings.marginThreshold ? "text-[#8a1f17]" : ""}`}>{fmtMargin(t.margin)}</dd>
              </>
            )}
          </dl>
          {showCost && <p className="mt-2 text-[13px] text-[#6b6764]">Internal only. Supplier cost and margin never appear on the customer document.</p>}
          {reasons.length > 0 && (
            <div className="mt-3">
              <Badge tone={approvedForThis ? "good" : "warn"}>{approvedForThis ? `Approved by ${memberName(state, view.approval!.by)}` : `Approval needed: ${reasons.join(", ")}`}</Badge>
            </div>
          )}
        </Card>

        {editable && blockers.length > 0 && (
          <Card className="p-5">
            <h3 className="text-[16px] font-extrabold">Before sending</h3>
            <ul className="m-0 mt-2 list-disc pl-5 text-[15px] text-[#5b5754]">
              {blockers.map((b, i) => (<li key={i}>{b.message}</li>))}
            </ul>
          </Card>
        )}

        <Card className="flex flex-col gap-2 p-5">
          <h3 className="text-[16px] font-extrabold">Actions</h3>
          {editable && q.status === "draft" && reasons.length > 0 && (
            <button type="button" className={btn.secondary} onClick={() => act((s, m, now) => requestApproval(s, m, trip.id, q.id, now))}>Request manager approval</button>
          )}
          {editable && reasons.length > 0 && !approvedForThis && can(me, "quote.approve") && (
            <button type="button" className={btn.secondary} onClick={() => act((s, m, now) => approveQuote(s, m, trip.id, q.id, now))}>
              Approve v{q.number} ({reasons.join(", ")})
            </button>
          )}
          {editable && (
            <button type="button" className={btn.primary} disabled={q.status === "awaiting_approval"} onClick={() => { setDlgErr([]); setDlg("send"); }}>
              Record send of v{q.number}
            </button>
          )}
          <Link href={`/os/trips/${trip.id}/print/${q.id}`} target="_blank" className={btn.secondary}>
            Download customer document (PDF)
          </Link>
          <p className="text-[13px] text-[#6b6764]">A download alone is not “sent”. Record the send so the version freezes and follow-up starts.</p>
          {q.status === "sent" && can(me, "quote.accept") && (
            <>
              <button type="button" className={btn.primary} onClick={() => { setDlgErr([]); setDlg("accept"); }}>Record customer acceptance</button>
              <button type="button" className={btn.secondary} onClick={() => { setDlgErr([]); setDlg("decline"); }}>Record decline</button>
            </>
          )}
          {!editable && !["booked", "lost", "cancelled"].includes(trip.commercial) && can(me, "quote.edit") && !trip.quotes.some((x) => ["draft", "awaiting_approval", "approved"].includes(x.status)) && (
            <button type="button" className={btn.secondary} onClick={() => {
              const r = run((s, m, now) => createRevision(s, m, trip.id, q.id, now));
              if (r.ok) onNewVersion(r.value.id);
              else onError([{ field: "quote", message: r.error.message }]);
            }}>
              Create v{trip.quotes.length + 1} from v{q.number}
            </button>
          )}
        </Card>
      </aside>

      <Dialog
        open={dlg === "send"}
        title={`Record send of quote v${q.number}`}
        onClose={() => setDlg("")}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setDlg("")}>Cancel</button>
            <button type="button" className={btn.primary} onClick={() => {
              auto.flush();
              const r = run((s, m, now) => recordSend(s, m, trip.id, q.id, channel, now));
              if (!r.ok) setDlgErr(r.error.fieldErrors?.length ? r.error.fieldErrors : [{ field: "quote", message: r.error.message }]);
              else setDlg("");
            }}>
              Record v{q.number} sent to {view.recipientName || "recipient"}
            </button>
          </>
        }
      >
        <ErrorSummary errors={dlgErr} title="This quotation can't be sent yet" />
        <p className="text-[15px]">Recording the send freezes v{q.number} ({fmtMoney(t.revenue, view.currency)}, valid until {fmtDate(view.validUntil)}). Later edits create a new version. Download the customer document and send it yourself; this logs the delivery.</p>
        <p className="text-[15px]"><strong>To:</strong> {view.recipientName || "—"} {view.recipientEmail ? `<${view.recipientEmail}>` : ""}</p>
        <Field id="snd-ch" label="Sent by">
          <select id="snd-ch" className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            {CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </Field>
      </Dialog>

      <Dialog
        open={dlg === "accept"}
        title={`Record acceptance of v${q.number}`}
        onClose={() => setDlg("")}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setDlg("")}>Cancel</button>
            <button type="button" className={btn.primary} onClick={() => {
              const r = run((s, m, now) => recordAcceptance(s, m, trip.id, q.id, acc, now));
              if (!r.ok) setDlgErr(r.error.fieldErrors?.length ? r.error.fieldErrors : [{ field: "acc-date", message: r.error.message }]);
              else setDlg("");
            }}>
              Book trip on v{q.number}
            </button>
          </>
        }
      >
        <ErrorSummary errors={dlgErr} title="Acceptance not recorded" />
        <p className="text-[15px]">The trip becomes Booked and operations tasks are created. Suppliers are not confirmed and the customer is not marked paid.</p>
        <Field id="person" label="Accepted by" required><input id="person" className={inputCls} value={acc.person} onChange={(e) => setAcc({ ...acc, person: e.target.value })} /></Field>
        <Field id="date" label="Date of acceptance" required><input id="date" type="date" className={inputCls} value={acc.date} onChange={(e) => setAcc({ ...acc, date: e.target.value })} /></Field>
        <Field id="evidence" label="Evidence" required hint="Paste the customer's words or describe the signed document.">
          <textarea id="evidence" className={`${inputCls} min-h-[80px]`} value={acc.evidence} onChange={(e) => setAcc({ ...acc, evidence: e.target.value })} />
        </Field>
      </Dialog>

      <Dialog
        open={dlg === "decline"}
        title={`Record decline of v${q.number}`}
        onClose={() => setDlg("")}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setDlg("")}>Cancel</button>
            <button type="button" className={btn.danger} onClick={() => {
              const r = run((s, m, now) => recordDecline(s, m, trip.id, q.id, declineReason, now));
              if (!r.ok) setDlgErr([{ field: "dr", message: r.error.message }]);
              else setDlg("");
            }}>Record decline</button>
          </>
        }
      >
        <ErrorSummary errors={dlgErr} />
        <Field id="dr" label="Reason given"><input id="dr" className={inputCls} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} /></Field>
      </Dialog>
    </div>
  );
}
