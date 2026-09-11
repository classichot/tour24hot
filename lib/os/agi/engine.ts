import type { L10n } from "../../data";
import type {
  Booking,
  Customer,
  Departure,
  Enquiry,
  FlightBlock,
  GuideAssign,
  HotelAllotment,
  LedgerLine,
  MealService,
  OsSnapshot,
  OsTask,
  QuoteVersion,
  ServiceLine,
  Supplier,
  TourProduct,
  VehicleAssign,
} from "../types";
import {
  AGI_BOOK_ID,
  AGI_CUS_ID,
  AGI_DEP_ID,
  AGI_ENQ_ID,
  AGI_PRD_ID,
  DEFAULT_AUTHORITY,
  type AgiChangePlan,
  type AgiFact,
  type AgiJob,
  type AgiMission,
  type AgiOption,
  type AgiRescue,
  type AgiState,
} from "./types";

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });

export const FLAGSHIP_BRIEF =
  "Prepare a six-day Thailand tour for 40 Swedish travelers. Include group flights, four-star hotels, buses, meals, attractions, and a Swedish-speaking guide. Target an 18% gross margin. Prepare three options and obtain supplier quotes.";

export interface ParsedBrief {
  dest: string;
  days: number;
  nights: number;
  pax: number;
  nationality: string;
  hotelClass: number;
  marginTarget: number;
  needFlights: boolean;
  needBuses: boolean;
  needMeals: boolean;
  needActs: boolean;
  guideLang: string;
  optionCount: number;
  raw: string;
}

function wordDays(t: string) {
  if (/\bsix[- ]?day\b|\b6[- ]?วัน\b|\b6[- ]?day\b/.test(t)) return 6;
  if (/\bfive[- ]?day\b|\b5[- ]?วัน\b|\b5[- ]?day\b/.test(t)) return 5;
  if (/\bfour[- ]?day\b|\b4[- ]?วัน\b/.test(t)) return 4;
  const m = t.match(/(\d+)\s*-?\s*(day|วัน)/);
  return m ? Number(m[1]) : 6;
}

function peekTap(raw: string): Partial<{ dest: string; days: number; pax: number; nationality: string; hotelClass: number; marginTarget: number; objective: string }> | null {
  const t = raw.trim();
  if (!t.startsWith("{")) return null;
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    if (j.protocol !== "TAP") return null;
    return j as Partial<{ dest: string; days: number; pax: number; nationality: string; hotelClass: number; marginTarget: number; objective: string }>;
  } catch {
    return null;
  }
}

export function parseBrief(raw: string): ParsedBrief {
  const tap = peekTap(raw);
  if (tap) {
    const days = Number(tap.days) || 6;
    const pax = Number(tap.pax) || 40;
    return {
      dest: tap.dest || "Thailand",
      days,
      nights: Math.max(1, days - 1),
      pax,
      nationality: tap.nationality || "Swedish",
      hotelClass: Number(tap.hotelClass) || 4,
      marginTarget: Number(tap.marginTarget) || 18,
      needFlights: true,
      needBuses: true,
      needMeals: true,
      needActs: true,
      guideLang: /swedish|สวีเดน/i.test(tap.nationality || "") ? "sv" : "en",
      optionCount: 3,
      raw: tap.objective || raw,
    };
  }
  const t = raw.toLowerCase();
  const paxM = t.match(/(\d+)\s*(swedish|pax|travelers?|travellers?|คน|客人|пассажир)/);
  const paxAlone = t.match(/\b(\d{2,3})\b/);
  const marginM = t.match(/(\d+)\s*%/);
  const starM = t.match(/(\d)\s*[- ]?star|สี่ดาว|4\s*ดาว/);
  return {
    dest: /chiang|เชียงใหม่|north/.test(t) ? "Chiang Mai" : /hua hin|หัวหิน/.test(t) ? "Hua Hin" : "Thailand",
    days: wordDays(t),
    nights: Math.max(1, wordDays(t) - 1),
    pax: paxM ? Number(paxM[1]) : paxAlone ? Number(paxAlone[1]) : 40,
    nationality: /swedish|สวีเดน|瑞典|швед/.test(t) ? "Swedish" : "International",
    hotelClass: starM ? Number(starM[1] || 4) : 4,
    marginTarget: marginM ? Number(marginM[1]) : 18,
    needFlights: /flight|ไฟลต์|机票|рейс/.test(t) || true,
    needBuses: /bus|รถ|巴士|автобус/.test(t) || true,
    needMeals: /meal|อาหาร|餐|питан/.test(t) || true,
    needActs: /attraction|กิจกรรม|景点|экскурс/.test(t) || true,
    guideLang: /swedish|สวีเดน|瑞典|швед/.test(t) ? "sv" : "en",
    optionCount: /three|3 options|สาม|三/.test(t) ? 3 : 3,
    raw,
  };
}

function sellFromCost(cost: number, marginPct: number) {
  const sell = Math.round(cost / (1 - marginPct / 100) / 100) * 100;
  const margin = sell === 0 ? 0 : ((sell - cost) / sell) * 100;
  return { sell, margin };
}

