"use client";

const ROWS: { area: string; status: "available" | "expand" | "new"; note: string }[] = [
  { area: "Marketplace compare + book", status: "available", note: "Public catalog, search, compare, book, inbound/outbound." },
  { area: "Agent Direct / TAP", status: "available", note: "Machine booking channel; now a sales allocation on each departure." },
  { area: "Group quote desk", status: "expand", note: "Existing /group bids now open an OS enquiry." },
  { area: "Agency brochure extract", status: "expand", note: "Upload stays; extracted rates feed supplier records." },
  { area: "Admin / trust ops", status: "available", note: "Marketplace control centre remains separate from operator OS." },
  { area: "Tour product vs departure", status: "new", note: "Reusable template + dated workspace with all services." },
  { area: "CRM / pipeline", status: "new", note: "Enquiry inbox, corporate profiles, quote versions." },
  { area: "Itinerary + live costing", status: "expand", note: "From static brochure days to editable builder with assumptions." },
  { area: "Group flights desk", status: "new", note: "Blocks, PNR, names, release, ticketing, unsold exposure." },
  { area: "Bus / hotel / meal / activity / guide", status: "new", note: "Supplier-linked allocations on the departure." },
  { area: "Passenger readiness", status: "expand", note: "From trip docs checklist to passport/name/ticket flags." },
  { area: "Live command + disruption", status: "new", note: "Timeline, incidents, acknowledgements, recovery." },
  { area: "Finance / profit", status: "expand", note: "From advertised vs real to quote-vs-actual and cash gap." },
  { area: "AI Tour Producer + extraction", status: "expand", note: "Command bar drafts connected to real records." },
  { area: "AI Change / Simulator / Profit / Ready", status: "new", note: "First operational AI pack on the 40-pax demo." },
  { area: "Capacity Exchange", status: "new", note: "Later stage — not in this release." },
];

function tone(s: (typeof ROWS)[number]["status"]) {
  if (s === "available") return "bg-accent text-text";
  if (s === "expand") return "bg-accent-100 text-accent-800";
  return "bg-text text-bg";
}

export default function ScopePage() {
  return (
    <main className="flex flex-col gap-5">
      <div>
        <div className="kicker">Build map</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Already available · expand · new</h1>
        <p className="mt-2 text-[14px] max-w-[680px] text-neutral-800">
          First commercial release: one connected departure workspace, core supplier modules including group flights, CRM, itinerary and pricing, passenger records, confirmations, deadlines, basic financial control, AI Tour Producer and document extraction.
        </p>
      </div>
      <div className="overflow-auto border-2 border-divider">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-surface">
              <th className="text-left px-3 py-2">Area</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.area} className="border-t border-divider">
                <td className="px-3 py-2 font-extrabold">{r.area}</td>
                <td className="px-3 py-2">
                  <span className={`tag text-[10px] uppercase font-extrabold ${tone(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-3 py-2">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
