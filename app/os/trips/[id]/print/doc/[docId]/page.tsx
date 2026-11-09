"use client";

import { useParams } from "next/navigation";
import { useIos } from "@/lib/ios/store";
import { DOC_LABEL, docChecksumFor } from "@/lib/ios/ops";
import { can, docOutdated, fmtDate, fmtDateTime } from "@/lib/ios/rules";
import { GUEST_DOCS } from "@/components/ios/trip/Documents";

type Base = { company: string; ref: string; name: string; customer: string; start?: string; end?: string; guests: number; timezone: string };
type Itin = Base & { days: { n: number; date?: string; title: string; destination: string; notes?: string; services: { name: string; start?: string; end?: string; location?: string }[] }[] };
type Voucher = Base & { service?: string; category?: string; spec?: Record<string, string>; qty?: number; supplier?: string; supplierContact?: string; confirmationRef?: string; confirmer?: string };
type Rooming = Base & { hotels: { name: string; checkIn?: string; checkOut?: string }[]; rooms: { room: string; type?: string; guests: { name: string; category: string; notes?: string }[] }[] };
type Pickup = Base & { arrival?: string; groups: { group: string; guests: { name: string; arrival?: string; notes?: string }[] }[] };
type Run = Base & { opsOwner: string; rows: { date?: string; start?: string; end?: string; service: string; location?: string; supplier?: string; contact?: string; status: string; ref?: string }[]; incidents: string[] };

/**
 * Issued trip documents (DOC02): rendered only from the frozen snapshot, never from live records, with version,
 * checksum and a clear mark when the copy is a draft, superseded, revoked or outdated.
 */
