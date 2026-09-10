import type { L10n } from "@/lib/data";
import type { BookingState, RateClass } from "@/lib/os/types";
import { money } from "@/lib/os/engines";
import { useApp } from "@/lib/store";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" | "ok" | "hold" }) {
  const cls =
    tone === "ok"
      ? "bg-accent text-text"
      : tone === "warn"
        ? "bg-accent-100 text-accent-800"
        : tone === "hold"
          ? "bg-text text-bg"
          : "bg-surface text-neutral-800";
  return <span className={`tag ${cls} text-[10px] font-extrabold uppercase tracking-[0.06em]`}>{children}</span>;
}

export function rateTone(r: RateClass | BookingState): "neutral" | "warn" | "ok" | "hold" {
  if (r === "confirmed" || r === "completed") return "ok";
  if (r === "held") return "hold";
  if (r === "indicative" || r === "requested" || r === "cancelled") return "warn";
  return "neutral";
}

export function Source({ src, at }: { src: string; at: string }) {
  return (
    <div className="text-[11px] text-neutral-700">
      {src} · {at.slice(0, 16).replace("T", " ")}
    </div>
  );
}

export function Money({ n }: { n: number }) {
  return <span className="font-[family-name:var(--font-heading)] font-extrabold">{money(n)}</span>;
}

export function LocText({ v }: { v: L10n | string }) {
  const { L } = useApp();
  return <>{L(v)}</>;
}

export function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="p-3.5 border-r-2 border-divider last:border-r-0 min-w-[140px]">
      <div className="font-[family-name:var(--font-heading)] font-extrabold text-[24px] leading-none">{n}</div>
      <div className="text-[11px] text-neutral-700 mt-1">{l}</div>
    </div>
  );
}

export function ImpactCard({
  title,
  why,
  finance,
  next,
}: {
  title: React.ReactNode;
  why: React.ReactNode;
  finance: React.ReactNode;
  next: React.ReactNode;
}) {
  const { lang } = useApp();
  const h = lang === "th" ? ["เกิดอะไร", "ทำไมสำคัญ", "ผลทางการเงิน", "ขั้นถัดไป"] : ["What happened", "Why it matters", "Financial effect", "Next action"];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border-2 border-divider">
      {[title, why, finance, next].map((cell, i) => (
        <div key={h[i]} className="p-3.5 border-t-2 md:border-t-0 md:border-l-2 border-divider first:border-l-0 first:border-t-0">
          <div className="microlabel mb-1">{h[i]}</div>
          <div className="text-[13px] leading-[1.4]">{cell}</div>
        </div>
      ))}
    </div>
  );
}

export function Table({ heads, rows }: { heads: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-auto border-2 border-divider">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-surface">
            {heads.map((h) => (
              <th key={h} className="text-left font-extrabold px-2.5 py-2 border-b-2 border-divider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-divider">
              {r.map((c, j) => (
                <td key={j} className="px-2.5 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
