"use client";

import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { updateTask, updateTrip } from "@/lib/ios/domain";
import { canManageTrip, fmtDateTime, memberName, toMajor, toMinor } from "@/lib/ios/rules";
import type { TaskStatus, TripFile } from "@/lib/ios/types";
import { Card, Field, Notice, Saving, Section, btn, inputCls } from "../ui";
import { useAutosave } from "./useAutosave";
import { ChangePanel, IncidentPanel, ReadinessPanel } from "./Operations";

interface Form {
  name: string;
  partnerId: string;
  contactName: string;
  contactEmail: string;
  startDate: string;
  endDate: string;
  flexibleDates: string;
  destinations: string;
  adults: string;
  children: string;
  infants: string;
  language: string;
  arrival: string;
  departure: string;
  hotelPref: string;
  roomNeeds: string;
  dietary: string;
  accessibility: string;
  budgetAmount: string;
  budgetCurrency: string;
  budgetBasis: "per_person" | "total";
  externalRef: string;
  nextFollowUp: string;
}

const toForm = (t: TripFile): Form => ({
  name: t.name,
  partnerId: t.partnerId ?? "",
  contactName: t.directContact?.name ?? "",
  contactEmail: t.directContact?.email ?? "",
  startDate: t.startDate ?? "",
  endDate: t.endDate ?? "",
  flexibleDates: t.flexibleDates ?? "",
  destinations: t.destinations.join(", "),
  adults: t.adults?.toString() ?? "",
  children: t.children?.toString() ?? "",
  infants: t.infants?.toString() ?? "",
  language: t.language ?? "",
  arrival: t.arrival ?? "",
  departure: t.departure ?? "",
  hotelPref: t.hotelPref ?? "",
  roomNeeds: t.roomNeeds ?? "",
  dietary: t.dietary ?? "",
  accessibility: t.accessibility ?? "",
  budgetAmount: t.budget ? String(toMajor(t.budget.amount)) : "",
  budgetCurrency: t.budget?.currency ?? "",
  budgetBasis: t.budget?.basis ?? "per_person",
  externalRef: t.externalRef ?? "",
  nextFollowUp: t.qual.nextFollowUp ?? "",
});

const num = (s: string) => (s.trim() === "" ? undefined : Math.max(0, Math.floor(Number(s))));

function toPatch(f: Form, t: TripFile): Partial<TripFile> {
  return {
    name: f.name.trim() || t.name,
    partnerId: f.partnerId || undefined,
    directContact: !f.partnerId && f.contactName ? { name: f.contactName, email: f.contactEmail || undefined } : undefined,
    startDate: f.startDate || undefined,
    endDate: f.endDate || undefined,
    flexibleDates: f.flexibleDates || undefined,
    destinations: f.destinations.split(",").map((s) => s.trim()).filter(Boolean),
    adults: num(f.adults),
    children: num(f.children),
    infants: num(f.infants),
    language: f.language || undefined,
    arrival: f.arrival || undefined,
    departure: f.departure || undefined,
    hotelPref: f.hotelPref || undefined,
    roomNeeds: f.roomNeeds || undefined,
    dietary: f.dietary || undefined,
    accessibility: f.accessibility || undefined,
    budget: f.budgetAmount && f.budgetCurrency ? { amount: toMinor(Number(f.budgetAmount)), currency: f.budgetCurrency, basis: f.budgetBasis } : undefined,
    externalRef: f.externalRef || undefined,
    qual: { ...t.qual, nextFollowUp: f.nextFollowUp || undefined },
  };
}