export default function TripDocumentPrintPage() {
  const { state, me, hydrated } = useIos();
  const params = useParams();
  const trip = state.trips.find((t) => t.id === String(params.id));
  const doc = trip?.documents.find((d) => d.id === String(params.docId));
  if (!hydrated) return null;
  if (!trip || !doc || (GUEST_DOCS.includes(doc.type) && !can(me, "guest.view"))) return <p className="p-10 text-[16px]">This document is not available.</p>;
  const b = doc.snapshot as unknown as Base;
  const outdated = doc.status === "issued" && docOutdated(trip, doc);
  const intact = docChecksumFor(doc.snapshot) === doc.checksum;
  const banner =
    doc.status === "draft" ? "Draft — not issued" : doc.status === "superseded" ? "Superseded by a newer version" : doc.status === "revoked" ? "Revoked — do not use" : outdated ? "Outdated — the trip changed after this was issued" : "";

  return (
    <div className="mx-auto max-w-[860px] px-8 py-10 text-[15px] leading-relaxed print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <p className="text-[14px] text-[#5b5754]">{doc.visibility === "internal" ? "Internal document." : doc.visibility === "customer" ? "Customer version: no costs or internal notes." : "Supplier version."} Print or save as PDF from your browser.</p>
        <button type="button" onClick={() => window.print()} className="cursor-pointer rounded-[4px] border-0 bg-[#f2b01e] px-4 py-2 text-[15px] font-bold">Print or save as PDF</button>
      </div>
      {banner && <div className="mb-4 rounded-[4px] border-2 border-[#8a1f17] px-3 py-2 text-center text-[14px] font-bold uppercase tracking-[0.08em] text-[#8a1f17]">{banner}</div>}
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#201e1d] pb-4">
        <div>
          <div className="text-[22px] font-extrabold">{b.company}</div>
          <div className="text-[14px] text-[#5b5754]">{b.customer}</div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-extrabold">{DOC_LABEL[doc.type]}</div>
          <div className="text-[14px]">{b.ref} · version {doc.version}</div>
          <div className="text-[14px]">{doc.status === "draft" ? "Prepared" : "Issued"} {fmtDateTime(doc.generatedAt, b.timezone)}</div>
        </div>
      </header>
      <section className="mt-4">
        <div className="text-[18px] font-bold">{b.name}</div>
        <div>{fmtDate(b.start)} – {fmtDate(b.end)} · {b.guests} guests</div>
      </section>

      {doc.type === "itinerary" && (
        <section className="mt-5">
          {(b as Itin).days.map((d) => (
            <div key={d.n} className="border-b border-[#e6e3e0] py-3">
              <div className="font-bold">Day {d.n}{d.date ? ` · ${fmtDate(d.date)}` : ""} · {d.title}{d.destination ? ` (${d.destination})` : ""}</div>
              {d.notes && <div className="text-[#5b5754]">{d.notes}</div>}
              {d.services.length > 0 && (
                <ul className="m-0 mt-1 pl-5">
                  {d.services.map((s, i) => (
                    <li key={i}>{s.start ? `${s.start}${s.end ? `–${s.end}` : ""} · ` : ""}{s.name}{s.location ? `, ${s.location}` : ""}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {doc.type === "voucher" && (() => {
        const v = b as Voucher;
        return (
          <section className="mt-5 grid gap-2 rounded-[6px] border-2 border-[#201e1d] p-4">
            <div className="text-[18px] font-extrabold">{v.service}</div>
            <div>Supplier: <strong>{v.supplier}</strong>{v.supplierContact ? ` · ${v.supplierContact}` : ""}</div>
            <div>Confirmation: <strong className="font-mono">{v.confirmationRef}</strong> (confirmed by {v.confirmer})</div>
            <div>Quantity: {v.qty} · {fmtDate(v.start)}{v.end && v.end !== v.start ? ` – ${fmtDate(v.end)}` : ""}</div>
            {v.spec && Object.keys(v.spec).length > 0 && (
              <ul className="m-0 pl-5">
                {Object.entries(v.spec).map(([k, val]) => (
                  <li key={k}>{k}: {val}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })()}

      {doc.type === "rooming" && (() => {
        const r = b as Rooming;
        return (
          <section className="mt-5">
            <div className="text-[14px] text-[#5b5754]">{r.hotels.map((h) => `${h.name} (${fmtDate(h.checkIn)} – ${fmtDate(h.checkOut)})`).join(" · ")}</div>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#201e1d] text-left">
                  <th className="py-1.5">Room</th>
                  <th className="py-1.5">Type</th>
                  <th className="py-1.5">Guests</th>
                  <th className="py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {r.rooms.map((x) => (
                  <tr key={x.room} className="border-b border-[#e6e3e0] align-top">
                    <td className="py-1.5 font-semibold">{x.room}</td>
                    <td className="py-1.5">{x.type ?? "—"}</td>
                    <td className="py-1.5">{x.guests.map((g) => `${g.name}${g.category !== "adult" ? ` (${g.category})` : ""}`).join(", ")}</td>
                    <td className="py-1.5">{x.guests.map((g) => g.notes).filter(Boolean).join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })()}

      {doc.type === "pickup" && (() => {
        const p = b as Pickup;
        return (
          <section className="mt-5 flex flex-col gap-4">
            {p.arrival && <div>Arrival: <strong>{p.arrival}</strong></div>}
            {p.groups.map((g) => (
              <div key={g.group}>
                <div className="font-bold">{g.group} · {g.guests.length} travellers</div>
                <ol className="m-0 mt-1 pl-6">
                  {g.guests.map((x, i) => (
                    <li key={i}>{x.name}{x.arrival && x.arrival !== p.arrival ? ` · ${x.arrival}` : ""}{x.notes ? ` · ${x.notes}` : ""}</li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        );
      })()}

      {doc.type === "runsheet" && (() => {
        const r = b as Run;
        return (
          <section className="mt-5">
            <div>Operations owner: <strong>{r.opsOwner}</strong></div>
            <table className="mt-2 w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b-2 border-[#201e1d] text-left">
                  <th className="py-1.5 pr-2">Date</th>
                  <th className="py-1.5 pr-2">Time</th>
                  <th className="py-1.5 pr-2">Service</th>
                  <th className="py-1.5 pr-2">Supplier and contact</th>
                  <th className="py-1.5">Status · ref</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x, i) => (
                  <tr key={i} className="border-b border-[#e6e3e0] align-top">
                    <td className="py-1.5 pr-2">{fmtDate(x.date)}</td>
                    <td className="py-1.5 pr-2">{x.start ?? "—"}{x.end ? `–${x.end}` : ""}</td>
                    <td className="py-1.5 pr-2">{x.service}{x.location ? `, ${x.location}` : ""}</td>
                    <td className="py-1.5 pr-2">{x.supplier ?? "—"}{x.contact ? ` · ${x.contact}` : ""}</td>
                    <td className="py-1.5">{x.status.replace("_", " ")}{x.ref ? ` · ${x.ref}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.incidents.length > 0 && <p className="mt-3 font-semibold text-[#8a1f17]">Open incidents at issue: {r.incidents.join("; ")}</p>}
          </section>
        );
      })()}

      <footer className="mt-8 border-t border-[#e6e3e0] pt-3 text-[13px] text-[#5b5754]">
        {DOC_LABEL[doc.type]} v{doc.version} · checksum <span className="font-mono">{doc.checksum}</span> {intact ? "(content intact)" : "(content does not match checksum)"}
      </footer>
    </div>
  );
}
