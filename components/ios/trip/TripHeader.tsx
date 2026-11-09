"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { markLost, reopen, reuseTrip, updateTrip } from "@/lib/ios/domain";
import { COMMERCIAL_LABEL, FINANCIAL_LABEL, OPERATIONAL_LABEL, canManageTrip, computeReadiness, customerLabel, fmtRange, guestCount, memberName, nextAction } from "@/lib/ios/rules";
import type { TripFile } from "@/lib/ios/types";
import { Badge, Dialog, Field, btn, inputCls } from "../ui";
import { COMMERCIAL_TONE, OPERATIONAL_TONE } from "../tripList";

/** Workspace header (TRP01): identity, three separate status indicators, next action, secondary actions. */
export default function TripHeader({ trip }: { trip: TripFile }) {
  const { state, me, today, run } = useIos();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<"" | "owner" | "lost" | "reopen">("");
  const [owner, setOwner] = useState(trip.ownerId ?? "");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const na = nextAction(trip, today);
  const ready = computeReadiness(trip, today);
  const mandatory = ready.mandatory;
  const manage = canManageTrip(me, trip);

  const close = () => {
    setDialog("");
    setErr("");
    setReason("");
  };

  return (
    <header className="flex flex-col gap-4 rounded-[8px] border border-[#dcd9d6] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#6b6764]">
            <Link href={trip.commercial === "booked" || trip.commercial === "cancelled" ? "/os/trips" : "/os/sales"} className="font-semibold">
              ← {trip.commercial === "booked" || trip.commercial === "cancelled" ? "Trips" : "Sales"}
            </Link>
            <span className="font-mono">{trip.ref}</span>
            {trip.sample && <Badge>Sample</Badge>}
            {trip.externalRef && <span>Partner ref {trip.externalRef}</span>}
          </div>
          <h1 className="mt-1 text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-[-0.02em]">{trip.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-[#3b3836]">
            <span>{customerLabel(state, trip)}</span>
            <span>{fmtRange(trip.startDate, trip.endDate, trip.flexibleDates)}</span>
            <span>
              {guestCount(trip) ? `${trip.adults || 0} adults${trip.children ? `, ${trip.children} children` : ""}${trip.infants ? `, ${trip.infants} infants` : ""}` : "Guests not set"}
            </span>
            <span>Owner: {memberName(state, trip.ownerId)}</span>
            {trip.commercial === "booked" && <span>Operations: {memberName(state, trip.opsOwnerId)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`?tab=${na.tab}`} scroll={false} className={btn.primary}>
            {na.label}
          </Link>
          <div className="relative">
            <button type="button" className={btn.secondary} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
              More actions
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 z-30 mt-1 flex w-[240px] flex-col rounded-[6px] border border-[#c9c5c1] bg-white p-1 shadow-[0_12px_30px_rgba(0,0,0,0.15)]" onMouseLeave={() => setMenu(false)}>
                {manage && trip.commercial !== "lost" && (
                  <button role="menuitem" type="button" className="cursor-pointer rounded-[4px] border-0 bg-transparent px-3 py-2 text-left text-[15px] hover:bg-[#f3f2f1]" onClick={() => { setMenu(false); setDialog("owner"); }}>
                    Assign owner
                  </button>
                )}
                {manage && ["enquiry", "quoting", "awaiting"].includes(trip.commercial) && (
                  <button role="menuitem" type="button" className="cursor-pointer rounded-[4px] border-0 bg-transparent px-3 py-2 text-left text-[15px] hover:bg-[#f3f2f1]" onClick={() => { setMenu(false); setDialog("lost"); }}>
                    Close as lost
                  </button>
                )}
                {manage && trip.commercial === "lost" && (
                  <button role="menuitem" type="button" className="cursor-pointer rounded-[4px] border-0 bg-transparent px-3 py-2 text-left text-[15px] hover:bg-[#f3f2f1]" onClick={() => { setMenu(false); setDialog("reopen"); }}>
                    Reopen enquiry
                  </button>
                )}
                <button
                  role="menuitem"
                  type="button"
                  className="cursor-pointer rounded-[4px] border-0 bg-transparent px-3 py-2 text-left text-[15px] hover:bg-[#f3f2f1]"
                  onClick={() => {
                    setMenu(false);
                    const r = run((s, m, now) => reuseTrip(s, m, trip.id, now));
                    if (r.ok) router.push(`/os/trips/${r.value.id}?tab=overview`);
                  }}
                >
                  Reuse as a new enquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[6px] bg-[#f7f6f5] px-3 py-2.5">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">Commercial</div>
          <div className="mt-1"><Badge tone={COMMERCIAL_TONE[trip.commercial]}>{COMMERCIAL_LABEL[trip.commercial]}</Badge></div>
        </div>
        <div className="rounded-[6px] bg-[#f7f6f5] px-3 py-2.5">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">Service readiness · Operations</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {trip.commercial === "booked" ? (
              <Badge tone={!mandatory ? "neutral" : ready.confirmed === mandatory ? "good" : "warn"}>{mandatory ? `${ready.confirmed} of ${mandatory} confirmed` : "No services yet"}</Badge>
            ) : (
              <Badge tone="neutral">Not booked</Badge>
            )}
            <Badge tone={OPERATIONAL_TONE[trip.operational]}>{OPERATIONAL_LABEL[trip.operational]}</Badge>
          </div>
        </div>
        <div className="rounded-[6px] bg-[#f7f6f5] px-3 py-2.5">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">Financial</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge>{FINANCIAL_LABEL[trip.financial]}</Badge>
            <Badge tone="neutral">{trip.commercial === "booked" ? "Nothing received yet" : "No charges yet"}</Badge>
          </div>
        </div>
      </div>
      {na.reason && <p className="text-[15px] font-semibold text-[#8a1f17]">{na.reason}</p>}

      <Dialog
        open={dialog === "owner"}
        title="Assign owner"
        onClose={close}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={close}>Cancel</button>
            <button type="button" className={btn.primary} onClick={() => {
              const r = run((s, m, now) => updateTrip(s, m, trip.id, trip.version, { ownerId: owner || undefined }, now));
              if (!r.ok) setErr(r.error.message);
              else close();
            }}>Assign {state.members.find((m) => m.id === owner)?.name ?? "nobody"}</button>
          </>
        }
      >
        {err && <p role="alert" className="font-semibold text-[#8a1f17]">{err}</p>}
        <Field id="ow" label="Sales owner">
          <select id="ow" className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">Unassigned</option>
            {state.members.filter((m) => m.role === "sales" || m.role === "manager").map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </Field>
      </Dialog>

      <Dialog
        open={dialog === "lost" || dialog === "reopen"}
        title={dialog === "lost" ? "Close as lost" : "Reopen enquiry"}
        onClose={close}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={close}>Cancel</button>
            <button type="button" className={dialog === "lost" ? btn.danger : btn.primary} onClick={() => {
              const r = run((s, m, now) => (dialog === "lost" ? markLost(s, m, trip.id, reason, now) : reopen(s, m, trip.id, reason, now)));
              if (!r.ok) setErr(r.error.message);
              else close();
            }}>{dialog === "lost" ? "Close as lost" : "Reopen on the same trip file"}</button>
          </>
        }
      >
        <p className="text-[15px] text-[#5b5754]">{dialog === "lost" ? "History is kept. You can reopen it later on the same trip file." : "The enquiry returns to Sales with its full history."}</p>
        <Field id="lr" label={dialog === "lost" ? "Lost reason" : "Reason for reopening"} required error={err || undefined}>
          <input id="lr" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>
    </header>
  );
}
