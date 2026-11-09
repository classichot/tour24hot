"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

/** Inbound OS UI kit (spec §3): text-labelled status, linked errors, focus-safe dialogs, explicit states. */

export type Tone = "neutral" | "info" | "good" | "warn" | "bad";

const TONE: Record<Tone, string> = {
  neutral: "bg-[#efeeec] text-[#3b3836] border-[#d9d6d3]",
  info: "bg-[#eef3fb] text-[#1f3f73] border-[#c7d6ee]",
  good: "bg-[#eaf5ec] text-[#1e5b2b] border-[#bfe0c6]",
  warn: "bg-[#fff6e0] text-[#714e04] border-[#f2d48a]",
  bad: "bg-[#fdeceb] text-[#8a1f17] border-[#f2bcb7]",
};

export function Badge({ tone = "neutral", children, title }: { tone?: Tone; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-[13px] font-semibold leading-5 ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export function Section({ title, actions, children, id }: { title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[20px] font-extrabold tracking-[-0.01em]">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <div id={id} className={`rounded-[6px] border border-[#dcd9d6] bg-white ${className}`}>{children}</div>;
}

export function Field({ id, label, error, hint, required, children }: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div id={`field-${id}`} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold text-[#3b3836]">
        {label}
        {required && <span className="text-[#8a1f17]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[14px] text-[#6b6764]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-[14px] font-semibold text-[#8a1f17]">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputCls =
  "w-full rounded-[4px] border border-[#c9c5c1] bg-white px-3 py-2 text-[16px] text-[#201e1d] focus-visible:border-[#875e00] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#875e00] disabled:bg-[#f3f2f1] disabled:text-[#6b6764]";

export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#f2b01e] px-4 py-2 text-[15px] font-bold text-[#201e1d] hover:bg-[#f9c644] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer border-0 no-underline",
  secondary: "inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#c9c5c1] bg-white px-4 py-2 text-[15px] font-semibold text-[#201e1d] hover:bg-[#f3f2f1] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer no-underline",
  ghost: "inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-[15px] font-semibold text-[#875e00] hover:bg-[#fff6e0] cursor-pointer border-0 bg-transparent no-underline",
  danger: "inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#f2bcb7] bg-white px-4 py-2 text-[15px] font-semibold text-[#8a1f17] hover:bg-[#fdeceb] cursor-pointer",
};

/** Concise error summary linking to the problem fields (UX06). */
export function ErrorSummary({ title = "Fix these before continuing", errors }: { title?: string; errors: { field: string; message: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [errors.length]);
  if (!errors.length) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded-[6px] border-2 border-[#d9534f] bg-[#fdeceb] px-4 py-3 outline-none">
      <p className="text-[15px] font-bold text-[#8a1f17]">{title}</p>
      <ul className="m-0 mt-1.5 list-disc pl-5 text-[15px]">
        {errors.map((e, i) => (
          <li key={i}>
            <a href={`#field-${e.field}`} className="text-[#8a1f17] underline">
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={`rounded-[6px] border px-4 py-3 text-[15px] ${TONE[tone]}`}>{children}</div>;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[6px] border border-dashed border-[#c9c5c1] bg-[#fbfaf9] px-6 py-8 text-center">
      <p className="text-[16px] font-bold">{title}</p>
      {body && <p className="mt-1 text-[15px] text-[#6b6764]">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Modal dialog: traps focus, closes on Escape, restores focus to the opener (UX03). */
export function Dialog({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const box = ref.current;
    const focusables = () => Array.from(box?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    (focusables()[0] ?? box)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#201e1d]/40 px-4 py-[8vh]">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`w-full ${wide ? "max-w-[760px]" : "max-w-[540px]"} rounded-[8px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] outline-none`}>
        <div className="flex items-center justify-between gap-3 border-b border-[#e6e3e0] px-5 py-4">
          <h2 id={titleId} className="text-[19px] font-extrabold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close dialog">
            Close
          </button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[#e6e3e0] px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ kicker, title, sub, actions }: { kicker?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#875e00]">{kicker}</div>}
        <h1 className="mt-1 text-[clamp(28px,3vw,38px)] font-extrabold tracking-[-0.02em]">{title}</h1>
        {sub && <div className="mt-1.5 text-[16px] text-[#5b5754]">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-[#dcd9d6] [scrollbar-width:none]">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          scroll={false}
          aria-current={t.key === active ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap border-b-[3px] px-3 py-2.5 text-[15px] font-semibold no-underline ${t.key === active ? "border-[#f2b01e] text-[#201e1d]" : "border-transparent text-[#5b5754] hover:text-[#201e1d]"}`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-[13px] text-[#6b6764]">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Saving({ state }: { state: "idle" | "saving" | "saved" | "error" | "conflict" }) {
  if (state === "idle") return null;
  const map = {
    saving: { t: "Saving…", tone: "neutral" as Tone },
    saved: { t: "Saved", tone: "good" as Tone },
    error: { t: "Unable to save", tone: "bad" as Tone },
    conflict: { t: "Not saved: newer version exists", tone: "bad" as Tone },
  };
  return (
    <span role="status" aria-live="polite">
      <Badge tone={map[state].tone}>{map[state].t}</Badge>
    </span>
  );
}