function optionCost(pax: number, kind: "north" | "central" | "combo") {
  const rooms = Math.ceil(pax / 2);
  const airIntl = 18500 * pax;
  const airDom = kind === "central" ? 0 : 2800 * pax;
  const hotelNight = kind === "combo" ? 2800 : kind === "north" ? 2500 : 2400;
  const nights = 5;
  const hotel = rooms * hotelNight * nights;
  const bus = kind === "central" ? 16000 * 6 : 18000 * 6;
  const meals = 12 * 380 * pax;
  const acts = (kind === "combo" ? 2600 : 2200) * pax;
  const guide = 9000 * 6;
  const leader = 4500 * 6;
  const misc = 400 * pax;
  return { airIntl, airDom, hotel, bus, meals, acts, guide, leader, misc, total: airIntl + airDom + hotel + bus + meals + acts + guide + leader + misc };
}

export function buildOptions(pax: number, marginTarget: number): AgiOption[] {
  const specs: ["north" | "central" | "combo", L10n][] = [
    ["north", z("เหนือ เชียงใหม่–ปาย–เชียงราย", "North: Chiang Mai – Pai – Chiang Rai")],
    ["central", z("กลาง กรุงเทพ–อยุธยา–หัวหิน", "Central: Bangkok – Ayutthaya – Hua Hin")],
    ["combo", z("ผสม กรุงเทพ 2 คืน + เหนือ 4 วัน", "Combo: 2 nights Bangkok + 4 days North")],
  ];
  return specs.map(([kind, label], i) => {
    const c = optionCost(pax, kind);
    const { sell, margin } = sellFromCost(c.total, marginTarget);
    return {
      id: `opt-${kind}`,
      label,
      pax,
      sell,
      cost: c.total,
      margin,
      nights: 5,
      hotelClass: "4*",
      notes: [
        z("ไฟลต์กลุ่มยังเป็นประมาณการ", "Group air is still an estimate"),
        z("โรงแรมสี่ดาวยังไม่ล็อกชื่อ", "Four-star hotels are not named-held"),
        i === 0 ? z("บัฟเฟอร์รับส่งเหนือดีกว่า", "Better transfer buffers in the North") : z("ขับนานกว่า ต้องเช็กความล้า", "Longer road days — check fatigue"),
      ],
    };
  });
}

function facts(b: ParsedBrief, opt: AgiOption): AgiFact[] {
  return [
    { id: "f-pax", label: z("จำนวนผู้เดินทาง", "Traveller count"), value: z(`${b.pax} คน`, `${b.pax} travellers`), klass: "confirmed", source: "Client brief", module: "sales" },
    { id: "f-nat", label: z("สัญชาติ / ภาษาไกด์", "Nationality / guide language"), value: z(`${b.nationality} · ไกด์ ${b.guideLang}`, `${b.nationality} · guide ${b.guideLang}`), klass: "confirmed", source: "Client brief", module: "guide" },
    { id: "f-days", label: z("จำนวนวัน", "Length"), value: z(`${b.days} วัน ${b.nights} คืน`, `${b.days} days / ${b.nights} nights`), klass: "confirmed", source: "Client brief", module: "sales" },
    { id: "f-hotel", label: z("ระดับโรงแรม", "Hotel class"), value: z(`${b.hotelClass} ดาว`, `${b.hotelClass}-star`), klass: "confirmed", source: "Client brief", module: "hotel" },
    { id: "f-margin", label: z("เป้ามาร์จิ้น", "Margin target"), value: z(`${b.marginTarget}% ขั้นต้น`, `${b.marginTarget}% gross`), klass: "confirmed", source: "Operator policy", module: "finance" },
    { id: "f-sell", label: z("ราคาขายตัวเลือกหลัก", "Lead option sell"), value: z(`${opt.sell.toLocaleString("en-US")} บาท`, `฿${opt.sell.toLocaleString("en-US")}`), klass: "estimate", source: "Cost engine", module: "finance" },
    { id: "f-air", label: z("ไฟลต์กลุ่ม", "Group flights"), value: z("ARN–BKK + บินในประเทศ — ยังไม่มีบล็อก", "ARN–BKK + domestic — no block yet"), klass: "estimate", source: "Consolidator memory 2025", module: "flight" },
    { id: "f-room", label: z("ห้อง", "Rooms"), value: z(`${Math.ceil(b.pax / 2)} ทวิน โดยประมาณ`, `~${Math.ceil(b.pax / 2)} twins`), klass: "estimate", source: "Rooming rule 2 pax / twin", module: "hotel" },
    { id: "f-dates", label: z("วันเดินทาง", "Travel dates"), value: z("ลูกค้ายังไม่ล็อกสัปดาห์", "Week not locked by client"), klass: "missing", source: "Brief gap", module: "sales" },
    { id: "f-names", label: z("รายชื่อพาสปอร์ต", "Passport name list"), value: z("ยังไม่มีไฟล์", "No file received"), klass: "missing", source: "Brief gap", module: "docs" },
    { id: "f-diet", label: z("อาหารพิเศษ / เด็ก", "Diet / children"), value: z("จำนวนเด็กและแพ้อาหารยังไม่ทราบ", "Child count and allergens unknown"), klass: "missing", source: "Brief gap", module: "meal" },
    { id: "f-hold", label: z("ที่นั่งและห้องที่ล็อก", "Held seats and rooms"), value: z("ยังไม่ถือของ — ห้ามสื่อว่าจองแล้ว", "Nothing held — do not imply booked"), klass: "missing", source: "Authority policy", module: "flight" },
  ];
}

