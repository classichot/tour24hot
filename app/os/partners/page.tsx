"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useIos } from "@/lib/ios/store";
import { saveCompany, uid } from "@/lib/ios/domain";
import { CATEGORY_LABEL, can } from "@/lib/ios/rules";
import type { Company, ServiceCategory } from "@/lib/ios/types";
import { Badge, Dialog, Empty, Field, Notice, PageHeader, btn, inputCls } from "@/components/ios/ui";
import { usePersisted } from "@/components/ios/tripList";

const CATS: ServiceCategory[] = ["hotel", "transport", "guide", "meal", "attraction", "other"];

/** Partner directory (PAR01–04): one company record, role tags, separate terms per role. */
export default function PartnersPage() {
  const { state, me, today, run } = useIos();
  const [f, setF] = usePersisted(`t24ios.partnerFilters.${me?.id}`, { q: "", role: "", cat: "", place: "" });
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState("name,service_type,city,email,phone\n");
  const [importMsg, setImportMsg] = useState<string[]>([]);

  const list = useMemo(() => {
    const q = f.q.toLowerCase();
    return state.companies
      .filter((c) => (!q || [c.name, c.city, c.country, ...c.contacts.map((x) => x.name)].join(" ").toLowerCase().includes(q)))
      .filter((c) => (!f.role || c.roles.includes(f.role as "partner" | "supplier")))
      .filter((c) => (!f.cat || c.supplierTerms?.categories.includes(f.cat as ServiceCategory)))
      .filter((c) => (!f.place || [c.city, c.supplierTerms?.locations ?? ""].join(" ").toLowerCase().includes(f.place.toLowerCase())))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.companies, f]);

  function importRows() {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    const head = lines.shift()?.split(",").map((h) => h.trim().toLowerCase()) ?? [];
    const idx = (k: string) => head.indexOf(k);
    const msgs: string[] = [];
    let added = 0;
    lines.forEach((line, n) => {
      const cols = line.split(",").map((c) => c.trim());
      const name = cols[idx("name")];
      const type = cols[idx("service_type")]?.toLowerCase() as ServiceCategory;
      if (!name) return msgs.push(`Row ${n + 2}: missing name — skipped.`);
      if (!CATS.includes(type)) return msgs.push(`Row ${n + 2} (${name}): service_type must be one of ${CATS.join(", ")} — skipped.`);
      if (state.companies.some((c) => c.name.toLowerCase() === name.toLowerCase())) return msgs.push(`Row ${n + 2} (${name}): already in Partners — skipped.`);
      const co: Company = {
        id: uid(), name, roles: ["supplier"], city: cols[idx("city")] ?? "", country: state.settings.country, languages: "English", currencies: state.settings.currency,
        contacts: cols[idx("email")] || cols[idx("phone")] ? [{ id: uid(), name: "Reservations", email: cols[idx("email")] || undefined, phone: cols[idx("phone")] || undefined }] : [],
        supplierTerms: { categories: [type], locations: cols[idx("city")] ?? "", cancellation: "", childRules: "", paymentDays: 30 }, rates: [], version: 0,
      };
      const r = run((s, m, now) => saveCompany(s, m, co, undefined, now));
      if (r.ok) added++;
      else msgs.push(`Row ${n + 2} (${name}): ${r.error.message}`);
    });
    setImportMsg([`${added} supplier${added === 1 ? "" : "s"} imported.`, ...msgs]);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="Partners"
        title="Sales partners and suppliers"
        sub="One record per company. A company can be both a sales partner and a supplier, with separate terms for each role."
        actions={
          can(me, "partner.manage") ? (
            <>
              <button type="button" className={btn.secondary} onClick={() => { setImportMsg([]); setImportOpen(true); }}>Import suppliers (CSV)</button>
              <Link href="/os/partners/new" className={btn.primary}>Add company</Link>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-3 rounded-[6px] border border-[#dcd9d6] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="pf-q" label="Search"><input id="pf-q" className={inputCls} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Name, city, contact" /></Field>
        <Field id="pf-role" label="Role">
          <select id="pf-role" className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="">All</option>
            <option value="partner">Sales partners</option>
            <option value="supplier">Suppliers</option>
          </select>
        </Field>
        <Field id="pf-cat" label="Service type">
          <select id="pf-cat" className={inputCls} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
            <option value="">Any</option>
            {CATS.map((c) => (<option key={c} value={c}>{CATEGORY_LABEL[c]}</option>))}
          </select>
        </Field>
        <Field id="pf-place" label="Destination"><input id="pf-place" className={inputCls} value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} /></Field>
      </div>

      {list.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const expired = c.rates.filter((r) => r.validTo < today).length;
            return (
              <Link key={c.id} href={`/os/partners/${c.id}`} className="block rounded-[6px] border border-[#dcd9d6] bg-white p-4 text-[#201e1d] no-underline hover:border-[#201e1d]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {c.roles.includes("partner") && <Badge tone="info">Sales partner</Badge>}
                  {c.roles.includes("supplier") && <Badge tone="good">Supplier</Badge>}
                  {c.sample && <Badge>Sample</Badge>}
                </div>
                <div className="mt-2 text-[17px] font-bold">{c.name}</div>
                <div className="text-[15px] text-[#5b5754]">{[c.city, c.country].filter(Boolean).join(", ")}</div>
                {c.supplierTerms && <div className="mt-1 text-[14px] text-[#5b5754]">{c.supplierTerms.categories.map((x) => CATEGORY_LABEL[x]).join(", ")} · {c.rates.length} rate{c.rates.length === 1 ? "" : "s"}</div>}
                {c.partnerTerms && <div className="mt-1 text-[14px] text-[#5b5754]">{c.partnerTerms.model === "net" ? "Net pricing" : `Commission ${c.partnerTerms.commissionPct ?? 0}%`} · pays in {c.partnerTerms.paymentDays} days</div>}
                {expired > 0 && <div className="mt-2"><Badge tone="bad">{expired} expired rate{expired === 1 ? "" : "s"}</Badge></div>}
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title={state.companies.length ? "No companies match" : "No partners or suppliers yet"} body={state.companies.length ? "Clear a filter to see more." : "Add a company or import suppliers from a CSV file."} />
      )}

      <Dialog open={importOpen} title="Import suppliers from CSV" wide onClose={() => setImportOpen(false)} footer={<><button type="button" className={btn.secondary} onClick={() => setImportOpen(false)}>Close</button><button type="button" className={btn.primary} onClick={importRows}>Import rows</button></>}>
        <p className="text-[15px]">Columns: <code>name, service_type, city, email, phone</code>. Service type is one of {CATS.join(", ")}. Rows with errors are skipped and listed; nothing is merged automatically.</p>
        <Field id="csv" label="CSV content"><textarea id="csv" className={`${inputCls} min-h-[180px] font-mono text-[14px]`} value={csv} onChange={(e) => setCsv(e.target.value)} /></Field>
        {importMsg.map((m, i) => (<Notice key={i} tone={i === 0 ? "good" : "warn"}>{m}</Notice>))}
      </Dialog>
    </div>
  );
}
