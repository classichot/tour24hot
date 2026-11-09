"use client";

import Link from "next/link";
import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { GUEST_TEMPLATE, importGuests, saveGuests, validateGuestCsv, type GuestRowResult } from "@/lib/ios/ops";
import { uid } from "@/lib/ios/domain";
import { can, headcount, opsChecks } from "@/lib/ios/rules";
import type { Traveller, TripFile } from "@/lib/ios/types";
import { Badge, Card, Empty, ErrorSummary, Notice, Section, btn, inputCls } from "../ui";

const cell = "rounded-[4px] border border-[#c9c5c1] bg-white px-2 py-1.5 text-[15px] w-full min-w-0 disabled:bg-[#f3f2f1]";

/** Guests (spec §9 GST01–04): named travellers, rooms and pickup groups; CSV import with a validation preview. */
export default function Guests({ trip }: { trip: TripFile }) {
  const { me, today, run } = useIos();
  const canView = can(me, "guest.view");
  const canEdit = can(me, "guest.edit");
  const restricted = can(me, "guest.restricted");
  // Identity details stay hidden until someone with a purpose asks to see them (GST04).
  const [showId, setShowId] = useState(false);
  const idCols = restricted && showId;
  const [rows, setRows] = useState<Traveller[]>(trip.guests);
  const [base, setBase] = useState(trip.guestsVersion);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{ rows: GuestRowResult[]; missing: string[]; version: number } | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  // Adopt a newer saved list when there are no unsaved edits here (derived state, no effect).
  if (!dirty && trip.guestsVersion !== base) {
    setRows(trip.guests);
    setBase(trip.guestsVersion);
  }

  if (!canView) {
    return <Notice tone="neutral">Guest records are restricted for your role. Operations and sales can see the traveller list; identity details are limited further.</Notice>;
  }

  const booked = headcount(trip);
  const checks = opsChecks(trip, [], 0).filter((c) => c.tab === "guests");
  const edit = (i: number, patch: Partial<Traveller>) => {
    setRows((r) => r.map((g, j) => (j === i ? { ...g, ...patch } : g)));
    setDirty(true);
    setMsg("");
  };
  const editR = (i: number, patch: NonNullable<Traveller["restricted"]>) => edit(i, { restricted: { ...rows[i].restricted, ...patch } });

  const save = () => {
    const r = run((s, m, now) => saveGuests(s, m, trip.id, base, rows, now));
    if (!r.ok) {
      setErrors(r.error.fieldErrors?.length ? r.error.fieldErrors : [{ field: "guests", message: r.error.message }]);
      return;
    }
    setErrors([]);
    setBase(r.value.guestsVersion);
    setRows(r.value.guests);
    setDirty(false);
    setMsg(`Saved guest list v${r.value.guestsVersion}. Documents built from the previous list are now marked outdated.`);
  };

  const validate = (text: string) => {
    const v = validateGuestCsv(text, trip.guests, today);
    setPreview({ ...v, version: trip.guestsVersion });
    setPicked(new Set(v.rows.filter((r) => r.guest).map((r) => r.row)));
  };

  const doImport = () => {
    if (!preview) return;
    const selected = preview.rows.filter((r) => r.guest && picked.has(r.row)).map((r) => r.guest!);
    const r = run((s, m, now) => importGuests(s, m, trip.id, preview.version, selected, preview.rows.length, now));
    if (!r.ok) {
      setErrors([{ field: "import", message: r.error.message }]);
      return;
    }
    setErrors([]);
    setPreview(null);
    setCsv("");
    setDirty(false);
    setMsg(`Imported ${selected.length} of ${preview.rows.length} rows. The commercial headcount stays ${booked}.`);
  };

  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(`${GUEST_TEMPLATE}\nWang Wei,adult,Chinese,CZ3051 07:10,T01,twin,CZ3051,Vegetarian,China,E12345678,1980-04-12\n`)}`;
  const rooms = Array.from(new Set(rows.filter((g) => g.room).map((g) => g.room!)));
  const groups = Array.from(new Set(rows.filter((g) => g.pickupGroup).map((g) => g.pickupGroup!)));

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Travellers"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={rows.length === booked ? "good" : "warn"}>{rows.length} named of {booked} booked</Badge>
            {dirty && <Badge tone="warn">Unsaved changes</Badge>}
            {restricted && (
              <button type="button" className={btn.ghost} aria-pressed={showId} onClick={() => setShowId((v) => !v)}>
                {showId ? "Hide identity details" : "Show identity details"}
              </button>
            )}
          </div>
        }
      >
        <Notice tone="info">
          Naming travellers never changes the booked headcount or price. If the group size really changed, use{" "}
          <Link href="?tab=overview#changes" scroll={false} className="font-semibold">a change proposal</Link> so suppliers and documents are reviewed.
        </Notice>
        <ErrorSummary errors={errors} />
        {msg && (
          <div role="status" aria-live="polite">
            <Notice tone="good">{msg}</Notice>
          </div>
        )}
        {checks.length > 0 && (
          <Card className="p-4">
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px]">
              {checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2">
                  <Badge tone={c.severity === "block" ? "bad" : "warn"}>{c.severity === "block" ? "Blocks" : "Check"}</Badge>
                  {c.text}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {rows.length === 0 && !canEdit ? (
          <Empty title="No travellers named yet" />
        ) : (
          <Card className="relative overflow-x-auto">
            <table id="field-guests" className={`w-full table-fixed border-collapse text-[15px] ${idCols ? "min-w-[1640px]" : "min-w-[1300px]"}`}>
              <thead>
                <tr className="bg-[#fbfaf9] text-left text-[13px] font-bold uppercase tracking-[0.05em] text-[#6b6764]">
                  <th className="w-[48px] px-3 py-2.5">#</th>
                  <th className="w-[210px] px-2 py-2.5">Name</th>
                  <th className="w-[110px] px-2 py-2.5">Type</th>
                  <th className="w-[120px] px-2 py-2.5">Language</th>
                  <th className="w-[170px] px-2 py-2.5">Arrival</th>
                  <th className="w-[84px] px-2 py-2.5">Room</th>
                  <th className="w-[110px] px-2 py-2.5">Room type</th>
                  <th className="w-[130px] px-2 py-2.5">Pickup group</th>
                  <th className="px-2 py-2.5">Service notes</th>
                  {idCols && <th className="w-[340px] px-2 py-2.5">Nationality · passport · birth date</th>}
                  {canEdit && <th className="w-[96px] px-2 py-2.5"><span className="sr-only">Remove</span></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((g, i) => (
                  <tr key={g.id} className="border-t border-[#ebe8e5] align-top">
                    <td className="px-3 py-2 text-[#6b6764]">{i + 1}</td>
                    <td className="px-2 py-1.5"><input aria-label={`Name, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.name} onChange={(e) => edit(i, { name: e.target.value })} /></td>
                    <td className="px-2 py-1.5">
                      <select aria-label={`Type, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.category} onChange={(e) => edit(i, { category: e.target.value as Traveller["category"] })}>
                        <option value="adult">Adult</option>
                        <option value="child">Child</option>
                        <option value="infant">Infant</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5"><input aria-label={`Language, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.language ?? ""} onChange={(e) => edit(i, { language: e.target.value || undefined })} /></td>
                    <td className="px-2 py-1.5"><input aria-label={`Arrival, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.arrival ?? ""} placeholder={trip.arrival ? "Trip arrival" : ""} onChange={(e) => edit(i, { arrival: e.target.value || undefined })} /></td>
                    <td className="w-[90px] px-2 py-1.5"><input aria-label={`Room, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.room ?? ""} onChange={(e) => edit(i, { room: e.target.value || undefined })} /></td>
                    <td className="px-2 py-1.5">
                      <select aria-label={`Room type, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.roomType ?? ""} onChange={(e) => edit(i, { roomType: (e.target.value || undefined) as Traveller["roomType"] })}>
                        <option value="">—</option>
                        <option value="single">Single</option>
                        <option value="twin">Twin</option>
                        <option value="double">Double</option>
                        <option value="triple">Triple</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5"><input aria-label={`Pickup group, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.pickupGroup ?? ""} onChange={(e) => edit(i, { pickupGroup: e.target.value || undefined })} /></td>
                    <td className="px-2 py-1.5"><input aria-label={`Service notes, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.serviceNotes ?? ""} onChange={(e) => edit(i, { serviceNotes: e.target.value || undefined })} /></td>
                    {idCols && (
                      <td className="px-2 py-1.5">
                        <div className="grid grid-cols-[90px_1fr_130px] gap-1">
                          <input aria-label={`Nationality, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.restricted?.nationality ?? ""} onChange={(e) => editR(i, { nationality: e.target.value || undefined })} />
                          <input aria-label={`Passport number, traveller ${i + 1}`} className={cell} disabled={!canEdit} value={g.restricted?.passportNo ?? ""} onChange={(e) => editR(i, { passportNo: e.target.value || undefined })} />
                          <input aria-label={`Birth date, traveller ${i + 1}`} type="date" className={cell} disabled={!canEdit} value={g.restricted?.dob ?? ""} onChange={(e) => editR(i, { dob: e.target.value || undefined })} />
                        </div>
                      </td>
                    )}
                    {canEdit && (
                      <td className="px-2 py-1.5">
                        <button type="button" className={btn.ghost} aria-label={`Remove ${g.name || `traveller ${i + 1}`}`} onClick={() => { setRows((r) => r.filter((_, j) => j !== i)); setDirty(true); }}>
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.secondary} onClick={() => { setRows((r) => [...r, { id: uid(), name: "", category: "adult", language: trip.language }]); setDirty(true); }}>
              Add traveller
            </button>
            <button type="button" className={btn.primary} disabled={!dirty} onClick={save}>Save guest list</button>
            {dirty && <button type="button" className={btn.ghost} onClick={() => { setRows(trip.guests); setBase(trip.guestsVersion); setDirty(false); setErrors([]); }}>Discard changes</button>}
          </div>
        )}
        <p className="text-[14px] text-[#6b6764]">
          {restricted ? "Identity details are hidden unless shown, and kept unchanged when hidden." : "Identity details (nationality, passport, birth date) are hidden for your role and kept unchanged when you save."}
        </p>
      </Section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {canEdit && (
          <Section title="Import from a spreadsheet">
            <Card className="flex flex-col gap-3 p-4">
              <p className="text-[15px] text-[#5b5754]">
                Paste CSV or choose a file. Nothing is saved until you review the rows and import the ones you select.{" "}
                <a href={template} download="tour24-guest-template.csv" className="font-semibold">Download the template</a>
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                aria-label="Choose a CSV file"
                className="text-[15px]"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setCsv(text);
                  validate(text);
                }}
              />
              <label htmlFor="csv" className="text-[14px] font-semibold">Or paste rows (first line is the header)</label>
              <textarea id="csv" rows={5} className={`${inputCls} font-mono text-[14px]`} value={csv} placeholder={GUEST_TEMPLATE} onChange={(e) => setCsv(e.target.value)} />
              <div>
                <button type="button" className={btn.secondary} disabled={!csv.trim()} onClick={() => validate(csv)}>Check rows</button>
              </div>
            </Card>
          </Section>
        )}
        <Section title="Rooms and pickup">
          <Card className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">Rooms ({rooms.length})</div>
              <ul className="m-0 mt-1 list-none p-0 text-[15px]">
                {rooms.slice(0, 12).map((r) => (
                  <li key={r}>{r}: {rows.filter((g) => g.room === r).map((g) => g.name).join(", ")}</li>
                ))}
                {rooms.length > 12 && <li className="text-[#6b6764]">and {rooms.length - 12} more</li>}
                {!rooms.length && <li className="text-[#6b6764]">No rooms assigned.</li>}
              </ul>
            </div>
            <div>
              <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6b6764]">Pickup groups ({groups.length})</div>
              <ul className="m-0 mt-1 list-none p-0 text-[15px]">
                {groups.map((p) => (
                  <li key={p}>{p}: {rows.filter((g) => g.pickupGroup === p).length} travellers</li>
                ))}
                {!groups.length && <li className="text-[#6b6764]">No pickup groups.</li>}
                {rows.some((g) => !g.pickupGroup) && groups.length > 0 && <li className="font-semibold text-[#8a1f17]">{rows.filter((g) => !g.pickupGroup).length} without a pickup group</li>}
              </ul>
            </div>
          </Card>
        </Section>
      </div>

      {preview && (
        <Section title="Check imported rows" id="import">
          {preview.missing.length > 0 ? (
            <Notice tone="bad">The header is missing required columns: {preview.missing.join(", ")}. Use the template.</Notice>
          ) : (
            <>
              <Notice tone={preview.rows.some((r) => r.errors.length) ? "warn" : "good"}>
                {preview.rows.filter((r) => r.guest).length} valid, {preview.rows.filter((r) => r.errors.length).length} with problems. Rows with problems can&rsquo;t be imported; fix them in the file and check again.
              </Notice>
              <Card className="relative overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-[15px]">
                  <thead>
                    <tr className="bg-[#fbfaf9] text-left text-[13px] font-bold uppercase tracking-[0.05em] text-[#6b6764]">
                      <th className="px-3 py-2.5">Import</th>
                      <th className="px-2 py-2.5">Row</th>
                      <th className="px-2 py-2.5">Name</th>
                      <th className="px-2 py-2.5">Type</th>
                      <th className="px-2 py-2.5">Room</th>
                      <th className="px-2 py-2.5">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.row} className={`border-t border-[#ebe8e5] align-top ${r.errors.length ? "bg-[#fdf6f5]" : ""}`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Import row ${r.row}`}
                            disabled={!r.guest}
                            checked={picked.has(r.row)}
                            onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(r.row); else n.delete(r.row); return n; })}
                          />
                        </td>
                        <td className="px-2 py-2 text-[#6b6764]">{r.row}</td>
                        <td className="px-2 py-2">{r.guest?.name ?? r.raw[0] ?? ""}</td>
                        <td className="px-2 py-2">{r.guest?.category ?? r.raw[1] ?? ""}</td>
                        <td className="px-2 py-2">{r.guest?.room ?? "—"}</td>
                        <td className="px-2 py-2">
                          {r.errors.length ? (
                            <ul className="m-0 list-none p-0 font-semibold text-[#8a1f17]">
                              {r.errors.map((e) => <li key={e}>{e}</li>)}
                            </ul>
                          ) : (
                            <Badge tone="good">Ready</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <div className="flex flex-wrap gap-2">
                <button type="button" id="field-import" className={btn.primary} disabled={!picked.size || dirty} onClick={doImport}>
                  Import {picked.size} selected row{picked.size === 1 ? "" : "s"}
                </button>
                <button type="button" className={btn.secondary} onClick={() => setPreview(null)}>Cancel import</button>
              </div>
              {dirty && <p className="text-[14px] font-semibold text-[#8a1f17]">Save or discard your unsaved edits first; importing adds to the saved list.</p>}
            </>
          )}
        </Section>
      )}
    </div>
  );
}