function jobs(b: ParsedBrief): AgiJob[] {
  return [
    { id: "j-dir", agent: "director", title: z("ตั้งโปรเจกต์และมอบงาน", "Open the project and assign jobs"), status: "done", note: z("ผูก enquiry กับ departure แล้ว", "Enquiry linked to a departure") },
    { id: "j-sales", agent: "sales", title: z("บรีฟ + ใบเสนอ 3 ฉบับ", "Brief + 3 quote versions"), status: "done", note: z("เขียนลง Sales แล้ว สถานะ quoted", "Written to Sales as quoted") },
    { id: "j-itin", agent: "itinerary", title: z("โปรแกรม 6 วันใช้ได้จริง", "Workable 6-day plan"), status: "done", note: z("เวลารับส่งและมื้ออาหารวางแล้ว — ยังเป็นร่าง", "Transfers and meals placed — still a draft") },
    { id: "j-fl", agent: "flight", title: z("ขอเรทกลุ่ม ARN–BKK", "Request ARN–BKK group fare"), status: "waiting", note: z("ส่งคำขอคอนโซแล้ว รอใบเสนอ", "Consolidator request out, quote pending"), deadline: "2026-09-18T17:00:00+07:00", waitingOn: "Europe group-air consolidator" },
    { id: "j-ht", agent: "hotel", title: z("ขอเรทโรงแรม 4 ดาว", "Request 4-star hotel rates"), status: "waiting", note: z("ส่ง 3 โรงในเชียงใหม่ ยังไม่ถือห้อง", "3 Chiang Mai hotels asked — no hold"), deadline: "2026-09-20T17:00:00+07:00", waitingOn: "Chiang Mai 4-star (unnamed)" },
    { id: "j-bus", agent: "bus", title: z("จับรถกับกระเป๋า 40 ใบ", "Match coach to 40 bags"), status: "working", note: z("โค้ช 45 ที่ 1 คัน + รถกระเป๋า", "One 45-seat coach + luggage van") },
    { id: "j-venue", agent: "venue", title: z("จองมื้อและตั๋วสถานที่", "Reserve meals and tickets"), status: "waiting", note: z("หัวอาหารยังเป็นประมาณ 40", "Headcount still assumed 40"), waitingOn: "/portal/supplier" },
    { id: "j-gd", agent: "guide", title: z("หาไกด์พูดสวีดิช", "Find a Swedish-speaking guide"), status: "working", note: z("รอคอนเฟิร์มลินดา ประจำเชียงใหม่", "Pending Linda, based Chiang Mai") },
    { id: "j-svc", agent: "service", title: z("ยังไม่ส่งโปรแกรมให้ลูกค้าว่าจองแล้ว", "Do not send a booked itinerary"), status: "done", note: z("ร่างอีเมลแยก confirmed / estimate / missing", "Draft email splits confirmed / estimate / missing") },
    { id: "j-fin", agent: "finance", title: z("คำนวณมาร์จิ้น 3 ตัวเลือก", "Cost all three options"), status: "done", note: z(`เป้า ${b.marginTarget}% คำนวณจากเอนจิน ไม่ใช่โมเดล`, `${b.marginTarget}% from the cost engine, not the model`) },
    { id: "j-q", agent: "quality", title: z("ดึงความจำซัพพลายเออร์เหนือ", "Pull North Thailand supplier memory"), status: "done", note: z("ร้านที่ตอบช้าปีที่แล้วถูกทำเครื่องหมาย", "Last year’s late restaurant is flagged") },
  ];
}

function now() {
  return new Date().toISOString();
}

