"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useIos } from "@/lib/ios/store";
import { COMMERCIAL_LABEL, can, customerLabel, effectiveQuoteStatus, fmtMoney, guestCount, memberName, quoteTotals, QUOTE_LABEL } from "@/lib/ios/rules";
import type { CommercialStage } from "@/lib/ios/types";
import { Badge, Card, Empty, PageHeader, btn } from "@/components/ios/ui";
import { COMMERCIAL_TONE, EMPTY_FILTERS, FilterBar, TripTable, applyFilters, tripExceptions, usePersisted } from "@/components/ios/tripList";

const PIPE: CommercialStage[] = ["enquiry", "quoting", "awaiting", "booked", "lost"];

export default function SalesPage() {
  const { state, me, today } = useIos();
  const [view, setView] = usePersisted<"list" | "pipeline">(`t24ios.salesView.${me?.id}`, "list");
  const [f, setF] = usePersisted(`t24ios.salesFilters.${me?.id}`, EMPTY_FILTERS);

  const trips = useMemo(() => applyFilters(state, state.trips, f, today).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state, f, today]);
  const listTrips = trips.filter((t) => f.stage || t.commercial !== "booked");

  // Conversion report (NAV06): measured from the audit trail, not promised.
  const report = useMemo(() => {
    const created = state.audit.filter((e) => e.action === "trip.created");
    const firstSend = new Map<string, string>();
    for (const e of [...state.audit].reverse()) if (e.action === "quote.sent" && e.tripId && !firstSend.has(e.tripId)) firstSend.set(e.tripId, e.at);
    const hours = created.map((c) => (firstSend.has(c.recordId) ? (Date.parse(firstSend.get(c.recordId)!) - Date.parse(c.at)) / 3600000 : null)).filter((x): x is number => x !== null && x >= 0).sort((a, b) => a - b);
    const median = hours.length ? hours[Math.floor(hours.length / 2)] : null;
    const decided = state.trips.filter((t) => t.commercial === "booked" || t.commercial === "lost");
    const won = decided.filter((t) => t.commercial === "booked").length;
    const open = state.trips.filter((t) => ["enquiry", "quoting", "awaiting"].includes(t.commercial));
    const openValue = open.reduce((a, t) => {
      const q = [...t.quotes].reverse().find((x) => x.status !== "superseded" && x.status !== "declined");
      return a + (q ? quoteTotals(q).revenue : 0);
    }, 0);
    return { median, winRate: decided.length ? Math.round((won / decided.length) * 100) : null, decided: decided.length, open: open.length, openValue };
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="Sales"
        title="Enquiries and quotations"
        sub="Every row is one trip file; the same record moves into Trips when a quotation is accepted."
        actions={
          <>
            <div role="group" aria-label="View" className="inline-flex rounded-[4px] border border-[#c9c5c1] bg-white p-0.5">
              {(["list", "pipeline"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`cursor-pointer rounded-[3px] border-0 px-3 py-1.5 text-[15px] font-semibold ${view === v ? "bg-[#201e1d] text-white" : "bg-transparent text-[#3b3836]"}`}>
                  {v === "list" ? "List" : "Pipeline"}
                </button>
              ))}
            </div>
            {can(me, "enquiry.create") && <Link href="/os/sales/new" className={btn.primary}>New enquiry</Link>}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><div className="text-[14px] font-semibold text-[#6b6764]">Open enquiries</div><div className="mt-1 text-[26px] font-extrabold">{report.open}</div></Card>
        <Card className="p-4"><div className="text-[14px] font-semibold text-[#6b6764]">Open quotation value</div><div className="mt-1 text-[22px] font-extrabold">{fmtMoney(report.openValue, state.settings.currency)}</div></Card>
        <Card className="p-4"><div className="text-[14px] font-semibold text-[#6b6764]">Median enquiry to first quote</div><div className="mt-1 text-[26px] font-extrabold">{report.median === null ? "N/A" : report.median < 48 ? `${Math.round(report.median)} h` : `${(report.median / 24).toFixed(1)} days`}</div></Card>
        <Card className="p-4"><div className="text-[14px] font-semibold text-[#6b6764]">Won of decided</div><div className="mt-1 text-[26px] font-extrabold">{report.winRate === null ? "N/A" : `${report.winRate}%`}</div><div className="text-[14px] text-[#6b6764]">{report.decided} decided</div></Card>
      </div>

      <FilterBar f={f} setF={setF} stages={PIPE.map((s) => ({ value: s, label: COMMERCIAL_LABEL[s] }))} />

      {view === "list" ? (
        listTrips.length ? (
          <TripTable trips={listTrips} mode="sales" />
        ) : state.trips.length ? (
          <Empty title="No enquiries match these filters" body="Clear a filter to see more." />
        ) : (
          <Empty title="No enquiries yet" action={<Link href="/os/sales/new" className={btn.primary}>New enquiry</Link>} />
        )
      ) : (
        <div className="overflow-x-auto" role="region" aria-label="Pipeline" tabIndex={0}>
          <div className="grid min-w-[1100px] grid-cols-5 gap-3">
            {PIPE.map((s) => {
              const col = trips.filter((t) => t.commercial === s);
              return (
                <div key={s} className="flex flex-col gap-2 rounded-[6px] bg-[#efeeec] p-2">
                  <div className="flex items-center justify-between px-1 py-1">
                    <Badge tone={COMMERCIAL_TONE[s]}>{COMMERCIAL_LABEL[s]}</Badge>
                    <span className="text-[14px] font-semibold text-[#5b5754]">{col.length}</span>
                  </div>
                  {col.map((t) => {
                    const q = t.quotes[t.quotes.length - 1];
                    const exc = tripExceptions(state, t, today);
                    return (
                      <Link key={t.id} href={`/os/trips/${t.id}`} className="block rounded-[6px] border border-[#dcd9d6] bg-white p-3 text-[#201e1d] no-underline hover:border-[#201e1d]">
                        <div className="text-[13px] text-[#6b6764]"><span className="font-mono">{t.ref}</span>{t.sample ? " · Sample" : ""}</div>
                        <div className="text-[15px] font-semibold leading-snug">{t.name}</div>
                        <div className="mt-1 text-[14px] text-[#5b5754]">{customerLabel(state, t)} · {guestCount(t) || "?"} guests</div>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {q && <Badge>v{q.number} {QUOTE_LABEL[effectiveQuoteStatus(q, today)]}</Badge>}
                          {exc.map((e) => <Badge key={e} tone="bad">{e}</Badge>)}
                        </div>
                        <div className="mt-2 flex justify-between text-[14px]">
                          <span>{memberName(state, t.ownerId)}</span>
                          <span className="font-semibold tabular-nums">{q ? fmtMoney(quoteTotals(q).revenue, q.currency) : ""}</span>
                        </div>
                      </Link>
                    );
                  })}
                  {!col.length && <p className="px-1 py-2 text-[14px] text-[#6b6764]">None</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
