"use client";

import { useState } from "react";
import { useIos } from "@/lib/ios/store";
import { addNote } from "@/lib/ios/domain";
import { fmtDateTime, memberName } from "@/lib/ios/rules";
import type { TripFile } from "@/lib/ios/types";
import { Badge, Card, Field, Section, btn, inputCls } from "../ui";
import Documents from "./Documents";

/** Messages and Files (DOC05): original input, kept files, internal notes vs external correspondence. */
export default function Files({ trip }: { trip: TripFile }) {
  const { state, run } = useIos();
  const [text, setText] = useState("");
  const [external, setExternal] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Documents trip={trip} />
        <Section title="Original enquiry">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#5b5754]">
              <Badge>Received by {trip.source.channel.replace("_", " ")}</Badge>
              <span>Created {fmtDateTime(trip.createdAt, state.settings.timezone)} by {memberName(state, trip.createdBy)}</span>
            </div>
            {trip.source.original ? (
              <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[14px] leading-relaxed text-[#201e1d]">{trip.source.original}</pre>
            ) : (
              <p className="mt-3 text-[15px] text-[#6b6764]">Entered manually; no original message was kept.</p>
            )}
            {trip.source.files.length > 0 && (
              <ul className="m-0 mt-4 list-none p-0 text-[15px]">
                {trip.source.files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 py-1">
                    <Badge tone={f.status === "parsed" ? "good" : "warn"}>{f.status === "parsed" ? "Read" : "Kept, not read"}</Badge>
                    {f.name} · {(f.size / 1024).toFixed(0)} KB
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>

        <Section title={`Notes and correspondence (${trip.notes.length})`}>
          <Card>
            {trip.notes.length ? (
              <ol className="m-0 list-none p-0">
                {trip.notes.map((n) => (
                  <li key={n.id} className="border-t border-[#ebe8e5] px-4 py-3 first:border-t-0">
                    <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#6b6764]">
                      <Badge tone={n.external ? "info" : "neutral"}>{n.external ? "External correspondence" : "Internal note"}</Badge>
                      {fmtDateTime(n.at, state.settings.timezone)} · {memberName(state, n.by)}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[15px]">{n.text}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-4 py-3 text-[15px] text-[#6b6764]">Nothing yet.</p>
            )}
          </Card>
        </Section>
      </div>

      <Section title="Add">
        <Card className="flex flex-col gap-3 p-5">
          <Field id="nt" label={external ? "Paste the correspondence" : "Internal note"} error={err || undefined}>
            <textarea id="nt" className={`${inputCls} min-h-[120px]`} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div role="radiogroup" aria-label="Type" className="flex gap-4 text-[15px]">
            <label className="flex items-center gap-2"><input type="radio" name="nt-kind" checked={!external} onChange={() => setExternal(false)} /> Internal note</label>
            <label className="flex items-center gap-2"><input type="radio" name="nt-kind" checked={external} onChange={() => setExternal(true)} /> External correspondence</label>
          </div>
          <button type="button" className={btn.primary} onClick={() => {
            const r = run((s, m, now) => addNote(s, m, trip.id, text, external, now));
            if (!r.ok) setErr(r.error.message);
            else { setText(""); setErr(""); }
          }}>
            Add to trip file
          </button>
          <p className="text-[14px] text-[#6b6764]">Email and messaging connectors that thread replies automatically arrive in P1. Internal notes never appear on customer documents.</p>
        </Card>
      </Section>
    </div>
  );
}
