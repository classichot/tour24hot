"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useIos } from "@/lib/ios/store";
import { OPERATIONAL_LABEL, addDays, fmtDate } from "@/lib/ios/rules";
import type { OperationalStage, TripFile } from "@/lib/ios/types";
import { Badge, Empty, PageHeader, btn } from "@/components/ios/ui";
import { EMPTY_FILTERS, FilterBar, OPERATIONAL_TONE, TripTable, applyFilters, usePersisted } from "@/components/ios/tripList";

const OPS: OperationalStage[] = ["not_started", "arranging", "ready", "in_progress", "completed", "cancelled"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CHIP: Record<OperationalStage, string> = {
  not_started: "border-[#d9d6d3] bg-[#efeeec]",
  arranging: "border-[#f2d48a] bg-[#fff6e0]",
  ready: "border-[#bfe0c6] bg-[#eaf5ec]",
  in_progress: "border-[#c7d6ee] bg-[#eef3fb]",
  completed: "border-[#d9d6d3] bg-[#f7f6f5]",
  cancelled: "border-[#d9d6d3] bg-[#f7f6f5] line-through",
};

/** Booked trips as a list or an operations calendar (NAV04). View and filters persist per user. */
export default function TripsPage() {
  const { state, me, today } = useIos();
  const [f, setF] = usePersisted(`t24ios.tripFilters.${me?.id}`, EMPTY_FILTERS);
  const [view, setView] = usePersisted<{ v: "list" | "calendar" }>(`t24ios.tripView.${me?.id}`, { v: "list" });
  const [month, setMonth] = useState(() => (today || new Date().toISOString()).slice(0, 7));
  const trips = useMemo(
    () =>
      applyFilters(state, state.trips.filter((t) => t.commercial === "booked" || t.commercial === "cancelled"), f, today).sort((a, b) => (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999")),
    [state, f, today]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="Trips"
        title="Booked trips"
        sub="Commercial, operational and financial status are separate: booked does not mean confirmed or paid."
        actions={
          <div role="group" aria-label="View" className="inline-flex rounded-[4px] border border-[#c9c5c1] bg-white p-0.5">
            {(["list", "calendar"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view.v === v} onClick={() => setView({ v })} className={`cursor-pointer rounded-[3px] border-0 px-3 py-1.5 text-[15px] font-semibold ${view.v === v ? "bg-[#201e1d] text-white" : "bg-transparent text-[#3b3836]"}`}>
                {v === "list" ? "List" : "Calendar"}
              </button>
            ))}
          </div>
        }
      />
      <FilterBar f={f} setF={setF} stages={OPS.map((s) => ({ value: s, label: OPERATIONAL_LABEL[s] }))} />
      {view.v === "calendar" ? (
        <Calendar trips={trips} month={month} setMonth={setMonth} today={today} />
      ) : trips.length ? (
        <TripTable trips={trips} mode="trips" />
      ) : (
        <Empty title="No booked trips match" body="A trip appears here when its quotation is accepted." />
      )}
    </div>
  );
}

function Calendar({ trips, month, setMonth, today }: { trips: TripFile[]; month: string; setMonth: (m: string) => void; today: string }) {
  const [y, m] = month.split("-").map(Number);
  const first = `${month}-01`;
  const dow = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const start = addDays(first, -dow);
  const weeks = Math.ceil((dow + daysInMonth) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const on = (d: string) => trips.filter((t) => t.startDate && t.endDate && t.startDate <= d && d <= t.endDate);
  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonth(d.toISOString().slice(0, 7));
  };
  const monthDays = cells.filter((d) => d.slice(0, 7) === month);

  return (
    <section aria-label={`Trips in ${MONTHS[m - 1]} ${y}`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-extrabold">{MONTHS[m - 1]} {y}</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn.secondary} onClick={() => shift(-1)}>Previous month</button>
          <button type="button" className={btn.secondary} onClick={() => setMonth(today.slice(0, 7))}>This month</button>
          <button type="button" className={btn.secondary} onClick={() => shift(1)}>Next month</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[14px]">
        {OPS.filter((s) => s !== "not_started").map((s) => (
          <Badge key={s} tone={OPERATIONAL_TONE[s]}>{OPERATIONAL_LABEL[s]}</Badge>
        ))}
      </div>

      {/* Desktop and tablet: month grid. */}
      <div className="hidden overflow-hidden rounded-[6px] border border-[#dcd9d6] bg-white md:block">
        <div className="grid grid-cols-7 border-b border-[#dcd9d6] bg-[#fbfaf9] text-[13px] font-bold uppercase tracking-[0.05em] text-[#6b6764]">
          {DOW.map((d) => (
            <div key={d} className="px-2 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const list = on(d);
            const out = d.slice(0, 7) !== month;
            return (
              <div key={d} className={`min-h-[118px] border-b border-r border-[#ebe8e5] p-1.5 [&:nth-child(7n)]:border-r-0 ${out ? "bg-[#fbfaf9]" : ""}`}>
                <div className={`mb-1 text-[13px] font-semibold ${d === today ? "inline-block rounded-[3px] bg-[#201e1d] px-1.5 text-white" : out ? "text-[#a19d99]" : "text-[#5b5754]"}`}>
                  {Number(d.slice(8))}
                </div>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {list.slice(0, 4).map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/os/trips/${t.id}?tab=${t.startDate === d ? "bookings" : "overview"}`}
                        title={`${t.ref} · ${t.name} · ${OPERATIONAL_LABEL[t.operational]}`}
                        className={`block truncate rounded-[3px] border px-1.5 py-0.5 text-[12px] font-semibold text-[#201e1d] no-underline ${CHIP[t.operational]}`}
                      >
                        {t.startDate === d ? "Arrive · " : t.endDate === d ? "Depart · " : ""}
                        {t.name}
                      </Link>
                    </li>
                  ))}
                  {list.length > 4 && <li className="text-[12px] text-[#6b6764]">+{list.length - 4} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phone: agenda of days with trips. */}
      <ol className="m-0 flex list-none flex-col gap-2 p-0 md:hidden">
        {monthDays.filter((d) => on(d).length).map((d) => (
          <li key={d} className="rounded-[6px] border border-[#dcd9d6] bg-white p-3">
            <div className="text-[14px] font-bold">{fmtDate(d)}{d === today ? " · Today" : ""}</div>
            <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
              {on(d).map((t) => (
                <li key={t.id}>
                  <Link href={`/os/trips/${t.id}`} className={`block rounded-[3px] border px-2 py-1 text-[14px] font-semibold text-[#201e1d] no-underline ${CHIP[t.operational]}`}>
                    {t.startDate === d ? "Arrive · " : t.endDate === d ? "Depart · " : ""}
                    {t.name} · {OPERATIONAL_LABEL[t.operational]}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {!monthDays.some((d) => on(d).length) && <li><Empty title="No trips running this month" /></li>}
      </ol>
      {!trips.some((t) => t.startDate) && <p className="text-[14px] text-[#6b6764]">Trips without dates are not shown on the calendar.</p>}
    </section>
  );
}
