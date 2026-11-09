"use client";

import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { useNow } from "@/lib/ios/clock";
import {
  createReservation,
  recordCancelled,
  recordHold,
  recordReply,
  requestCancellation,
  requestReservation,
  requestReservationChange,
  resolveDiscrepancy,
  setReservationActive,
  zonedToUtc,
  type ReplyOutcome,
} from "@/lib/ios/ops";
import { CATEGORY_LABEL, RESERVATION_LABEL, allServices, can, confirmedQty, fmtDate, fmtDateTime, fmtMoney, memberName, opsChecks, toMajor, toMinor } from "@/lib/ios/rules";
import type { Reservation, ServiceItem, TripFile } from "@/lib/ios/types";
import { Badge, Card, Dialog, Empty, ErrorSummary, Field, Notice, Section, btn, inputCls, type Tone } from "../ui";

const STATUS_TONE: Record<Reservation["status"], Tone> = {
  draft: "neutral",
  requested: "info",
  held: "warn",
  confirmed: "good",
  change_requested: "warn",
  cancellation_requested: "warn",
  cancelled: "neutral",
  declined: "bad",
  expired: "bad",
};

type DialogKind = "" | "new" | "request" | "hold" | "reply" | "change" | "cancel" | "cancelled";

/** Bookings (spec §8 OPS01–03): supplier requests, holds and evidenced confirmations per itinerary service. */
export default function Bookings({ trip }: { trip: TripFile }) {
  const { state, me, run } = useIos();
  const nowMs = useNow();
  const manage = can(me, "reservation.manage");
  const seeCost = can(me, "cost.view");
  const [dlg, setDlg] = useState<{ kind: DialogKind; serviceId?: string; resId?: string }>({ kind: "" });
  const [f, setF] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  if (trip.commercial !== "booked") {
    return <Empty title="No supplier reservations yet" body="Reservations start after the customer accepts a quotation. Until then, prices and suppliers live on the Itinerary." />;
  }

  const services = allServices(trip);
  const mand = services.filter((x) => x.s.mandatory);
  const done = mand.filter((x) => confirmedQty(trip, x.s) >= x.s.qty).length;
  const checks = opsChecks(trip, state.trips, nowMs).filter((c) => c.tab === "bookings" || c.tab === "itinerary");
  const service = dlg.serviceId ? services.find((x) => x.s.id === dlg.serviceId)?.s : undefined;
  const res = dlg.resId ? trip.reservations.find((r) => r.id === dlg.resId) : undefined;
  const resService = res ? services.find((x) => x.s.id === res.serviceId)?.s : undefined;

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const close = () => {
    setDlg({ kind: "" });
    setErrors([]);
  };
  const open = (kind: DialogKind, serviceId?: string, r?: Reservation, init: Record<string, string> = {}) => {
    setDlg({ kind, serviceId, resId: r?.id });
    setErrors([]);
    setF(init);
  };
  const handle = <T,>(r: { ok: true; value: T } | { ok: false; error: { message: string; fieldErrors?: { field: string; message: string }[] } }, success?: string) => {
    if (!r.ok) {
      setErrors(r.error.fieldErrors?.length ? r.error.fieldErrors : [{ field: "dlg", message: r.error.message }]);
      return false;
    }
    close();
    if (success) setMsg({ tone: "good", text: success });
    return true;
  };

  const supplierName = (id?: string) => state.companies.find((c) => c.id === id)?.name ?? "No supplier";
  const suppliersFor = (s: ServiceItem) => state.companies.filter((c) => c.roles.includes("supplier") && (!c.supplierTerms || c.supplierTerms.categories.includes(s.category)));

  const submit = () => {
    if (dlg.kind === "new" && service) {
      const qty = Number(f.qty);
      handle(run((s, m, now) => createReservation(s, m, trip.id, service.id, { supplierId: f.supplier ?? "", qty, amount: toMinor(Number(f.amount || 0)), currency: f.currency || service.costCurrency, deadline: f.deadline || undefined }, now)), "Reservation drafted. Send the request to the supplier, then record it here.");
      return;
    }
    if (!res) return;
    if (dlg.kind === "request") handle(run((s, m, now) => requestReservation(s, m, trip.id, res.id, f.evidence ?? "", now)), "Request recorded. Status: awaiting supplier reply.");
    if (dlg.kind === "hold") {
      const utc = f.expiry ? zonedToUtc(f.expiry, res.supplierTz) : "";
      handle(run((s, m, now) => recordHold(s, m, trip.id, res.id, { holdExpiry: utc, ref: f.ref ?? "", evidence: f.evidence ?? "" }, now)), "Hold recorded. It stays provisional and expires automatically.");
    }
    if (dlg.kind === "reply") {
      const r = run((s, m, now) =>
        recordReply(s, m, trip.id, res.id, res.version, {
          confirmer: f.confirmer ?? "",
          ref: f.ref ?? "",
          evidence: f.evidence ?? "",
          qty: Number(f.qty),
          startDate: f.start || undefined,
          endDate: f.end || undefined,
          amount: toMinor(Number(f.amount || 0)),
          requestVersion: Number(f.reqv),
        }, now)
      );
      if (handle(r) && r.ok) {
        const out: Record<ReplyOutcome, { tone: Tone; text: string }> = {
          confirmed: { tone: "good", text: "Confirmed with the supplier's evidence. The service now counts towards readiness." },
          discrepancy: { tone: "warn", text: "The reply differs from what was requested. Review the differences below before accepting." },
          conflict: { tone: "bad", text: "Not applied: the supplier answered an older request than the current specification. Send a change request." },
          rejected_expired: { tone: "bad", text: "Not applied: the hold had already expired. The reply is kept in history; check availability again." },
        };
        setMsg(out[r.value]);
      }
    }
    if (dlg.kind === "change") handle(run((s, m, now) => requestReservationChange(s, m, trip.id, res.id, f.note ?? "", now)), "Change request recorded. Record the supplier's reply when it arrives.");
    if (dlg.kind === "cancel") handle(run((s, m, now) => requestCancellation(s, m, trip.id, res.id, f.note ?? "", now)), res.status === "draft" ? "Draft discarded." : "Cancellation requested. The commitment stays until the supplier replies.");
    if (dlg.kind === "cancelled") handle(run((s, m, now) => recordCancelled(s, m, trip.id, res.id, { evidence: f.evidence ?? "", penalty: toMinor(Number(f.penalty || 0)), declined: f.declined === "1" }, now)), "Recorded.");
  };

  const requestVersions = (r: Reservation) => Array.from(new Set([r.requestVersion, ...r.events.filter((e) => e.requestVersion).map((e) => e.requestVersion!)])).sort((a, b) => b - a);

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Section title="Supplier reservations" actions={<Badge tone={done === mand.length && mand.length ? "good" : "warn"}>{done} of {mand.length} mandatory confirmed</Badge>}>
          <Notice tone="info">
            Booked does not mean confirmed. A service counts as confirmed only with the supplier&rsquo;s own reply and reference, against the current specification.
          </Notice>
          {msg && (
            <div role="status" aria-live="polite">
              <Notice tone={msg.tone}>{msg.text}</Notice>
            </div>
          )}
          {!services.length && <Empty title="No services on the itinerary" body="Add services on the Itinerary tab first." />}
          {services.map(({ s, date }) => {
            const list = trip.reservations.filter((r) => r.serviceId === s.id);
            const cq = confirmedQty(trip, s);
            return (
              <Card key={s.id} id={`svc-${s.id}`} className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ebe8e5] bg-[#fbfaf9] px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">
                      {CATEGORY_LABEL[s.category]} · {date ? fmtDate(date) : "No date"} · spec v{s.specVersion}
                    </div>
                    <div className="text-[16px] font-bold">{s.name}</div>
                    <div className="text-[14px] text-[#5b5754]">
                      Needs {s.qty} · {s.mandatory ? "Mandatory" : "Optional"} · Planned supplier: {supplierName(s.supplierId)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={cq >= s.qty ? "good" : cq > 0 ? "warn" : "neutral"}>{cq >= s.qty ? "Confirmed" : `${cq} of ${s.qty} confirmed`}</Badge>
                    {manage && (
                      <button
                        type="button"
                        className={btn.secondary}
                        onClick={() => {
                          const covered = list.filter((r) => r.active && !["cancelled", "declined", "expired"].includes(r.status)).reduce((a, r) => a + r.qty, 0);
                          const qty = Math.max(s.qty - covered, 1);
                          open("new", s.id, undefined, { supplier: s.supplierId ?? "", qty: String(qty), amount: s.unitCost !== undefined ? String(toMajor(s.unitCost * qty)) : "", currency: s.costCurrency });
                        }}
                      >
                        {list.length ? "Add another request" : "Draft request"}
                      </button>
                    )}
                  </div>
                </div>
                {list.length === 0 ? (
                  <p className="px-4 py-3 text-[15px] text-[#6b6764]">No supplier request yet.</p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {list.map((r) => {
                      const outdated = r.requestVersion < s.specVersion && !["cancelled", "declined", "expired"].includes(r.status);
                      const expSoon = r.status === "held" && r.holdExpiry && nowMs && Date.parse(r.holdExpiry) - nowMs < 24 * 3600000;
                      return (
                        <li key={r.id} className={`border-t border-[#ebe8e5] px-4 py-3 first:border-t-0 ${r.active ? "" : "bg-[#fbfaf9]"}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={STATUS_TONE[r.status]}>{RESERVATION_LABEL[r.status]}</Badge>
                                {!r.active && <Badge>Alternative · not selected</Badge>}
                                {outdated && <Badge tone="bad">Requested v{r.requestVersion}, now v{s.specVersion}</Badge>}
                                {r.discrepancy && <Badge tone="warn">Reply differs</Badge>}
                                <span className="text-[15px] font-semibold">{supplierName(r.supplierId)}</span>
                              </div>
                              <div className="mt-1 text-[14px] text-[#5b5754]">
                                {r.qty} × · {r.startDate ? `${fmtDate(r.startDate)}${r.endDate && r.endDate !== r.startDate ? ` – ${fmtDate(r.endDate)}` : ""}` : "No dates"}
                                {seeCost && ` · ${fmtMoney(r.amount, r.currency)}`}
                                {r.deadline && ` · Option deadline ${fmtDate(r.deadline)}`}
                              </div>
                              {r.status === "held" && r.holdExpiry && (
                                <div className={`mt-1 text-[14px] ${expSoon ? "font-semibold text-[#8a1f17]" : "text-[#5b5754]"}`}>
                                  Hold expires {fmtDateTime(r.holdExpiry, r.supplierTz)} supplier time ({fmtDateTime(r.holdExpiry, "UTC")} UTC)
                                </div>
                              )}
                              {r.confirmation && r.status === "confirmed" && (
                                <div className="mt-1 text-[14px] text-[#1e5b2b]">
                                  Ref {r.confirmation.ref} · confirmed by {r.confirmation.confirmer} · recorded {fmtDateTime(r.confirmation.at, state.settings.timezone)} by {memberName(state, r.confirmation.by)}
                                </div>
                              )}
                            </div>
                            {manage && (
                              <div className="flex flex-wrap gap-1.5">
                                {r.status === "draft" && (
                                  <>
                                    <button type="button" className={btn.primary} onClick={() => open("request", s.id, r)}>Record request sent</button>
                                    <button type="button" className={btn.ghost} onClick={() => open("cancel", s.id, r)}>Discard</button>
                                  </>
                                )}
                                {r.status === "requested" && <button type="button" className={btn.secondary} onClick={() => open("hold", s.id, r)}>Record hold</button>}
                                {["requested", "held", "change_requested"].includes(r.status) && !r.discrepancy && (
                                  <button type="button" className={btn.primary} onClick={() => open("reply", s.id, r, { qty: String(r.qty), start: r.startDate ?? "", end: r.endDate ?? "", amount: String(toMajor(r.amount)), reqv: String(r.requestVersion) })}>
                                    Record supplier reply
                                  </button>
                                )}
                                {["requested", "held", "confirmed", "change_requested"].includes(r.status) && <button type="button" className={btn.secondary} onClick={() => open("change", s.id, r)}>Request change</button>}
                                {["requested", "held", "confirmed", "change_requested"].includes(r.status) && <button type="button" className={btn.ghost} onClick={() => open("cancel", s.id, r)}>Request cancellation</button>}
                                {["cancellation_requested", "requested"].includes(r.status) && <button type="button" className={btn.ghost} onClick={() => open("cancelled", s.id, r, { declined: r.status === "requested" ? "1" : "" })}>Record cancel or decline</button>}
                                {!["cancelled", "declined", "expired"].includes(r.status) && (
                                  <button type="button" className={btn.ghost} onClick={() => setMsg(((x) => (x.ok ? { tone: "good", text: r.active ? "Kept as an alternative." : "Selected as the active reservation." } : { tone: "bad", text: x.error.message }))(run((st, m, now) => setReservationActive(st, m, trip.id, r.id, !r.active, now))))}>
                                    {r.active ? "Deselect" : "Select as active"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {r.discrepancy && (
                            <div className="mt-3 rounded-[6px] border border-[#f2d48a] bg-[#fff6e0] p-3">
                              <p className="text-[15px] font-bold text-[#714e04]">Supplier reply {r.discrepancy.reply.ref} differs from the request</p>
                              <table className="mt-2 w-full border-collapse text-[14px]">
                                <thead>
                                  <tr className="text-left text-[#6b6764]">
                                    <th className="py-1 pr-3 font-semibold">Field</th>
                                    <th className="py-1 pr-3 font-semibold">Requested</th>
                                    <th className="py-1 font-semibold">Supplier replied</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.discrepancy.fields.filter((x) => seeCost || x.field !== "Amount").map((x) => (
                                    <tr key={x.field} className="border-t border-[#f2d48a]">
                                      <td className="py-1 pr-3 font-semibold">{x.field}</td>
                                      <td className="py-1 pr-3">{x.requested}</td>
                                      <td className="py-1">{x.replied}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {manage && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button type="button" className={btn.secondary} onClick={() => setMsg(((x) => (x.ok ? { tone: "good", text: "Accepted the supplier's terms; reservation confirmed." } : { tone: "bad", text: x.error.message }))(run((st, m, now) => resolveDiscrepancy(st, m, trip.id, r.id, true, now))))}>
                                    Accept supplier&rsquo;s terms
                                  </button>
                                  <button type="button" className={btn.ghost} onClick={() => setMsg(((x) => (x.ok ? { tone: "info", text: "Reply rejected; the request stays open." } : { tone: "bad", text: x.error.message }))(run((st, m, now) => resolveDiscrepancy(st, m, trip.id, r.id, false, now))))}>
                                    Reject reply
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          <details className="mt-2 text-[14px]">
                            <summary className="cursor-pointer font-semibold text-[#875e00]">History and evidence ({r.events.length})</summary>
                            <ol className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                              {r.events.map((e) => (
                                <li key={e.id} className="border-l-2 border-[#dcd9d6] pl-3">
                                  <div className="text-[13px] text-[#6b6764]">
                                    {fmtDateTime(e.at, state.settings.timezone)} · {e.by === "system" ? "System" : memberName(state, e.by)}
                                  </div>
                                  <div>{e.text}</div>
                                  {e.evidence && <blockquote className="m-0 mt-1 border-l-2 border-[#c7d6ee] bg-[#f6f8fc] px-2 py-1 text-[#1f3f73]">{e.evidence}</blockquote>}
                                </li>
                              ))}
                            </ol>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })}
        </Section>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Checks">
          <Card className="p-4">
            {checks.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
                {checks.map((c) => (
                  <li key={c.key} className="flex items-start gap-2">
                    <Badge tone={c.severity === "block" ? "bad" : "warn"}>{c.severity === "block" ? "Blocks" : "Check"}</Badge>
                    <a href={c.serviceId ? `#svc-${c.serviceId}` : undefined}>{c.text}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-[#6b6764]">No capacity, date, version or hold problems found.</p>
            )}
          </Card>
        </Section>
        <Section title="How this works">
          <Card className="p-4 text-[15px] text-[#3b3836]">
            <ol className="m-0 flex flex-col gap-1.5 pl-5">
              <li>Draft a request per service and supplier. Extra enquiries stay as alternatives until selected.</li>
              <li>Record that you sent it, with the message as evidence.</li>
              <li>Record holds with their expiry; expired holds never come back by themselves.</li>
              <li>Record the reply. Only a reply that matches the current request confirms the service.</li>
            </ol>
          </Card>
        </Section>
      </div>

      <Dialog
        open={dlg.kind !== ""}
        wide={dlg.kind === "reply"}
        title={
          {
            "": "",
            new: `Draft request · ${service?.name ?? ""}`,
            request: "Record request sent",
            hold: "Record supplier hold",
            reply: "Record supplier reply",
            change: "Request a change",
            cancel: res?.status === "draft" ? "Discard draft" : "Request cancellation",
            cancelled: "Record cancellation or decline",
          }[dlg.kind]
        }
        onClose={close}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={close}>Cancel</button>
            <button type="button" className={dlg.kind === "cancel" || dlg.kind === "cancelled" ? btn.danger : btn.primary} onClick={submit}>
              {{ "": "", new: "Save draft", request: "Record as sent", hold: "Record hold", reply: "Record reply", change: "Record change request", cancel: res?.status === "draft" ? "Discard" : "Record request", cancelled: "Record" }[dlg.kind]}
            </button>
          </>
        }
      >
        <ErrorSummary errors={errors} />
        {dlg.kind === "new" && service && (
          <>
            <Field id="rs-supplier" label="Supplier" required>
              <select id="rs-supplier" className={inputCls} value={f.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)}>
                <option value="">Choose…</option>
                {suppliersFor(service).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="rs-qty" label="Quantity" required hint={`Service needs ${service.qty}.`}>
                <input id="rs-qty" type="number" min={1} className={inputCls} value={f.qty ?? ""} onChange={(e) => set("qty", e.target.value)} />
              </Field>
              <Field id="rs-deadline" label="Option deadline">
                <input id="rs-deadline" type="date" className={inputCls} value={f.deadline ?? ""} onChange={(e) => set("deadline", e.target.value)} />
              </Field>
            </div>
            {seeCost && (
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field id="rs-amount" label="Expected amount" hint="Total for this reservation.">
                  <input id="rs-amount" type="number" min={0} className={inputCls} value={f.amount ?? ""} onChange={(e) => set("amount", e.target.value)} />
                </Field>
                <Field id="rs-cur" label="Currency">
                  <input id="rs-cur" maxLength={3} className={inputCls} value={f.currency ?? ""} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
                </Field>
              </div>
            )}
          </>
        )}
        {dlg.kind === "request" && res && (
          <>
            <p className="text-[15px] text-[#5b5754]">This records that the request left your company. It does not send anything.</p>
            <Field id="rq-evidence" label="How it was sent" required hint="For example: email subject, LINE message, or phone call with name and time.">
              <textarea id="rq-evidence" rows={3} className={inputCls} value={f.evidence ?? ""} onChange={(e) => set("evidence", e.target.value)} />
            </Field>
          </>
        )}
        {dlg.kind === "hold" && res && (
          <>
            <Field id="hd-exp" label={`Hold expires (supplier time, ${res.supplierTz})`} required>
              <input id="hd-exp" type="datetime-local" className={inputCls} value={f.expiry ?? ""} onChange={(e) => set("expiry", e.target.value)} />
            </Field>
            <Field id="hd-ref" label="Supplier hold reference">
              <input id="hd-ref" className={inputCls} value={f.ref ?? ""} onChange={(e) => set("ref", e.target.value)} />
            </Field>
            <Field id="hd-ev" label="Supplier's message" required>
              <textarea id="hd-ev" rows={3} className={inputCls} value={f.evidence ?? ""} onChange={(e) => set("evidence", e.target.value)} />
            </Field>
          </>
        )}
        {dlg.kind === "reply" && res && resService && (
          <>
            {res.requestVersion < resService.specVersion && (
              <Notice tone="bad">
                The specification changed to v{resService.specVersion} after this request (v{res.requestVersion}). A reply to the old request will be logged but not applied.
              </Notice>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <Field id="rp-who" label="Confirmed by (supplier person)" required>
                <input id="rp-who" className={inputCls} value={f.confirmer ?? ""} onChange={(e) => set("confirmer", e.target.value)} />
              </Field>
              <Field id="rp-ref" label="Supplier reference" required>
                <input id="rp-ref" className={inputCls} value={f.ref ?? ""} onChange={(e) => set("ref", e.target.value)} />
              </Field>
            </div>
            <Field id="rp-reqv" label="The supplier is answering">
              <select id="rp-reqv" className={inputCls} value={f.reqv ?? ""} onChange={(e) => set("reqv", e.target.value)}>
                {requestVersions(res).map((v) => (
                  <option key={v} value={v}>
                    Request for specification v{v}
                    {v === resService.specVersion ? " (current)" : " (outdated)"}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="rp-ev" label="Supplier's reply (paste their words)" required hint="A note such as “emailed hotel” is not evidence.">
              <textarea id="rp-ev" rows={4} className={inputCls} value={f.evidence ?? ""} onChange={(e) => set("evidence", e.target.value)} />
            </Field>
            <p className="text-[14px] text-[#5b5754]">What the supplier confirmed. Prefilled with your request; change anything that differs.</p>
            <div className={`grid gap-3 ${seeCost ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              <Field id="rp-qty" label="Quantity">
                <input id="rp-qty" type="number" min={0} className={inputCls} value={f.qty ?? ""} onChange={(e) => set("qty", e.target.value)} />
              </Field>
              <Field id="rp-start" label="From">
                <input id="rp-start" type="date" className={inputCls} value={f.start ?? ""} onChange={(e) => set("start", e.target.value)} />
              </Field>
              <Field id="rp-end" label="To">
                <input id="rp-end" type="date" className={inputCls} value={f.end ?? ""} min={f.start || undefined} onChange={(e) => set("end", e.target.value)} />
              </Field>
              {seeCost && (
                <Field id="rp-amount" label={`Amount (${res.currency})`}>
                  <input id="rp-amount" type="number" min={0} className={inputCls} value={f.amount ?? ""} onChange={(e) => set("amount", e.target.value)} />
                </Field>
              )}
            </div>
          </>
        )}
        {dlg.kind === "change" && res && resService && (
          <>
            <p className="text-[15px] text-[#5b5754]">
              The request is updated to specification v{resService.specVersion}
              {resService.qty !== res.qty ? ` (${resService.qty} instead of ${res.qty})` : ""}. The current confirmation stops counting until the supplier reconfirms.
            </p>
            <Field id="ch-note" label="What you asked the supplier to change" required>
              <textarea id="ch-note" rows={3} className={inputCls} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </>
        )}
        {dlg.kind === "cancel" && res && res.status !== "draft" && (
          <Field id="cx-note" label="Note (optional)" hint="The commitment and any penalty remain until the supplier replies.">
            <textarea id="cx-note" rows={2} className={inputCls} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} />
          </Field>
        )}
        {dlg.kind === "cancel" && res?.status === "draft" && <p className="text-[15px]">The draft was never sent, so it is removed without a supplier record.</p>}
        {dlg.kind === "cancelled" && res && (
          <>
            <label className="flex items-center gap-2 text-[15px]">
              <input type="checkbox" checked={f.declined === "1"} onChange={(e) => set("declined", e.target.checked ? "1" : "")} /> The supplier declined (no availability)
            </label>
            <Field id="cx-ev" label="Supplier's message" required>
              <textarea id="cx-ev" rows={3} className={inputCls} value={f.evidence ?? ""} onChange={(e) => set("evidence", e.target.value)} />
            </Field>
            {seeCost && (
              <Field id="cx-pen" label={`Penalty charged (${res.currency})`}>
                <input id="cx-pen" type="number" min={0} className={inputCls} value={f.penalty ?? ""} onChange={(e) => set("penalty", e.target.value)} />
              </Field>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}