export function createMission(raw: string): AgiMission {
  const brief = parseBrief(raw || FLAGSHIP_BRIEF);
  const options = buildOptions(brief.pax, brief.marginTarget);
  const lead = options[0];
  return {
    id: "msn-se40",
    objective: brief.raw.trim() || FLAGSHIP_BRIEF,
    status: "awaiting_approval",
    created: now(),
    departureId: AGI_DEP_ID,
    enquiryId: AGI_ENQ_ID,
    facts: facts(brief, lead),
    jobs: jobs(brief),
    options,
    blockers: [
      z("วันเดินทางยังไม่ล็อก — ห้ามถือที่นั่ง", "Travel week unlocked — do not hold seats"),
      z("ยังไม่มีรายชื่อพาสปอร์ต", "No passport names"),
      z("อำนาจห้ามคอนเฟิร์มคลังสินค้า", "Authority forbids confirming inventory"),
    ],
    deadlines: [
      { label: z("ใบเสนอคอนโซไฟลต์", "Flight consolidator quote"), due: "2026-09-18T17:00:00+07:00" },
      { label: z("เรทโรงแรม 4 ดาว", "4-star hotel rates"), due: "2026-09-20T17:00:00+07:00" },
      { label: z("ลูกค้าล็อกสัปดาห์เดินทาง", "Client locks travel week"), due: "2026-09-22T17:00:00+07:00" },
    ],
    log: [
      { at: now(), agent: "director", text: z("รับวัตถุประสงค์ แตกงาน 11 เอเจนต์", "Took the objective and split 11 agent jobs") },
      { at: now(), agent: "finance", text: z("คำนวณ 3 ตัวเลือกจากเอนจินต้นทุน", "Priced 3 options from the cost engine") },
      { at: now(), agent: "flight", text: z("ส่งคำขอเรทกลุ่ม — ยังไม่ถือที่นั่ง", "Sent group-fare request — no hold") },
    ],
    paused: false,
  };
}

export function buildChangePlan(fromPax: number, toPax: number, marginTarget: number): AgiChangePlan {
  const before = optionCost(fromPax, "north");
  const after = optionCost(toPax, "north");
  const airRelease = (fromPax - toPax) * 18500;
  const penalty = Math.round(airRelease * 0.15);
  const roomSave = (Math.ceil(fromPax / 2) - Math.ceil(toPax / 2)) * 2500 * 5;
  const mealSave = (fromPax - toPax) * 12 * 380;
  const actSave = (fromPax - toPax) * 2200;
  const extraCost = penalty - roomSave - mealSave - actSave;
  const newCost = after.total + penalty;
  const { sell, margin } = sellFromCost(newCost, marginTarget);
  return {
    fromPax,
    toPax,
    extraCost,
    newSell: sell,
    newCost,
    newMargin: margin,
    applied: false,
    lines: [
      { module: "flight", what: z(`ปล่อย ${fromPax - toPax} ที่นั่ง ค่าปรับประมาณ 15%`, `Release ${fromPax - toPax} seats — ~15% penalty`), cost: penalty, reconfirm: true },
      { module: "hotel", what: z(`ลดห้องทวิน ${Math.ceil(fromPax / 2)} → ${Math.ceil(toPax / 2)}`, `Twins ${Math.ceil(fromPax / 2)} → ${Math.ceil(toPax / 2)}`), cost: -roomSave, reconfirm: true },
      { module: "bus", what: z("ยังต้องใช้โค้ช 45 ที่ — ลดรถกระเป๋าเสริม", "Keep 45-seat coach — drop extra luggage van"), cost: -12000, reconfirm: true },
      { module: "meal", what: z(`ลดหัวอาหาร ${fromPax - toPax}`, `Meal headcount −${fromPax - toPax}`), cost: -mealSave, reconfirm: true },
      { module: "activity", what: z(`ลดตั๋วสถานที่ ${fromPax - toPax}`, `Attraction tickets −${fromPax - toPax}`), cost: -actSave, reconfirm: true },
      { module: "guide", what: z("ค่าไกด์สวีดิชเท่าเดิม", "Swedish guide fee unchanged"), cost: 0, reconfirm: false },
    ],
  };
}

export function buildRescue(): AgiRescue {
  return {
    incident: z(
      "ไฟลต์ขาเข้าดีเลย์ 3 ชั่วโมง พลาดรถรับและมื้อค่ำวันแรก",
      "Arrival delayed 3 hours — first transfer and dinner window fail"
    ),
    options: [
      {
        id: "rsc-shift",
        title: z("เลื่อนรถ + โรงแรม + มื้อค่ำ (เสี่ยงต่ำ)", "Shift coach, hotel, dinner (low risk)"),
        availability: z("โค้ชและโรงแรมตอบได้ในอำนาจ", "Coach and hotel can move inside authority"),
        extraCost: 8400,
        customerImpact: z("ถึงโรงแรมดึก ย้ายมื้อค่ำเป็น 20:30 ไม่เสียวันท่องเที่ยว", "Late hotel, dinner 20:30, sightseeing day kept"),
        needsApproval: false,
        autoAllowed: true,
      },
      {
        id: "rsc-bkk",
        title: z("ค้างกรุงเทพ 1 คืน เลื่อนขึ้นเหนือ", "Extra Bangkok night, delay the North"),
        availability: z("ต้องขอห้องด่วนและเลื่อนโรงเชียงใหม่", "Walk-up BKK room + move CNX night"),
        extraCost: 95000,
        customerImpact: z("เสียครึ่งวันเหนือ ได้พักชดเชย", "Lose a North half-day, gain rest"),
        needsApproval: true,
        autoAllowed: false,
      },
      {
        id: "rsc-skip",
        title: z("ตัดวัดวันแรก นอนใกล้สนามบิน", "Drop day-1 temple, airport hotel"),
        availability: z("โรงแรมสนามบินมีห้อง ตัดตั๋วดอยสุเทพ", "Airport hotel open, cancel Doi Suthep"),
        extraCost: 42000,
        customerImpact: z("โปรแกรมสั้นลง ลูกค้าต้องรับ", "Shorter programme — client must accept"),
        needsApproval: true,
        autoAllowed: false,
      },
    ],
  };
}

