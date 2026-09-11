import type { L10n } from "../data";
import type {
  ActivityService,
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
  Passenger,
  QuoteVersion,
  ServiceLine,
  Supplier,
  TourProduct,
  VehicleAssign,
} from "./types";

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });

/** Primary OS acceptance demo — inbound Golden Triangle, 40 pax. Replaces outbound `dep-jp40`. */
export const DEMO_DEP_ID = "dep-gt40";
export const DEMO_PRD_ID = "prd-gt40";
export const DEMO_BOOK_ID = "bk-gt40";
export const DEMO_CUS_ID = "cus-nanfang";
export const DEMO_ENQ_ID = "enq-gt40";
export const DEMO_SELL_PER = 24000;

const NAMES = [
  "Chen Wei", "Li Na", "Wang Fang", "Zhang Min", "Liu Yang",
  "Zhao Lei", "Sun Jing", "Zhou Jie", "Wu Lin", "Zheng Hao",
  "Feng Yan", "Zhu Tao", "Xu Mei", "He Jun", "Gao Xue",
  "Lin Wen", "Huang Wei", "Ma Li", "Luo Bin", "Liang Chen",
  "Song Yu", "Tang Hui", "Cao Ping", "Deng Kai", "Peng Rui",
  "Xiao Han", "Jiang Bo", "Cai Yun", "Pan Qi", "Yuan Fei",
  "Guo Ning", "Shi Lei", "Qin Yue", "Du Wei", "Jiang Lin",
  "Fan Tao", "Ye Ting", "Cheng Hao", "Ren Jie", "Mo Lan",
];

function pax(i: number, bookingId: string): Passenger {
  const name = NAMES[i] || `Traveler ${i + 1}`;
  const issues = i === 7 || i === 19 || i === 33;
  return {
    id: `pax-${String(i + 1).padStart(2, "0")}`,
    departureId: DEMO_DEP_ID,
    bookingId,
    name,
    namePassport: i === 19 ? "LUO BIN" : name.toUpperCase(),
    type: i === 14 || i === 28 ? "child" : "adult",
    passport: issues && i === 7 ? undefined : `E${490000 + i}`,
    roomPref: i % 17 === 0 ? "single" : "twin",
    diet: i === 11 ? "vegetarian" : i === 22 ? "no pork" : "none",
    emergency: "+86 138 0000 " + String(i).padStart(4, "0"),
    visaStatus: "ok",
    insurance: i !== 33,
    docsReady: !issues,
    ticketStatus: "listed",
  };
}

