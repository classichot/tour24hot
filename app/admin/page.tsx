"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { NAV, type NavDir } from "@/lib/nav";
import { riskFor, ticketsFor } from "@/lib/control";
import { CC } from "./copy";
import { liveSummary, OverviewView, RiskView, SectionView, SupportView, type Mark, type Marks } from "./sections";

const DIRS: NavDir[] = ["outbound", "inbound"];

function NavButton({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap border border-divider px-4 py-2.5 text-left font-[family-name:var(--font-heading)] text-[14px] font-bold lg:border-0 ${
        active ? "bg-text text-bg" : "bg-bg text-text hover:bg-surface"
      }`}
    >
      <span className="lg:truncate">{label}</span>
      {badge ? (
        <span className={`min-w-[22px] px-1.5 py-0.5 text-center text-[11px] font-extrabold ${active ? "bg-accent text-text" : "bg-accent-700 text-bg"}`}>{badge}</span>
      ) : null}
    </button>
  );
}

export default function AdminPage() {
  const { t, L, inboundMode, setInboundMode } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const dir: NavDir = inboundMode ? "inbound" : "outbound";
  const [picked, setPicked] = useState(() => params.get("tab") ?? "overview");
  const [marks, setMarks] = useState<Marks>({});

  // A tab from the other direction (e.g. after the header toggle) falls back to Overview.
  const items = NAV[dir];
  const tab = picked === "overview" || picked === "risk" || picked === "support" || items.some((n) => n.id === picked) ? picked : "overview";
  const current = items.find((n) => n.id === tab);

  const sync = (nextDir: NavDir, nextTab: string) => {
    const q = new URLSearchParams({ dir: nextDir });
    if (nextTab !== "overview") q.set("tab", nextTab);
    router.replace(`/admin?${q.toString()}`, { scroll: false });
  };
  const open = (id: string) => {
    setPicked(id);
    sync(dir, id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const switchDir = (next: NavDir) => {
    if (next === dir) return;
    setInboundMode(next === "inbound");
    setPicked("overview");
    sync(next, "overview");
  };
  const mark: Mark = (key, value) =>
    setMarks((m) => {
      const next = { ...m };
      if (value === null) delete next[key];
      else next[key] = value;
      return next;
    });

  return (
    <main className="mx-auto w-full max-w-[1400px] px-5 pb-24 lg:px-[22px]">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b-2 border-text pb-6 pt-7">
        <div>
          <div className="kicker">{t.adKicker}</div>
          <h1 className="mt-1.5 text-[clamp(30px,3.2vw,44px)]">{t.adTitle}</h1>
          <p className="mt-2 text-[14px] text-neutral-700">
            {L(CC.synced)} · {dir === "inbound" ? t.navModeIn : t.navModeOut} · {items.length} {L(CC.sections)}
          </p>
        </div>
        <div role="group" aria-label={t.fDirection} className="inline-flex border-2 border-text">
          {DIRS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dir === d}
              onClick={() => switchDir(d)}
              className={`cursor-pointer border-0 px-5 py-2.5 font-[family-name:var(--font-heading)] text-[15px] font-extrabold ${
                dir === d ? "bg-text text-bg" : "bg-bg text-text hover:bg-surface"
              }`}
            >
              {d === "inbound" ? t.navModeIn : t.navModeOut}
              <span className="ml-2 text-[12px] font-normal opacity-70">{NAV[d].length}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="grid items-start gap-8 pt-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <nav
          aria-label={L(CC.sectionsNav)}
          className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-[105px] lg:mx-0 lg:overflow-visible lg:px-0"
        >
          <div className="flex gap-1 lg:flex-col lg:gap-0 lg:border-2 lg:border-divider lg:bg-bg">
            <NavButton active={tab === "overview"} onClick={() => open("overview")} label={L(CC.overview)} />
            <div className="hidden px-4 pb-1.5 pt-4 microlabel lg:block">
              {L(CC.menuGroup)} · {dir === "inbound" ? t.navModeIn : t.navModeOut}
            </div>
            {items.map((n) => (
              <NavButton key={n.id} active={tab === n.id} onClick={() => open(n.id)} label={t[n.label]} badge={liveSummary(n, marks).pending} />
            ))}
            <div className="hidden px-4 pb-1.5 pt-4 microlabel lg:block">{L(CC.opsGroup)}</div>
            <NavButton active={tab === "risk"} onClick={() => open("risk")} label={t.adRisk} badge={riskFor(dir).filter((r) => r.level === "risk" || r.level === "watch").length} />
            <NavButton active={tab === "support"} onClick={() => open("support")} label={t.adSupport} badge={ticketsFor(dir).length} />
          </div>
        </nav>

        <section className="min-w-0" aria-live="polite">
          {tab === "overview" && <OverviewView dir={dir} open={open} marks={marks} mark={mark} />}
          {current && <SectionView item={current} marks={marks} mark={mark} />}
          {tab === "risk" && <RiskView dir={dir} />}
          {tab === "support" && <SupportView dir={dir} />}
        </section>
      </div>
    </main>
  );
}
