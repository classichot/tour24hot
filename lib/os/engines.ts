import type { L10n } from "../data";
import { DEMO_BOOK_ID, DEMO_DEP_ID, DEMO_SELL_PER, EXTRA_PAX_NAMES } from "./seed";
import type {
  AiDraft,
  ChangeImpact,
  OsSnapshot,
  Passenger,
  ServiceLine,
} from "./types";

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });

export function money(n: number) {
  return "฿" + Math.round(n).toLocaleString("en-US");
}

export function serviceCost(s: ServiceLine) {
  return s.qty * s.unitCost;
}

export function totals(snap: OsSnapshot, depId: string) {
  const svcs = snap.services.filter((s) => s.departureId === depId && s.state !== "cancelled");
  const cost = svcs.reduce((a, s) => a + serviceCost(s), 0);
  const books = snap.bookings.filter((b) => b.departureId === depId && b.state !== "cancelled");
  const sell = books.reduce((a, b) => a + b.total, 0);
  const pax = snap.passengers.filter((p) => p.departureId === depId).length;
  const margin = sell === 0 ? 0 : ((sell - cost) / sell) * 100;
  const inExp = snap.ledger.filter((l) => l.departureId === depId && l.side === "in");
  const outExp = snap.ledger.filter((l) => l.departureId === depId && l.side === "out");
  const collected = inExp.filter((l) => l.status === "received").reduce((a, l) => a + l.amount, 0);
  const payableSoon = outExp.filter((l) => l.status === "expected").reduce((a, l) => a + l.amount, 0);
  return { cost, sell, pax, margin, collected, payableSoon, gap: payableSoon - (sell - collected) };
}

export function breakEvenPax(snap: OsSnapshot, depId: string) {
  const t = totals(snap, depId);
  const per = t.pax ? t.sell / t.pax : DEMO_SELL_PER;
  return per ? Math.ceil(t.cost / per) : 0;
}

export function readiness(snap: OsSnapshot, depId: string) {
  const pax = snap.passengers.filter((p) => p.departureId === depId);
  const missingPass = pax.filter((p) => !p.passport);
  const nameMismatch = pax.filter((p) => p.namePassport.replace(/\s+/g, "") !== p.name.replace(/\s+/g, "").toUpperCase());
  const noIns = pax.filter((p) => !p.insurance);
  const noDocs = pax.filter((p) => !p.docsReady);
  const dups = pax.filter((p, i) => pax.findIndex((x) => x.namePassport === p.namePassport) !== i);
  return { pax, missingPass, nameMismatch, noIns, noDocs, dups, score: Math.max(0, 100 - missingPass.length * 8 - nameMismatch.length * 6 - noIns.length * 4) };
}

export function flightExposure(snap: OsSnapshot) {
  return snap.flights.map((f) => {
    const unsold = Math.max(0, f.seats - f.sold);
    const svc = snap.services.find((s) => s.id === f.serviceId);
    const leak = unsold * (svc?.unitCost || 0);
    return { ...f, unsold, leak, keep: leak < 80000 };
  });
}