const product: TourProduct = {
  id: DEMO_PRD_ID,
  code: "TR24-TH-IN-1101",
  title: z("เชียงใหม่ เชียงราย สามเหลี่ยมทองคำ ไม่ลงร้าน", "Chiang Mai, Chiang Rai & Golden Triangle — no shopping", "清迈清莱金三角纯玩无购物", "Чиангмай, Чианграй и Золотой треугольник — без магазинов"),
  kind: "inbound",
  days: 6,
  nights: 5,
  destination: z("ไทย · เชียงใหม่ · เชียงราย · สามเหลี่ยมทองคำ", "Thailand · Chiang Mai · Chiang Rai · Golden Triangle", "泰国 · 清迈 · 清莱 · 金三角", "Таиланд · Чиангмай · Чианграй · Золотой треугольник"),
  minPax: 30,
  capacity: 48,
  marginTarget: 18,
  marketplacePkgId: "th01",
  itinerary: [
    { d: 1, title: z("ถึงเชียงใหม่ – ดอยสุเทพ", "Arrive Chiang Mai – Doi Suthep"), body: z("รับ CZ3051 ที่ CNX ขึ้นดอยสุเทพ พักกลางเมือง", "Meet CZ3051 at CNX, Doi Suthep, old-city hotel."), start: "07:10", end: "18:00" },
    { d: 2, title: z("เชียงใหม่เมืองเก่า – วันอิสระ", "Old city – free afternoon"), body: z("วัดเจดีย์หลวง ถนนคนเดิน บ่ายนิมมาน", "Wat Chedi Luang and walking street; free afternoon in Nimman."), start: "08:30", end: "18:00" },
    { d: 3, title: z("เชียงใหม่ – เชียงราย วัดร่องขุ่น", "Chiang Mai – Chiang Rai White Temple"), body: z("รถประมาณ 3 ชั่วโมง วัดร่องขุ่น ไม่แวะร้าน", "About 3 hours by coach, Wat Rong Khun, no shop stop."), start: "08:00", end: "18:00" },
    { d: 4, title: z("สามเหลี่ยมทองคำ – แม่โขง", "Golden Triangle – Mekong"), body: z("เชียงแสน จุดไทย-ลาว-เมียนมา ล่องแม่โขง พิพิธภัณฑ์ฝิ่น", "Chiang Saen, Thailand–Laos–Myanmar viewpoint, Mekong boat, Hall of Opium."), start: "08:00", end: "17:30" },
    { d: 5, title: z("วัดร่องเสือเต้น – บ้านดำ", "Blue Temple – Black House"), body: z("วัดร่องเสือเต้นและบ้านดำ บ่ายอิสระเชียงราย", "Wat Rong Suea Ten and Baan Dam, free afternoon in Chiang Rai."), start: "08:30", end: "18:00" },
    { d: 6, title: z("ส่งสนามบินเชียงใหม่", "Transfer to CNX"), body: z("รถกลับเชียงใหม่ ส่ง CZ3052", "Return coach to Chiang Mai and CZ3052 drop-off."), start: "07:00", end: "12:40" },
  ],
};

const departure: Departure = {
  id: DEMO_DEP_ID,
  productId: DEMO_PRD_ID,
  dateStart: "2026-10-12",
  dateEnd: "2026-10-17",
  status: "guaranteed",
  cutoff: "2026-09-28T17:00:00+07:00",
  timezone: "Asia/Bangkok",
  paxTarget: 40,
  capacity: 48,
  channelAllocations: [
    { channel: "group", seats: 40, sold: 40, commission: 0 },
    { channel: "marketplace", seats: 4, sold: 0, commission: 8 },
    { channel: "agent-direct", seats: 4, sold: 0, commission: 1.5 },
  ],
};

const customers: Customer[] = [
  { id: DEMO_CUS_ID, name: z("กวางโจว หนานฟาง ทราเวล", "Guangzhou Nanfang Travel"), type: "corporate", company: z("หนานฟาง ทราเวล", "Nanfang Travel"), contact: "Lin Wen", email: "lin.wen@nanfang.example" },
  { id: "cus-walk", name: z("ลูกค้าตลาด TOUR24", "TOUR24 marketplace guest"), type: "individual", contact: "—", email: "—" },
];

const enquiries: Enquiry[] = [
  {
    id: DEMO_ENQ_ID,
    channel: "group",
    customerId: DEMO_CUS_ID,
    title: z("อินบาวด์ 40 คน สามเหลี่ยมทองคำ ต.ค. 2026", "Inbound 40 pax Golden Triangle Oct 2026"),
    brief: z("กรุ๊ปจีน 40 คน ไกด์จีน เชียงใหม่ เชียงราย เชียงแสน แม่โขง ไม่ลงร้าน งบไม่เกิน 24,000 ต่อคน รวมไฟลต์กลุ่มเข้า CNX", "Chinese group of 40, Chinese guide, Chiang Mai / Chiang Rai / Chiang Saen / Mekong, no shops, all-in budget ฿24,000 including group air into CNX."),
    pax: 40,
    budget: 24000,
    dest: "Thailand",
    stage: "won",
    owner: "Inbound desk",
    created: "2026-08-02T09:10:00+07:00",
    followUp: "2026-08-04T14:00:00+07:00",
    departureId: DEMO_DEP_ID,
  },
  {
    id: "enq-inb-16",
    channel: "marketplace",
    customerId: "cus-walk",
    title: z("อินบาวด์เชียงใหม่ กลุ่มจีน 16 คน", "Inbound Chiang Mai Chinese group 16"),
    brief: z("ต้องการไกด์จีน วัดร่องขุ่น สามเหลี่ยมทองคำ ไม่ลงร้าน", "Chinese guide, White Temple, Golden Triangle, no shops."),
    pax: 16,
    budget: 21900,
    dest: "Thailand",
    stage: "briefed",
    owner: "Inbound desk",
    created: "2026-09-08T11:20:00+07:00",
    followUp: "2026-09-11T10:00:00+07:00",
  },
];

