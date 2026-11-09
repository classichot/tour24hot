"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DATA, isInbound, pkgById } from "@/lib/data";
import { useApp, useInboundScope } from "@/lib/store";
import { ROLE_INFO, type Session } from "@/lib/auth/session";
import { signOut, useMember } from "@/lib/auth/client";
import { useBookingRequests } from "@/lib/auth/requests";
import PackageCard from "@/components/PackageCard";
import { AU } from "@/components/auth/copy";

function Profile({ member, inbound }: { member: Session; inbound: boolean }) {
  const { L } = useApp();
  const key = `t24_profile_${member.id}`;
  const [form, setForm] = useState(() => {
    const base = { fullName: member.name, phone: "", nationality: inbound ? "China" : "Thailand", lang: inbound ? "Chinese" : "Thai", diet: "" };
    try {
      return { ...base, ...(JSON.parse(window.localStorage.getItem(key) || "{}") as Partial<typeof base>) };
    } catch {
      return base;
    }
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form, v: string) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  return (
    <form
      className="flex flex-col gap-3.5 border-2 border-divider bg-bg p-5"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          window.localStorage.setItem(key, JSON.stringify(form));
        } catch {
          /* ignore */
        }
        setSaved(true);
      }}
    >
      <h2 className="text-[17px]">{L(AU.profile)}</h2>
      <div className="field">
        <label htmlFor="pf-name">{L(AU.fullName)}</label>
        <input id="pf-name" className="input" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pf-email">{L(AU.email)}</label>
        <input id="pf-email" className="input opacity-70" value={member.email} readOnly />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label htmlFor="pf-phone">{L(AU.phone)}</label>
          <input id="pf-phone" className="input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pf-nat">{L(AU.homeCountry)}</label>
          <input id="pf-nat" className="input" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="pf-lang">{L(AU.prefLang)}</label>
        <select id="pf-lang" className="input" value={form.lang} onChange={(e) => set("lang", e.target.value)}>
          {["Thai", "English", "Chinese", "Russian"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pf-diet">{L(AU.diet)}</label>
        <textarea id="pf-diet" className="input min-h-[70px]" value={form.diet} onChange={(e) => set("diet", e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary">
          {L(AU.save)}
        </button>
        <span className="text-[12px] text-neutral-700" role="status">
          {saved ? `✓ ${L(AU.savedOk)}` : L(AU.savedLocal)}
        </span>
      </div>
    </form>
  );
}

function BuyerSpace({ member }: { member: Session }) {
  const { t, L, money, saved } = useApp();
  const router = useRouter();
  const inbound = member.role === "in-buyer";
  useInboundScope(inbound);
  const requests = useBookingRequests();
  const trip = DATA.trips.find((tr) => {
    const p = pkgById(tr.pkg);
    return tr.status !== "past" && !!p && isInbound(p) === inbound;
  });
  const tripPkg = trip ? pkgById(trip.pkg) : undefined;
  const savedList = saved.map(pkgById).filter((p): p is NonNullable<typeof p> => !!p && isInbound(p) === inbound);
  const dir = inbound ? "inbound" : "outbound";
  const shortcuts = [
    { href: inbound ? "/inbound" : "/search?dir=outbound", label: L(AU.browse) },
    ...(inbound
      ? [
          { href: "/inbound/day-tours", label: t.navInDayTours },
          { href: "/inbound/excursions", label: t.navInExcursions },
          { href: "/inbound/attractions", label: t.navInAttractions },
        ]
      : [{ href: "/burn?dir=outbound", label: t.navBurn }]),
    { href: `/advisor?dir=${dir}`, label: L(AU.askAi) },
    { href: `/group?dir=${dir}`, label: L(AU.groupQuote) },
  ];

  return (
    <main className="mx-auto w-full max-w-[1360px] px-5 pb-24 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-text pb-6 pt-8">
        <div>
          <div className="kicker">{L(ROLE_INFO[member.role].title)}</div>
          <h1 className="mt-1.5 text-[clamp(30px,3.2vw,46px)]">
            {L(AU.hi)}, {member.name.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-[640px] text-[15px] text-neutral-800">{L(AU.accountSub)}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          {L(AU.signOut)}
        </button>
      </header>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-10">
          <section>
            <h2 className="mb-3 text-[20px]">{L(AU.nextTrip)}</h2>
            {trip && tripPkg ? (
              <div className="flex flex-wrap items-center justify-between gap-5 border-2 border-text px-6 py-5">
                <div className="min-w-0">
                  <div className="kicker">
                    {t.bkRef} {trip.ref}
                  </div>
                  <div className="mt-1 text-[21px] font-extrabold leading-tight">{L(tripPkg.title)}</div>
                  <div className="mt-1 text-[14px] text-neutral-800">
                    {L(trip.date)} · {trip.pax} {t.people} · {money(trip.paid)} / {money(trip.total)}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-heading)] text-[40px] font-extrabold leading-none text-accent-700">{trip.daysAway}</div>
                    <div className="text-[12px] text-neutral-700">{L({ th: "วันก่อนออกเดินทาง", en: "days to go", zh: "天后出发" })}</div>
                  </div>
                  <Link href={`/trips?dir=${dir}`} className="btn btn-primary no-underline">
                    {L(AU.openTrips)}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border-2 border-divider px-6 py-6 text-[14px] text-neutral-700">{L(AU.noTrip)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[20px]">
              {L(AU.requests)} <span className="font-normal text-neutral-600">({requests.length})</span>
            </h2>
            {requests.length ? (
              <div className="overflow-x-auto border-2 border-divider">
                <table className="w-full min-w-[640px] border-collapse text-[14px]">
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.ref} className="border-t border-divider first:border-t-0">
                        <td className="px-5 py-3">
                          <Link href={r.href} className="font-extrabold text-text no-underline hover:underline">
                            {L(r.title)}
                          </Link>
                          <div className="font-mono text-[12px] text-neutral-700">{r.ref}</div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">{r.date}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          {r.adults + r.kids} {L(AU.people)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-extrabold">{money(r.total)}</td>
                        <td className="px-5 py-3">
                          <span className="tag tag-accent text-[11px] font-extrabold">{L(AU.waiting)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-2 border-divider px-6 py-6 text-[14px] text-neutral-700">{L(AU.noRequests)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[20px]">
              {L(AU.saved)} <span className="font-normal text-neutral-600">({savedList.length})</span>
            </h2>
            {savedList.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                {savedList.map((p) => (
                  <PackageCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <div className="border-2 border-divider px-6 py-6 text-[14px] text-neutral-700">{L(AU.noSaved)}</div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-[112px]">
          <Profile key={member.id} member={member} inbound={inbound} />
          <section className="border-2 border-divider bg-bg p-5">
            <h2 className="text-[17px]">{L(AU.shortcuts)}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {shortcuts.map((s) => (
                <Link key={s.href} href={s.href} className="btn btn-secondary no-underline text-[13px]">
                  {s.label}
                </Link>
              ))}
            </div>
          </section>
          <section className="bg-[#141312] p-5 text-[#f3f2f2]">
            <div className="text-[11px] uppercase tracking-[0.1em] text-white/60">{L(AU.memberId)}</div>
            <div className="mt-1 font-mono text-[15px]">{member.id.toUpperCase()}</div>
            <p className="mt-3 text-[13px] text-white/80">{L(AU.guarantee)}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default function AccountPage() {
  const member = useMember();
  // proxy.ts only lets buyers in; until the cookie is read on the client, keep the frame empty.
  if (!member || ROLE_INFO[member.role].group !== "buy") return <main className="mx-auto min-h-[60vh] w-full max-w-[1360px] px-5 lg:px-10" />;
  return <BuyerSpace member={member} />;
}
