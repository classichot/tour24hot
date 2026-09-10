"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";

const STEPS = [
  { t: { th: "งานลูกค้า", en: "Enquiry" }, b: { th: "เว็บ จองกลุ่ม มาร์เก็ตเพลส หรือ Agent Direct เข้าท่อขายเดียวกัน", en: "Website, group desk, marketplace or Agent Direct land in one sales pipe." } },
  { t: { th: "ทัวร์คิดต้นทุน", en: "Costed tour" }, b: { th: "เทมเพลต + ใบเสนอหลายฉบับ มาร์จิ้นเป้าและสมมติฐานแก้ได้", en: "A reusable product, versioned quotes, editable margin and assumptions." } },
  { t: { th: "ประสานซัพพลายเออร์", en: "Supplier coordination" }, b: { th: "ไฟลต์กลุ่ม โรงแรม รถ อาหาร กิจกรรม ไกด์ — แต่ละรายการมีสถานะและเดดไลน์", en: "Group air, hotels, coaches, meals, activities, guides — each with state and deadlines." } },
  { t: { th: "ปฏิบัติการสด", en: "Live operation" }, b: { th: "ไทม์ไลน์ แผนที่เหตุ งานค้าง แผนกู้ และใบตอบรับ", en: "Timeline, incidents, open tasks, recovery plans and acknowledgements." } },
  { t: { th: "กำไรจริง", en: "Profit" }, b: { th: "เทียบใบเสนอกับต้นทุนจริง เก็บเงินลูกค้า และเจ้าหนี้ซัพพลายเออร์", en: "Quote versus actual, collections and supplier payables on the same departure." } },
];

export default function OsProductPage() {
  const { L, t } = useApp();
  return (
    <main className="max-w-[1100px] mx-auto px-[22px] pb-20">
      <div className="pt-8 pb-6 border-b-2 border-divider">
        <div className="kicker">TOUR24 OS</div>
        <h1 className="mt-2 text-[clamp(32px,4vw,52px)] leading-[1.05]">
          {L({ th: "ระบบปฏิบัติการทัวร์ — จากงานลูกค้าถึงกำไรปิดทริป", en: "The tour operating system — from enquiry to closed profit" })}
        </h1>
        <p className="mt-3 text-[16px] max-w-[640px] text-neutral-800">
          {L({
            th: "มาร์เก็ตเพลส เว็บจอง และ Agent Direct เป็นช่องทางขายที่ต่อเข้า workspace รอบเดินทางเดียวกัน",
            en: "The marketplace, booking website and Agent Direct are sales channels connected to one departure workspace.",
          })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/os" className="btn btn-primary no-underline">
            {L({ th: "เปิด Operator OS", en: "Open Operator OS" })}
          </Link>
          <Link href="/os/scope" className="btn btn-secondary no-underline">
            {L({ th: "ดูแผนขอบเขต", en: "See the scope map" })}
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-0.5 bg-divider border-2 border-divider mt-8">
        {STEPS.map((s, i) => (
          <div key={s.t.en} className="bg-bg p-4">
            <div className="microlabel">0{i + 1}</div>
            <div className="font-extrabold text-[18px] mt-1">{L(s.t)}</div>
            <p className="text-[13px] mt-1">{L(s.b)}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
        {[
          {
            h: { th: "ไฟลต์กลุ่ม", en: "Group flights" },
            p: { th: "บล็อกที่นั่ง PNR เดดไลน์ปล่อย/ยื่นชื่อ/ออกตั๋ว และความเสี่ยงที่นั่งว่าง", en: "Seat blocks, PNRs, release/name/ticket deadlines and unsold-seat exposure." },
            href: "/os/flights",
          },
          {
            h: { th: "ซัพพลายเออร์", en: "Supplier management" },
            p: { th: "เรทสัญญา เทียบข้อเสนอ จอง ยืนยัน และลิงก์สั้นให้ร้านตอบ", en: "Contract rates, offer comparison, reservations, confirmations and short supplier links." },
            href: "/os/suppliers",
          },
          {
            h: { th: "AI อัตโนมัติ", en: "AI automation" },
            p: { th: "Producer, Buyer, Change Impact, Simulator, Seat Advisor, Readiness, Disruption, Profit, Ops, Memory — ร่างที่แก้และอนุมัติได้", en: "Producer, Buyer, Change Impact, Simulator, Seat Advisor, Readiness, Disruption, Profit, Ops, Memory — editable drafts you approve." },
            href: "/os",
          },
        ].map((c) => (
          <Link key={c.href + c.h.en} href={c.href} className="border-2 border-divider p-4 no-underline text-text hover:border-text">
            <div className="font-extrabold text-[20px]">{L(c.h)}</div>
            <p className="text-[13px] mt-2">{L(c.p)}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 border-2 border-text p-5">
        <div className="kicker">Acceptance demo</div>
        <h2 className="mt-2 text-[24px]">
          {L({ th: "ทัวร์องค์กร 40 คน โตเกียว — เพิ่ม 5 คน แล้วไฟลต์ดีเลย์", en: "40-person Tokyo corporate — add five, then delay the arrival" })}
        </h2>
        <p className="mt-2 text-[14px] max-w-[680px]">
          {L({
            th: "สร้างจากงานลูกค้าและใบซัพพลายเออร์ จัดที่นั่ง ห้อง รถ อาหาร กิจกรรม เพิ่มผู้โดยสาร ดีเลย์ขาเข้า แสดงบริการที่กระทบ ต้นทุน เดดไลน์ อนุมัติ ติดตามยืนยัน ปิดด้วยกำไรจริง",
            en: "Build from an enquiry and supplier quotes. Allocate seats, rooms, buses, meals and attractions. Add passengers, delay the inbound flight, show every affected service, cost and deadline. Approve, track confirmations, close on actual profit.",
          })}
        </p>
        <Link href="/os" className="btn btn-primary no-underline mt-4 inline-flex">
          {t.seeAll}
        </Link>
      </section>
    </main>
  );
}
