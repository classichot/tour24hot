"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import { menuKeyFromPath } from "@/lib/os/playbook";
import type { AiDraft } from "@/lib/os/types";
import PlaybookPanel from "./Playbook";
import AgiToggle from "./AgiToggle";
import AskDock from "./AskDock";

const LINKS = [
  ["agi", "/os/agi"],
  ["home", "/os"],
  ["sales", "/os/sales"],
  ["builder", "/os/builder"],
  ["departure", `/os/departures/${DEMO_DEP_ID}`],
  ["flights", "/os/flights"],
  ["suppliers", "/os/suppliers"],
  ["live", "/os/live"],
  ["finance", "/os/finance"],
  ["analytics", "/os/analytics"],
  ["portals", "/os/portals"],
  ["scope", "/os/scope"],
] as const;

const PLAYBOOK_KEY = "t24osPlaybook";

function withPlaybook(href: string) {
  return href.includes("?") ? `${href}&playbook=1` : `${href}?playbook=1`;
}

export default function OsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { lang, setLang } = useApp();
  const { o, a, drafts, runDemo, reset, snap, agi } = useOs();
  const pageKey = menuKeyFromPath(path);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PLAYBOOK_KEY);
      const fromUrl = new URLSearchParams(window.location.search).get("playbook") === "1";
      setOpen(fromUrl || saved === "1");
    } catch {
      setOpen(false);
    }
  }, [path]);

  function togglePlaybook() {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PLAYBOOK_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function rememberOpen() {
    try {
      window.localStorage.setItem(PLAYBOOK_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(true);
  }

  return (
    <div className={`min-h-screen bg-bg text-text grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] ${agi.on ? "agi-layer" : ""}`}>
      <aside className={`border-b-2 lg:border-b-0 lg:border-r-2 border-divider lg:min-h-screen lg:sticky lg:top-0 ${agi.on ? "bg-accent-100" : "bg-bg"}`}>
        <div className="px-4 py-4 border-b-2 border-divider">
          <Link href="/os" className="no-underline text-text font-[family-name:var(--font-heading)] font-extrabold text-[28px] leading-none">
            TOUR<span className="text-[#ffc61a]">24</span>
          </Link>
          <div className="kicker mt-2">{agi.on ? a.agiLayer : o.os}</div>
          <div className="mt-3">
            <AgiToggle />
          </div>
        </div>
        <nav className="flex lg:flex-col gap-0 overflow-auto">
          {LINKS.map(([key, href]) => {
            const active = href === "/os" ? path === "/os" : href === "/os/agi" ? path.startsWith("/os/agi") : path.startsWith(href.split("?")[0]);
            return (
              <div
                key={key}
                className={`flex items-stretch ${active ? "bg-text text-bg" : "text-text"}`}
              >
                <Link
                  href={href}
                  className="flex-1 px-4 py-2.5 no-underline text-[13px] font-extrabold whitespace-nowrap text-inherit"
                >
                  {o[key]}
                </Link>
                <Link
                  href={withPlaybook(href)}
                  className={`px-2 py-2.5 no-underline text-[10px] font-extrabold uppercase tracking-[0.06em] whitespace-nowrap ${
                    active ? "bg-accent text-text" : "text-neutral-700"
                  }`}
                  onClick={rememberOpen}
                >
                  {o.playbook}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="px-4 py-3 flex flex-col gap-2 border-t-2 border-divider">
          <button type="button" className="btn btn-primary w-full" onClick={runDemo}>
            {o.run}
          </button>
          <button type="button" className="btn btn-secondary w-full" onClick={reset}>
            {o.reset}
          </button>
          <div className="text-[11px] text-neutral-700">Demo · {snap.demoStage}</div>
        </div>
        <div className="px-4 pb-4 flex flex-col gap-1.5 text-[12px]">
          <Link href="/" className="no-underline">
            {o.website}
          </Link>
          <Link href="/search?dir=outbound" className="no-underline">
            {o.marketplace}
          </Link>
          <Link href="/agents" className="no-underline">
            {o.agents}
          </Link>
          <Link href="/os-product" className="no-underline">
            {o.product}
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col">
        <div className="sticky top-0 z-40">
          <header className={`border-b-2 border-divider px-4 py-1.5 flex flex-wrap items-center justify-end gap-2 ${agi.on ? "bg-accent-100" : "bg-bg"}`}>
            <AgiToggle />
            <button type="button" className="btn btn-secondary" onClick={togglePlaybook}>
              {open ? o.hidePlaybook : o.playbook}
            </button>
            <div className="inline-flex border border-divider">
              {LANGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLang(item.id)}
                  className={`px-2 py-1.5 text-xs font-extrabold border-0 ${lang === item.id ? "bg-accent" : "bg-transparent"}`}
                >
                  {item.short}
                </button>
              ))}
            </div>
          </header>
          {agi.on && (
            <div className="px-4 py-1.5 bg-text text-bg text-[11px] font-extrabold tracking-[0.04em] uppercase">
              {a.agiOn} — {a.promise}
            </div>
          )}
          <AskDock />
        </div>

        {drafts.length > 0 && !agi.on && (
          <div className="px-4 pt-3 flex flex-col gap-2">
            {drafts.map((d) => (
              <AiCard key={d.id} draft={d} />
            ))}
          </div>
        )}

        <div className="px-4 py-5 pb-16">
          <PlaybookPanel menuKey={pageKey} open={open} onToggle={togglePlaybook} />
          {children}
        </div>
      </div>
    </div>
  );
}

function AiCard({ draft }: { draft: AiDraft }) {
  const { L } = useApp();
  const { o, applyDraft } = useOs();
  const [text, setText] = useState(draft.editable);
  return (
    <div className="border-2 border-text bg-accent-100 p-3 flex flex-col gap-2">
      <div className="font-extrabold text-[14px]">
        {draft.feature} — {L(draft.title)}
      </div>
      <p className="text-[13px]">{L(draft.body)}</p>
      <textarea className="input min-h-[64px]" value={text} onChange={(e) => setText(e.target.value)} />
      <div>
        <button type="button" className="btn btn-primary" onClick={() => applyDraft(draft.id, text)} disabled={draft.applied}>
          {draft.applied ? "✓" : o.apply}
        </button>
      </div>
    </div>
  );
}
