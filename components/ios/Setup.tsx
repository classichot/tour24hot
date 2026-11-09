"use client";

import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { DEFAULT_MEMBERS, DEFAULT_SETTINGS } from "@/lib/ios/seed";
import { ROLE_LABEL } from "@/lib/ios/rules";
import type { Member, StaffRole } from "@/lib/ios/types";
import { ErrorSummary, Field, btn, inputCls } from "./ui";

const TIMEZONES = ["Asia/Bangkok", "Asia/Ho_Chi_Minh", "Asia/Kuala_Lumpur", "Asia/Singapore", "Asia/Jakarta", "Asia/Manila", "Asia/Tokyo", "Asia/Shanghai", "Europe/London", "UTC"];
const CURRENCIES = ["THB", "USD", "EUR", "CNY", "MYR", "SGD", "VND", "IDR", "JPY", "KRW"];

/** First use (§2): company basics and first staff, then an optional sample trip clearly labelled Sample. */
export default function Setup() {
  const { setup } = useIos();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(DEFAULT_SETTINGS.country);
  const [tz, setTz] = useState(DEFAULT_SETTINGS.timezone);
  const [currency, setCurrency] = useState(DEFAULT_SETTINGS.currency);
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [sample, setSample] = useState(true);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

  const setM = (i: number, patch: Partial<Member>) => setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <main className="mx-auto w-full max-w-[860px] px-5 py-10 text-[16px]">
      <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#875e00]">TOUR24 Inbound OS · first use</div>
      <h1 className="mt-1 text-[34px] font-extrabold tracking-[-0.02em]">Set up your company</h1>
      <p className="mt-2 max-w-[640px] text-[16px] text-[#5b5754]">
        Four basics and your first staff. You can change everything later in Company. No integrations, supplier catalogue or accounting setup is needed to save a first enquiry.
      </p>

      <form
        className="mt-8 flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          const errs: { field: string; message: string }[] = [];
          if (!name.trim()) errs.push({ field: "co-name", message: "Enter your company name." });
          if (members.some((m) => !m.name.trim() || !m.email.trim())) errs.push({ field: "staff", message: "Every staff row needs a name and an email." });
          if (!members.some((m) => m.role === "manager")) errs.push({ field: "staff", message: "Add at least one owner or manager." });
          setErrors(errs);
          if (errs.length) return;
          const res = setup({ ...DEFAULT_SETTINGS, companyName: name.trim(), country, timezone: tz, currency }, members, sample);
          if (!res.ok) setErrors(res.error.fieldErrors ?? [{ field: "co-name", message: res.error.message }]);
        }}
      >
        <ErrorSummary errors={errors} />
        <div className="grid gap-5 rounded-[6px] border border-[#dcd9d6] bg-white p-6 md:grid-cols-2">
          <Field id="co-name" label="Company name" required error={errors.find((e) => e.field === "co-name")?.message}>
            <input id="co-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Siam Horizon DMC" />
          </Field>
          <Field id="co-country" label="Destination country">
            <input id="co-country" className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
          </Field>
          <Field id="co-tz" label="Company timezone">
            <select id="co-tz" className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
              {TIMEZONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field id="co-cur" label="Base reporting currency">
            <select id="co-cur" className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <div id="field-staff" className="rounded-[6px] border border-[#dcd9d6] bg-white p-6">
          <h2 className="text-[19px] font-extrabold">First staff members</h2>
          <p className="mt-1 text-[15px] text-[#5b5754]">These match the demo sign-in accounts. Roles decide what each person can see and do.</p>
          <div className="mt-4 flex flex-col gap-3">
            {members.map((m, i) => (
              <div key={i} className="grid items-end gap-2 md:grid-cols-[1fr_1.4fr_1fr_auto]">
                <Field id={`m-name-${i}`} label="Name">
                  <input id={`m-name-${i}`} className={inputCls} value={m.name} onChange={(e) => setM(i, { name: e.target.value })} />
                </Field>
                <Field id={`m-email-${i}`} label="Email">
                  <input id={`m-email-${i}`} type="email" className={inputCls} value={m.email} onChange={(e) => setM(i, { email: e.target.value })} />
                </Field>
                <Field id={`m-role-${i}`} label="Role">
                  <select id={`m-role-${i}`} className={inputCls} value={m.role} onChange={(e) => setM(i, { role: e.target.value as StaffRole })}>
                    {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </Field>
                <button type="button" className={btn.ghost} onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))} disabled={members.length < 2} aria-label={`Remove ${m.name || "staff member"}`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" className={`${btn.secondary} mt-4`} onClick={() => setMembers((ms) => [...ms, { id: `m-${Date.now().toString(36)}`, name: "", email: "", role: "sales" }])}>
            Add staff member
          </button>
        </div>

        <label className="flex items-start gap-3 rounded-[6px] border border-[#dcd9d6] bg-white p-5 text-[16px]">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[#f2b01e]" checked={sample} onChange={(e) => setSample(e.target.checked)} />
          <span>
            <span className="font-bold">Add sample trips, partners and suppliers</span>
            <span className="block text-[15px] text-[#5b5754]">Every sample record is labelled “Sample”. Skip this to start empty.</span>
          </span>
        </label>

        <div>
          <button type="submit" className={btn.primary}>
            Create company workspace
          </button>
        </div>
      </form>
    </main>
  );
}