const booking: Booking = {
  id: DEMO_BOOK_ID,
  ref: "T24-OS-GT40",
  departureId: DEMO_DEP_ID,
  customerId: DEMO_CUS_ID,
  channel: "group",
  paxIds: NAMES.map((_, i) => `pax-${String(i + 1).padStart(2, "0")}`),
  state: "confirmed",
  deposit: 384000,
  balance: 576000,
  total: 960000,
};

const suppliers: Supplier[] = [
  { id: "sup-cz", name: z("ไชน่าเซาเทิร์น / คอนโซลิเดเตอร์", "China Southern consolidator"), kind: "consolidator", terms: z("มัดจำที่นั่ง 30% ปล่อย 21 วัน ยื่นชื่อ 14 วัน", "30% seat deposit, release T-21, names T-14"), rating: 92, currency: "THB" },
  { id: "sup-mer-cnx", name: z("Le Meridien Chiang Mai", "Le Meridien Chiang Mai"), kind: "hotel", terms: z("ปล่อยห้อง T-14 คืน 1 คืนฟรีทุก 16", "Release T-14, 1 complimentary per 16"), rating: 93, currency: "THB" },
  { id: "sup-mer-cei", name: z("Le Meridien Chiang Rai", "Le Meridien Chiang Rai"), kind: "hotel", terms: z("ปล่อยห้อง T-10", "Release T-10"), rating: 91, currency: "THB" },
  { id: "sup-bus", name: z("รถเช่าเหนือ", "North Thailand coach hire"), kind: "bus", terms: z("ล่วงเวลา ฿800/ชม. ที่จอด ฿600", "Overtime ฿800/hr, parking ฿600"), rating: 88, currency: "THB" },
  { id: "sup-meal", name: z("ร้านกลุ่มนิมมาน", "Nimman group table"), kind: "meal", terms: z("ยืนยันหัว 48 ชม. อาหารไกด์ฟรี 2 ที่", "Headcount T-48h, 2 complimentary guide meals"), rating: 85, currency: "THB" },
  { id: "sup-doi", name: z("ดอยสุเทพ / ตั๋วกลุ่ม", "Doi Suthep group tickets"), kind: "activity", terms: z("สล็อต 10:30 ความจุ 50 ยกเลิก T-24h", "10:30 slot, cap 50, cancel T-24h"), rating: 90, currency: "THB" },
  { id: "sup-guide", name: z("ไกด์จีนเหนือ — หมิง", "Chinese-speaking North guide Ming"), kind: "guide", terms: z("ค่าวัน ฿5,500 ล่วงเวลาหลัง 20:00", "Day fee ฿5,500, OT after 20:00"), rating: 94, currency: "THB" },
];

function svc(partial: ServiceLine): ServiceLine {
  return partial;
}

