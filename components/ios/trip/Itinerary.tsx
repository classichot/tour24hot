"use client";

import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { saveItinerary, uid } from "@/lib/ios/domain";
import { BASIS_LABEL, CATEGORY_LABEL, addDays, can, fmtDate, fmtMoney, toMajor, toMinor } from "@/lib/ios/rules";
import type { Company, ItineraryDay, PricingBasis, Rate, ServiceCategory, ServiceItem, TripFile } from "@/lib/ios/types";
import { Badge, Card, Empty, Field, Notice, Saving, btn, inputCls } from "../ui";
import { useAutosave } from "./useAutosave";

const CATS: ServiceCategory[] = ["hotel", "transport", "guide", "meal", "attraction", "other"];
const BASES: PricingBasis[] = ["per_person", "per_room_night", "per_vehicle", "per_group", "per_unit"];

/** Category fields (QUO02). Custom "other" items keep free notes without weakening known categories. */
const SPEC: Record<ServiceCategory, { key: string; label: string; type?: string }[]> = {
  hotel: [{ key: "checkIn", label: "Check-in", type: "date" }, { key: "checkOut", label: "Check-out", type: "date" }, { key: "roomType", label: "Room type" }, { key: "rooms", label: "Rooms", type: "number" }],
  transport: [{ key: "pickup", label: "Pickup" }, { key: "dropoff", label: "Drop-off" }, { key: "capacity", label: "Seats", type: "number" }, { key: "luggage", label: "Luggage notes" }],
  guide: [{ key: "language", label: "Language" }, { key: "hours", label: "Working interval" }],
  meal: [{ key: "mealDate", label: "Meal date", type: "date" }, { key: "guests", label: "Guest count", type: "number" }],
  attraction: [{ key: "ticketType", label: "Ticket type" }, { key: "ageBand", label: "Age band" }],
  other: [],
};

const DEFAULT_BASIS: Record<ServiceCategory, PricingBasis> = { hotel: "per_room_night", transport: "per_vehicle", guide: "per_group", meal: "per_person", attraction: "per_person", other: "per_unit" };