export function simulateDay2(snap: OsSnapshot) {
  const delayed = snap.flights.some((f) => f.delayed);
  const conflicts: L10n[] = [];
  const alts: L10n[] = [];
  if (delayed) {
    conflicts.push(z("ถึงเชียงใหม่ 11:40 พลาดสล็อตดอยสุเทพ 10:30", "CNX 11:40 arrival misses Doi Suthep 10:30 slot"));
    conflicts.push(z("รถรอเกิน 3 ชั่วโมง เกิดล่วงเวลาคนขับ", "Coaches wait 3+ hours — driver overtime"));
    conflicts.push(z("อาหารกลางวันนิมมาน 12:15 ชนกับเวลาถึงเมือง", "Nimman 12:15 lunch collides with city arrival"));
    alts.push(z("ย้ายดอยสุเทพเป็น 15:30 หรือแทนด้วยเมืองเก่ายาวขึ้น", "Move Doi Suthep to 15:30 or replace with a longer old-city walk"));
    alts.push(z("เลื่อนอาหารกลางวันเป็น 13:30 และแจ้งร้าน", "Shift lunch to 13:30 and reconfirm the restaurant"));
    alts.push(z("เช็กอินโรงแรมสาย เก็บกระเป๋าที่รถ", "Late hotel check-in, bags stay on the coach"));
  }
  return { delayed, conflicts, alts };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function applyAddPax(snap: OsSnapshot, n = 5): { next: OsSnapshot; impact: ChangeImpact } {
  const next = clone(snap);
  const start = next.passengers.length;
  const extras: Passenger[] = EXTRA_PAX_NAMES.slice(0, n).map((name, i) => ({
    id: `pax-${String(start + i + 1).padStart(2, "0")}`,
    departureId: DEMO_DEP_ID,
    bookingId: DEMO_BOOK_ID,
    name,
    namePassport: name.toUpperCase(),
    type: "adult",
    passport: undefined,
    roomPref: i === 4 ? "single" : "twin",
    diet: "none",
    visaStatus: "na",
    insurance: true,
    docsReady: false,
    ticketStatus: "none",
    addedLate: true,
  }));
  next.passengers.push(...extras);
  const bk = next.bookings.find((b) => b.id === DEMO_BOOK_ID);
  if (bk) {
    bk.paxIds.push(...extras.map((p) => p.id));
    bk.total += n * DEMO_SELL_PER;
    bk.balance += n * DEMO_SELL_PER;
  }
  const addQty = (id: string, q: number) => {
    const s = next.services.find((x) => x.id === id);
    if (s) {
      s.qty += q;
      s.updatedAt = "2026-09-10T11:00:00+07:00";
      s.notes = z(`เพิ่ม ${q} จากจำนวนผู้โดยสารใหม่`, `Added ${q} after passenger increase`);
    }
  };
  addQty("svc-fl-out", n);
  addQty("svc-fl-in", n);
  addQty("svc-meal-d2", n);
  addQty("svc-doi", n);
  const ht = next.services.find((s) => s.id === "svc-ht-cnx");
  if (ht) {
    ht.qty += 3;
    ht.unitCost = 4200;
    ht.rateClass = "indicative";
    ht.notes = z("3 ห้องเพิ่มราคาเดิน ไม่ใช่เรทสัญญา", "3 extra rooms at walk-up, not contract rate");
  }
  const hf = next.services.find((s) => s.id === "svc-ht-cei");
  if (hf) {
    hf.qty += 3;
    hf.unitCost = 5400;
    hf.rateClass = "indicative";
  }
  next.flights.forEach((f) => {
    f.seats += n;
    f.sold += n;
  });
  next.hotels.forEach((h) => {
    h.twins += 2;
    h.singles += 1;
  });
  const before = totals(snap, DEMO_DEP_ID);
  const after = totals(next, DEMO_DEP_ID);
  const extraCost = after.cost - before.cost;
  const impact: ChangeImpact = {
    id: "imp-pax",
    title: z("เพิ่มผู้โดยสาร 5 คน", "Add 5 passengers"),
    why: z("เอเย่นต์ขอเพิ่มแขก 5 คนหลังล็อกกลุ่ม", "The inbound agency asked to add 5 travellers after the group was locked."),
    finance: z(
      `ต้นทุนเพิ่ม ${money(extraCost)} รายได้เพิ่ม ${money(n * DEMO_SELL_PER)} มาร์จิ้นใหม่ ${after.margin.toFixed(1)}% (เป้า 18%)`,
      `Cost +${money(extraCost)}, revenue +${money(n * DEMO_SELL_PER)}, new margin ${after.margin.toFixed(1)}% (target 18%)`
    ),
    next: z("ขออนุมัติซื้อที่นั่งเดินและห้องเพิ่ม แล้วตามพาสปอร์ต 5 ฉบับ", "Approve walk-up seats and extra rooms, then collect 5 passports."),
    extraCost,
    newMargin: after.margin,
    affected: [
      { id: "svc-fl-in", module: "flight", name: z("CZ3051/3052", "CZ3051/3052"), change: z("ที่นั่ง 40→45 ราคาเดิน 5 ที่", "Seats 40→45, 5 at walk-up") },
      { id: "svc-ht-cnx", module: "hotel", name: z("เชียงใหม่ + เชียงราย", "Chiang Mai + Chiang Rai"), change: z("ห้อง +3 สองโรง เรทสัญญาไม่ครอบคลุม", "+3 rooms at both hotels, outside contract") },
      { id: "svc-bus", module: "bus", name: z("รถโค้ช 2 คัน", "Two coaches"), change: z("ยังจุได้ ไม่ต้องเพิ่มคัน", "Capacity holds — no extra coach") },
      { id: "svc-meal-d2", module: "meal", name: z("อาหารกลางวัน", "Lunch"), change: z("หัวอาหาร 40→45", "Headcount 40→45") },
      { id: "svc-doi", module: "activity", name: z("ดอยสุเทพ", "Doi Suthep"), change: z("บัตร 40→45 ในสล็อตเดิม", "Tickets 40→45 in the same slot") },
    ],
    deadlines: [
      { label: z("ยื่นชื่อเพิ่มสายการบิน", "Name-list addendum to airline"), due: "2026-09-28T12:00:00+07:00" },
      { label: z("ยืนยันห้องเดินภายใน 24 ชม.", "Confirm walk-up rooms in 24h"), due: "2026-09-11T17:00:00+09:00" },
    ],
  };
  next.impacts = [impact, ...next.impacts.filter((x) => x.id !== "imp-pax")];
  next.approvals = [
    { id: "ap-pax", title: z("อนุมัติต้นทุนผู้โดยสารเพิ่ม", "Approve extra-passenger cost"), body: impact.finance, amount: extraCost, status: "pending", impactId: "imp-pax" },
    ...next.approvals.filter((a) => a.id !== "ap-pax"),
  ];
  next.demoStage = "paxAdded";
  next.log.unshift({ at: new Date().toISOString(), text: z("เพิ่มผู้โดยสาร 5 คน — รออนุมัติผลกระทบ", "Added 5 passengers — impact awaiting approval") });
  return { next, impact };
}

export function applyDelay(snap: OsSnapshot): { next: OsSnapshot; impact: ChangeImpact } {
  const next = clone(snap);
  const fl = next.flights.find((f) => f.id === "fl-in");
  if (fl) {
    fl.arriveAt = "2026-10-12T11:40:00+07:00";
    fl.delayed = true;
  }
  const doi = next.services.find((s) => s.id === "svc-doi");
  if (doi) {
    doi.state = "cancelled";
    doi.notes = z("สล็อต 10:30 ใช้ไม่ได้ เสนอ 15:30", "10:30 slot unusable; propose 15:30");
  }
  const meal = next.services.find((s) => s.id === "svc-meal-d2");
  if (meal) {
    meal.notes = z("เลื่อนเป็น 13:30 รอร้านยืนยัน", "Moved to 13:30, awaiting restaurant ack");
    meal.state = "quoted";
  }
  const ot: ServiceLine = {
    id: "svc-ot",
    departureId: DEMO_DEP_ID,
    module: "bus",
    supplierId: "sup-bus",
    name: z("ล่วงเวลาคนขับ + ที่จอด", "Driver overtime + parking"),
    qty: 1,
    unitCost: 4200,
    unitSell: 0,
    currency: "THB",
    rateClass: "indicative",
    state: "requested",
    source: "AI Disruption Coordinator",
    updatedAt: new Date().toISOString(),
  };
  if (!next.services.some((s) => s.id === "svc-ot")) next.services.push(ot);
  next.incidents = [
    {
      id: "inc-delay",
      departureId: DEMO_DEP_ID,
      title: z("CZ3051 ล่าช้า ถึง 11:40", "CZ3051 delayed, arrive 11:40"),
      body: z("กระทบดอยสุเทพ อาหารกลางวัน เช็กอิน และล่วงเวลารถ", "Hits Doi Suthep, lunch, check-in and coach overtime."),
      status: "open",
      created: new Date().toISOString(),
    },
    ...next.incidents.filter((i) => i.id !== "inc-delay"),
  ];
  const after = totals(next, DEMO_DEP_ID);
  const impact: ChangeImpact = {
    id: "imp-delay",
    title: z("ไฟลต์ขาเข้าดีเลย์", "Arrival flight delayed"),
    why: z("CZ3051 ถึงเชียงใหม่ 11:40 แทน 07:10", "CZ3051 arrives Chiang Mai 11:40 instead of 07:10."),
    finance: z(
      `ต้นทุนเพิ่มประมาณ ฿4,200 (ล่วงเวลา) + ความเสี่ยงบัตรดอยสุเทพ มาร์จิ้น ${after.margin.toFixed(1)}%`,
      `About ฿4,200 overtime plus Doi Suthep exposure. Margin ${after.margin.toFixed(1)}%`
    ),
    next: z("อนุมัติย้ายสล็อต แจ้งร้าน แจ้งลูกค้า และให้ซัพพลายเออร์ตอบรับ", "Approve slot move, notify restaurant and client, collect supplier acks."),
    extraCost: 4200,
    newMargin: after.margin,
    affected: [
      { id: "fl-in", module: "flight", name: z("CZ3051", "CZ3051"), change: z("ถึง 07:10 → 11:40", "Arrive 07:10 → 11:40") },
      { id: "svc-doi", module: "activity", name: z("ดอยสุเทพ", "Doi Suthep"), change: z("ยกเลิก 10:30 เสนอ 15:30", "Cancel 10:30, propose 15:30") },
      { id: "svc-meal-d2", module: "meal", name: z("ร้านกลุ่มนิมมาน", "Nimman group table"), change: z("12:15 → 13:30", "12:15 → 13:30") },
      { id: "svc-bus", module: "bus", name: z("รถโค้ช", "Coaches"), change: z("รอสนามบิน ล่วงเวลา + ที่จอด", "Airport wait, OT + parking") },
      { id: "svc-ht-cnx", module: "hotel", name: z("Le Meridien Chiang Mai", "Le Meridien Chiang Mai"), change: z("เช็กอินสาย เก็บกระเป๋าที่รถ", "Late check-in, bags on coach") },
      { id: "svc-gd", module: "guide", name: z("ไกด์", "Guides"), change: z("เลื่อนบรีฟและล่วงเวลาเย็น", "Briefing shift and evening OT risk") },
    ],
    deadlines: [
      { label: z("ร้านอาหารตอบรับ", "Restaurant acknowledgement"), due: "2026-10-12T18:00:00+07:00" },
      { label: z("ดอยสุเทพยืนยันสล็อตใหม่", "Doi Suthep new-slot confirm"), due: "2026-10-12T16:00:00+07:00" },
    ],
  };
  next.impacts = [impact, ...next.impacts.filter((x) => x.id !== "imp-delay")];
  next.approvals = [
    { id: "ap-delay", title: z("อนุมัติแผนกู้ไฟลต์ดีเลย์", "Approve delay recovery plan"), body: impact.finance, amount: 4200, status: "pending", impactId: "imp-delay" },
    ...next.approvals.filter((a) => a.id !== "ap-delay"),
  ];
  next.tasks = next.tasks.map((t) => (t.id === "tk-meal" ? { ...t, title: z("ร้านนิมมานตอบรับ 13:30", "Nimman restaurant ack 13:30") } : t));
  next.demoStage = "disrupted";
  next.log.unshift({ at: new Date().toISOString(), text: z("CZ3051 ดีเลย์ — สร้างแผนกู้และรออนุมัติ", "CZ3051 delayed — recovery plan awaiting approval") });
  return { next, impact };
}

export function approveAll(snap: OsSnapshot): OsSnapshot {
  const next = clone(snap);
  next.approvals = next.approvals.map((a) => ({ ...a, status: "approved" as const }));
  next.services = next.services.map((s) => {
    if (s.id === "svc-ot") return { ...s, state: "confirmed" as const, rateClass: "quoted" as const };
    if (s.id === "svc-doi" && s.state === "cancelled") {
      return { ...s, state: "held" as const, notes: z("ย้ายเป็นสล็อต 15:30 แล้ว", "Moved to 15:30 slot"), qty: s.qty };
    }
    if (s.state === "quoted" || s.state === "requested") return { ...s, state: "confirmed" as const, rateClass: "confirmed" as const };
    if (s.state === "held") return { ...s, state: "confirmed" as const, rateClass: "confirmed" as const };
    return s;
  });
  next.tasks = next.tasks.map((t) => ({ ...t, ack: true }));
  next.incidents = next.incidents.map((i) => ({ ...i, status: "recovering" as const }));
  next.activities = next.activities.map((a) => (a.id === "act-doi" ? { ...a, slot: "15:30" } : a));
  next.meals = next.meals.map((m) => (m.id === "ml-d2" ? { ...m, time: "13:30" } : m));
  next.demoStage = "approved";
  next.log.unshift({ at: new Date().toISOString(), text: z("อนุมัติผลกระทบทั้งหมด ซัพพลายเออร์กำลังยืนยัน", "All impacts approved — suppliers confirming") });
  return next;
}

export function closeDeparture(snap: OsSnapshot): OsSnapshot {
  const next = clone(snap);
  const t = totals(next, DEMO_DEP_ID);
  next.departures = next.departures.map((d) => (d.id === DEMO_DEP_ID ? { ...d, status: "closed" as const } : d));
  next.bookings = next.bookings.map((b) => (b.departureId === DEMO_DEP_ID ? { ...b, state: "completed" as const, balance: 0, deposit: b.total } : b));
  next.incidents = next.incidents.map((i) => ({ ...i, status: "closed" as const }));
  next.ledger = next.ledger.map((l) => ({ ...l, status: l.side === "in" ? "received" : "paid" }));
  next.demoStage = "closed";
  next.log.unshift({
    at: new Date().toISOString(),
    text: z(`ปิดทริป กำไรจริง ${money(t.sell - t.cost)} มาร์จิ้น ${t.margin.toFixed(1)}%`, `Trip closed. Actual profit ${money(t.sell - t.cost)}, margin ${t.margin.toFixed(1)}%`),
  });
  return next;
}

export function buildDrafts(snap: OsSnapshot, intent: string): AiDraft[] {
  const t = totals(snap, DEMO_DEP_ID);
  const ready = readiness(snap, DEMO_DEP_ID);
  const sim = simulateDay2(snap);
  const q = intent.toLowerCase();
  const all: AiDraft[] = [
    {
      id: "ai-producer",
      feature: "AI Tour Producer",
      title: z("บรีฟและใบเสนอจากงานลูกค้า", "Brief and proposal from the enquiry"),
      body: z("อินบาวด์ 40 คน สามเหลี่ยมทองคำ 6 วัน ไกด์จีน ไม่ลงร้าน งบ 24,000 — สร้างเทมเพลตและรายการขอซัพพลายเออร์แล้ว", "Inbound 40 pax, Golden Triangle 6 days, Chinese guide, no shops, ฿24,000 — template and supplier request list drafted."),
      editable: "Golden Triangle 6D / CAN-CNX group / named 4★ / 0 shopping / sell ฿24,000 / margin target 18%",
      applied: false,
    },
    {
      id: "ai-buyer",
      feature: "AI Supplier Buyer",
      title: z("เทียบเรทที่นั่งกลุ่ม", "Compare group-seat offers"),
      body: z("ข้อเสนอคอนโซ CZ ถูกกว่าเดิน ฿1,300/ที่ แต่ต้องมัดจำ 30% และปล่อย T-21 — ไม่รวมที่นั่งเด็กพิเศษ", "CZ consolidator is ฿1,300/seat below walk-up, but 30% deposit and T-21 release. Child seats not specified."),
      editable: "Prefer consolidator block. Clarify child fare and name-change fee before hold.",
      applied: false,
    },
    {
      id: "ai-impact",
      feature: "AI Change Impact",
      title: z("ผลกระทบล่าสุดของไฟลต์/หัว", "Latest passenger/flight impact"),
      body: snap.impacts[0]?.finance || z("ยังไม่มีเปลี่ยนแปลงที่รอวิเคราะห์", "No pending change to analyse."),
      editable: snap.impacts[0] ? "Approve extra cost, then push supplier confirmations." : "No package.",
      applied: false,
    },
    {
      id: "ai-sim",
      feature: "AI Trip Simulator",
      title: z("จำลองจังหวะวันที่ 2", "Simulate day-2 timing"),
      body: sim.delayed
        ? sim.conflicts[0]
        : z("ตารางเดิมผ่าน: ถึง 07:10 ถึงดอยสุเทพ 10:30 อาหาร 12:15", "Base timetable clears: arrive 07:10, Doi Suthep 10:30, lunch 12:15."),
      editable: sim.alts[0] ? sim.alts.map((a) => a.en).join(" | ") : "Keep published timing.",
      applied: false,
    },
    {
      id: "ai-seat",
      feature: "AI Flight and Seat Advisor",
      title: z("ถือหรือปล่อยที่นั่งว่าง", "Keep or release unused seats"),
      body: z(
        `บล็อกไป-กลับอย่างละ ${snap.flights[0]?.seats || 0} ที่ ขายแล้ว ${snap.flights[0]?.sold || 0} ความเสี่ยงที่นั่งว่าง ${money(flightExposure(snap)[0]?.leak || 0)}`,
        `Blocks ${snap.flights[0]?.seats || 0} / sold ${snap.flights[0]?.sold || 0}. Unsold exposure ${money(flightExposure(snap)[0]?.leak || 0)}`
      ),
      editable: "Keep the block through name-list date. Do not release — corporate add-ons still open.",
      applied: false,
    },
    {
      id: "ai-ready",
      feature: "AI Passenger Readiness Checker",
      title: z("ความพร้อมเอกสารผู้โดยสาร", "Passenger document readiness"),
      body: z(
        `คะแนน ${ready.score} · พาสปอร์ตขาด ${ready.missingPass.length} · ชื่อไม่ตรง ${ready.nameMismatch.length} · ไม่มีประกัน ${ready.noIns.length}`,
        `Score ${ready.score} · missing passports ${ready.missingPass.length} · name mismatches ${ready.nameMismatch.length} · no insurance ${ready.noIns.length}`
      ),
      editable: ready.missingPass.map((p) => p.name).join(", ") || "All passports on file.",
      applied: false,
    },
    {
      id: "ai-dis",
      feature: "AI Disruption Coordinator",
      title: z("แผนกู้เมื่อไฟลต์/ซัพพลายเออร์ล่ม", "Recovery when a flight or supplier fails"),
      body: sim.delayed
        ? z("ย้ายดอยสุเทพ เลื่อนอาหาร เก็บกระเป๋าที่รถ แจ้งเอเย่นต์อินบาวด์", "Move Doi Suthep, shift lunch, bags on coach, notify the inbound agency.")
        : z("ยังไม่มีเหตุกวน แผนสำรองคือสล็อตดอยสุเทพสำรอง 15:30", "No live disruption. Fallback is the 15:30 Doi Suthep slot."),
      editable: "Send one acknowledgement pack: restaurant, attraction, coaches, client.",
      applied: false,
    },
    {
      id: "ai-profit",
      feature: "AI Profit Guardian",
      title: z("เฝ้ามาร์จิ้นและเงินสด", "Watch margin and cash"),
      body: z(
        `ขาย ${money(t.sell)} ต้นทุน ${money(t.cost)} มาร์จิ้น ${t.margin.toFixed(1)}% จุดคุ้มทุน ${breakEvenPax(snap, DEMO_DEP_ID)} คน เก็บแล้ว ${money(t.collected)} จ่ายซัพพลายเออร์รอ ${money(t.payableSoon)}`,
        `Sell ${money(t.sell)} / cost ${money(t.cost)} / margin ${t.margin.toFixed(1)}% / break-even ${breakEvenPax(snap, DEMO_DEP_ID)} pax. Collected ${money(t.collected)}, supplier due ${money(t.payableSoon)}`
      ),
      editable: "Leakage: walk-up rooms and overtime. Hold extra rooms to contract if the hotel allows.",
      applied: false,
    },
    {
      id: "ai-ops",
      feature: "AI Operations Assistant",
      title: z("งานที่ต้องทำวันนี้", "Tasks for today"),
      body: z(
        `${snap.tasks.filter((x) => !x.done).length} งานเปิด — เร่งรายชื่อไฟลต์และพาสปอร์ตที่ขาด`,
        `${snap.tasks.filter((x) => !x.done).length} open tasks — flight names and missing passports first`
      ),
      editable: "Create task: call Nanfang Travel for 3 passports before Friday 17:00 ICT.",
      applied: false,
    },
    {
      id: "ai-mem",
      feature: "AI Tour Memory",
      title: z("บทเรียนจากทริปที่ปิด", "Lessons from closed trips"),
      body: z("ทริปสามเหลี่ยมทองคำก่อนหน้า: ดอยสุเทพเช้าหลังไฟลต์สายพลาด 40% — อย่าขายสล็อตก่อน 10:30 ถ้าถึงเชียงใหม่หลัง 08:00", "Prior Golden Triangle departures: morning Doi Suthep missed 40% after late arrivals. Do not sell a slot before 10:30 if CNX arrival is after 08:00."),
      editable: "Default day-1: old city first if late, Doi Suthep afternoon. Used automatically on the next inbound North template.",
      applied: false,
    },
  ];
  if (!q.trim()) return all;
  const hit = all.filter((d) => `${d.feature} ${d.title.en} ${d.title.th} ${d.body.en}`.toLowerCase().includes(q) || q.includes(d.feature.split(" ")[1]?.toLowerCase() || "x"));
  if (q.includes("เพิ่ม") || q.includes("5") || q.includes("pax") || q.includes("impact")) return all.filter((d) => d.id === "ai-impact" || d.id === "ai-profit");
  if (q.includes("ดีเลย์") || q.includes("delay") || q.includes("flight")) return all.filter((d) => d.id === "ai-dis" || d.id === "ai-sim");
  if (q.includes("พาส") || q.includes("passport") || q.includes("ready")) return all.filter((d) => d.id === "ai-ready");
  return hit.length ? hit : all.slice(0, 3);
}
