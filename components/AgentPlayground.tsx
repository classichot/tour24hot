"use client";

import { useState } from "react";
import { SAMPLE_QUERIES, type TapOffer } from "@/lib/tap";
import { useApp } from "@/lib/store";

type InvokeRes = { ok: boolean; result: Record<string, unknown> };

async function invoke(tool: string, args: Record<string, unknown>) {
  const res = await fetch("/api/agent/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, arguments: args }),
  });
  return res.json() as Promise<InvokeRes>;
}

const LABELS: Record<string, { en: string; th: string; zh?: string }> = {
  jp: { en: "Japan autumn", th: "ญี่ปุ่นฤดูใบไม้ร่วง", zh: "日本秋季" },
  kr: { en: "Korea family", th: "เกาหลีครอบครัว", zh: "韩国亲子" },
  hk: { en: "Hokkaido snow", th: "ฮอกไกโดหิมะ", zh: "北海道雪季" },
  th: { en: "Inbound North", th: "อินบาวด์เหนือ", zh: "入境北泰" },
};

export default function AgentPlayground() {
  const { t, lang, money } = useApp();
  const [q, setQ] = useState(SAMPLE_QUERIES[0]);
  const [step, setStep] = useState<"ask" | "results" | "hold" | "booked">("ask");
  const [busy, setBusy] = useState(false);
  const [offers, setOffers] = useState<TapOffer[]>([]);
  const [explain, setExplain] = useState("");
  const [winner, setWinner] = useState("");
  const [hold, setHold] = useState<Record<string, unknown> | null>(null);
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [guest, setGuest] = useState("Alex Kim");
  const [err, setErr] = useState("");

  const reset = (next = SAMPLE_QUERIES[0]) => {
    setQ(next);
    setStep("ask");
    setHold(null);
    setBooking(null);
    setOffers([]);
    setExplain("");
    setWinner("");
    setErr("");
  };

  async function search() {
    setBusy(true);
    setErr("");
    try {
      const found = await invoke("search", q.args);
      const list = ((found.result.offers as TapOffer[]) || []).filter(Boolean);
      setOffers(list);
      if (list.length >= 2) {
        const cmp = await invoke("compare", { package_ids: list.map((o) => o.package_id) });
        setExplain(String(cmp.result.explanation || ""));
        setWinner(String(cmp.result.winner || list[0]?.package_id || ""));
      } else {
        setExplain("");
        setWinner(list[0]?.package_id || "");
      }
      setStep("results");
    } catch {
      setErr("Gateway unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function holdWinner() {
    const id = winner || offers[0]?.package_id;
    if (!id) return;
    setBusy(true);
    setErr("");
    try {
      await invoke("quote", { package_id: id, pax: 2 });
      const h = await invoke("reserve", { package_id: id, pax: 2 });
      if (!h.ok) {
        setErr(String(h.result.error || "reserve_failed"));
        return;
      }
      setHold(h.result);
      setStep("hold");
    } finally {
      setBusy(false);
    }
  }

  async function book() {
    if (!hold) return;
    setBusy(true);
    setErr("");
    try {
      const b = await invoke("book", { hold_id: hold.hold_id, guest, method: "PromptPay" });
      if (!b.ok) {
        setErr(String(b.result.error || "book_failed"));
        return;
      }
      setBooking(b.result);
      setStep("booked");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 mb-3">
        {SAMPLE_QUERIES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`px-3 py-1.5 cursor-pointer text-xs font-extrabold font-[family-name:var(--font-heading)] border-0 ${
              q.id === s.id ? "bg-accent text-text" : "bg-surface text-text"
            }`}
            onClick={() => reset(s)}
          >
            {lang === "zh" ? LABELS[s.id].zh || LABELS[s.id].en : lang === "th" ? LABELS[s.id].th : LABELS[s.id].en}
          </button>
        ))}
      </div>
      <p className="text-base max-w-[680px] mb-4">{lang === "zh" ? ("zh" in q && q.zh) || q.en : lang === "th" ? q.th : q.en}</p>
      {err && <p className="text-sm text-accent-800 mb-3">{err}</p>}

      {step === "ask" && (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={search}>
          {busy ? t.agntAsking : t.agntAsk}
        </button>
      )}

      {step !== "ask" && (
        <div className="overflow-x-auto border-2 border-divider">
          <table className="w-full text-[13px] border-collapse min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.08em] uppercase text-neutral-700 border-b-2 border-divider">
                <th className="px-3 py-2 font-extrabold">{t.agPackages}</th>
                <th className="px-3 py-2 font-extrabold text-right">{t.cRealTotal}</th>
                <th className="px-3 py-2 font-extrabold">{t.cAirline}</th>
                <th className="px-3 py-2 font-extrabold">{t.fHotel}</th>
                <th className="px-3 py-2 font-extrabold">{t.cShopping}</th>
                <th className="px-3 py-2 font-extrabold">{t.seats}</th>
                <th className="px-3 py-2 font-extrabold">{t.trust}</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr
                  key={o.package_id}
                  className="border-b border-divider"
                  style={{ background: o.package_id === winner ? "color-mix(in srgb, var(--color-accent) 14%, transparent)" : undefined }}
                >
                  <td className="px-3 py-2.5">
                    <strong>{o.title}</strong>
                    <div className="text-[11px] text-neutral-700">
                      {o.duration_days}D{o.duration_nights}N · {o.cities} · {o.agency_name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-[family-name:var(--font-heading)] font-extrabold text-accent-700">
                    {money(o.real_total)}
                  </td>
                  <td className="px-3 py-2.5">{o.airline}</td>
                  <td className="px-3 py-2.5">{o.hotel_class}★</td>
                  <td className="px-3 py-2.5">{o.shopping_stops}</td>
                  <td className="px-3 py-2.5">{o.seats}</td>
                  <td className="px-3 py-2.5 font-extrabold">{o.trust_score}</td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-neutral-700" colSpan={7}>
                    {t.advEmpty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {step === "results" && offers[0] && (
        <div className="mt-4 border-2 border-text p-4">
          {explain && (
            <p className="text-sm mb-3">
              <strong>{t.agntExplain}.</strong> {explain}
            </p>
          )}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={holdWinner}>
            {t.agntHold} — quote() → reserve()
          </button>
        </div>
      )}

      {step === "hold" && hold && (
        <div className="mt-4 border-2 border-text p-4">
          <div className="microlabel">{t.agntHeld}</div>
          <strong className="block mt-1">{String(hold.hold_id)}</strong>
          <p className="text-sm mt-2">
            {String(hold.title)} · {String(hold.agency)} · {String(hold.pax)} {t.people} · {money(Number(hold.total))} · {t.agntExpires} {String(hold.expires)}
          </p>
          <p className="text-[12px] text-neutral-700 mt-2">{t.agntNoOta}</p>
          <div className="field mt-3 max-w-[280px]">
            <label>{t.agntGuest}</label>
            <input className="input" value={guest} onChange={(e) => setGuest(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary mt-3" disabled={busy} onClick={book}>
            {t.agntBook} — book() → agency
          </button>
        </div>
      )}

      {step === "booked" && booking && (
        <div className="mt-4 border-2 border-text p-4 bg-accent-100">
          <div className="microlabel">{t.agntBooked}</div>
          <strong className="block mt-1">{String(booking.booking_id)}</strong>
          <p className="text-sm mt-2">
            {String(booking.guest)} · {String(booking.title)} · {money(Number(booking.total))} · {String(booking.pay)}
          </p>
          <p className="text-sm mt-2">
            {t.agntMerchant}: {String(booking.merchant_of_record)} · {t.agntFeeNote}
          </p>
          <p className="text-[13px] mt-2">{t.agntNoOta}</p>
        </div>
      )}
    </div>
  );
}