export function rehearsalNotes(): L10n[] {
  return [
    z("ถึงดึก + รถขึ้นดอยสุเทพเช้าวันถัดไป — บัฟเฟอร์ 90 นาทีพอ", "Late arrival + next-morning Doi Suthep: 90-minute buffer is enough"),
    z("ถ้าฝนหนักปาย ถนยคด — เตรียมสลับตลาดวอร์กกิ้งแทน", "Heavy rain in Pai: swap the mountain loop for the walking street"),
    z("กลุ่มสวีเดนขึ้นรถช้าโดยสถิติ +12 นาที — อย่าวางมื้อติดสล็อต", "Swedish groups board +12 min on average — do not stack meal on a slot"),
  ];
}

function stripAgi(snap: OsSnapshot): OsSnapshot {
  const dropDep = (id: string) => id === AGI_DEP_ID;
  return {
    ...snap,
    products: snap.products.filter((p) => p.id !== AGI_PRD_ID),
    departures: snap.departures.filter((d) => !dropDep(d.id)),
    customers: snap.customers.filter((c) => c.id !== AGI_CUS_ID),
    enquiries: snap.enquiries.filter((e) => e.id !== AGI_ENQ_ID),
    bookings: snap.bookings.filter((b) => b.id !== AGI_BOOK_ID),
    passengers: snap.passengers.filter((p) => !dropDep(p.departureId)),
    services: snap.services.filter((s) => !dropDep(s.departureId)),
    flights: snap.flights.filter((f) => !snap.services.some((s) => s.id === f.serviceId && dropDep(s.departureId))),
    vehicles: snap.vehicles.filter((v) => !snap.services.some((s) => s.id === v.serviceId && dropDep(s.departureId))),
    hotels: snap.hotels.filter((h) => !snap.services.some((s) => s.id === h.serviceId && dropDep(s.departureId))),
    meals: snap.meals.filter((m) => !snap.services.some((s) => s.id === m.serviceId && dropDep(s.departureId))),
    activities: snap.activities.filter((a) => !snap.services.some((s) => s.id === a.serviceId && dropDep(s.departureId))),
    guides: snap.guides.filter((g) => !snap.services.some((s) => s.id === g.serviceId && dropDep(s.departureId))),
    suppliers: snap.suppliers.filter((s) => !s.id.startsWith("sup-agi-")),
    tasks: snap.tasks.filter((t) => !dropDep(t.departureId)),
    quotes: snap.quotes.filter((q) => q.enquiryId !== AGI_ENQ_ID),
    ledger: snap.ledger.filter((l) => !dropDep(l.departureId)),
    log: snap.log,
  };
}

