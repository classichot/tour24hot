"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { AGENT_ORDER, agentMeta } from "@/lib/os/agi/copy";
import { AGI_DEP_ID, type FactClass } from "@/lib/os/agi/types";
import { money } from "@/lib/os/engines";
import { LocText, Pill, Stat, Table } from "@/components/os/ui";
import AgiToggle from "@/components/os/AgiToggle";
import AgiWorkbench from "@/components/os/agi/AgiWorkbench";

function tone(k: FactClass): "ok" | "warn" | "hold" {
  if (k === "confirmed") return "ok";
  if (k === "estimate") return "warn";
  return "hold";
}

export default function AgiPage() {
  const { lang, L } = useApp();
  const {
    a,
    agi,
    pauseMission,
    runChangeOnce,
    applyChangeOnce,
    runRescue,
    applyRescue,
    snap,
    setAgiOn,
    resumeJob,
  } = useOs();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const mission = agi.missions.find((m) => m.id === agi.activeId) || agi.missions[0];
  const lead = mission?.options[0];
  const written = snap.departures.some((d) => d.id === AGI_DEP_ID);

  if (!ready) return <main className="min-h-[40vh]" />;

  if (!agi.on) {
    return (
      <main className="flex flex-col gap-6 max-w-[820px]">
        <div>
          <div className="kicker">{a.agiOff}</div>
          <h1 className="mt-1 text-[clamp(28px,3vw,44px)]">{a.offTitle}</h1>
          <p className="mt-2 text-[15px] text-neutral-800">{a.offBody}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-divider">
          <div className="p-4">
            <div className="microlabel">{a.normalAi}</div>
            <p className="mt-2 text-[14px]">{a.normalHelp}</p>
          </div>
          <div className="p-4 border-t-2 md:border-t-0 md:border-l-2 border-divider bg-accent-100">
            <div className="microlabel">{a.agi}</div>
            <p className="mt-2 text-[14px]">{a.agiHelp}</p>
          </div>
        </div>
        <AgiToggle />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-[820px]">
          <div className="kicker">{a.agiLayer}</div>
          <h1 className="mt-1 text-[clamp(26px,3.2vw,46px)]">{a.askAgi}</h1>
          <p className="mt-2 text-[15px] text-neutral-800">{a.promise}</p>
        </div>
        <AgiToggle />
      </div>

      {!mission && (
        <p className="text-[14px] text-neutral-800">{a.watchQuote}</p>
      )}

      {mission && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-2 border-2 border-divider p-3.5">
            <div>
              <div className="microlabel">{a.active}</div>
              <div className="font-extrabold text-[16px] mt-1">{mission.objective.slice(0, 140)}{mission.objective.length > 140 ? "…" : ""}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Pill tone={mission.paused ? "hold" : mission.status === "awaiting_approval" ? "warn" : "ok"}>{mission.status}</Pill>
                {written && <Pill tone="ok">{a.written}</Pill>}
                <Pill tone="warn">{a.notSecured}</Pill>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => pauseMission(mission.id)}>
                {mission.paused ? a.resume : a.pause}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setAgiOn(false)}>
                {a.takeover}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-2 border-divider">
            <Stat n={String(lead?.pax || "—")} l="Pax" />
            <Stat n={lead ? money(lead.sell) : "—"} l="Sell (est.)" />
            <Stat n={lead ? money(lead.cost) : "—"} l="Cost (est.)" />
            <Stat n={lead ? `${lead.margin.toFixed(1)}%` : "—"} l={a.floor} />
            <Stat n={money(agi.authority.spendLimit)} l={a.spend} />
          </div>

          <p className="text-[13px] font-extrabold text-accent-800">{a.watchQuote}</p>

          <section>
            <h2 className="text-[20px] mb-2">{a.confirmed} · {a.estimate} · {a.missing}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-divider">
              {(["confirmed", "estimate", "missing"] as FactClass[]).map((k) => (
                <div key={k} className="p-3.5 border-t-2 md:border-t-0 md:border-l-2 border-divider first:border-l-0 first:border-t-0">
                  <div className="microlabel mb-2">{k === "confirmed" ? a.confirmed : k === "estimate" ? a.estimate : a.missing}</div>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {mission.facts.filter((f) => f.klass === k).map((f) => (
                      <li key={f.id}>
                        <div className="flex items-center gap-2">
                          <Pill tone={tone(f.klass)}>{f.klass}</Pill>
                          <span className="font-extrabold text-[13px]"><LocText v={f.label} /></span>
                        </div>
                        <p className="text-[12px] text-neutral-800 mt-0.5"><LocText v={f.value} /></p>
                        <div className="text-[11px] text-neutral-700">{f.source}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[20px] mb-2">{a.options}</h2>
            <Table
              heads={["Option", "Pax", "Sell", "Cost", "Margin", "Notes"]}
              rows={mission.options.map((opt) => [
                <LocText key={opt.id} v={opt.label} />,
                String(opt.pax),
                money(opt.sell),
                money(opt.cost),
                `${opt.margin.toFixed(1)}%`,
                opt.notes.map((n) => L(n)).join(" · "),
              ])}
            />
          </section>

          <section>
            <h2 className="text-[20px] mb-2">{a.jobs}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-divider">
              {mission.jobs.map((j) => (
                <div key={j.id} className="p-3.5 border-t-2 md:border-t-0 md:border-l-2 border-divider first:border-l-0 [&:nth-child(-n+2)]:md:border-t-0 [&:nth-child(n+3)]:border-t-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-[13px]">{agentMeta(lang, j.agent).name}</div>
                    <Pill tone={j.status === "done" ? "ok" : j.status === "waiting" ? "warn" : "hold"}>{j.status}</Pill>
                  </div>
                  <div className="text-[13px] mt-1"><LocText v={j.title} /></div>
                  <p className="text-[12px] text-neutral-800 mt-1"><LocText v={j.note} /></p>
                  {j.status === "waiting" && (
                    <button type="button" className="btn btn-secondary mt-2" onClick={() => resumeJob(j.id)}>
                      {a.supplierReplied}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Box title={a.blockers}>
              {mission.blockers.map((b, i) => (
                <p key={i} className="text-[13px] mb-2"><LocText v={b} /></p>
              ))}
            </Box>
            <Box title={a.deadlines}>
              {mission.deadlines.map((d) => (
                <p key={d.due} className="text-[13px] mb-2">
                  <LocText v={d.label} /> · {d.due.slice(0, 16).replace("T", " ")}
                </p>
              ))}
            </Box>
            <Box title={a.authority}>
              <p className="text-[13px]">{a.spend}: {money(agi.authority.spendLimit)}</p>
              <p className="text-[13px] mt-1">{a.floor}: {agi.authority.discountFloor}%</p>
              <p className="text-[13px] mt-1">{a.cannotConfirm}</p>
              <p className="text-[13px] mt-1">{a.canQuote}</p>
            </Box>
          </section>

          <section className="border-2 border-text p-3.5 flex flex-col gap-3">
            <div>
              <div className="kicker">{a.changeOnce}</div>
              <p className="text-[13px] mt-1 text-neutral-800">
                {L({ th: "ลูกค้าเหลือ 32 คน — ระบบไล่ผลต่อไฟลต์ ห้อง รถ อาหาร ตั๋ว ไกด์ ราคา และมาร์จิ้น", en: "Client is now 32. The team traces air, rooms, coach, meals, tickets, guide, price and margin." })}
              </p>
            </div>
            <button type="button" className="btn btn-secondary self-start" onClick={runChangeOnce} disabled={!!mission.changePlan}>
              {a.changeRun}
            </button>
            {mission.changePlan && (
              <>
                <Table
                  heads={["Module", "What changes", "Money", "Reconfirm"]}
                  rows={mission.changePlan.lines.map((ln) => [
                    ln.module,
                    <LocText key={ln.module} v={ln.what} />,
                    money(ln.cost),
                    ln.reconfirm ? a.waitingSupplier : "—",
                  ])}
                />
                <div className="text-[13px] font-extrabold">
                  {a.impact}: sell {money(mission.changePlan.newSell)} · cost {money(mission.changePlan.newCost)} · margin {mission.changePlan.newMargin.toFixed(1)}%
                </div>
                <button type="button" className="btn btn-primary self-start" onClick={applyChangeOnce} disabled={mission.changePlan.applied}>
                  {mission.changePlan.applied ? "✓" : a.changeApply}
                </button>
              </>
            )}
          </section>

          <section className="border-2 border-divider p-3.5 flex flex-col gap-3">
            <div>
              <div className="kicker">{a.rescue}</div>
              <p className="text-[13px] mt-1 text-neutral-800">
                {L({ th: "เมื่อฟีดหรือไกด์รายงานดีเลย์ ทีมเสนอแผนกู้ พร้อมต้นทุน ผลกระทบ และอำนาจ", en: "When a feed or guide reports a delay, the team offers recoveries with cost, customer impact and authority." })}
              </p>
            </div>
            <button type="button" className="btn btn-secondary self-start" onClick={runRescue} disabled={!!mission.rescue}>
              {a.rescueRun}
            </button>
            {mission.rescue && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {mission.rescue.options.map((opt) => (
                  <div key={opt.id} className="border-2 border-divider p-3 flex flex-col gap-2">
                    <div className="font-extrabold text-[14px]"><LocText v={opt.title} /></div>
                    <p className="text-[12px]"><LocText v={opt.availability} /></p>
                    <p className="text-[12px]"><LocText v={opt.customerImpact} /></p>
                    <div className="text-[13px] font-extrabold">{money(opt.extraCost)}</div>
                    <Pill tone={opt.needsApproval ? "warn" : "ok"}>{opt.needsApproval ? a.approvals : a.spend}</Pill>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={mission.rescue?.chosen === opt.id}
                      onClick={() => applyRescue(opt.id)}
                    >
                      {mission.rescue?.chosen === opt.id ? "✓" : a.rescuePick}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[20px] mb-2">{a.agentsTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {AGENT_ORDER.map((id) => {
                const meta = agentMeta(lang, id);
                const job = mission.jobs.find((j) => j.agent === id);
                return (
                  <div key={id} className="border-2 border-divider p-3">
                    <div className="font-extrabold text-[13px]">{meta.name}</div>
                    <p className="text-[12px] text-neutral-800 mt-1">{meta.role}</p>
                    {job && <div className="mt-2"><Pill tone={job.status === "done" ? "ok" : "warn"}>{job.status}</Pill></div>}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[20px] mb-2">{a.completed}</h2>
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {mission.log.slice(0, 8).map((row, i) => (
                <li key={`${row.at}-${i}`}>
                  <span className="font-extrabold">{agentMeta(lang, row.agent).name}</span>
                  {" — "}
                  <LocText v={row.text} />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
              <Link href="/os/sales">{L({ th: "ดูในขาย", en: "Open Sales" })}</Link>
              <Link href={`/os/departures/${AGI_DEP_ID}`}>{L({ th: "เปิดรอบเดินทาง", en: "Open departure" })}</Link>
              <Link href="/os/finance">{L({ th: "ดูการเงิน", en: "Open Finance" })}</Link>
            </div>
          </section>
        </>
      )}

      <AgiWorkbench />
    </main>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-divider p-3.5">
      <div className="microlabel mb-2">{title}</div>
      {children}
    </div>
  );
}
