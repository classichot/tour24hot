"use client";

import Link from "next/link";
import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { DOC_LABEL, generateDocument, issueDocument, recordDelivery, revokeDocument } from "@/lib/ios/ops";
import { allServices, can, confirmedQty, docOutdated, fmtDateTime, memberName } from "@/lib/ios/rules";
import type { DocumentType, TripDocument, TripFile } from "@/lib/ios/types";
import { Badge, Card, Dialog, ErrorSummary, Field, Notice, Section, btn, inputCls, type Tone } from "../ui";

type Err = { field: string; message: string }[];

const VIS: Record<TripDocument["visibility"], string> = { customer: "For the customer", supplier: "For the supplier", internal: "Internal" };

export const GUEST_DOCS: DocumentType[] = ["rooming", "pickup", "runsheet"];

/** Trip documents (DOC01–04): prepared from current records, issued as frozen versions, outdated when sources change. */
export default function Documents({ trip }: { trip: TripFile }) {
  const { state, me, run } = useIos();
  const manage = can(me, "document.issue");
  const seeGuests = can(me, "guest.view");
  const [errors, setErrors] = useState<Err>([]);
  const [msg, setMsg] = useState("");
  const [dlg, setDlg] = useState<{ kind: "" | "deliver" | "revoke"; doc?: TripDocument }>({ kind: "" });
  const [to, setTo] = useState("");
  const [channel, setChannel] = useState("email");
  const [reason, setReason] = useState("");

  if (trip.commercial !== "booked") {
    return (
      <Section title="Trip documents">
        <Card className="p-4 text-[15px] text-[#5b5754]">Itineraries, vouchers, rooming and pickup lists are prepared after the trip is booked. Quotations are on the Money tab.</Card>
      </Section>
    );
  }

  const cats = new Set(allServices(trip).map((x) => x.s.category));
  const slots: { type: DocumentType; serviceId?: string; label: string }[] = [
    { type: "itinerary", label: DOC_LABEL.itinerary },
    ...(seeGuests ? [{ type: "runsheet" as const, label: DOC_LABEL.runsheet }] : []),
    ...(seeGuests && cats.has("hotel") ? [{ type: "rooming" as const, label: DOC_LABEL.rooming }] : []),
    ...(seeGuests && cats.has("transport") ? [{ type: "pickup" as const, label: DOC_LABEL.pickup }] : []),
    ...allServices(trip)
      .filter(({ s }) => confirmedQty(trip, s) > 0 || trip.documents.some((d) => d.type === "voucher" && d.serviceId === s.id))
      .map(({ s }) => ({ type: "voucher" as const, serviceId: s.id, label: `${DOC_LABEL.voucher}: ${s.name}` })),
  ];

  const act = (fn: Parameters<typeof run>[0], ok: string) => {
    const r = run(fn);
    setErrors(r.ok ? [] : r.error.fieldErrors?.length ? r.error.fieldErrors : [{ field: "doc", message: r.error.message }]);
    setMsg(r.ok ? ok : "");
    return r.ok;
  };

  return (
    <Section title="Trip documents" id="documents">
      {msg && (
        <div role="status" aria-live="polite">
          <Notice tone="good">{msg}</Notice>
        </div>
      )}
      <ErrorSummary title="Can't prepare this document yet" errors={errors} />
      <Card>
        <ul id="field-doc" className="m-0 list-none p-0">
          {slots.map((slot) => {
            const versions = trip.documents.filter((d) => d.type === slot.type && d.serviceId === slot.serviceId).sort((a, b) => b.version - a.version);
            const latest = versions[0];
            const issued = versions.find((d) => d.status === "issued");
            const draft = versions.find((d) => d.status === "draft");
            const outdated = issued ? docOutdated(trip, issued) : false;
            const draftOutdated = draft ? docOutdated(trip, draft) : false;
            let tone: Tone = "neutral";
            let label = "Not prepared";
            if (issued && !outdated) [tone, label] = ["good", `Issued v${issued.version}`];
            else if (issued && outdated) [tone, label] = ["bad", `v${issued.version} outdated — reissue`];
            else if (draft) [tone, label] = ["warn", `Draft v${draft.version}`];
            else if (latest) [tone, label] = ["neutral", `v${latest.version} ${latest.status}`];
            return (
              <li key={`${slot.type}:${slot.serviceId ?? ""}`} className="border-t border-[#ebe8e5] px-4 py-3 first:border-t-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[16px] font-bold">{slot.label}</span>
                      <Badge tone={tone}>{label}</Badge>
                      {latest && <Badge>{VIS[latest.visibility]}</Badge>}
                    </div>
                    {issued && (
                      <div className="mt-1 text-[14px] text-[#5b5754]">
                        Issued {fmtDateTime(issued.generatedAt, state.settings.timezone)} by {memberName(state, issued.generatedBy)} · checksum <span className="font-mono">{issued.checksum}</span>
                        {issued.deliveries.length > 0 && ` · delivered to ${issued.deliveries.map((d) => `${d.to} (${d.channel})`).join(", ")}`}
                      </div>
                    )}
                    {draft && draftOutdated && <div className="mt-1 text-[14px] font-semibold text-[#8a1f17]">The trip changed after this draft was prepared; prepare it again.</div>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {draft && <Link href={`/os/trips/${trip.id}/print/doc/${draft.id}`} target="_blank" className={btn.ghost}>Preview draft</Link>}
                    {issued && <Link href={`/os/trips/${trip.id}/print/doc/${issued.id}`} target="_blank" className={btn.ghost}>Open issued</Link>}
                    {manage && (!draft || draftOutdated) && (
                      <button type="button" className={issued && !outdated ? btn.secondary : btn.primary} onClick={() => act((s, m, now) => generateDocument(s, m, trip.id, slot.type, slot.serviceId, now), `${slot.label}: draft prepared from current records. Review it, then issue.`)}>
                        {issued ? "Prepare new version" : "Prepare"}
                      </button>
                    )}
                    {manage && draft && !draftOutdated && (
                      <button type="button" className={btn.primary} onClick={() => act((s, m, now) => issueDocument(s, m, trip.id, draft.id, now), `${slot.label} v${draft.version} issued and frozen.`)}>
                        Issue v{draft.version}
                      </button>
                    )}
                    {manage && issued && (
                      <>
                        <button type="button" className={btn.ghost} onClick={() => { setTo(""); setChannel("email"); setDlg({ kind: "deliver", doc: issued }); }}>Record delivery</button>
                        <button type="button" className={btn.ghost} onClick={() => { setReason(""); setDlg({ kind: "revoke", doc: issued }); }}>Revoke</button>
                      </>
                    )}
                  </div>
                </div>
                {versions.length > 1 && (
                  <details className="mt-2 text-[14px]">
                    <summary className="cursor-pointer font-semibold text-[#875e00]">All versions ({versions.length})</summary>
                    <ul className="m-0 mt-1 list-none p-0">
                      {versions.map((d) => (
                        <li key={d.id} className="py-0.5">
                          <Link href={`/os/trips/${trip.id}/print/doc/${d.id}`} target="_blank">v{d.version}</Link> · {d.status} · {fmtDateTime(d.generatedAt, state.settings.timezone)} · {memberName(state, d.generatedBy)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="text-[14px] text-[#6b6764]">Issued documents are frozen copies. When the itinerary, guest list or reservations change they are marked outdated, never silently rewritten.</p>

      <Dialog
        open={dlg.kind !== ""}
        title={dlg.kind === "deliver" ? "Record delivery" : "Revoke document"}
        onClose={() => setDlg({ kind: "" })}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setDlg({ kind: "" })}>Cancel</button>
            <button
              type="button"
              className={dlg.kind === "revoke" ? btn.danger : btn.primary}
              onClick={() => {
                const d = dlg.doc!;
                const ok = dlg.kind === "deliver"
                  ? act((s, m, now) => recordDelivery(s, m, trip.id, d.id, to, channel, now), "Delivery recorded.")
                  : act((s, m, now) => revokeDocument(s, m, trip.id, d.id, reason, now), "Revoked. Copies already sent can't be recalled; tell the recipient.");
                if (ok) setDlg({ kind: "" });
              }}
            >
              {dlg.kind === "deliver" ? "Record" : "Revoke"}
            </button>
          </>
        }
      >
        <ErrorSummary errors={errors} />
        {dlg.kind === "deliver" ? (
          <>
            <p className="text-[15px] text-[#5b5754]">Records that you sent v{dlg.doc?.version}. Nothing is sent from here.</p>
            <Field id="dl-to" label="Sent to" required>
              <input id="dl-to" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field id="dl-ch" label="Channel">
              <select id="dl-ch" className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
                {["email", "whatsapp", "wechat", "line", "printed", "other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <Field id="rv-reason" label="Reason">
            <input id="rv-reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
      </Dialog>
    </Section>
  );
}
