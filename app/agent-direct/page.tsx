"use client";

import Link from "next/link";
import { TAP_ENDPOINTS, TAP_TOOLS, buildTour24Json } from "@/lib/tap";
import { useApp } from "@/lib/store";
import { Check } from "@/components/icons";

const CHECKS = [
  { en: "Tourism licence verified", th: "ใบอนุญาตธุรกิจท่องเที่ยวตรวจแล้ว" },
  { en: "Company registration verified", th: "จดทะเบียนบริษัทตรวจแล้ว" },
  { en: "Insurance verified", th: "ประกันตรวจแล้ว" },
  { en: "Live inventory", th: "คลังที่นั่งสด" },
  { en: "Live price", th: "ราคาสด" },
  { en: "Standardized cancellation", th: "นโยบายยกเลิกมาตรฐาน" },
  { en: "AI booking enabled", th: "เอเจนต์จองได้" },
  { en: "Agent Direct API compatible", th: "เข้ากันได้กับ Agent Direct API" },
];

const NETWORK = [
  { name: "HOTEL24", what: { en: "Hotels", th: "โรงแรม" } },
  { name: "TOUR24", what: { en: "Tours / activities", th: "ทัวร์ / กิจกรรม" } },
  { name: "JET24", what: { en: "Private aviation", th: "การบินส่วนตัว" } },
  { name: "SHOP24", what: { en: "Products", th: "สินค้า" } },
  { name: "INSURE24", what: { en: "Travel insurance", th: "ประกันเดินทาง" } },
];

export default function AgentDirectPage() {
  const { t, L } = useApp();
  const doc = buildTour24Json("siam", "");

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <div className="pt-[22px] pb-6 border-b-2 border-divider grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 items-end">
        <div>
          <div className="kicker">{t.agntHomeKicker}</div>
          <h1 className="mt-2 text-[clamp(28px,3.6vw,48px)] leading-[1.03]">{t.agntPageTitle}</h1>
          <p className="mt-3 text-sm text-neutral-800 max-w-[560px]">{t.agntPageSub}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/agents" className="btn btn-primary no-underline">
            {t.agntHomeCta}
          </Link>
          <Link href="/api/agent/mcp" className="btn btn-secondary no-underline">
            MCP
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] border-2 border-divider mt-6">
        {[
          { n: "TAP", l: t.agntProtocol },
          { n: String(TAP_TOOLS.length), l: t.agntTools },
          { n: "1.5%", l: t.agntFee },
          { n: "No", l: t.agntOtaPath },
        ].map((s) => (
          <div key={s.l} className="p-3.5 border-r border-divider last:border-r-0">
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[26px] leading-none">{s.n}</div>
            <div className="text-[11px] text-neutral-700 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-2 border-text p-4 text-sm">
        <strong>TOUR24 Agent Direct</strong>
        {" · "}
        {t.agntFlow}
      </div>

      <section className="pt-8 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
        <div>
          <h2 className="mb-2 text-[22px]">{t.agntIdentity}</h2>
          <p className="text-[13px] text-neutral-700 mb-3">
            <code>/.well-known/tour24.json</code> · <code>/agent.json</code>
          </p>
          <p className="text-[13px] mb-3">
            <Link href="/agent.json">/agent.json</Link>
            {" · "}
            <Link href="/.well-known/tour24.json">/.well-known/tour24.json</Link>
          </p>
          <pre className="text-[11px] leading-relaxed overflow-x-auto bg-surface border-2 border-divider p-3.5 whitespace-pre-wrap">
            {JSON.stringify(doc, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="mb-3 text-[22px]">{t.agntBadge}</h2>
          <div className="flex flex-col gap-0.5 bg-divider border-2 border-divider">
            {CHECKS.map((c) => (
              <div key={c.en} className="bg-bg px-3.5 py-2.5 flex gap-2 items-center text-[13px]">
                <Check className="flex-none" stroke="var(--color-accent-700)" />
                <span>{L(c)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-10">
        <h2 className="mb-3 text-[22px]">{t.agntEndpoints}</h2>
        <div className="overflow-x-auto border-2 border-divider">
          <table className="w-full text-[13px] border-collapse min-w-[640px]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.08em] uppercase text-neutral-700 border-b-2 border-divider">
                <th className="px-3 py-2 font-extrabold">Method</th>
                <th className="px-3 py-2 font-extrabold">Path</th>
                <th className="px-3 py-2 font-extrabold">{t.agntUse}</th>
              </tr>
            </thead>
            <tbody>
              {TAP_ENDPOINTS.map((e) => (
                <tr key={e.path} className="border-b border-divider">
                  <td className="px-3 py-2 font-extrabold">{e.method}</td>
                  <td className="px-3 py-2">
                    <code>{e.path}</code>
                  </td>
                  <td className="px-3 py-2 text-neutral-800">{e.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pt-10">
        <h2 className="mb-3 text-[22px]">{t.agntNetwork}</h2>
        <p className="text-sm text-neutral-800 max-w-[640px] mb-4">{t.agntNetworkSub}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-0.5 bg-divider border-2 border-divider">
          {NETWORK.map((n) => (
            <div key={n.name} className="bg-bg p-3.5">
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[18px]">{n.name}</div>
              <div className="text-[12px] text-neutral-700 mt-1">{L(n.what)}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