function writeProject(snap: OsSnapshot, brief: ParsedBrief, options: AgiOption[]): OsSnapshot {
  const base = stripAgi(snap);
  const lead = options[0];
  const rooms = Math.ceil(brief.pax / 2);
  const at = "2026-09-11T00:20:00+07:00";

  const product: TourProduct = {
    id: AGI_PRD_ID,
    code: "TR24-AGI-TH-SE6",
    title: z("ไทย 6 วัน กลุ่มสวีเดน", "Thailand 6 days — Swedish group"),
    kind: "inbound",
    days: brief.days,
    nights: brief.nights,
    destination: z("ไทย · เชียงใหม่ · ปาย · เชียงราย", "Thailand · Chiang Mai · Pai · Chiang Rai"),
    minPax: 24,
    capacity: 48,
    marginTarget: brief.marginTarget,
    itinerary: [
      { d: 1, title: z("ถึงสุวรรณภูมิ – ขึ้นเหนือ", "Arrive BKK – fly North"), body: z("ถึงเช้า บินต่อเชียงใหม่ เข้าโรงแรมสี่ดาว — เวลายังประมาณ", "Morning arrival, onward to Chiang Mai, 4-star hotel — times are estimates."), start: "07:40", end: "16:00" },
      { d: 2, title: z("ดอยสุเทพ – เมืองเก่า", "Doi Suthep – old city"), body: z("วัดเช้า ตลาดเย็น บัฟเฟอร์รับส่ง 90 นาที", "Temple morning, night market, 90-minute transfer buffer."), start: "08:30", end: "20:00" },
      { d: 3, title: z("ปาย", "Pai"), body: z("ขึ้นเขา ถ้าฝนหนักสลับวอล์กกิ้งสตรีท", "Mountain day; rain plan is the walking street."), start: "07:30", end: "18:30" },
      { d: 4, title: z("เชียงราย วัดร่องขุ่น", "Chiang Rai White Temple"), body: z("ความจุกลุ่มต้องคอนเฟิร์ม", "Group capacity still to confirm."), start: "08:00", end: "18:00" },
      { d: 5, title: z("เชียงใหม่อิสระ / ช้อปท้องถิ่น", "Chiang Mai free / local shops"), body: z("ไม่มีร้านบังคับ", "No forced shopping."), start: "09:00", end: "18:00" },
      { d: 6, title: z("กลับกรุงเทพ – ARN", "Return BKK – ARN"), body: z("บินในประเทศแล้วต่อไฟลต์กลุ่ม — ยังไม่ถือที่นั่ง", "Domestic then group long-haul — seats not held."), start: "08:00", end: "23:50" },
    ],
  };

  const departure: Departure = {
    id: AGI_DEP_ID,
    productId: AGI_PRD_ID,
    dateStart: "2026-11-08",
    dateEnd: "2026-11-13",
    status: "quoting",
    cutoff: "2026-10-18T17:00:00+07:00",
    timezone: "Asia/Bangkok",
    paxTarget: brief.pax,
    capacity: 48,
    channelAllocations: [
      { channel: "group", seats: brief.pax, sold: 0, commission: 0 },
      { channel: "agent-direct", seats: 0, sold: 0, commission: 1.5 },
    ],
  };

  const customer: Customer = {
    id: AGI_CUS_ID,
    name: z("Nordic Study Circles", "Nordic Study Circles"),
    type: "corporate",
    company: z("Nordic Study Circles", "Nordic Study Circles"),
    contact: "Eva Lindgren",
    email: "eva@nordiccircles.example",
  };

  const enquiry: Enquiry = {
    id: AGI_ENQ_ID,
    channel: "group",
    customerId: AGI_CUS_ID,
    title: z(`ทัวร์ไทย ${brief.days} วัน ${brief.pax} คน สวีเดน`, `Thailand ${brief.days} days, ${brief.pax} Swedish travellers`),
    brief: z(brief.raw, brief.raw),
    pax: brief.pax,
    budget: Math.round(lead.sell / brief.pax),
    dest: "Thailand",
    stage: "quoted",
    owner: "AGI Tour Director",
    created: at,
    followUp: "2026-09-16T10:00:00+07:00",
    departureId: AGI_DEP_ID,
  };

  const booking: Booking = {
    id: AGI_BOOK_ID,
    ref: "T24-AGI-SE40",
    departureId: AGI_DEP_ID,
    customerId: AGI_CUS_ID,
    channel: "group",
    paxIds: [],
    state: "quoted",
    deposit: 0,
    balance: lead.sell,
    total: lead.sell,
  };

  const suppliers: Supplier[] = [
    { id: "sup-agi-air", name: z("คอนโซไฟลต์ยุโรป", "Europe group-air consolidator"), kind: "consolidator", terms: z("มัดจำ 30% ปล่อย T-21", "30% deposit, release T-21"), rating: 90, currency: "THB" },
    { id: "sup-agi-ht", name: z("โรงแรมเชียงใหม่ 4 ดาว (รอชื่อ)", "Chiang Mai 4-star (unnamed)"), kind: "hotel", terms: z("ปล่อย T-14", "Release T-14"), rating: 88, currency: "THB" },
    { id: "sup-agi-bus", name: z("รถเช่าเหนือ", "North Thailand coach hire"), kind: "bus", terms: z("ล่วงเวลา ฿800/ชม.", "OT ฿800/hr"), rating: 86, currency: "THB" },
    { id: "sup-agi-gd", name: z("ไกด์ลินดา (สวีดิช)", "Guide Linda (Swedish)"), kind: "guide", terms: z("ค่าวัน ฿9,000", "Day fee ฿9,000"), rating: 93, currency: "THB" },
  ];

  const services: ServiceLine[] = [
    { id: "svc-agi-air", departureId: AGI_DEP_ID, module: "flight", supplierId: "sup-agi-air", name: z("กลุ่ม ARN–BKK ไปกลับ (ประมาณ)", "Group ARN–BKK return (estimate)"), qty: brief.pax, unitCost: 18500, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Flight Agent — memory 2025", updatedAt: at, notes: z("ยังไม่ใช่บล็อกที่ยืนยัน", "Not a confirmed block") },
    { id: "svc-agi-dom", departureId: AGI_DEP_ID, module: "flight", supplierId: "sup-agi-air", name: z("บินในประเทศ BKK–CNX (ประมาณ)", "Domestic BKK–CNX (estimate)"), qty: brief.pax, unitCost: 2800, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Flight Agent", updatedAt: at },
    { id: "svc-agi-ht", departureId: AGI_DEP_ID, module: "hotel", supplierId: "sup-agi-ht", name: z(`โรงแรม 4 ดาว ${brief.nights} คืน`, `4-star hotel ${brief.nights} nights`), qty: rooms, unitCost: 2500, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Hotel Agent", updatedAt: at, day: 1, deadline: "2026-09-20T17:00:00+07:00" },
    { id: "svc-agi-bus", departureId: AGI_DEP_ID, module: "bus", supplierId: "sup-agi-bus", name: z("โค้ช 45 ที่ + รถกระเป๋า", "45-seat coach + luggage van"), qty: 1, unitCost: 18000, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Bus Agent", updatedAt: at },
    { id: "svc-agi-meal", departureId: AGI_DEP_ID, module: "meal", supplierId: "sup-agi-ht", name: z("มื้อกลุ่ม 12 มื้อ", "12 group meals"), qty: brief.pax, unitCost: 380 * 12, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Venue Agent", updatedAt: at },
    { id: "svc-agi-act", departureId: AGI_DEP_ID, module: "activity", supplierId: "sup-agi-ht", name: z("ดอยสุเทพ · วัดร่องขุ่น · ตลาด", "Doi Suthep · White Temple · markets"), qty: brief.pax, unitCost: 2200, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Venue Agent", updatedAt: at },
    { id: "svc-agi-gd", departureId: AGI_DEP_ID, module: "guide", supplierId: "sup-agi-gd", name: z("ไกด์สวีดิช 6 วัน", "Swedish-speaking guide 6 days"), qty: 6, unitCost: 9000, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", source: "AGI Guide Agent", updatedAt: at },
  ];

  const flights: FlightBlock[] = [
    { id: "fl-agi-out", serviceId: "svc-agi-air", airline: "TG", flightNo: "TG961", from: "ARN", to: "BKK", departAt: "2026-11-07T15:20:00+01:00", arriveAt: "2026-11-08T07:40:00+07:00", seats: brief.pax, sold: 0, deposit: 0, releaseAt: "2026-10-18T17:00:00+07:00", namesDue: "2026-10-25T17:00:00+07:00", ticketBy: "2026-11-01T17:00:00+07:00", timezone: "Europe/Stockholm" },
  ];

  const vehicles: VehicleAssign[] = [
    { id: "veh-agi-1", serviceId: "svc-agi-bus", plate: "รอจัดสรร", owned: false, seats: 45, luggage: 45, driver: "TBA", pickup: z("สุวรรณภูมิ T1 — ยังไม่ล็อกเวลา", "Suvarnabhumi T1 — time not locked") },
  ];

  const hotels: HotelAllotment[] = [
    { id: "ht-agi-1", serviceId: "svc-agi-ht", hotel: z("โรงแรม 4 ดาวเชียงใหม่ (รอชื่อ)", "Chiang Mai 4-star (unnamed)"), city: z("เชียงใหม่", "Chiang Mai"), nights: brief.nights, twins: rooms, singles: 0, comps: 0, releaseAt: "2026-10-25T17:00:00+07:00" },
  ];

  const meals: MealService[] = [
    { id: "ml-agi-1", serviceId: "svc-agi-meal", venue: z("ร้านกลุ่มเหนือ (รอชื่อ)", "North group restaurant (unnamed)"), meal: "D", day: 1, time: "19:00", capacity: 48, dietNotes: z("ยังไม่ทราบแพ้อาหาร", "Allergens unknown") },
  ];

  const guides: GuideAssign[] = [
    { id: "gd-agi-1", serviceId: "svc-agi-gd", name: z("ลินดา (รอคอนเฟิร์ม)", "Linda (pending)"), role: "leader", langs: ["sv", "en", "th"], fee: 9000, phone: "+66 81 240 1100" },
  ];

  const quotes: QuoteVersion[] = options.map((o) => ({
    id: `q-agi-${o.id}`,
    enquiryId: AGI_ENQ_ID,
    label: o.label,
    pax: o.pax,
    sell: o.sell,
    cost: o.cost,
    margin: o.margin,
    assumptions: o.notes,
    created: at,
  }));

  const tasks: OsTask[] = [
    { id: "tk-agi-air", departureId: AGI_DEP_ID, title: z("รอใบเสนอไฟลต์กลุ่ม ARN–BKK", "Await ARN–BKK group-fare quote"), owner: "AGI Flight", due: "2026-09-18T17:00:00+07:00", tz: "Asia/Bangkok", module: "flight", done: false },
    { id: "tk-agi-ht", departureId: AGI_DEP_ID, title: z("รอเรทโรงแรม 4 ดาว 3 แห่ง", "Await 3× 4-star hotel rates"), owner: "AGI Hotel", due: "2026-09-20T17:00:00+07:00", tz: "Asia/Bangkok", module: "hotel", done: false },
    { id: "tk-agi-dates", departureId: AGI_DEP_ID, title: z("ให้ลูกค้าล็อกสัปดาห์เดินทาง", "Client to lock travel week"), owner: "AGI Sales", due: "2026-09-22T17:00:00+07:00", tz: "Europe/Stockholm", module: "sales", done: false },
  ];

  const ledger: LedgerLine[] = [
    { id: "ld-agi-sell", departureId: AGI_DEP_ID, side: "in", label: z("ยอดขายตัวเลือกหลัก (ยังไม่เก็บ)", "Lead-option sell (not collected)"), amount: lead.sell, due: "2026-10-10", status: "expected" },
    { id: "ld-agi-air", departureId: AGI_DEP_ID, side: "out", label: z("ไฟลต์กลุ่มประมาณการ", "Estimated group air"), amount: 18500 * brief.pax, due: "2026-10-20", status: "expected" },
  ];

  return {
    ...base,
    products: [...base.products, product],
    departures: [...base.departures, departure],
    customers: [...base.customers, customer],
    enquiries: [...base.enquiries, enquiry],
    bookings: [...base.bookings, booking],
    services: [...base.services, ...services],
    flights: [...base.flights, ...flights],
    vehicles: [...base.vehicles, ...vehicles],
    hotels: [...base.hotels, ...hotels],
    meals: [...base.meals, ...meals],
    guides: [...base.guides, ...guides],
    suppliers: [...base.suppliers, ...suppliers],
    tasks: [...base.tasks, ...tasks],
    quotes: [...base.quotes, ...quotes],
    ledger: [...base.ledger, ...ledger],
    log: [{ at, text: z("AGI Mode สร้างโปรเจกต์ทัวร์ไทยกลุ่มสวีเดน — ของยังไม่ล็อก", "AGI Mode opened the Swedish Thailand project — inventory not secured") }, ...base.log],
  };
}

export function runOneCommand(snap: OsSnapshot, raw: string): { snap: OsSnapshot; mission: AgiMission } {
  const brief = parseBrief(raw || FLAGSHIP_BRIEF);
  const mission = createMission(raw || FLAGSHIP_BRIEF);
  return { snap: writeProject(snap, brief, mission.options), mission };
}

export function applyChangeToSnap(snap: OsSnapshot, plan: AgiChangePlan): OsSnapshot {
  const next: OsSnapshot = JSON.parse(JSON.stringify(snap)) as OsSnapshot;
  const dep = next.departures.find((d) => d.id === AGI_DEP_ID);
  if (dep) dep.paxTarget = plan.toPax;
  const enq = next.enquiries.find((e) => e.id === AGI_ENQ_ID);
  if (enq) enq.pax = plan.toPax;
  const bk = next.bookings.find((b) => b.id === AGI_BOOK_ID);
  if (bk) {
    bk.total = plan.newSell;
    bk.balance = plan.newSell;
  }
  for (const id of ["svc-agi-air", "svc-agi-dom", "svc-agi-meal", "svc-agi-act"]) {
    const s = next.services.find((x) => x.id === id);
    if (s) {
      s.qty = plan.toPax;
      s.notes = z("ปรับหลังลูกค้าเหลือ 32 คน — รอซัพพลายเออร์คอนเฟิร์ม", "Adjusted after client dropped to 32 — awaiting reconfirm");
      s.updatedAt = now();
    }
  }
  const ht = next.services.find((s) => s.id === "svc-agi-ht");
  if (ht) {
    ht.qty = Math.ceil(plan.toPax / 2);
    ht.updatedAt = now();
  }
  const fl = next.flights.find((f) => f.id === "fl-agi-out");
  if (fl) fl.seats = plan.toPax;
  next.quotes = next.quotes.map((q) => (q.enquiryId === AGI_ENQ_ID && q.id.includes("north") ? { ...q, pax: plan.toPax, sell: plan.newSell, cost: plan.newCost, margin: plan.newMargin } : q));
  next.log = [{ at: now(), text: z(`AGI Change Once: ${plan.fromPax} → ${plan.toPax} คน รอคอนเฟิร์มซัพพลายเออร์`, `AGI Change Once: ${plan.fromPax} → ${plan.toPax} pax, suppliers must reconfirm`) }, ...next.log];
  return next;
}

export function applyRescueToSnap(snap: OsSnapshot, optionId: string): OsSnapshot {
  const next: OsSnapshot = JSON.parse(JSON.stringify(snap)) as OsSnapshot;
  const meal = next.meals.find((m) => m.id === "ml-agi-1");
  if (meal && optionId === "rsc-shift") meal.time = "20:30";
  next.incidents = [
    {
      id: "inc-agi-1",
      departureId: AGI_DEP_ID,
      title: z("ดีเลย์ขาเข้า 3 ชม.", "Arrival delay 3h"),
      body: z("กู้ด้วยแผนที่เลือกใน AGI Mode", "Recovery chosen in AGI Mode"),
      status: optionId === "rsc-shift" ? "recovering" : "open",
      created: now(),
    },
    ...next.incidents,
  ];
  next.log = [{ at: now(), text: z(`AGI Trip Rescue ใช้แผน ${optionId}`, `AGI Trip Rescue applied ${optionId}`) }, ...next.log];
  return next;
}

export function togglePause(state: AgiState, id: string): AgiState {
  return {
    ...state,
    missions: state.missions.map((m) =>
      m.id === id ? { ...m, paused: !m.paused, status: !m.paused ? "paused" : "working" } : m
    ),
  };
}

export function withMission(state: AgiState, mission: AgiMission, on = true): AgiState {
  const rest = state.missions.filter((m) => m.id !== mission.id);
  return { ...state, on, activeId: mission.id, authority: state.authority || DEFAULT_AUTHORITY, missions: [mission, ...rest] };
}
