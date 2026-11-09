"use client";

import { useParams } from "next/navigation";
import { useIos } from "@/lib/ios/store";
import { BASIS_LABEL, chargeableQty, customerLabel, effectiveQuoteStatus, fmtDate, fmtMoney, fmtRange, guestCount, quoteHash, quoteTotals, todayIn, QUOTE_LABEL } from "@/lib/ios/rules";

/**
 * Customer quotation document (QUO04). Public commercial version only: no supplier cost, no margin,
 * no internal notes. Print or save as PDF from the browser.
 */
export default function QuotePrintPage() {
  const { state, today } = useIos();
  const params = useParams();
  const trip = state.trips.find((t) => t.id === String(params.id));
  const q = trip?.quotes.find((x) => x.id === String(params.qid));
  if (!trip || !q) return <p className="p-10 text-[16px]">This document is not available.</p>;
  const t = quoteTotals(q);
  const st = effectiveQuoteStatus(q, today);
  const draft = !["sent", "accepted"].includes(q.status);

  return (
    <div className="mx-auto max-w-[820px] px-8 py-10 text-[15px] leading-relaxed print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <p className="text-[14px] text-[#5b5754]">Customer version. Use your browser’s Print, then “Save as PDF”.</p>
        <button type="button" onClick={() => window.print()} className="cursor-pointer rounded-[4px] border-0 bg-[#f2b01e] px-4 py-2 text-[15px] font-bold">Print or save as PDF</button>
      </div>
      {draft && <div className="mb-4 rounded-[4px] border-2 border-[#8a1f17] px-3 py-2 text-center text-[14px] font-bold uppercase tracking-[0.08em] text-[#8a1f17]">Draft — not yet issued ({QUOTE_LABEL[st]})</div>}
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#201e1d] pb-4">
        <div>
          <div className="text-[22px] font-extrabold">{state.settings.companyName}</div>
          <div className="text-[14px] text-[#5b5754]">{state.settings.country}</div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-extrabold">Quotation</div>
          <div className="text-[14px]">{trip.ref} · version {q.number}</div>
          <div className="text-[14px]">Issued {fmtDate(todayIn(state.settings.timezone, new Date(q.sent?.at ?? q.createdAt)))}</div>
          <div className="text-[14px] font-semibold">Valid until {fmtDate(q.validUntil)}</div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#5b5754]">Prepared for</div>
          <div className="font-semibold">{customerLabel(state, trip)}</div>
          {q.recipientName && <div>Attn: {q.recipientName}</div>}
        </div>
        <div>
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#5b5754]">Trip</div>
          <div className="font-semibold">{trip.name}</div>
          <div>{fmtRange(trip.startDate, trip.endDate, trip.flexibleDates)} · {guestCount(trip)} guests</div>
          <div>{trip.destinations.join(", ")}</div>
        </div>
      </section>

      {trip.itinerary.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[17px] font-extrabold">Programme</h2>
          <ol className="m-0 mt-2 list-none p-0">
            {trip.itinerary.map((d, i) => (
              <li key={d.id} className="border-b border-[#e6e3e0] py-1.5">
                <strong>Day {i + 1}</strong> · {d.title}{d.destination ? ` (${d.destination})` : ""}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-[17px] font-extrabold">Price</h2>
        <table className="mt-2 w-full border-collapse text-[15px]">
          <thead>
            <tr className="border-b-2 border-[#201e1d] text-left">
              <th className="py-1.5">Item</th>
              <th className="py-1.5 text-right">Quantity</th>
              <th className="py-1.5 text-right">Unit price</th>
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {q.lines.map((l) => (
              <tr key={l.id} className="border-b border-[#e6e3e0] align-top">
                <td className="py-1.5">
                  {l.description}
                  <div className="text-[13px] text-[#5b5754]">
                    {BASIS_LABEL[l.basis]}
                    {l.foc ? ` · ${l.foc} complimentary` : ""}
                    {l.discount ? ` · discount ${fmtMoney(l.discount, q.currency)}` : ""}
                    {l.optional ? " · optional, not included in total" : ""}
                  </div>
                </td>
                <td className="py-1.5 text-right tabular-nums">{l.qty}{l.foc ? ` (${chargeableQty(l)} charged)` : ""}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtMoney(l.unitPrice, q.currency)}</td>
                <td className="py-1.5 text-right tabular-nums">{l.optional ? "Optional" : fmtMoney(Math.max(0, chargeableQty(l) * l.unitPrice - l.discount), q.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-2 text-right font-extrabold">Total (excluding applicable tax)</td>
              <td className="py-2 text-right text-[17px] font-extrabold tabular-nums">{fmtMoney(t.revenue, q.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          ["Included", q.inclusions],
          ["Not included", q.exclusions],
          ["Payment schedule", q.paymentTerms],
          ["Cancellation terms", q.cancellationTerms],
        ].map(([h, v]) => (
          <div key={h}>
            <h3 className="text-[15px] font-extrabold">{h}</h3>
            <p className="whitespace-pre-wrap">{v || "—"}</p>
          </div>
        ))}
      </section>
      <section className="mt-4">
        <h3 className="text-[15px] font-extrabold">Availability</h3>
        <p className="whitespace-pre-wrap">{q.assumptions || "Subject to availability at the time of booking."}</p>
      </section>
      <footer className="mt-8 border-t border-[#e6e3e0] pt-3 text-[12px] text-[#6b6764]">
        {trip.ref} · quotation version {q.number} · document fingerprint {quoteHash(q)} · generated {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
      </footer>
    </div>
  );
}