export default function Itinerary({ trip }: { trip: TripFile }) {
  const { state, me, run } = useIos();
  const [days, setDays] = useState<ItineraryDay[]>(trip.itinerary);
  const [base, setBase] = useState(trip.version);
  const [dirty, setDirty] = useState(false);
  const [drag, setDrag] = useState<{ day: number; idx: number } | null>(null);
  const locked = trip.commercial === "booked" || trip.commercial === "cancelled" || trip.commercial === "lost" || !can(me, "itinerary.edit");
  const showCost = can(me, "cost.view");

  if (!dirty && trip.version !== base) {
    setDays(trip.itinerary);
    setBase(trip.version);
  }

  const auto = useAutosave<{ d: ItineraryDay[]; v: number }>(({ d, v }) => {
    const r = run((s, m, now) => saveItinerary(s, m, trip.id, v, d, now));
    if (r.ok) {
      setBase(r.value.version);
      setDirty(false);
      return { ok: true };
    }
    return r;
  });

  const commit = (next: ItineraryDay[]) => {
    setDays(next);
    setDirty(true);
    auto.queue({ d: next, v: base });
  };
  const setDay = (i: number, patch: Partial<ItineraryDay>) => commit(days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const setSvc = (di: number, si: number, patch: Partial<ServiceItem>) => setDay(di, { services: days[di].services.map((s, j) => (j === si ? { ...s, ...patch } : s)) });
  const move = <T,>(arr: T[], from: number, to: number) => {
    const a = [...arr];
    const [x] = a.splice(from, 1);
    a.splice(to, 0, x);
    return a;
  };
  const suppliersFor = (c: ServiceCategory) => state.companies.filter((co) => co.roles.includes("supplier") && (c === "other" || co.supplierTerms?.categories.includes(c)));
  const rateFor = (s: ServiceItem): Rate | undefined => state.companies.find((c) => c.id === s.supplierId)?.rates.find((r) => r.id === s.rateId);
  const rateExpired = (r: Rate | undefined) => !!r && !!trip.startDate && r.validTo < trip.startDate;
  const dayCost = (d: ItineraryDay) => d.services.reduce((a, s) => a + (s.unitCost ?? 0) * s.qty, 0);
  const total = days.reduce((a, d) => a + dayCost(d), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[15px] text-[#5b5754]">
          Itinerary version {trip.itineraryVersion} · {days.length} days · {days.reduce((a, d) => a + d.services.length, 0)} services
          {showCost && <> · estimated direct cost <strong className="text-[#201e1d]">{fmtMoney(total, state.settings.currency)}</strong></>}
        </div>
        <Saving state={auto.status} />
      </div>
      {locked && trip.commercial === "booked" && <Notice tone="info">The accepted itinerary is locked. Changes after acceptance go through a change proposal with supplier reconfirmation (milestone C).</Notice>}
      {locked && !can(me, "itinerary.edit") && <Notice tone="warn">Your role can view the itinerary but not edit it.</Notice>}
      {auto.status === "conflict" && (
        <div role="alert" className="rounded-[6px] border-2 border-[#d9534f] bg-[#fdeceb] px-4 py-3 text-[15px]">
          <p className="font-bold text-[#8a1f17]">Someone else saved itinerary version {trip.itineraryVersion} while you were editing. Your changes were not saved.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={btn.secondary} onClick={() => { setDays(trip.itinerary); setBase(trip.version); setDirty(false); auto.reset(); }}>Reload their version</button>
            <button type="button" className={btn.secondary} onClick={() => { setBase(trip.version); auto.queue({ d: days, v: trip.version }); auto.flush(); }}>Keep mine and save over theirs</button>
          </div>
        </div>
      )}
      {auto.status === "error" && auto.error && <Notice tone="bad">{auto.error.message}</Notice>}

      {!days.length && (
        <Empty
          title="No itinerary yet"
          body={trip.startDate ? `Build day by day from ${fmtDate(trip.startDate)}.` : "Add days now; set dates later in Overview."}
          action={!locked ? <button type="button" className={btn.primary} onClick={() => {
            const n = trip.startDate && trip.endDate ? Math.max(1, Math.round((Date.parse(trip.endDate) - Date.parse(trip.startDate)) / 86400000) + 1) : 1;
            commit(Array.from({ length: Math.min(n, 21) }, (_, i) => ({ id: uid(), title: `Day ${i + 1}`, destination: trip.destinations[0] ?? "", services: [] })));
          }}>Create days from trip dates</button> : undefined}
        />
      )}

      {days.map((d, di) => (
        <Card key={d.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[18px] font-extrabold">
              Day {di + 1}
              <span className="ml-2 text-[15px] font-semibold text-[#6b6764]">{trip.startDate ? fmtDate(addDays(trip.startDate, di)) : "date not set"}</span>
            </h3>
            {!locked && (
              <div className="flex gap-1">
                <button type="button" className={btn.ghost} disabled={di === 0} onClick={() => commit(move(days, di, di - 1))} aria-label={`Move day ${di + 1} up`}>Move up</button>
                <button type="button" className={btn.ghost} disabled={di === days.length - 1} onClick={() => commit(move(days, di, di + 1))} aria-label={`Move day ${di + 1} down`}>Move down</button>
                <button type="button" className={btn.ghost} onClick={() => commit(days.filter((_, j) => j !== di))} aria-label={`Remove day ${di + 1}`}>Remove day</button>
              </div>
            )}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <Field id={`dt-${d.id}`} label="Day title"><input id={`dt-${d.id}`} className={inputCls} disabled={locked} value={d.title} onChange={(e) => setDay(di, { title: e.target.value })} /></Field>
            <Field id={`dd-${d.id}`} label="Destination"><input id={`dd-${d.id}`} className={inputCls} disabled={locked} value={d.destination} onChange={(e) => setDay(di, { destination: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field id={`dn-${d.id}`} label="Notes"><textarea id={`dn-${d.id}`} className={`${inputCls} min-h-[60px]`} disabled={locked} value={d.notes ?? ""} onChange={(e) => setDay(di, { notes: e.target.value })} /></Field>
            </div>
          </div>

          <ol className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {d.services.map((s, si) => {
              const rate = rateFor(s);
              const expired = rateExpired(rate);
              return (
                <li
                  key={s.id}
                  draggable={!locked}
                  onDragStart={() => setDrag({ day: di, idx: si })}
                  onDragOver={(e) => { if (drag && drag.day === di) e.preventDefault(); }}
                  onDrop={() => { if (drag && drag.day === di && drag.idx !== si) setDay(di, { services: move(d.services, drag.idx, si) }); setDrag(null); }}
                  className="rounded-[6px] border border-[#dcd9d6] bg-[#fbfaf9] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {!locked && <span className="cursor-grab select-none text-[#6b6764]" aria-hidden title="Drag to reorder">⋮⋮</span>}
                      <Badge tone="info">{CATEGORY_LABEL[s.category]}</Badge>
                      <Badge tone={s.costSource === "contract" ? "good" : s.costSource === "manual" ? "neutral" : "warn"}>
                        {s.costSource === "contract" ? "Contract rate" : s.costSource === "manual" ? "Manual cost" : s.costSource === "estimate" ? "Estimate" : "No cost"}
                      </Badge>
                      {expired && <Badge tone="bad">Rate expired {fmtDate(rate!.validTo)} — revalidate</Badge>}
                      {s.revalidate && !expired && <Badge tone="warn">Rate requires reconfirmation</Badge>}
                      {!s.mandatory && <Badge>Optional</Badge>}
                      <Badge tone="warn">Not confirmed</Badge>
                    </div>
                    {!locked && (
                      <div className="flex gap-1">
                        <button type="button" className={btn.ghost} disabled={si === 0} onClick={() => setDay(di, { services: move(d.services, si, si - 1) })} aria-label={`Move ${s.name} up`}>Up</button>
                        <button type="button" className={btn.ghost} disabled={si === d.services.length - 1} onClick={() => setDay(di, { services: move(d.services, si, si + 1) })} aria-label={`Move ${s.name} down`}>Down</button>
                        <button type="button" className={btn.ghost} onClick={() => setDay(di, { services: d.services.filter((_, j) => j !== si) })} aria-label={`Remove ${s.name}`}>Remove</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Field id={`sn-${s.id}`} label="Service"><input id={`sn-${s.id}`} className={inputCls} disabled={locked} value={s.name} onChange={(e) => setSvc(di, si, { name: e.target.value })} /></Field>
                    </div>
                    <Field id={`sc-${s.id}`} label="Category">
                      <select id={`sc-${s.id}`} className={inputCls} disabled={locked} value={s.category} onChange={(e) => setSvc(di, si, { category: e.target.value as ServiceCategory, supplierId: undefined, rateId: undefined, costSource: "none", spec: {} })}>
                        {CATS.map((c) => (<option key={c} value={c}>{CATEGORY_LABEL[c]}</option>))}
                      </select>
                    </Field>
                    <Field id={`sl-${s.id}`} label="Location"><input id={`sl-${s.id}`} className={inputCls} disabled={locked} value={s.location ?? ""} onChange={(e) => setSvc(di, si, { location: e.target.value })} /></Field>
                    <Field id={`st-${s.id}`} label="Start"><input id={`st-${s.id}`} type="time" className={inputCls} disabled={locked} value={s.start ?? ""} onChange={(e) => setSvc(di, si, { start: e.target.value })} /></Field>
                    <Field id={`se-${s.id}`} label="End"><input id={`se-${s.id}`} type="time" className={inputCls} disabled={locked} value={s.end ?? ""} onChange={(e) => setSvc(di, si, { end: e.target.value })} /></Field>
                    <Field id={`sb-${s.id}`} label="Quantity basis">
                      <select id={`sb-${s.id}`} className={inputCls} disabled={locked || !!s.rateId} value={s.basis} onChange={(e) => setSvc(di, si, { basis: e.target.value as PricingBasis })}>
                        {BASES.map((b) => (<option key={b} value={b}>{BASIS_LABEL[b]}</option>))}
                      </select>
                    </Field>
                    <Field id={`sq-${s.id}`} label="Quantity"><input id={`sq-${s.id}`} type="number" min={0} className={inputCls} disabled={locked} value={s.qty} onChange={(e) => setSvc(di, si, { qty: Math.max(0, Math.floor(Number(e.target.value))) })} /></Field>
                    {SPEC[s.category].map((x) => (
                      <Field key={x.key} id={`sp-${s.id}-${x.key}`} label={x.label}>
                        <input id={`sp-${s.id}-${x.key}`} type={x.type ?? "text"} className={inputCls} disabled={locked} value={s.spec[x.key] ?? ""} onChange={(e) => setSvc(di, si, { spec: { ...s.spec, [x.key]: e.target.value } })} />
                      </Field>
                    ))}
                    <Field id={`ss-${s.id}`} label="Supplier candidate">
                      <select id={`ss-${s.id}`} className={inputCls} disabled={locked} value={s.supplierId ?? ""} onChange={(e) => setSvc(di, si, { supplierId: e.target.value || undefined, rateId: undefined, costSource: s.unitCost ? "manual" : "none" })}>
                        <option value="">Not chosen</option>
                        {suppliersFor(s.category).map((c: Company) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </Field>
                    {s.supplierId && (
                      <Field id={`sr-${s.id}`} label="Rate" hint={rate ? `${rate.source} · ${rate.sourceRef} · valid ${fmtDate(rate.validFrom)} – ${fmtDate(rate.validTo)} · not live availability` : undefined}>
                        <select
                          id={`sr-${s.id}`}
                          className={inputCls}
                          disabled={locked}
                          value={s.rateId ?? ""}
                          onChange={(e) => {
                            const r = state.companies.find((c) => c.id === s.supplierId)?.rates.find((x) => x.id === e.target.value);
                            setSvc(di, si, r ? { rateId: r.id, unitCost: r.amount, costCurrency: r.currency, basis: r.basis, costSource: "contract", revalidate: false } : { rateId: undefined, costSource: s.unitCost ? "manual" : "none" });
                          }}
                        >
                          <option value="">Manual cost (no rate)</option>
                          {(state.companies.find((c) => c.id === s.supplierId)?.rates ?? []).filter((r) => s.category === "other" || r.serviceType === s.category).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} · {fmtMoney(r.amount, r.currency)} {BASIS_LABEL[r.basis]}{rateExpired(r) ? " (expired)" : ""}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {showCost && (
                      <Field id={`su-${s.id}`} label={`Unit cost (${s.costCurrency})`}>
                        <input id={`su-${s.id}`} type="number" min={0} className={inputCls} disabled={locked || !!s.rateId} value={s.unitCost !== undefined ? toMajor(s.unitCost) : ""} onChange={(e) => setSvc(di, si, { unitCost: e.target.value === "" ? undefined : toMinor(Number(e.target.value)), costSource: e.target.value === "" ? "none" : "manual" })} />
                      </Field>
                    )}
                    <label className="flex items-center gap-2 self-end pb-2 text-[15px] font-semibold">
                      <input type="checkbox" className="h-5 w-5 accent-[#f2b01e]" disabled={locked} checked={s.mandatory} onChange={(e) => setSvc(di, si, { mandatory: e.target.checked })} />
                      Mandatory for readiness
                    </label>
                  </div>
                  {showCost && s.unitCost !== undefined && (
                    <p className="mt-2 text-[14px] text-[#5b5754]">
                      {s.qty} × {fmtMoney(s.unitCost, s.costCurrency)} {BASIS_LABEL[s.basis]} = <strong>{fmtMoney(s.qty * s.unitCost, s.costCurrency)}</strong> estimated cost
                    </p>
                  )}
                  {!locked && s.revalidate && rate && !expired && (
                    <button type="button" className={`${btn.ghost} mt-1`} onClick={() => setSvc(di, si, { revalidate: false })}>
                      Mark rate revalidated for these dates
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          {!locked && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-[#5b5754]">Add service:</span>
              {CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={btn.secondary}
                  onClick={() => setDay(di, { services: [...d.services, { id: uid(), category: c, name: `New ${CATEGORY_LABEL[c].toLowerCase()}`, basis: DEFAULT_BASIS[c], qty: DEFAULT_BASIS[c] === "per_person" ? (trip.adults || 0) + (trip.children || 0) || 1 : 1, costSource: "none", costCurrency: state.settings.currency, mandatory: c !== "other", spec: {}, specVersion: 1 }] })}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          )}
        </Card>
      ))}

      {!locked && days.length > 0 && (
        <button type="button" className={`${btn.secondary} self-start`} onClick={() => commit([...days, { id: uid(), title: `Day ${days.length + 1}`, destination: days[days.length - 1]?.destination ?? "", services: [] }])}>
          Add a day
        </button>
      )}
    </div>
  );
}