const services: ServiceLine[] = [
  svc({ id: "svc-fl-in", departureId: DEMO_DEP_ID, module: "flight", supplierId: "sup-cz", name: z("บล็อกที่นั่ง CZ3051 CAN–CNX", "Seat block CZ3051 CAN–CNX"), qty: 40, unitCost: 6200, unitSell: 7500, currency: "THB", rateClass: "held", state: "held", holdExpiry: "2026-09-21T17:00:00+07:00", deadline: "2026-09-28T12:00:00+07:00", source: "Consolidator quote Q-CZ-1101", updatedAt: "2026-09-04T16:10:00+07:00", notes: z("มัดจำ 30% ชำระแล้ว", "30% deposit paid") }),
  svc({ id: "svc-fl-out", departureId: DEMO_DEP_ID, module: "flight", supplierId: "sup-cz", name: z("บล็อกที่นั่ง CZ3052 CNX–CAN", "Seat block CZ3052 CNX–CAN"), qty: 40, unitCost: 6200, unitSell: 7500, currency: "THB", rateClass: "held", state: "held", holdExpiry: "2026-09-21T17:00:00+07:00", deadline: "2026-09-28T12:00:00+07:00", source: "Consolidator quote Q-CZ-1101", updatedAt: "2026-09-04T16:10:00+07:00" }),
  svc({ id: "svc-ht-cnx", departureId: DEMO_DEP_ID, module: "hotel", supplierId: "sup-mer-cnx", name: z("Le Meridien Chiang Mai 2 คืน", "Le Meridien Chiang Mai 2 nights"), qty: 21, unitCost: 3600, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", deadline: "2026-09-28T17:00:00+07:00", source: "Contract rate 2026 inbound", updatedAt: "2026-09-05T11:00:00+07:00", day: 1 }),
  svc({ id: "svc-ht-cei", departureId: DEMO_DEP_ID, module: "hotel", supplierId: "sup-mer-cei", name: z("Le Meridien Chiang Rai 3 คืน", "Le Meridien Chiang Rai 3 nights"), qty: 21, unitCost: 4800, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", deadline: "2026-10-02T17:00:00+07:00", source: "Email offer 5 Sep", updatedAt: "2026-09-05T14:20:00+07:00", day: 3 }),
  svc({ id: "svc-bus", departureId: DEMO_DEP_ID, module: "bus", supplierId: "sup-bus", name: z("รถโค้ช 45 ที่ 2 คัน", "Two 45-seat coaches"), qty: 2, unitCost: 18000, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", source: "North ground operator rate card", updatedAt: "2026-09-03T09:40:00+07:00" }),
  svc({ id: "svc-meal-d2", departureId: DEMO_DEP_ID, module: "meal", supplierId: "sup-meal", name: z("อาหารกลางวันนิมมาน วันที่ 2", "Nimman lunch day 2"), qty: 40, unitCost: 420, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", deadline: "2026-10-11T12:00:00+07:00", source: "Menu PDF 2026", updatedAt: "2026-09-06T10:00:00+07:00", day: 2 }),
  svc({ id: "svc-doi", departureId: DEMO_DEP_ID, module: "activity", supplierId: "sup-doi", name: z("ดอยสุเทพ สล็อต 10:30", "Doi Suthep 10:30 slot"), qty: 40, unitCost: 350, unitSell: 0, currency: "THB", rateClass: "held", state: "held", holdExpiry: "2026-10-11T10:00:00+07:00", source: "Attraction allotment", updatedAt: "2026-09-06T15:00:00+07:00", day: 1 }),
  svc({ id: "svc-gd", departureId: DEMO_DEP_ID, module: "guide", supplierId: "sup-guide", name: z("หัวหน้าทัวร์ + ไกด์จีน", "Tour leader + Chinese-speaking guide"), qty: 6, unitCost: 5500, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", source: "Guide roster", updatedAt: "2026-09-02T18:00:00+07:00" }),
];

const flights: FlightBlock[] = [
  { id: "fl-in", serviceId: "svc-fl-in", airline: "CZ", flightNo: "CZ3051", from: "CAN", to: "CNX", departAt: "2026-10-12T04:40:00+08:00", arriveAt: "2026-10-12T07:10:00+07:00", seats: 40, sold: 40, deposit: 148800, releaseAt: "2026-09-21T17:00:00+07:00", namesDue: "2026-09-28T12:00:00+07:00", ticketBy: "2026-10-05T17:00:00+07:00", pnr: "OS4GTX", timezone: "Asia/Bangkok" },
  { id: "fl-out", serviceId: "svc-fl-out", airline: "CZ", flightNo: "CZ3052", from: "CNX", to: "CAN", departAt: "2026-10-17T12:40:00+07:00", arriveAt: "2026-10-17T16:20:00+08:00", seats: 40, sold: 40, deposit: 148800, releaseAt: "2026-09-21T17:00:00+07:00", namesDue: "2026-09-28T12:00:00+07:00", ticketBy: "2026-10-05T17:00:00+07:00", pnr: "OS4GTY", timezone: "Asia/Bangkok" },
];

const vehicles: VehicleAssign[] = [
  { id: "veh-1", serviceId: "svc-bus", plate: "ชม 4501", owned: false, seats: 45, luggage: 45, driver: "Somsak Inthanon", pickup: z("CNX T1 07:30", "CNX T1 07:30") },
  { id: "veh-2", serviceId: "svc-bus", plate: "ชม 4502", owned: false, seats: 45, luggage: 45, driver: "Prasert Mae", pickup: z("CNX T1 07:30", "CNX T1 07:30") },
];

const hotels: HotelAllotment[] = [
  { id: "ht-cnx", serviceId: "svc-ht-cnx", hotel: z("Le Meridien Chiang Mai", "Le Meridien Chiang Mai"), city: z("เชียงใหม่", "Chiang Mai"), nights: 2, twins: 18, singles: 3, comps: 1, releaseAt: "2026-09-28T17:00:00+07:00" },
  { id: "ht-cei", serviceId: "svc-ht-cei", hotel: z("Le Meridien Chiang Rai", "Le Meridien Chiang Rai"), city: z("เชียงราย", "Chiang Rai"), nights: 3, twins: 18, singles: 3, comps: 1, releaseAt: "2026-10-02T17:00:00+07:00" },
];

const meals: MealService[] = [
  { id: "ml-d2", serviceId: "svc-meal-d2", venue: z("ร้านกลุ่มนิมมาน", "Nimman group table"), meal: "L", day: 2, time: "12:15", capacity: 48, dietNotes: z("มังสวิรัติ 1 · ไม่ทานหมู 1 · อาหารไกด์ 2 ที่", "1 vegetarian · 1 no pork · 2 guide meals") },
];

const activities: ActivityService[] = [
  { id: "act-doi", serviceId: "svc-doi", name: z("ดอยสุเทพ", "Doi Suthep"), slot: "10:30", capacity: 50, voucher: "DOI-OS-GT40", redeemed: 0 },
];

const guides: GuideAssign[] = [
  { id: "gd-1", serviceId: "svc-gd", name: z("คุณเดือน หัวหน้าทัวร์", "Duean, tour leader"), role: "leader", langs: ["th", "en", "zh"], fee: 4500, phone: "+66 89 111 2401" },
  { id: "gd-2", serviceId: "svc-gd", name: z("หมิง ไกด์จีน", "Ming, Chinese-speaking guide"), role: "local", langs: ["zh", "th", "en"], fee: 5500, phone: "+66 81 240 1102" },
];

const quotes: QuoteVersion[] = [
  { id: "q-v1", enquiryId: DEMO_ENQ_ID, label: z("ร่างต้นทุนแรก", "First cost draft"), pax: 40, sell: 960000, cost: 810000, margin: 15.6, assumptions: [z("ที่นั่งกลุ่ม CAN–CNX", "CAN–CNX group fare"), z("โรงแรมระบุชื่อ", "Named hotels")], created: "2026-08-03T16:00:00+07:00" },
  { id: "q-v2", enquiryId: DEMO_ENQ_ID, label: z("ฉบับที่ยื่นลูกค้า", "Client proposal"), pax: 40, sell: 960000, cost: 773000, margin: 19.5, assumptions: [z("ตัดร้านช้อป", "No shopping stops"), z("มื้อกลางวันกลุ่มวันที่ 2", "Group lunch day 2")], created: "2026-08-04T11:30:00+07:00" },
];

const tasks: OsTask[] = [
  { id: "tk-names", departureId: DEMO_DEP_ID, title: z("ยื่นรายชื่อผู้โดยสารให้สายการบิน", "Submit passenger name list to airline"), owner: "Ops — flights", due: "2026-09-28T12:00:00+07:00", tz: "Asia/Bangkok", module: "flight", done: false },
  { id: "tk-room", departureId: DEMO_DEP_ID, title: z("ล็อกห้องเชียงใหม่และเชียงราย", "Confirm Chiang Mai and Chiang Rai rooms"), owner: "Ops — hotels", due: "2026-09-28T17:00:00+07:00", tz: "Asia/Bangkok", module: "hotel", done: false },
  { id: "tk-pass", departureId: DEMO_DEP_ID, title: z("ตามพาสปอร์ตที่ขาด 3 ราย", "Chase 3 missing passports"), owner: "Docs", due: "2026-09-20T17:00:00+07:00", tz: "Asia/Bangkok", module: "docs", done: false },
  { id: "tk-bal", departureId: DEMO_DEP_ID, title: z("เรียกเก็บยอดคงเหลือลูกค้า", "Collect customer balance"), owner: "Finance", due: "2026-09-12T17:00:00+07:00", tz: "Asia/Bangkok", module: "finance", done: false },
  { id: "tk-meal", departureId: DEMO_DEP_ID, title: z("ยืนยันหัวอาหารนิมมาน", "Confirm Nimman lunch headcount"), owner: "Ops — meals", due: "2026-10-11T12:00:00+07:00", tz: "Asia/Bangkok", module: "meal", done: false },
];

const ledger: LedgerLine[] = [
  { id: "ld-dep", departureId: DEMO_DEP_ID, side: "in", label: z("มัดจำลูกค้า 40%", "Customer deposit 40%"), amount: 384000, due: "2026-08-15", status: "received" },
  { id: "ld-bal", departureId: DEMO_DEP_ID, side: "in", label: z("ยอดคงเหลือลูกค้า", "Customer balance"), amount: 576000, due: "2026-09-12", status: "expected" },
  { id: "ld-cz", departureId: DEMO_DEP_ID, side: "out", label: z("มัดจำที่นั่งไชน่าเซาเทิร์น", "CZ seat-block deposit"), amount: 148800, due: "2026-08-20", status: "paid" },
  { id: "ld-cz2", departureId: DEMO_DEP_ID, side: "out", label: z("ส่วนที่เหลือตั๋วเครื่องบิน", "Air ticket balance"), amount: 347200, due: "2026-10-05", status: "expected" },
  { id: "ld-ht", departureId: DEMO_DEP_ID, side: "out", label: z("โรงแรมเชียงใหม่+เชียงราย", "Chiang Mai + Chiang Rai hotels"), amount: 176400, due: "2026-10-01", status: "expected" },
  { id: "ld-bus", departureId: DEMO_DEP_ID, side: "out", label: z("รถโค้ช", "Coaches"), amount: 36000, due: "2026-10-08", status: "expected" },
];

export function createSeed(): OsSnapshot {
  return {
    products: [product],
    departures: [departure],
    customers,
    enquiries,
    bookings: [booking],
    passengers: NAMES.map((_, i) => pax(i, DEMO_BOOK_ID)),
    services,
    flights,
    vehicles,
    hotels,
    meals,
    activities,
    guides,
    suppliers,
    tasks,
    incidents: [],
    quotes,
    approvals: [],
    impacts: [],
    drafts: [],
    ledger,
    demoStage: "allocated",
    log: [
      { at: "2026-08-02T09:10:00+07:00", text: z("รับงานจากหนานฟาง 40 คน อินบาวด์สามเหลี่ยมทองคำ", "Enquiry received: Nanfang Travel, 40 pax inbound Golden Triangle") },
      { at: "2026-08-04T11:30:00+07:00", text: z("ยื่นใบเสนอราคาฉบับที่ 2 ยอมรับแล้ว", "Quote v2 accepted") },
      { at: "2026-09-04T16:10:00+07:00", text: z("ถือที่นั่ง CZ 40 ที่ PNR OS4GTX/Y", "Held CZ 40 seats, PNR OS4GTX/Y") },
    ],
  };
}

export const EXTRA_PAX_NAMES = ["Wang Extra", "Li Extra", "Chen Extra", "Liu Extra", "Zhang Extra"];
