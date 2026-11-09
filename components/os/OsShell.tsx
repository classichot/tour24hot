"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useMember } from "@/lib/auth/client";
import { ROLE_INFO } from "@/lib/auth/session";
import { AU } from "@/components/auth/copy";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { DEMO_DEP_ID } from "@/lib/os/seed";
import { menuKeyFromPath } from "@/lib/os/playbook";
import type { AiDraft } from "@/lib/os/types";
import PlaybookPanel from "./Playbook";
import AgiToggle from "./AgiToggle";
import AskDock from "./AskDock";
import { LocText } from "./ui";

const LINKS = [
  ["agi", "/os-legacy/agi"],
  ["home", "/os-legacy"],
  ["workspace", "/os-legacy/workspace"],
  ["projects", "/os-legacy/projects"],
  ["sales", "/os-legacy/sales"],
  ["builder", "/os-legacy/builder"],
  ["departure", `/os-legacy/departures/${DEMO_DEP_ID}`],
  ["flights", "/os-legacy/flights"],
  ["suppliers", "/os-legacy/suppliers"],
  ["live", "/os-legacy/live"],
  ["finance", "/os-legacy/finance"],
  ["analytics", "/os-legacy/analytics"],
  ["portals", "/os-legacy/portals"],
  ["scope", "/os-legacy/scope"],
] as const;

const OS_LANGS = LANGS.filter((item) => item.id !== "ru");
const SIDE_KEY = "t24osSideW";
const SIDE_MIN = 160;
const SIDE_MAX = 400;
const SIDE_DEF = 200;

function clampSide(n: number) {
  return Math.min(SIDE_MAX, Math.max(SIDE_MIN, Math.round(n)));
}

function withPlaybook(href: string) {
  return href.includes("?") ? `${href}&playbook=1` : `${href}?playbook=1`;
}

