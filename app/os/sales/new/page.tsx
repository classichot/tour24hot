"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useIos } from "@/lib/ios/store";
import { createEnquiry, findDuplicates, reuseTrip, uid, type EnquiryInput } from "@/lib/ios/domain";
import { extractBrief, MAX_FILE_BYTES, MAX_FILES, READABLE_IN_BROWSER, SUPPORTED_UPLOADS, type Extraction } from "@/lib/ios/extract";
import { can, COMMERCIAL_LABEL, customerLabel, fmtRange, guestCount, toMinor } from "@/lib/ios/rules";
import type { Channel, TripFile } from "@/lib/ios/types";
import { Badge, Card, Dialog, ErrorSummary, Field, Notice, PageHeader, btn, inputCls } from "@/components/ios/ui";

type Mode = "paste" | "upload" | "manual" | "reuse";

interface Form {
  name: string;
  team: "sales" | "ops";
  ownerId: string;
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
  channel: Channel;
  notes: string;
}

const CHANNELS: Channel[] = ["email", "whatsapp", "wechat", "line", "phone", "website", "partner_portal", "walk_in", "other"];

export default function NewEnquiryPage() {
  const { state, me, today, run } = useIos();
  const router = useRouter();
  const idem = useRef(uid());
  const [mode, setMode] = useState<Mode>("paste");
  const [raw, setRaw] = useState("");
  const [files, setFiles] = useState<{ name: string; size: number; type: string; status: "parsed" | "kept" }[]>([]);
  const [fileMsgs, setFileMsgs] = useState<string[]>([]);
  const [ex, setEx] = useState<Extraction | null>(null);
  const [use, setUse] = useState<Record<number, { on: boolean; value: string }>>({});
  const [step, setStep] = useState<"input" | "review" | "details">("input");
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [dupes, setDupes] = useState<TripFile[]>([]);
  const [reuseQ, setReuseQ] = useState("");
  const [f, setF] = useState<Form>({
    name: "", team: "sales", ownerId: me?.role === "sales" ? me.id : "", partnerId: "", contactName: "", contactEmail: "", startDate: "", endDate: "", flexibleDates: "",
    destinations: "", adults: "", children: "", infants: "", language: "", arrival: "", departure: "", hotelPref: "", roomNeeds: "", dietary: "", accessibility: "",
    budgetAmount: "", budgetCurrency: "", budgetBasis: "per_person", externalRef: "", nextFollowUp: "", channel: "email", notes: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const partners = state.companies.filter((c) => c.roles.includes("partner"));

  function runExtraction(text: string) {
    const out = extractBrief(text, state.companies, Number(today.slice(0, 4)));
    setEx(out);
    setUse(Object.fromEntries(out.proposals.map((p, i) => [i, { on: p.confidence !== "low", value: p.value }])));
    setStep("review");
  }

  function applyReview() {
    if (!ex) return;
    const next = { ...f, notes: raw };
    ex.proposals.forEach((p, i) => {
      const u = use[i];
      if (!u?.on) return;
      const v = u.value.trim();
      switch (p.field) {
        case "adults": next.adults = v; break;
        case "children": next.children = v; break;
        case "infants": next.infants = v; break;
        case "destinations": next.destinations = v; break;
        case "startDate": next.startDate = v; break;
        case "endDate": next.endDate = v; break;
        case "flexibleDates": next.flexibleDates = v; break;
        case "language": next.language = v; break;
        case "hotelPref": next.hotelPref = v; break;
        case "dietary": next.dietary = v; break;
        case "accessibility": next.accessibility = v; break;
        case "partnerId": next.partnerId = v; break;
        case "contactEmail": next.contactEmail = v; break;
        case "requirements": next.roomNeeds = [next.roomNeeds, v].filter(Boolean).join("; "); break;
        case "budget": {
          const m = /^([A-Z]{3})\s+([\d,.]+)\s+(per person|total)/.exec(v);
          if (m) {
            next.budgetCurrency = m[1];
            next.budgetAmount = m[2].replace(/,/g, "");
            next.budgetBasis = m[3] === "per person" ? "per_person" : "total";
          }
          break;
        }
        case "budgetAmount": next.budgetAmount = v.replace(/,/g, ""); break;
        case "duration":
          if (next.startDate && !next.endDate) {
            const d = new Date(`${next.startDate}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + Math.max(0, Number(v) - 1));
            next.endDate = d.toISOString().slice(0, 10);
          }
          break;
      }
    });
    setF(next);
    setStep("details");
  }

  function input(): EnquiryInput {
    const num = (s: string) => (s.trim() === "" ? undefined : Math.max(0, Math.floor(Number(s))));
    return {
      name: f.name,
      team: f.team,
      ownerId: f.ownerId || undefined,
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
      budget: f.budgetAmount && f.budgetCurrency ? { amount: toMinor(Number(f.budgetAmount)), currency: f.budgetCurrency.toUpperCase(), basis: f.budgetBasis } : undefined,
      externalRef: f.externalRef || undefined,
      qual: { nextFollowUp: f.nextFollowUp || undefined },
      source: { channel: f.channel, original: raw || f.notes, files },
    };
  }

  function validate() {
    const errs: { field: string; message: string }[] = [];
    if (f.startDate && f.endDate && f.endDate < f.startDate) errs.push({ field: "endDate", message: "The end date is before the start date." });
    if (f.budgetAmount && !f.budgetCurrency) errs.push({ field: "budget", message: "Choose the budget currency, or clear the amount." });
    if (f.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contactEmail)) errs.push({ field: "contactEmail", message: "Check the contact email." });
    return errs;
  }

  function save(force = false) {
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;
    const inp = input();
    if (!force) {
      const d = findDuplicates(state, inp as Partial<TripFile>);
      if (d.length) {
        setDupes(d);
        return;
      }
    }
    const r = run((s, m, now) => createEnquiry(s, m, inp, now, idem.current));
    if (!r.ok) {
      setErrors(r.error.fieldErrors ?? [{ field: "name", message: r.error.message }]);
      return;
    }
    router.push(`/os/trips/${r.value.id}?tab=overview`);
  }

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    const msgs: string[] = [];
    if (files.length + picked.length > MAX_FILES) msgs.push(`Up to ${MAX_FILES} files per enquiry.`);
    const kept: typeof files = [];
    let text = raw;
    for (const file of picked.slice(0, Math.max(0, MAX_FILES - files.length))) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!SUPPORTED_UPLOADS.includes(ext)) {
        msgs.push(`${file.name}: unsupported type. Use text, PDF, DOCX, CSV, XLSX, JPEG or PNG.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        msgs.push(`${file.name}: larger than 20 MB.`);
        continue;
      }
      if (READABLE_IN_BROWSER.includes(ext)) {
        try {
          text += `\n\n--- ${file.name} ---\n${(await file.text()).slice(0, 20000)}`;
          kept.push({ name: file.name, size: file.size, type: ext, status: "parsed" });
        } catch {
          msgs.push(`${file.name}: could not be read. It was not added.`);
        }
      } else {
        kept.push({ name: file.name, size: file.size, type: ext, status: "kept" });
        msgs.push(`${file.name}: kept with the enquiry, but this prototype cannot read ${ext.toUpperCase()} content yet. Paste the text or enter the details.`);
      }
    }
    setFiles((x) => [...x, ...kept]);
    setRaw(text);
    setFileMsgs(msgs);
  }

  const reuseList = useMemo(
    () => state.trips.filter((t) => t.itinerary.length && [t.ref, t.name, customerLabel(state, t)].join(" ").toLowerCase().includes(reuseQ.toLowerCase())).slice(0, 12),
    [state, reuseQ]
  );

  if (!can(me, "enquiry.create")) {
    return <Notice tone="warn">Your role can view enquiries but not create them. Ask a sales user or manager.</Notice>;
  }

  const MODES: { key: Mode; label: string }[] = [
    { key: "paste", label: "Paste a message" },
    { key: "upload", label: "Upload a brief" },
    { key: "manual", label: "Enter details" },
    { key: "reuse", label: "Reuse a trip" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader kicker="Sales" title="New enquiry" sub="Every path creates the same draft trip file. Nothing is quoted or booked until you review it." actions={<Link href="/os/sales" className={btn.secondary}>Cancel</Link>} />

      {step === "input" && (
        <>
          <div role="tablist" aria-label="How to start" className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button key={m.key} role="tab" type="button" aria-selected={mode === m.key} onClick={() => { setMode(m.key); if (m.key === "manual") setStep("details"); }} className={`cursor-pointer rounded-[4px] border px-4 py-2 text-[15px] font-semibold ${mode === m.key ? "border-[#201e1d] bg-[#201e1d] text-white" : "border-[#c9c5c1] bg-white text-[#201e1d]"}`}>
                {m.label}
              </button>
            ))}
          </div>

          {mode === "paste" && (
            <Card className="flex flex-col gap-4 p-5">
              <Field id="raw" label="Customer message or brief" hint="Paste an email, chat or agency brief. It is kept as the original input and treated as data only.">
                <textarea id="raw" className={`${inputCls} min-h-[200px] font-mono text-[15px]`} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="e.g. 20 guests, Bangkok and Chiang Mai, 5 days" />
              </Field>
              <Field id="ch" label="Received by">
                <select id="ch" className={`${inputCls} max-w-[260px]`} value={f.channel} onChange={(e) => set("channel", e.target.value as Channel)}>
                  {CHANNELS.map((c) => (<option key={c} value={c}>{c.replace("_", " ")}</option>))}
                </select>
              </Field>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn.primary} disabled={!raw.trim()} onClick={() => runExtraction(raw)}>
                  Extract details for review
                </button>
                <button type="button" className={btn.secondary} onClick={() => { set("notes", raw); setStep("details"); }}>
                  Skip extraction, enter details
                </button>
              </div>
            </Card>
          )}

          {mode === "upload" && (
            <Card className="flex flex-col gap-4 p-5">
              <Field id="files" label="Brief files" hint={`Text, PDF, DOCX, CSV, XLSX, JPEG or PNG. Up to ${MAX_FILES} files, 20 MB each. Macros and embedded instructions are ignored.`}>
                <input id="files" type="file" multiple accept={SUPPORTED_UPLOADS.join(",")} onChange={(e) => onFiles(e.target.files)} className="text-[15px]" />
              </Field>
              {files.length > 0 && (
                <ul className="m-0 list-none p-0 text-[15px]">
                  {files.map((x) => (
                    <li key={x.name} className="flex items-center gap-2 py-1">
                      <Badge tone={x.status === "parsed" ? "good" : "warn"}>{x.status === "parsed" ? "Read" : "Kept, not read"}</Badge>
                      {x.name} · {(x.size / 1024).toFixed(0)} KB
                    </li>
                  ))}
                </ul>
              )}
              {fileMsgs.map((m, i) => (<Notice key={i} tone="warn">{m}</Notice>))}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn.primary} disabled={!raw.trim()} onClick={() => runExtraction(raw)}>
                  Extract details for review
                </button>
                <button type="button" className={btn.secondary} onClick={() => setStep("details")}>
                  Enter details manually
                </button>
              </div>
            </Card>
          )}

          {mode === "reuse" && (
            <Card className="flex flex-col gap-4 p-5">
              <Notice tone="info">Reusing copies the itinerary structure and reusable notes only. Guests, payments, supplier confirmations and correspondence are not copied, and every price must be revalidated for the new dates.</Notice>
              <Field id="reuse-q" label="Find a trip to reuse">
                <input id="reuse-q" className={inputCls} value={reuseQ} onChange={(e) => setReuseQ(e.target.value)} placeholder="Reference, name or customer" />
              </Field>
              <ul className="m-0 list-none p-0">
                {reuseList.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe8e5] py-3 first:border-t-0">
                    <div>
                      <div className="font-semibold">{t.ref} · {t.name}</div>
                      <div className="text-[14px] text-[#6b6764]">{customerLabel(state, t)} · {t.itinerary.length} days · {COMMERCIAL_LABEL[t.commercial]}</div>
                    </div>
                    <button
                      type="button"
                      className={btn.secondary}
                      onClick={() => {
                        const r = run((s, m, now) => reuseTrip(s, m, t.id, now));
                        if (r.ok) router.push(`/os/trips/${r.value.id}?tab=overview`);
                      }}
                    >
                      Reuse itinerary
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {step === "review" && ex && (
        <Card className="flex flex-col gap-5 p-5">
          <div>
            <h2 className="text-[20px] font-extrabold">Review the extracted details</h2>
            <p className="mt-1 text-[15px] text-[#5b5754]">AI draft. Nothing is saved until you continue. Low-confidence values are unticked; edit any value before using it.</p>
          </div>
          {ex.warnings.map((w, i) => (<Notice key={i} tone="warn">{w}</Notice>))}
          <div className="overflow-x-auto" role="region" aria-label="Extracted values">
            <table className="w-full min-w-[760px] border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-[#dcd9d6] text-left text-[14px] text-[#5b5754]">
                  <th className="px-3 py-2">Use</th>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Proposed value</th>
                  <th className="px-3 py-2">Source excerpt</th>
                  <th className="px-3 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {ex.proposals.map((p, i) => (
                  <tr key={i} className={`border-b border-[#ebe8e5] align-top ${p.confidence === "low" ? "bg-[#fff6e0]" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" className="h-5 w-5 accent-[#f2b01e]" aria-label={`Use ${p.label}`} checked={!!use[i]?.on} onChange={(e) => setUse((u) => ({ ...u, [i]: { ...u[i], on: e.target.checked } }))} />
                    </td>
                    <td className="px-3 py-2 font-semibold">{p.label}</td>
                    <td className="px-3 py-2">
                      {p.field === "partnerId" ? (
                        <select className={inputCls} aria-label={p.label} value={use[i]?.value ?? ""} onChange={(e) => setUse((u) => ({ ...u, [i]: { ...u[i], value: e.target.value } }))}>
                          {partners.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                      ) : (
                        <input className={inputCls} aria-label={p.label} value={use[i]?.value ?? ""} onChange={(e) => setUse((u) => ({ ...u, [i]: { ...u[i], value: e.target.value } }))} />
                      )}
                    </td>
                    <td className="max-w-[320px] px-3 py-2 font-mono text-[14px] text-[#5b5754]">“{p.excerpt}”</td>
                    <td className="px-3 py-2">
                      <Badge tone={p.confidence === "high" ? "good" : p.confidence === "medium" ? "info" : "warn"}>{p.confidence}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ex.questions.length > 0 && (
            <div className="rounded-[6px] border border-[#f2d48a] bg-[#fff6e0] px-4 py-3">
              <p className="font-bold text-[#714e04]">Unresolved — confirm with the customer</p>
              <ul className="m-0 mt-1 list-disc pl-5 text-[15px] text-[#714e04]">
                {ex.questions.map((q, i) => (<li key={i}>{q}</li>))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={applyReview}>Use ticked values and continue</button>
            <button type="button" className={btn.secondary} onClick={() => setStep("input")}>Back</button>
          </div>
        </Card>
      )}

      {step === "details" && (
        <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <ErrorSummary errors={errors} />
          <Notice tone="info">Only a name and team are needed to save. Dates, destinations, guests, recipient, currency and price become required when you send a quotation.</Notice>
          <Card className="grid gap-4 p-5 md:grid-cols-2">
            <h2 className="text-[18px] font-extrabold md:col-span-2">Identity and ownership</h2>
            <Field id="name" label="Trip name" hint="Leave blank to use a temporary name from the reference.">
              <input id="name" className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="team" label="Assigned team" required>
                <select id="team" className={inputCls} value={f.team} onChange={(e) => set("team", e.target.value as Form["team"])}>
                  <option value="sales">Sales</option>
                  <option value="ops">Operations</option>
                </select>
              </Field>
              <Field id="owner" label="Sales owner">
                <select id="owner" className={inputCls} value={f.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
                  <option value="">Unassigned</option>
                  {state.members.filter((m) => m.role === "sales" || m.role === "manager").map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </Field>
            </div>
            <Field id="partner" label="Sales partner">
              <select id="partner" className={inputCls} value={f.partnerId} onChange={(e) => set("partnerId", e.target.value)}>
                <option value="">Direct customer (no agency)</option>
                {partners.map((c) => (<option key={c.id} value={c.id}>{c.name}{c.sample ? " (Sample)" : ""}</option>))}
              </select>
            </Field>
            {!f.partnerId && (
              <div className="grid grid-cols-2 gap-3">
                <Field id="contactName" label="Customer name">
                  <input id="contactName" className={inputCls} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} />
                </Field>
                <Field id="contactEmail" label="Customer email" error={errors.find((e) => e.field === "contactEmail")?.message}>
                  <input id="contactEmail" type="email" className={inputCls} value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
                </Field>
              </div>
            )}
            <Field id="externalRef" label="Partner booking reference">
              <input id="externalRef" className={inputCls} value={f.externalRef} onChange={(e) => set("externalRef", e.target.value)} />
            </Field>
            <Field id="nextFollowUp" label="Next follow-up">
              <input id="nextFollowUp" type="date" className={inputCls} value={f.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} />
            </Field>
          </Card>

          <Card className="grid gap-4 p-5 md:grid-cols-2">
            <h2 className="text-[18px] font-extrabold md:col-span-2">Travel</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field id="startDate" label="Start date">
                <input id="startDate" type="date" className={inputCls} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </Field>
              <Field id="endDate" label="End date" error={errors.find((e) => e.field === "endDate")?.message}>
                <input id="endDate" type="date" className={inputCls} value={f.endDate} min={f.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} />
              </Field>
            </div>
            <Field id="flexibleDates" label="Or a flexible date range" hint="e.g. late October or November">
              <input id="flexibleDates" className={inputCls} value={f.flexibleDates} onChange={(e) => set("flexibleDates", e.target.value)} />
            </Field>
            <Field id="destinations" label="Destinations" hint="Separate with commas.">
              <input id="destinations" className={inputCls} value={f.destinations} onChange={(e) => set("destinations", e.target.value)} placeholder="Bangkok, Chiang Mai" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field id="adults" label="Adults"><input id="adults" type="number" min={0} className={inputCls} value={f.adults} onChange={(e) => set("adults", e.target.value)} /></Field>
              <Field id="children" label="Children"><input id="children" type="number" min={0} className={inputCls} value={f.children} onChange={(e) => set("children", e.target.value)} /></Field>
              <Field id="infants" label="Infants"><input id="infants" type="number" min={0} className={inputCls} value={f.infants} onChange={(e) => set("infants", e.target.value)} /></Field>
            </div>
            <Field id="arrival" label="Arrival details (if known)"><input id="arrival" className={inputCls} value={f.arrival} onChange={(e) => set("arrival", e.target.value)} placeholder="Flight, time, airport" /></Field>
            <Field id="departure" label="Departure details (if known)"><input id="departure" className={inputCls} value={f.departure} onChange={(e) => set("departure", e.target.value)} /></Field>
          </Card>

          <Card className="grid gap-4 p-5 md:grid-cols-2">
            <h2 className="text-[18px] font-extrabold md:col-span-2">Requirements and budget</h2>
            <Field id="language" label="Guide language"><input id="language" className={inputCls} value={f.language} onChange={(e) => set("language", e.target.value)} /></Field>
            <Field id="hotelPref" label="Hotel preference"><input id="hotelPref" className={inputCls} value={f.hotelPref} onChange={(e) => set("hotelPref", e.target.value)} /></Field>
            <Field id="roomNeeds" label="Room needs and requests"><input id="roomNeeds" className={inputCls} value={f.roomNeeds} onChange={(e) => set("roomNeeds", e.target.value)} /></Field>
            <Field id="dietary" label="Dietary requests"><input id="dietary" className={inputCls} value={f.dietary} onChange={(e) => set("dietary", e.target.value)} /></Field>
            <Field id="accessibility" label="Accessibility needs"><input id="accessibility" className={inputCls} value={f.accessibility} onChange={(e) => set("accessibility", e.target.value)} /></Field>
            <div id="field-budget" className="grid grid-cols-[1fr_110px_150px] gap-3">
              <Field id="budgetAmount" label="Budget" error={errors.find((e) => e.field === "budget")?.message}>
                <input id="budgetAmount" type="number" min={0} className={inputCls} value={f.budgetAmount} onChange={(e) => set("budgetAmount", e.target.value)} />
              </Field>
              <Field id="budgetCurrency" label="Currency">
                <input id="budgetCurrency" className={inputCls} value={f.budgetCurrency} maxLength={3} onChange={(e) => set("budgetCurrency", e.target.value.toUpperCase())} placeholder="THB" />
              </Field>
              <Field id="budgetBasis" label="Basis">
                <select id="budgetBasis" className={inputCls} value={f.budgetBasis} onChange={(e) => set("budgetBasis", e.target.value as Form["budgetBasis"])}>
                  <option value="per_person">Per person</option>
                  <option value="total">Total</option>
                </select>
              </Field>
            </div>
            <Field id="notes" label="Original brief or notes">
              <textarea id="notes" className={`${inputCls} min-h-[100px]`} value={raw || f.notes} onChange={(e) => (raw ? setRaw(e.target.value) : set("notes", e.target.value))} />
            </Field>
          </Card>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btn.primary}>Save draft enquiry</button>
            <button type="button" className={btn.secondary} onClick={() => setStep("input")}>Back</button>
          </div>
        </form>
      )}

      <Dialog
        open={dupes.length > 0}
        title="Possible duplicate"
        wide
        onClose={() => setDupes([])}
        footer={
          <>
            <button type="button" className={btn.secondary} onClick={() => setDupes([])}>Keep editing</button>
            <button type="button" className={btn.primary} onClick={() => { setDupes([]); save(true); }}>Create a separate enquiry</button>
          </>
        }
      >
        <p className="text-[15px]">These trips share the partner, dates, guest count or reference. Nothing is merged automatically.</p>
        <ul className="m-0 list-none p-0">
          {dupes.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe8e5] py-3 first:border-t-0">
              <div>
                <div className="font-semibold">{d.ref} · {d.name}</div>
                <div className="text-[14px] text-[#6b6764]">{customerLabel(state, d)} · {fmtRange(d.startDate, d.endDate, d.flexibleDates)} · {guestCount(d)} guests · {COMMERCIAL_LABEL[d.commercial]}</div>
              </div>
              <Link href={`/os/trips/${d.id}`} className={btn.secondary}>Open existing</Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}
