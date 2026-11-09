"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { saveCompany, saveRate, uid } from "@/lib/ios/domain";
import { BASIS_LABEL, CATEGORY_LABEL, addDays, can, fmtDate, fmtMoney, toMajor, toMinor } from "@/lib/ios/rules";
import type { Company, PricingBasis, Rate, ServiceCategory } from "@/lib/ios/types";
import { Badge, Card, Dialog, ErrorSummary, Field, Notice, PageHeader, Section, btn, inputCls } from "@/components/ios/ui";

const CATS: ServiceCategory[] = ["hotel", "transport", "guide", "meal", "attraction", "other"];
const BASES: PricingBasis[] = ["per_person", "per_room_night", "per_vehicle", "per_group", "per_unit"];

const blank = (country: string, currency: string): Company => ({
  id: uid(), name: "", roles: ["supplier"], country, city: "", languages: "English", currencies: currency, contacts: [], rates: [], version: 0,
  supplierTerms: { categories: [], locations: "", cancellation: "", childRules: "", paymentDays: 30 },
});

export default function PartnerDetailPage() {
  const { state, me, today, run } = useIos();
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const existing = state.companies.find((c) => c.id === String(params.id));
  const [c, setC] = useState<Company>(() => existing ?? blank(state.settings.country, state.settings.currency));
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [rateDlg, setRateDlg] = useState<Rate | null>(null);
  const [rateErr, setRateErr] = useState<{ field: string; message: string }[]>([]);
  // Version this form was loaded at; a stale save reports a conflict instead of overwriting (UX09).
  const [baseV, setBaseV] = useState<number | undefined>(existing?.version);
  const edit = can(me, "partner.manage");

  if (!isNew && !existing) {
    return (
      <div className="mx-auto max-w-[560px] rounded-[8px] border border-[#dcd9d6] bg-white p-8">
        <h1 className="text-[24px] font-extrabold">Company not available</h1>
        <Link href="/os/partners" className={`${btn.secondary} mt-4`}>Back to Partners</Link>
      </div>
    );
  }

  const set = <K extends keyof Company>(k: K, v: Company[K]) => { setC((x) => ({ ...x, [k]: v })); setSaved(false); };
  const toggleRole = (r: "partner" | "supplier", on: boolean) => {
    const roles = on ? Array.from(new Set([...c.roles, r])) : c.roles.filter((x) => x !== r);
    setC((x) => ({
      ...x,
      roles,
      partnerTerms: roles.includes("partner") ? x.partnerTerms ?? { model: "net", creditCurrency: state.settings.currency, paymentDays: 30 } : undefined,
      supplierTerms: roles.includes("supplier") ? x.supplierTerms ?? { categories: [], locations: "", cancellation: "", childRules: "", paymentDays: 30 } : undefined,
    }));
    setSaved(false);
  };

  function save() {
    // Rates are versioned separately; keep the stored ones rather than this form's copy.
    const r = run((s, m, now) => saveCompany(s, m, { ...c, rates: existing?.rates ?? c.rates }, baseV, now));
    if (!r.ok) { setErrors(r.error.fieldErrors ?? [{ field: "name", message: r.error.message }]); return; }
    setErrors([]);
    setSaved(true);
    setBaseV(r.value.version);
    if (isNew) router.replace(`/os/partners/${r.value.id}`);
    else setC(r.value);
  }

  const live = existing ?? c;
  const rates = live.rates;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker={<Link href="/os/partners">← Partners</Link>}
        title={isNew ? "Add company" : live.name}
        sub={!isNew && <span className="flex flex-wrap gap-1.5">{live.roles.includes("partner") && <Badge tone="info">Sales partner</Badge>}{live.roles.includes("supplier") && <Badge tone="good">Supplier</Badge>}{live.sample && <Badge>Sample</Badge>}</span>}
        actions={edit ? <><span role="status">{saved && <Badge tone="good">Saved</Badge>}</span><button type="button" className={btn.primary} onClick={save}>{isNew ? "Add company" : "Save changes"}</button></> : undefined}
      />
      {!edit && <Notice tone="warn">Your role can view partners but not change them.</Notice>}
      <ErrorSummary errors={errors} />

      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <Field id="name" label="Company name" required><input id="name" className={inputCls} disabled={!edit} value={c.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div id="field-roles">
          <span className="text-[14px] font-semibold">Roles</span>
          <div className="mt-2 flex gap-5 text-[16px]">
            <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#f2b01e]" disabled={!edit} checked={c.roles.includes("partner")} onChange={(e) => toggleRole("partner", e.target.checked)} /> Sales partner</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#f2b01e]" disabled={!edit} checked={c.roles.includes("supplier")} onChange={(e) => toggleRole("supplier", e.target.checked)} /> Supplier</label>
          </div>
        </div>
        <Field id="city" label="City"><input id="city" className={inputCls} disabled={!edit} value={c.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field id="country" label="Country"><input id="country" className={inputCls} disabled={!edit} value={c.country} onChange={(e) => set("country", e.target.value)} /></Field>
        <Field id="langs" label="Operational languages"><input id="langs" className={inputCls} disabled={!edit} value={c.languages} onChange={(e) => set("languages", e.target.value)} /></Field>
        <Field id="curs" label="Currencies"><input id="curs" className={inputCls} disabled={!edit} value={c.currencies} onChange={(e) => set("currencies", e.target.value)} /></Field>
      </Card>

      <Section title={`Contacts (${c.contacts.length})`} actions={edit ? <button type="button" className={btn.secondary} onClick={() => set("contacts", [...c.contacts, { id: uid(), name: "" }])}>Add contact</button> : undefined}>
        <Card className="flex flex-col gap-3 p-5">
          {c.contacts.length ? c.contacts.map((ct, i) => (
            <div key={ct.id} className="grid items-end gap-2 md:grid-cols-[1fr_1.3fr_1fr_1fr_auto_auto]">
              <Field id={`ct-n-${i}`} label="Name"><input id={`ct-n-${i}`} className={inputCls} disabled={!edit} value={ct.name} onChange={(e) => set("contacts", c.contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
              <Field id={`ct-e-${i}`} label="Email"><input id={`ct-e-${i}`} className={inputCls} disabled={!edit} value={ct.email ?? ""} onChange={(e) => set("contacts", c.contacts.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} /></Field>
              <Field id={`ct-p-${i}`} label="Phone"><input id={`ct-p-${i}`} className={inputCls} disabled={!edit} value={ct.phone ?? ""} onChange={(e) => set("contacts", c.contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))} /></Field>
              <Field id={`ct-r-${i}`} label="Role"><input id={`ct-r-${i}`} className={inputCls} disabled={!edit} value={ct.role ?? ""} onChange={(e) => set("contacts", c.contacts.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} /></Field>
              <label className="flex items-center gap-2 pb-2 text-[15px]"><input type="checkbox" disabled={!edit} checked={!!ct.emergency} onChange={(e) => set("contacts", c.contacts.map((x, j) => (j === i ? { ...x, emergency: e.target.checked } : x)))} /> Emergency</label>
              {edit && <button type="button" className={btn.ghost} onClick={() => set("contacts", c.contacts.filter((_, j) => j !== i))}>Remove</button>}
            </div>
          )) : <p className="text-[15px] text-[#6b6764]">No contacts.</p>}
        </Card>
      </Section>

      {c.partnerTerms && (
        <Section title="Sales partner terms">
          <Card className="grid gap-4 p-5 md:grid-cols-3">
            <Field id="pt-owner" label="Account owner">
              <select id="pt-owner" className={inputCls} disabled={!edit} value={c.partnerTerms.accountOwnerId ?? ""} onChange={(e) => set("partnerTerms", { ...c.partnerTerms!, accountOwnerId: e.target.value || undefined })}>
                <option value="">None</option>
                {state.members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </Field>
            <Field id="pt-model" label="Pricing model">
              <select id="pt-model" className={inputCls} disabled={!edit} value={c.partnerTerms.model} onChange={(e) => set("partnerTerms", { ...c.partnerTerms!, model: e.target.value as "net" | "commission" })}>
                <option value="net">Net pricing</option>
                <option value="commission">Gross with commission</option>
              </select>
            </Field>
            {c.partnerTerms.model === "commission" && (
              <Field id="pt-comm" label="Commission %"><input id="pt-comm" type="number" min={0} max={50} className={inputCls} disabled={!edit} value={c.partnerTerms.commissionPct ?? 0} onChange={(e) => set("partnerTerms", { ...c.partnerTerms!, commissionPct: Number(e.target.value) })} /></Field>
            )}
            <Field id="pt-credit" label={`Credit limit (${c.partnerTerms.creditCurrency})`} hint="Overrides need manager approval and a reason (milestone D).">
              <input id="pt-credit" type="number" min={0} className={inputCls} disabled={!edit} value={c.partnerTerms.creditLimit !== undefined ? toMajor(c.partnerTerms.creditLimit) : ""} onChange={(e) => set("partnerTerms", { ...c.partnerTerms!, creditLimit: e.target.value === "" ? undefined : toMinor(Number(e.target.value)) })} />
            </Field>
            <Field id="pt-days" label="Payment days"><input id="pt-days" type="number" min={0} className={inputCls} disabled={!edit} value={c.partnerTerms.paymentDays} onChange={(e) => set("partnerTerms", { ...c.partnerTerms!, paymentDays: Number(e.target.value) })} /></Field>
            <Field id="pt-ref" label="Booking reference convention"><input id="pt-ref" className={inputCls} disabled={!edit} value={c.partnerTerms.refConvention ?? ""} onChange={(e) => set("partnerTerms", { ...c.partnerTerms!, refConvention: e.target.value })} /></Field>
          </Card>
        </Section>
      )}

      {c.supplierTerms && (
        <Section title="Supplier terms">
          <Card className="grid gap-4 p-5 md:grid-cols-2">
            <div>
              <span className="text-[14px] font-semibold">Service categories</span>
              <div className="mt-2 flex flex-wrap gap-3 text-[15px]">
                {CATS.map((x) => (
                  <label key={x} className="flex items-center gap-1.5"><input type="checkbox" disabled={!edit} checked={c.supplierTerms!.categories.includes(x)} onChange={(e) => set("supplierTerms", { ...c.supplierTerms!, categories: e.target.checked ? [...c.supplierTerms!.categories, x] : c.supplierTerms!.categories.filter((y) => y !== x) })} /> {CATEGORY_LABEL[x]}</label>
                ))}
              </div>
            </div>
            <Field id="st-loc" label="Locations served"><input id="st-loc" className={inputCls} disabled={!edit} value={c.supplierTerms.locations} onChange={(e) => set("supplierTerms", { ...c.supplierTerms!, locations: e.target.value })} /></Field>
            <Field id="st-cx" label="Cancellation terms"><textarea id="st-cx" className={`${inputCls} min-h-[60px]`} disabled={!edit} value={c.supplierTerms.cancellation} onChange={(e) => set("supplierTerms", { ...c.supplierTerms!, cancellation: e.target.value })} /></Field>
            <Field id="st-ch" label="Child rules"><textarea id="st-ch" className={`${inputCls} min-h-[60px]`} disabled={!edit} value={c.supplierTerms.childRules} onChange={(e) => set("supplierTerms", { ...c.supplierTerms!, childRules: e.target.value })} /></Field>
            <Field id="st-days" label="Payment days"><input id="st-days" type="number" min={0} className={inputCls} disabled={!edit} value={c.supplierTerms.paymentDays} onChange={(e) => set("supplierTerms", { ...c.supplierTerms!, paymentDays: Number(e.target.value) })} /></Field>
            <div>
              <span className="text-[14px] font-semibold">Bank details</span>
              <p className="mt-1 text-[15px] text-[#5b5754]">{can(me, "bank.manage") ? "Recorded and independently verified in Money (milestone D)." : "Restricted to finance."}</p>
            </div>
          </Card>
        </Section>
      )}

      {!isNew && live.supplierTerms && (
        <Section
          title={`Contracted rates (${rates.length})`}
          actions={can(me, "rate.manage") ? <button type="button" className={btn.secondary} onClick={() => { setRateErr([]); setRateDlg({ id: uid(), serviceType: live.supplierTerms!.categories[0] ?? "other", name: "", basis: "per_unit", amount: 0, currency: state.settings.currency, taxMode: "incl", validFrom: today, validTo: addDays(today, 365), source: "contract", sourceRef: "", rateVersion: 0 }); }}>Add rate</button> : undefined}
        >
          <Notice tone="neutral">A rate is a price agreement, not live availability. Quoting with an expired rate requires revalidation.</Notice>
          {rates.length ? (
            <div className="overflow-x-auto rounded-[6px] border border-[#dcd9d6] bg-white" role="region" aria-label="Rates" tabIndex={0}>
              <table className="w-full min-w-[820px] border-collapse text-[15px]">
                <thead>
                  <tr className="border-b border-[#dcd9d6] bg-[#fbfaf9] text-left text-[14px] text-[#5b5754]">
                    <th className="px-4 py-2">Rate</th><th className="px-4 py-2">Type</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Valid</th><th className="px-4 py-2">Source</th><th className="px-4 py-2">Status</th><th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => {
                    const expired = r.validTo < today;
                    return (
                      <tr key={r.id} className="border-b border-[#ebe8e5]">
                        <td className="px-4 py-2 font-semibold">{r.name}<div className="text-[13px] font-normal text-[#6b6764]">version {r.rateVersion}</div></td>
                        <td className="px-4 py-2">{CATEGORY_LABEL[r.serviceType]}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{fmtMoney(r.amount, r.currency)} <span className="text-[13px] text-[#6b6764]">{BASIS_LABEL[r.basis]} · tax {r.taxMode}</span></td>
                        <td className="whitespace-nowrap px-4 py-2">{fmtDate(r.validFrom)} – {fmtDate(r.validTo)}</td>
                        <td className="px-4 py-2">{r.source} · {r.sourceRef || "—"}</td>
                        <td className="px-4 py-2"><Badge tone={expired ? "bad" : "good"}>{expired ? "Expired" : "Valid"}</Badge></td>
                        <td className="px-4 py-2">{can(me, "rate.manage") && <button type="button" className={btn.ghost} onClick={() => { setRateErr([]); setRateDlg(r); }}>Edit</button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[15px] text-[#6b6764]">No rates yet.</p>
          )}
        </Section>
      )}

      <Dialog
        open={!!rateDlg}
        title={rateDlg?.rateVersion ? `Edit rate (creates version ${rateDlg.rateVersion + 1})` : "Add rate"}
        wide
        onClose={() => setRateDlg(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setRateDlg(null)}>Cancel</button><button type="button" className={btn.primary} onClick={() => {
          if (!rateDlg) return;
          const r = run((s, m, now) => saveRate(s, m, live.id, rateDlg, now));
          if (!r.ok) setRateErr(r.error.fieldErrors ?? [{ field: "r-name", message: r.error.message }]);
          else { setRateDlg(null); setBaseV((v) => (v ?? 0) + 1); }
        }}>Save rate</button></>}
      >
        {rateDlg && (
          <>
            <ErrorSummary errors={rateErr} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="r-name" label="Rate name" required><input id="r-name" className={inputCls} value={rateDlg.name} onChange={(e) => setRateDlg({ ...rateDlg, name: e.target.value })} /></Field>
              <Field id="r-type" label="Service type">
                <select id="r-type" className={inputCls} value={rateDlg.serviceType} onChange={(e) => setRateDlg({ ...rateDlg, serviceType: e.target.value as ServiceCategory })}>
                  {CATS.map((x) => (<option key={x} value={x}>{CATEGORY_LABEL[x]}</option>))}
                </select>
              </Field>
              <Field id="amount" label="Amount" required><input id="amount" type="number" min={0} className={inputCls} value={toMajor(rateDlg.amount)} onChange={(e) => setRateDlg({ ...rateDlg, amount: toMinor(Number(e.target.value)) })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="r-cur" label="Currency"><input id="r-cur" maxLength={3} className={inputCls} value={rateDlg.currency} onChange={(e) => setRateDlg({ ...rateDlg, currency: e.target.value.toUpperCase() })} /></Field>
                <Field id="r-basis" label="Pricing basis">
                  <select id="r-basis" className={inputCls} value={rateDlg.basis} onChange={(e) => setRateDlg({ ...rateDlg, basis: e.target.value as PricingBasis })}>
                    {BASES.map((b) => (<option key={b} value={b}>{BASIS_LABEL[b]}</option>))}
                  </select>
                </Field>
              </div>
              <Field id="r-from" label="Valid from"><input id="r-from" type="date" className={inputCls} value={rateDlg.validFrom} onChange={(e) => setRateDlg({ ...rateDlg, validFrom: e.target.value })} /></Field>
              <Field id="validTo" label="Valid to"><input id="validTo" type="date" className={inputCls} value={rateDlg.validTo} onChange={(e) => setRateDlg({ ...rateDlg, validTo: e.target.value })} /></Field>
              <Field id="r-tax" label="Tax treatment">
                <select id="r-tax" className={inputCls} value={rateDlg.taxMode} onChange={(e) => setRateDlg({ ...rateDlg, taxMode: e.target.value as Rate["taxMode"] })}>
                  <option value="incl">Tax inclusive</option><option value="excl">Tax exclusive</option><option value="none">No tax</option>
                </select>
              </Field>
              <Field id="r-src" label="Source">
                <select id="r-src" className={inputCls} value={rateDlg.source} onChange={(e) => setRateDlg({ ...rateDlg, source: e.target.value as Rate["source"] })}>
                  <option value="contract">Contract</option><option value="manual">Manually entered</option><option value="external">External source</option>
                </select>
              </Field>
              <div className="sm:col-span-2"><Field id="r-ref" label="Source reference" hint="Contract number, email date or file name."><input id="r-ref" className={inputCls} value={rateDlg.sourceRef} onChange={(e) => setRateDlg({ ...rateDlg, sourceRef: e.target.value })} /></Field></div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