export default function OsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { lang, setLang, t } = useApp();
  const { o, a, drafts, runDemo, reset, snap, agi } = useOs();
  const pageKey = menuKeyFromPath(path);
  const [open, setOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [sideW, setSideW] = useState(SIDE_DEF);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const desk = snap.products[0];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDE_KEY);
      if (raw) setSideW(clampSide(Number(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  const persistSide = useCallback((w: number) => {
    try {
      window.localStorage.setItem(SIDE_KEY, String(w));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      setSideW(clampSide(d.startW + e.clientX - d.startX));
    }
    function onUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      setDragging(false);
      setSideW((w) => {
        persistSide(w);
        return w;
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [persistSide]);

  useEffect(() => {
    try {
      setOpen(new URLSearchParams(window.location.search).get("playbook") === "1");
    } catch {
      setOpen(false);
    }
  }, [path]);

  function togglePlaybook() {
    setOpen((prev) => !prev);
  }

  return (
    <div
      className={`os-desk min-h-screen grid grid-cols-1 lg:grid-cols-[var(--os-side)_minmax(0,1fr)] ${agi.on ? "agi-layer" : ""} ${dragging ? "select-none" : ""}`}
      style={{ ["--os-side" as string]: `${sideW}px` }}
    >
      <aside className="os-side relative lg:min-h-screen lg:sticky lg:top-0 flex flex-col overflow-hidden">
        <div className="px-4 py-5 border-b border-white/15">
          <Link href="/os-legacy" className="no-underline font-[family-name:var(--font-heading)] font-extrabold text-[26px] leading-none tracking-[-0.02em] text-[#f3f2f2]">
            TOUR<span className="text-[#ffc61a]">24</span>
          </Link>
          <div className="mt-3 text-[12px] font-extrabold leading-snug text-[#f3f2f2]">
            {desk ? <LocText v={desk.title} /> : o.os}
          </div>
          <div className="mt-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#ffc61a]">{o.osSystem}</div>
          <Link href="/os" className="mt-2 block border border-[#ffc61a]/60 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#ffc61a] no-underline hover:bg-white/10">
            Legacy OS · Open new Inbound OS →
          </Link>
        </div>
        <nav className="flex lg:flex-col gap-0 overflow-auto flex-1 py-2">
          {LINKS.map(([key, href]) => {
            const active = href === "/os-legacy" ? path === "/os-legacy" : href === "/os-legacy/agi" ? path.startsWith("/os-legacy/agi") : path.startsWith(href.split("?")[0]);
            return (
              <div key={key} className={`os-nav-item flex items-stretch ${active ? "is-active" : ""}`}>
                <Link href={href} className="flex-1 px-4 py-2.5 no-underline text-[13px] font-bold whitespace-nowrap">
                  {o[key]}
                </Link>
                <Link
                  href={withPlaybook(href)}
                  className={`w-2 shrink-0 ${active ? "bg-[#f2b01e]" : "bg-transparent"}`}
                  onClick={(e) => {
                    if (active) {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                  aria-label={o.playbook}
                />
              </div>
            );
          })}
        </nav>
        <div className="px-4 py-4 mt-auto border-t border-white/15 flex flex-col gap-2">
          <button type="button" className="btn btn-primary w-full text-[12px]" onClick={runDemo}>
            {o.run}
          </button>
          <button type="button" className="os-topbtn w-full justify-center text-[#f3f2f2] border border-white/20" onClick={reset}>
            {o.reset}
          </button>
          <div className="text-[10px] uppercase tracking-[0.08em] text-white/50">Demo · {snap.demoStage}</div>
          <div className="flex flex-col gap-1 text-[11px] text-white/70">
            <Link href="/">{o.website}</Link>
            <Link href="/search?dir=outbound">{o.marketplace}</Link>
            <Link href="/agents">{o.agents}</Link>
            <Link href="/os-product">{o.product}</Link>
            <Link href="/host">{t.navHost}</Link>
          </div>
          <OsMember />
        </div>
        <button
          type="button"
          className={`os-side-handle ${dragging ? "is-drag" : ""}`}
          aria-label="Resize menu"
          aria-orientation="vertical"
          onPointerDown={(e) => {
            e.preventDefault();
            dragRef.current = { startX: e.clientX, startW: sideW };
            setDragging(true);
          }}
          onDoubleClick={() => {
            setSideW(SIDE_DEF);
            persistSide(SIDE_DEF);
          }}
        />
      </aside>

      <div className="min-w-0 flex flex-col bg-white">
        <div className="sticky top-0 z-40 bg-white">
          <header className="os-topbar pl-10 lg:pl-14 pr-8 lg:pr-12 py-2 flex flex-wrap items-center justify-end gap-1">
            {OS_LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLang(item.id)}
                className={`os-topbtn ${lang === item.id ? "is-on" : ""}`}
              >
                {item.short}
              </button>
            ))}
            <button type="button" className={`os-topbtn ${askOpen ? "is-on" : ""}`} onClick={() => setAskOpen((v) => !v)}>
              {o.askAi}
            </button>
            <button type="button" className={`os-topbtn ${open ? "is-on" : ""}`} onClick={togglePlaybook}>
              {o.playbook}
            </button>
            <AgiToggle />
          </header>
          {agi.on && (
            <div className="pl-10 lg:pl-14 pr-8 lg:pr-12 py-1.5 bg-[#141312] text-[#f3f2f2] text-[11px] font-extrabold tracking-[0.06em] uppercase">
              {a.agiOn} — {a.promise}
            </div>
          )}
        </div>

        {drafts.length > 0 && !agi.on && (
          <div className="pl-10 lg:pl-14 pr-8 lg:pr-12 pt-5 flex flex-col gap-2">
            {drafts.map((d) => (
              <AiCard key={d.id} draft={d} />
            ))}
          </div>
        )}

        <div className="pl-10 lg:pl-14 pr-8 lg:pr-12 py-8 pb-24 w-full">{children}</div>
        <AskDock open={askOpen} onOpen={() => setAskOpen(true)} onClose={() => setAskOpen(false)} />
        <PlaybookPanel menuKey={pageKey} open={open} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}

/** Signed-in staff member and sign-out, at the foot of the OS rail. */
function OsMember() {
  const { L } = useApp();
  const member = useMember();
  const router = useRouter();
  if (!member) return null;
  return (
    <div className="mt-2 flex items-center gap-2 border-t border-white/15 pt-3">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffc61a] text-[12px] font-extrabold text-[#141312]">
        {member.name.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-extrabold text-[#f3f2f2]">{member.name}</div>
        <div className="truncate text-[10px] text-white/60">{member.org || L(ROLE_INFO[member.role].title)}</div>
      </div>
      <button
        type="button"
        className="shrink-0 cursor-pointer border border-white/25 bg-transparent px-1.5 py-0.5 text-[10px] font-extrabold text-[#f3f2f2] hover:bg-white/10"
        onClick={async () => {
          await signOut();
          router.push("/login?role=os");
          router.refresh();
        }}
      >
        {L(AU.signOut)}
      </button>
    </div>
  );
}

function AiCard({ draft }: { draft: AiDraft }) {
  const { L } = useApp();
  const { o, applyDraft } = useOs();
  const [text, setText] = useState(draft.editable);
  return (
    <div className="border border-text bg-accent-100 p-3 flex flex-col gap-2">
      <div className="font-extrabold text-[14px]">
        {draft.feature} — {L(draft.title)}
      </div>
      <p className="text-[13px]">{L(draft.body)}</p>
      <textarea className="input min-h-[64px] bg-white" value={text} onChange={(e) => setText(e.target.value)} />
      <div>
        <button type="button" className="btn btn-primary" onClick={() => applyDraft(draft.id, text)} disabled={draft.applied}>
          {draft.applied ? "✓" : o.apply}
        </button>
      </div>
    </div>
  );
}
