"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useIos } from "@/lib/ios/store";
import { COMMERCIAL_LABEL, can, customerLabel } from "@/lib/ios/rules";

/** Global search (NAV02): trips, partners and suppliers the user may see; keyboard navigable. */
export default function Search() {
  const { state, me } = useIos();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2 || !me) return [];
    const trips = state.trips
      .filter((t) => [t.ref, t.name, customerLabel(state, t), t.externalRef ?? ""].join(" ").toLowerCase().includes(needle))
      .slice(0, 6)
      .map((t) => ({ group: "Trips", key: t.id, title: `${t.ref} · ${t.name}`, sub: `${customerLabel(state, t)} · ${COMMERCIAL_LABEL[t.commercial]}`, href: `/os/trips/${t.id}` }));
    const companies = state.companies
      .filter((c) => [c.name, c.city, ...c.contacts.map((x) => x.name)].join(" ").toLowerCase().includes(needle))
      .slice(0, 6)
      .map((c) => ({ group: c.roles.includes("supplier") && !c.roles.includes("partner") ? "Suppliers" : "Partners", key: c.id, title: c.name, sub: `${c.roles.map((r) => (r === "partner" ? "Sales partner" : "Supplier")).join(" + ")} · ${c.city}`, href: `/os/partners/${c.id}` }));
    // Travellers and supplier confirmation references: only for roles that may see guest or booking records.
    const guests = can(me, "guest.view")
      ? state.trips
          .flatMap((t) => t.guests.filter((g) => g.name.toLowerCase().includes(needle)).map((g) => ({ t, g })))
          .slice(0, 6)
          .map(({ t, g }) => ({ group: "Travellers", key: `${t.id}:${g.id}`, title: g.name, sub: `${t.ref} · ${t.name}${g.room ? ` · room ${g.room}` : ""}`, href: `/os/trips/${t.id}?tab=guests` }))
      : [];
    const bookings = can(me, "reservation.manage")
      ? state.trips
          .flatMap((t) => t.reservations.filter((r) => r.confirmation?.ref.toLowerCase().includes(needle)).map((r) => ({ t, r })))
          .slice(0, 4)
          .map(({ t, r }) => ({ group: "Supplier confirmations", key: r.id, title: `Ref ${r.confirmation!.ref}`, sub: `${t.ref} · ${state.companies.find((c) => c.id === r.supplierId)?.name ?? "supplier"}`, href: `/os/trips/${t.id}?tab=bookings#svc-${r.serviceId}` }))
      : [];
    return [...trips, ...guests, ...bookings, ...companies];
  }, [q, state, me]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div className="relative w-full max-w-[520px]">
      <label htmlFor="ios-search" className="sr-only">
        Search trips, partners and suppliers
      </label>
      <input
        ref={input}
        id="ios-search"
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search trip ref, name, partner or supplier (Ctrl K)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            go(results[active].href);
          } else if (e.key === "Escape") setOpen(false);
        }}
        className="w-full rounded-[4px] border border-[#c9c5c1] bg-white px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-[#875e00]"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-[60vh] overflow-auto rounded-[6px] border border-[#c9c5c1] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
          {results.length ? (
            <ul id={listId} role="listbox" className="m-0 list-none p-1">
              {results.map((r, i) => (
                <li
                  key={r.key}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(r.href);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`cursor-pointer rounded-[4px] px-3 py-2 ${i === active ? "bg-[#fff6e0]" : ""}`}
                >
                  {(i === 0 || results[i - 1].group !== r.group) && <div className="mb-0.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">{r.group}</div>}
                  <div className="text-[15px] font-semibold">{r.title}</div>
                  <div className="text-[14px] text-[#6b6764]">{r.sub}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-[15px] text-[#6b6764]">No results for “{q.trim()}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