export default function Overview({ trip }: { trip: TripFile }) {
  const { state, me, run } = useIos();
  const [form, setForm] = useState<Form>(() => toForm(trip));
  const [base, setBase] = useState(trip.version);
  // The values this form started from, to show exactly what someone else changed on conflict.
  const [baseForm, setBaseForm] = useState<Form>(() => toForm(trip));
  const [dirty, setDirty] = useState(false);
  const [taskErr, setTaskErr] = useState("");
  const booked = trip.commercial === "booked" || trip.commercial === "cancelled";
  const editable = canManageTrip(me, trip) && trip.commercial !== "lost";

  // Adopt another tab's or user's newer version when we have no unsaved edits (derived state, no effect).
  if (!dirty && trip.version !== base) {
    setForm(toForm(trip));
    setBaseForm(toForm(trip));
    setBase(trip.version);
  }

  // The expected version travels with each queued save, so a deliberate overwrite uses the newest version.
  const auto = useAutosave<{ f: Form; v: number }>(({ f, v }) => {
    const r = run((s, m, now) => updateTrip(s, m, trip.id, v, toPatch(f, trip), now));
    if (r.ok) {
      setBase(r.value.version);
      setBaseForm(f);
      setDirty(false);
      return { ok: true };
    }
    return r;
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    const next = { ...form, [k]: v };
    setForm(next);
    setDirty(true);
    auto.queue({ f: next, v: base });
  };

  const tasks = state.tasks.filter((k) => k.tripId === trip.id).sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
  const timeline = state.audit.filter((e) => e.tripId === trip.id);
  const ro = !editable;
  const roCommercial = ro || booked;

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        {trip.operational === "in_progress" && <IncidentPanel trip={trip} />}
        <Section title="Enquiry details" actions={<Saving state={auto.status} />}>
          {auto.status === "conflict" && auto.error && (
            <div role="alert" className="rounded-[6px] border-2 border-[#d9534f] bg-[#fdeceb] px-4 py-3 text-[15px]">
              <p className="font-bold text-[#8a1f17]">{auto.error.message}</p>
              <p className="mt-1">Their version {trip.version} changed:</p>
              <ul className="m-0 mt-1 list-disc pl-5">
                {(Object.keys(baseForm) as (keyof Form)[]).filter((k) => toForm(trip)[k] !== baseForm[k]).map((k) => (
                  <li key={k}><span className="font-semibold">{k}</span>: {String(baseForm[k]) || "—"} → {String(toForm(trip)[k]) || "—"}{form[k] !== baseForm[k] ? " (you also changed this)" : ""}</li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={btn.secondary} onClick={() => { setForm(toForm(trip)); setBaseForm(toForm(trip)); setBase(trip.version); setDirty(false); auto.reset(); }}>
                  Reload their version (discard mine)
                </button>
                <button
                  type="button"
                  className={btn.secondary}
                  onClick={() => {
                    // Deliberate merge: my edited fields win, every field I did not touch takes their value.
                    const theirs = toForm(trip);
                    const merged = Object.fromEntries((Object.keys(form) as (keyof Form)[]).map((k) => [k, form[k] !== baseForm[k] ? form[k] : theirs[k]])) as unknown as Form;
                    setForm(merged);
                    setBase(trip.version);
                    auto.queue({ f: merged, v: trip.version });
                    auto.flush();
                  }}
                >
                  Merge: keep my edits, take theirs elsewhere
                </button>
              </div>
            </div>
          )}
          {auto.status === "error" && auto.error && <Notice tone="bad">{auto.error.message}</Notice>}
          {booked && (
            <Notice tone="info">
              This trip is booked. Dates and guest counts change through <a href="#changes" className="font-semibold">a change proposal</a>, so affected suppliers and documents are reviewed first.
            </Notice>
          )}
          <Card className="grid gap-4 p-5 md:grid-cols-2">
            <Field id="ov-name" label="Trip name"><input id="ov-name" className={inputCls} disabled={ro} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field id="ov-partner" label="Sales partner">
              <select id="ov-partner" className={inputCls} disabled={ro} value={form.partnerId} onChange={(e) => set("partnerId", e.target.value)}>
                <option value="">Direct customer</option>
                {state.companies.filter((c) => c.roles.includes("partner")).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </Field>
            {!form.partnerId && (
              <>
                <Field id="ov-cn" label="Customer name"><input id="ov-cn" className={inputCls} disabled={ro} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} /></Field>
                <Field id="ov-ce" label="Customer email"><input id="ov-ce" type="email" className={inputCls} disabled={ro} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field id="ov-sd" label="Start date"><input id="ov-sd" type="date" className={inputCls} disabled={roCommercial} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
              <Field id="ov-ed" label="End date"><input id="ov-ed" type="date" className={inputCls} disabled={roCommercial} value={form.endDate} min={form.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} /></Field>
            </div>
            <Field id="ov-fd" label="Flexible dates"><input id="ov-fd" className={inputCls} disabled={roCommercial} value={form.flexibleDates} onChange={(e) => set("flexibleDates", e.target.value)} /></Field>
            <Field id="ov-dest" label="Destinations" hint="Separate with commas."><input id="ov-dest" className={inputCls} disabled={roCommercial} value={form.destinations} onChange={(e) => set("destinations", e.target.value)} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field id="ov-a" label="Adults"><input id="ov-a" type="number" min={0} className={inputCls} disabled={roCommercial} value={form.adults} onChange={(e) => set("adults", e.target.value)} /></Field>
              <Field id="ov-c" label="Children"><input id="ov-c" type="number" min={0} className={inputCls} disabled={roCommercial} value={form.children} onChange={(e) => set("children", e.target.value)} /></Field>
              <Field id="ov-i" label="Infants"><input id="ov-i" type="number" min={0} className={inputCls} disabled={roCommercial} value={form.infants} onChange={(e) => set("infants", e.target.value)} /></Field>
            </div>
            <Field id="ov-ar" label="Arrival details"><input id="ov-ar" className={inputCls} disabled={ro} value={form.arrival} onChange={(e) => set("arrival", e.target.value)} /></Field>
            <Field id="ov-dp" label="Departure details"><input id="ov-dp" className={inputCls} disabled={ro} value={form.departure} onChange={(e) => set("departure", e.target.value)} /></Field>
            <Field id="ov-lang" label="Guide language"><input id="ov-lang" className={inputCls} disabled={ro} value={form.language} onChange={(e) => set("language", e.target.value)} /></Field>
            <Field id="ov-hp" label="Hotel preference"><input id="ov-hp" className={inputCls} disabled={ro} value={form.hotelPref} onChange={(e) => set("hotelPref", e.target.value)} /></Field>
            <Field id="ov-rn" label="Room needs and requests"><input id="ov-rn" className={inputCls} disabled={ro} value={form.roomNeeds} onChange={(e) => set("roomNeeds", e.target.value)} /></Field>
            <Field id="ov-di" label="Dietary"><input id="ov-di" className={inputCls} disabled={ro} value={form.dietary} onChange={(e) => set("dietary", e.target.value)} /></Field>
            <Field id="ov-ac" label="Accessibility"><input id="ov-ac" className={inputCls} disabled={ro} value={form.accessibility} onChange={(e) => set("accessibility", e.target.value)} /></Field>
            <div className="grid grid-cols-[1fr_96px_140px] gap-3">
              <Field id="ov-ba" label="Budget"><input id="ov-ba" type="number" min={0} className={inputCls} disabled={ro} value={form.budgetAmount} onChange={(e) => set("budgetAmount", e.target.value)} /></Field>
              <Field id="ov-bc" label="Currency"><input id="ov-bc" maxLength={3} className={inputCls} disabled={ro} value={form.budgetCurrency} onChange={(e) => set("budgetCurrency", e.target.value.toUpperCase())} /></Field>
              <Field id="ov-bb" label="Basis">
                <select id="ov-bb" className={inputCls} disabled={ro} value={form.budgetBasis} onChange={(e) => set("budgetBasis", e.target.value as Form["budgetBasis"])}>
                  <option value="per_person">Per person</option>
                  <option value="total">Total</option>
                </select>
              </Field>
            </div>
            <Field id="ov-xr" label="Partner booking reference"><input id="ov-xr" className={inputCls} disabled={ro} value={form.externalRef} onChange={(e) => set("externalRef", e.target.value)} /></Field>
            <Field id="ov-fu" label="Next follow-up"><input id="ov-fu" type="date" className={inputCls} disabled={ro} value={form.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} /></Field>
          </Card>
          {trip.commercial === "lost" && trip.qual.lostReason && <Notice tone="neutral">Lost: {trip.qual.lostReason}</Notice>}
        </Section>
        <ChangePanel trip={trip} />
        {trip.operational !== "in_progress" && <IncidentPanel trip={trip} />}
      </div>

      <div className="flex flex-col gap-6">
        <ReadinessPanel trip={trip} />

        <Section title={`Tasks (${tasks.filter((k) => k.status !== "done" && k.status !== "cancelled").length} open)`}>
          <Card>
            {tasks.length ? (
              <ul className="m-0 list-none p-0">
                {tasks.map((k) => (
                  <li key={k.id} className="border-t border-[#ebe8e5] px-4 py-3 first:border-t-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`text-[15px] font-semibold ${k.status === "done" ? "text-[#6b6764] line-through" : ""}`}>{k.title}</div>
                      <label className="sr-only" htmlFor={`ts-${k.id}`}>Status</label>
                      <select id={`ts-${k.id}`} className={`${inputCls} w-auto py-1 text-[14px]`} value={k.status} onChange={(e) => {
                        const r = run((s, m, now) => updateTask(s, m, k.id, { status: e.target.value as TaskStatus }, "", now));
                        setTaskErr(r.ok ? "" : r.error.message);
                      }}>
                        {(["open", "in_progress", "waiting", "done", "cancelled"] as TaskStatus[]).map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
                      </select>
                    </div>
                    <div className="text-[14px] text-[#6b6764]">Due {fmtDateTime(k.due, state.settings.timezone)} · {k.ownerId ? memberName(state, k.ownerId) : `${k.team} team`}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-[15px] text-[#6b6764]">No tasks on this trip.</p>
            )}
          </Card>
          {taskErr && <p role="alert" className="text-[15px] font-semibold text-[#8a1f17]">{taskErr}</p>}
        </Section>

        <Section title="Activity">
          <Card className="p-4">
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {timeline.slice(0, 30).map((e) => (
                <li key={e.id} className="border-l-2 border-[#dcd9d6] pl-3 text-[15px]">
                  <div className="text-[13px] text-[#6b6764]">{fmtDateTime(e.at, state.settings.timezone)} · {memberName(state, e.actorId)}</div>
                  <div>{e.summary}</div>
                  {e.changes && e.changes.length > 0 && (
                    <details className="mt-1 text-[14px] text-[#5b5754]">
                      <summary className="cursor-pointer">What changed</summary>
                      <ul className="m-0 mt-1 list-none p-0">
                        {e.changes.map((c, i) => (
                          <li key={i}><span className="font-semibold">{c.field}</span>: {c.from || "—"} → {c.to || "—"}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
              {!timeline.length && <li className="text-[15px] text-[#6b6764]">No activity yet.</li>}
            </ol>
          </Card>
        </Section>
      </div>
    </div>
  );
}
