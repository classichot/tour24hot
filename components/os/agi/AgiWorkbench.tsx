"use client";

import Link from "next/link";
import { LocText, Pill, Stat, Table } from "@/components/os/ui";
import { agentMeta } from "@/lib/os/agi/copy";
import { buildAutopilot, buildScorecards, FLAGSHIP_TAP, waitingJobs } from "@/lib/os/agi/features";
import { money } from "@/lib/os/engines";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";

export default function AgiWorkbench() {
  const { lang, L } = useApp();
  const {
    a,
    agi,
    resumeJob,
    authorizeRound,
    markSupplierReply,
    runRehearsalCase,
    acceptTapBrief,
  } = useOs();
  const mission = agi.missions.find((m) => m.id === agi.activeId) || agi.missions[0];
  const waiting = waitingJobs(mission);
  const cards = buildScorecards(mission);
  const auto = buildAutopilot(mission);
  const neg = agi.negotiation;
  const mem = agi.memory;
  const rehearsal = agi.rehearsal;
  const tapJson = JSON.stringify(FLAGSHIP_TAP, null, 2);
  const latest = agi.ingests[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="border-2 border-text p-3.5 flex flex-col gap-3 bg-accent-100">
        <div>
          <div className="kicker">{a.ingest}</div>
          <p className="text-[13px] mt-1 text-neutral-800">{a.askAgiIngestHint}</p>
        </div>
        {latest && (
          <div className="border-2 border-divider p-3 bg-bg">
            <div className="flex flex-wrap gap-2 items-center">
              <Pill tone="warn">{latest.kind}</Pill>
              <span className="font-extrabold text-[13px]">{latest.name}</span>
            </div>
            <p className="text-[12px] mt-1"><LocText v={latest.note} /></p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {(["confirmed", "estimate", "missing"] as const).map((k) => (
                <div key={k}>
                  <div className="microlabel mb-1">{k === "confirmed" ? a.confirmed : k === "estimate" ? a.estimate : a.missing}</div>
                  {latest.facts.filter((f) => f.klass === k).map((f) => (
                    <p key={f.id} className="text-[12px]">
                      <LocText v={f.label} /> — <LocText v={f.value} />
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {waiting.length > 0 && (
        <section>
          <h2 className="text-[20px] mb-2">{a.jobsWait}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-divider">
            {waiting.map((j) => (
              <div key={j.id} className="p-3.5 border-t-2 md:border-t-0 md:border-l-2 border-divider first:border-l-0 first:border-t-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-[13px]">{agentMeta(lang, j.agent).name}</div>
                  <Pill tone="warn">{j.status}</Pill>
                </div>
                <div className="text-[13px] mt-1"><LocText v={j.title} /></div>
                <p className="text-[12px] text-neutral-800 mt-1"><LocText v={j.note} /></p>
                {j.deadline && <div className="text-[11px] text-neutral-700 mt-1">{j.deadline.slice(0, 16).replace("T", " ")}</div>}
                {j.waitingOn && <div className="text-[11px] mt-1">{j.waitingOn}</div>}
                <button type="button" className="btn btn-primary mt-2" onClick={() => resumeJob(j.id)}>
                  {a.supplierReplied}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[20px] mb-2">{a.memory}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-divider">
          {mem.map((row) => (
            <div key={row.id} className="p-3.5 border-t-2 md:border-t-0 md:border-l-2 border-divider first:border-l-0 [&:nth-child(-n+2)]:md:border-t-0 [&:nth-child(n+3)]:border-t-2">
              <div className="font-extrabold text-[13px]"><LocText v={row.topic} /></div>
              <p className="text-[12px] mt-1"><LocText v={row.body} /></p>
              <div className="text-[11px] text-neutral-700 mt-2">
                {row.source} · {row.region} · {a.memoryValid} {row.validFrom} → {row.validTo}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
          <h2 className="text-[20px]">{a.scorecards}</h2>
          <div className="text-[12px] text-neutral-700">{a.adapter}</div>
        </div>
        <p className="text-[12px] text-neutral-800 mb-2">{a.adapterHint}</p>
        <Table
          heads={[L({ th: "เอเจนต์", en: "Agent" }), a.completed, a.jobsWait, L({ th: "แก้", en: "Corrections" }), a.impact]}
          rows={cards.map((c) => [
            agentMeta(lang, c.agent).name,
            String(c.completed),
            String(c.waiting),
            String(c.corrections),
            money(c.costImpact),
          ])}
        />
      </section>

      {neg && (
        <section className="border-2 border-divider p-3.5 flex flex-col gap-3">
          <div>
            <div className="kicker">{a.negotiation}</div>
            <p className="text-[13px] mt-1">{a.notCommitment}</p>
          </div>
          <Table
            heads={[L({ th: "ซัพพลายเออร์", en: "Supplier" }), L({ th: "โมดูล", en: "Module" }), a.normalize, "THB", "Via"]}
            rows={neg.offers.map((o) => [
              <LocText key={o.id} v={o.supplier} />,
              o.module,
              o.inclusions.map((x) => L(x)).join(" · "),
              money(o.total),
              `${o.via} · ${o.klass}`,
            ])}
          />
          <div className="flex flex-col gap-1.5">
            {neg.rounds.map((r) => (
              <div key={r.n} className="flex flex-wrap items-center gap-2 text-[13px]">
                <Pill tone={r.status === "replied" ? "ok" : "warn"}>R{r.n} {r.status}</Pill>
                <LocText v={r.note} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={authorizeRound}>
              {a.roundAuth}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => markSupplierReply()}>
              {a.roundReply}
            </button>
            <Link href="/portal/supplier" className="btn btn-secondary no-underline">
              {a.viaPortal}
            </Link>
          </div>
        </section>
      )}

      <section className="border-2 border-text p-3.5 flex flex-col gap-3">
        <div className="kicker">{a.autopilot}</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] border-2 border-divider">
          <Stat n={String(auto.sold)} l={L({ th: "ขายแล้ว", en: "Sold" })} />
          <Stat n={money(auto.committedCost)} l={a.committed} />
          <Stat n={money(auto.estimatedCost)} l={a.estimatedCost} />
          <Stat n={`${auto.margin.toFixed(1)}%`} l={a.floor} />
          <Stat n={money(auto.cash)} l={L({ th: "เงินสด / ค่าปรับ", en: "Cash / penalties" })} />
        </div>
        <div>
          {auto.releases.map((r) => (
            <p key={r.due} className="text-[13px] mb-1">
              <LocText v={r.label} /> · {r.due.slice(0, 16).replace("T", " ")} — <LocText v={r.risk} />
            </p>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {auto.recs.map((r) => (
            <div key={r.id} className="border-2 border-divider p-3">
              <div className="microlabel">{r.action}</div>
              <div className="font-extrabold text-[14px] mt-1"><LocText v={r.title} /></div>
              <p className="text-[12px] mt-1"><LocText v={r.assumption} /></p>
              <div className="text-[12px] mt-1">
                {a.impact}: margin {r.marginDelta >= 0 ? "+" : ""}
                {r.marginDelta.toFixed(1)}pp · cash {money(r.cashDelta)} · {L({ th: "ค่าปรับ", en: "penalty" })} {money(r.penalty)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[20px] mb-2">{a.rehearsal}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(rehearsal?.cases || []).map((c) => (
            <div key={c.id} className={`border-2 p-3.5 flex flex-col gap-2 ${c.ran ? "border-text bg-accent-100" : "border-divider"}`}>
              <div className="font-extrabold text-[14px]"><LocText v={c.label} /></div>
              <p className="text-[12px]"><LocText v={c.trigger} /></p>
              <div>
                <div className="microlabel">{a.fragile}</div>
                <p className="text-[12px]"><LocText v={c.fragile} /></p>
              </div>
              <div>
                <div className="microlabel">{a.assumption}</div>
                <p className="text-[12px]"><LocText v={c.assumption} /></p>
              </div>
              {c.ran && (
                <p className="text-[13px] font-extrabold">
                  <LocText v={c.outcome} />
                </p>
              )}
              <button type="button" className="btn btn-secondary self-start" onClick={() => runRehearsalCase(c.id)} disabled={c.ran}>
                {c.ran ? "✓" : a.rehearsalRun}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-2 border-divider p-3.5 flex flex-col gap-3">
        <div className="kicker">{a.agentDirect}</div>
        <p className="text-[13px]">{a.tapExternal}. {a.tapInternal}.</p>
        <pre className="input text-[11px] whitespace-pre-wrap min-h-[140px] overflow-auto">{tapJson}</pre>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => acceptTapBrief(tapJson)}>
            {a.tapAccept}
          </button>
          <Link href="/agents" className="btn btn-secondary no-underline">
            TAP /agents
          </Link>
        </div>
      </section>
    </div>
  );
}
