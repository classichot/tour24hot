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

const NAMES = [
  "Thanakrit Prasert", "Nicha Wongsa", "Somchai Thongdee", "Piyawan Kaew", "Arunee Srisuk",
  "Kittipong Saetang", "Wanida Rattanapong", "Nattapong Meechai", "Siriporn Jantar", "Anan Boonmee",
  "Chalita Phan", "Preecha Sook", "Malee Chaiyasit", "Yodchai Rung", "Kannika Phet",
  "Somsak Na Ayutthaya", "Jintana Kiat", "Prasert Wichai", "Uraiwan Dee", "Boonlert Mok",
  "Patcharee Lim", "Wichai Ton", "Narumon Sri", "Apichat Boon", "Duangjai Pet",
  "Suthep Kan", "Orn-anong Vila", "Chaiwat Song", "Pimchanok Rueang", "Manit Kosa",
  "Rattana Yim", "Thawatchai Pon", "Kanya Sombat", "Niran Jit", "Suda Phon",
  "Wichian Rak", "Pornthip Sae", "Anuwat Klin", "Mayuree Chan", "Santi Vong",
];

function pax(i: number, bookingId: string): Passenger {
  const name = NAMES[i] || `Traveler ${i + 1}`;
  const issues = i === 7 || i === 19 || i === 33;
  return {
    id: `pax-${String(i + 1).padStart(2, "0")}`,
    departureId: "dep-jp40",
    bookingId,
    name,
    namePassport: i === 19 ? "NATTAPONG MEECHAI" : name.toUpperCase(),
    type: i === 14 || i === 28 ? "child" : "adult",
    passport: issues && i === 7 ? undefined : `AA${490000 + i}`,
    roomPref: i % 17 === 0 ? "single" : "twin",
    diet: i === 11 ? "vegetarian" : i === 22 ? "no pork" : "none",
    emergency: "+66 81 000 00" + String(i).padStart(2, "0"),
    visaStatus: "na",
    insurance: i !== 33,
    docsReady: !issues,
    ticketStatus: "listed",
  };
}

const product: TourProduct = {
  id: "prd-jp40",
  code: "TR24-OS-JP-40",
  title: z("โตเกียว ฟูจิ คาวาโกเอะ กลุ่มบริษัท 5 วัน", "Tokyo Fuji Kawagoe — corporate group 5 days", "东京富士川越企业团5日", "Токио Фудзи Кавагоэ — корпоративная группа 5 дней"),
  kind: "corporate",
  days: 5,
  nights: 4,
  destination: z("ญี่ปุ่น · โตเกียว · ฟูจิ", "Japan · Tokyo · Fuji", "日本 · 东京 · 富士", "Япония · Токио · Фудзи"),
  minPax: 30,
  capacity: 48,
  marginTarget: 18,
  marketplacePkgId: "jp01",
  itinerary: [
    { d: 1, title: z("สุวรรณภูมิ – ฮาเนดะ", "Suvarnabhumi – Haneda"), body: z("บินดึก ถึงเช้า เข้าโรงแรมชินากาว่า", "Overnight flight, morning arrival, Shinagawa hotel."), start: "22:30", end: "06:55" },
    { d: 2, title: z("อาซากุสะ – สกายทรี – ชินจูกุ", "Asakusa – Skytree – Shinjuku"), body: z("วัดเช้า ถ่ายรูปสกายทรี บ่ายอิสระ", "Morning temple, Skytree photo stop, free afternoon."), start: "08:30", end: "18:00" },
    { d: 3, title: z("ฟูจิชั้น 5 – โอชิโนะฮักไก", "Fuji 5th station – Oshino Hakkai"), body: z("ขึ้นเขาตามอากาศ พักทะเลสาบ", "Mountain morning, lakeside stay."), start: "07:00", end: "19:00" },
    { d: 4, title: z("คาวาโกเอะ – วันอิสระโตเกียว", "Kawagoe – Tokyo free day"), body: z("เมืองเก่าเช้า บ่ายอิสระ", "Old town morning, free afternoon."), start: "08:00", end: "18:00" },
    { d: 5, title: z("ฮาเนดะ – สุวรรณภูมิ", "Haneda – Suvarnabhumi"), body: z("เช็กอินบ่าย บินเย็น", "Afternoon check-in, evening flight."), start: "13:00", end: "23:40" },
  ],
};

const departure: Departure = {
  id: "dep-jp40",
  productId: "prd-jp40",
  dateStart: "2026-10-12",
  dateEnd: "2026-10-16",
  status: "guaranteed",
  cutoff: "2026-09-28T17:00:00+07:00",
  timezone: "Asia/Bangkok",
  paxTarget: 40,
  capacity: 48,
  channelAllocations: [
    { channel: "crm", seats: 40, sold: 40, commission: 0 },
    { channel: "marketplace", seats: 4, sold: 0, commission: 8 },
    { channel: "agent-direct", seats: 4, sold: 0, commission: 1.5 },
  ],
};

const customers: Customer[] = [
  { id: "cus-siam-e", name: z("บริษัท สยามอิเล็กทรอนิกส์ จำกัด", "Siam Electronics Co., Ltd."), type: "corporate", company: z("สยามอิเล็กทรอนิกส์", "Siam Electronics"), contact: "Khun Monthira", email: "monthira@siamelec.example" },
  { id: "cus-walk", name: z("ลูกค้าตลาด TOUR24", "TOUR24 marketplace guest"), type: "individual", contact: "—", email: "—" },
];

const enquiries: Enquiry[] = [
  {
    id: "enq-40",
    channel: "crm",
    customerId: "cus-siam-e",
    title: z("ทัวร์บริษัท 40 คน โตเกียว ต.ค. 2026", "Corporate 40 pax Tokyo Oct 2026"),
    brief: z("กลุ่มพนักงาน 40 คน บินตรง โรงแรมมีชื่อ ไม่ลงร้านช้อป งบไม่เกิน 38,000 ต่อคน รวมทุกอย่าง", "40 staff, direct flight, named hotels, no shopping stops, all-in budget ฿38,000 per person."),
    pax: 40,
    budget: 38000,
    dest: "Japan",
    stage: "won",
    owner: "Mira Sales",
    created: "2026-08-02T09:10:00+07:00",
    followUp: "2026-08-04T14:00:00+07:00",
    departureId: "dep-jp40",
  },
  {
    id: "enq-inb",
    channel: "marketplace",
    customerId: "cus-walk",
    title: z(" inbound เชียงใหม่ กลุ่มจีน 16 คน", "Inbound Chiang Mai Chinese group 16"),
    brief: z("ต้องการไกด์จีน วัดร่องขุ่น สามเหลี่ยมทองคำ ไม่ลงร้าน", "Chinese guide, White Temple, Golden Triangle, no shops."),
    pax: 16,
    budget: 24000,
    dest: "Thailand",
    stage: "briefed",
    owner: "Inbound desk",
    created: "2026-09-08T11:20:00+07:00",
    followUp: "2026-09-11T10:00:00+07:00",
  },
];

const booking: Booking = {
  id: "bk-40",
  ref: "T24-OS-4012",
  departureId: "dep-jp40",
  customerId: "cus-siam-e",
  channel: "crm",
  paxIds: NAMES.map((_, i) => `pax-${String(i + 1).padStart(2, "0")}`),
  state: "confirmed",
  deposit: 608000,
  balance: 912000,
  total: 1520000,
};

const suppliers: Supplier[] = [
  { id: "sup-tg", name: z("การบินไทย / คอนโซลิเดเตอร์", "Thai Airways consolidator"), kind: "consolidator", terms: z("มัดจำที่นั่ง 30% ปล่อย 21 วัน ยื่นชื่อ 14 วัน", "30% seat deposit, release T-21, names T-14"), rating: 94, currency: "THB" },
  { id: "sup-shin", name: z("Shinagawa Prince Hotel", "Shinagawa Prince Hotel"), kind: "hotel", terms: z("ปล่อยห้อง T-14 คืน 1 คืนฟรีทุก 16", "Release T-14, 1 complimentary per 16"), rating: 91, currency: "THB" },
  { id: "sup-fuji", name: z("Fuji Lake Hotel", "Fuji Lake Hotel"), kind: "hotel", terms: z("ปล่อยห้อง T-10", "Release T-10"), rating: 88, currency: "THB" },
  { id: "sup-bus", name: z("โตเกียวโค้ชเช่า", "Tokyo hired coach"), kind: "bus", terms: z("ล่วงเวลา ฿1,200/ชม. ที่จอด ฿800", "Overtime ฿1,200/hr, parking ฿800"), rating: 86, currency: "THB" },
  { id: "sup-meal", name: z("อาซากุสะ เทเบิล", "Asakusa Table"), kind: "meal", terms: z("ยืนยันหัว 48 ชม. อาหารไกด์ฟรี 2 ที่", "Headcount T-48h, 2 complimentary guide meals"), rating: 84, currency: "THB" },
  { id: "sup-sky", name: z("โตเกียวสกายทรี", "Tokyo Skytree"), kind: "activity", terms: z("สล็อต 10:30 ความจุ 50 ยกเลิก T-24h", "10:30 slot, cap 50, cancel T-24h"), rating: 90, currency: "THB" },
  { id: "sup-guide", name: z("ไกด์ท้องถิ่นโทโกะ", "Local guide Toko"), kind: "guide", terms: z("ค่าวัน ฿6,500 ล่วงเวลาหลัง 20:00", "Day fee ฿6,500, OT after 20:00"), rating: 95, currency: "THB" },
];

function svc(partial: ServiceLine): ServiceLine {
  return partial;
}

const services: ServiceLine[] = [
  svc({ id: "svc-fl-out", departureId: "dep-jp40", module: "flight", supplierId: "sup-tg", name: z("บล็อกที่นั่ง TG660 BKK–HND", "Seat block TG660 BKK–HND"), qty: 40, unitCost: 12500, unitSell: 14800, currency: "THB", rateClass: "held", state: "held", holdExpiry: "2026-09-21T17:00:00+07:00", deadline: "2026-09-28T12:00:00+07:00", source: "Consolidator quote Q-TG-8841", updatedAt: "2026-09-04T16:10:00+07:00", notes: z("มัดจำ 30% ชำระแล้ว", "30% deposit paid") }),
  svc({ id: "svc-fl-in", departureId: "dep-jp40", module: "flight", supplierId: "sup-tg", name: z("บล็อกที่นั่ง TG661 HND–BKK", "Seat block TG661 HND–BKK"), qty: 40, unitCost: 12500, unitSell: 14800, currency: "THB", rateClass: "held", state: "held", holdExpiry: "2026-09-21T17:00:00+07:00", deadline: "2026-09-28T12:00:00+07:00", source: "Consolidator quote Q-TG-8841", updatedAt: "2026-09-04T16:10:00+07:00" }),
  svc({ id: "svc-ht-tyo", departureId: "dep-jp40", module: "hotel", supplierId: "sup-shin", name: z("Shinagawa Prince 3 คืน", "Shinagawa Prince 3 nights"), qty: 21, unitCost: 4200, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", deadline: "2026-09-28T17:00:00+09:00", source: "Contract rate 2026 corporate", updatedAt: "2026-09-05T11:00:00+07:00", day: 1 }),
  svc({ id: "svc-ht-fuji", departureId: "dep-jp40", module: "hotel", supplierId: "sup-fuji", name: z("Fuji Lake Hotel 1 คืน", "Fuji Lake Hotel 1 night"), qty: 21, unitCost: 5100, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", deadline: "2026-10-02T17:00:00+09:00", source: "Email offer 5 Sep", updatedAt: "2026-09-05T14:20:00+07:00", day: 3 }),
  svc({ id: "svc-bus", departureId: "dep-jp40", module: "bus", supplierId: "sup-bus", name: z("รถโค้ช 45 ที่ 2 คัน", "Two 45-seat coaches"), qty: 2, unitCost: 28000, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", source: "Ground operator rate card", updatedAt: "2026-09-03T09:40:00+07:00" }),
  svc({ id: "svc-meal-d2", departureId: "dep-jp40", module: "meal", supplierId: "sup-meal", name: z("อาหารกลางวันอาซากุสะ วันที่ 2", "Asakusa lunch day 2"), qty: 40, unitCost: 650, unitSell: 0, currency: "THB", rateClass: "indicative", state: "requested", deadline: "2026-10-10T12:00:00+09:00", source: "Menu PDF 2026", updatedAt: "2026-09-06T10:00:00+07:00", day: 2 }),
  svc({ id: "svc-sky", departureId: "dep-jp40", module: "activity", supplierId: "sup-sky", name: z("สกายทรี สล็อต 10:30", "Skytree 10:30 slot"), qty: 40, unitCost: 900, unitSell: 0, currency: "THB", rateClass: "held", state: "held", holdExpiry: "2026-10-11T10:00:00+09:00", source: "Attraction allotment", updatedAt: "2026-09-06T15:00:00+07:00", day: 2 }),
  svc({ id: "svc-gd", departureId: "dep-jp40", module: "guide", supplierId: "sup-guide", name: z("หัวหน้าทัวร์ + ไกด์ท้องถิ่น", "Tour leader + local guide"), qty: 5, unitCost: 6500, unitSell: 0, currency: "THB", rateClass: "quoted", state: "quoted", source: "Guide roster", updatedAt: "2026-09-02T18:00:00+07:00" }),
];

const flights: FlightBlock[] = [
  { id: "fl-out", serviceId: "svc-fl-out", airline: "TG", flightNo: "TG660", from: "BKK", to: "HND", departAt: "2026-10-12T22:30:00+07:00", arriveAt: "2026-10-13T06:55:00+09:00", seats: 40, sold: 40, deposit: 150000, releaseAt: "2026-09-21T17:00:00+07:00", namesDue: "2026-09-28T12:00:00+07:00", ticketBy: "2026-10-05T17:00:00+07:00", pnr: "OS4JPX", timezone: "Asia/Bangkok" },
  { id: "fl-in", serviceId: "svc-fl-in", airline: "TG", flightNo: "TG661", from: "HND", to: "BKK", departAt: "2026-10-16T17:10:00+09:00", arriveAt: "2026-10-16T23:40:00+07:00", seats: 40, sold: 40, deposit: 150000, releaseAt: "2026-09-21T17:00:00+07:00", namesDue: "2026-09-28T12:00:00+07:00", ticketBy: "2026-10-05T17:00:00+07:00", pnr: "OS4JPY", timezone: "Asia/Tokyo" },
];

const vehicles: VehicleAssign[] = [
  { id: "veh-1", serviceId: "svc-bus", plate: "品川 500 あ 2412", owned: false, seats: 45, luggage: 45, driver: "Sato Kenji", pickup: z("ฮาเนดะ T3 07:20", "Haneda T3 07:20") },
  { id: "veh-2", serviceId: "svc-bus", plate: "品川 500 あ 2413", owned: false, seats: 45, luggage: 45, driver: "Mori Aiko", pickup: z("ฮาเนดะ T3 07:20", "Haneda T3 07:20") },
];

const hotels: HotelAllotment[] = [
  { id: "ht-tyo", serviceId: "svc-ht-tyo", hotel: z("Shinagawa Prince Hotel", "Shinagawa Prince Hotel"), city: z("โตเกียว", "Tokyo"), nights: 3, twins: 18, singles: 3, comps: 1, releaseAt: "2026-09-28T17:00:00+09:00" },
  { id: "ht-fuji", serviceId: "svc-ht-fuji", hotel: z("Fuji Lake Hotel", "Fuji Lake Hotel"), city: z("ฟูจิ", "Fuji"), nights: 1, twins: 18, singles: 3, comps: 1, releaseAt: "2026-10-02T17:00:00+09:00" },
];

const meals: MealService[] = [
  { id: "ml-d2", serviceId: "svc-meal-d2", venue: z("อาซากุสะ เทเบิล", "Asakusa Table"), meal: "L", day: 2, time: "12:15", capacity: 48, dietNotes: z("มังสวิรัติ 1 · ไม่ทานหมู 1 · อาหารไกด์ 2 ที่", "1 vegetarian · 1 no pork · 2 guide meals") },
];

const activities: ActivityService[] = [
  { id: "act-sky", serviceId: "svc-sky", name: z("โตเกียวสกายทรี", "Tokyo Skytree"), slot: "10:30", capacity: 50, voucher: "SKY-OS-4012", redeemed: 0 },
];

const guides: GuideAssign[] = [
  { id: "gd-1", serviceId: "svc-gd", name: z("คุณเดือน หัวหน้าทัวร์", "Duean, tour leader"), role: "leader", langs: ["th", "en"], fee: 4500, phone: "+66 89 111 2401" },
  { id: "gd-2", serviceId: "svc-gd", name: z("โทโกะ ไกด์ท้องถิ่น", "Toko, local guide"), role: "local", langs: ["ja", "en", "th"], fee: 6500, phone: "+81 90 2400 1102" },
];

const quotes: QuoteVersion[] = [
  { id: "q-v1", enquiryId: "enq-40", label: z("ร่างต้นทุนแรก", "First cost draft"), pax: 40, sell: 1520000, cost: 1284000, margin: 15.5, assumptions: [z("ที่นั่งกลุ่มราคาคอนโซ", "Consolidator group fare"), z("โรงแรมระบุชื่อ", "Named hotels")], created: "2026-08-03T16:00:00+07:00" },
  { id: "q-v2", enquiryId: "enq-40", label: z("ฉบับที่ยื่นลูกค้า", "Client proposal"), pax: 40, sell: 1520000, cost: 1248600, margin: 17.9, assumptions: [z("ตัดร้านช้อป", "No shopping stops"), z("มื้อกลางวันกลุ่มวันที่ 2", "Group lunch day 2")], created: "2026-08-04T11:30:00+07:00" },
];

const tasks: OsTask[] = [
  { id: "tk-names", departureId: "dep-jp40", title: z("ยื่นรายชื่อผู้โดยสารให้สายการบิน", "Submit passenger name list to airline"), owner: "Ops — flights", due: "2026-09-28T12:00:00+07:00", tz: "Asia/Bangkok", module: "flight", done: false },
  { id: "tk-room", departureId: "dep-jp40", title: z("ล็อกห้อง Shinagawa", "Confirm Shinagawa rooms"), owner: "Ops — hotels", due: "2026-09-28T17:00:00+09:00", tz: "Asia/Tokyo", module: "hotel", done: false },
  { id: "tk-pass", departureId: "dep-jp40", title: z("ตามพาสปอร์ตที่ขาด 3 ราย", "Chase 3 missing passports"), owner: "Docs", due: "2026-09-20T17:00:00+07:00", tz: "Asia/Bangkok", module: "docs", done: false },
  { id: "tk-bal", departureId: "dep-jp40", title: z("เรียกเก็บยอดคงเหลือลูกค้า", "Collect customer balance"), owner: "Finance", due: "2026-09-12T17:00:00+07:00", tz: "Asia/Bangkok", module: "finance", done: false },
  { id: "tk-meal", departureId: "dep-jp40", title: z("ยืนยันหัวอาหารอาซากุสะ", "Confirm Asakusa headcount"), owner: "Ops — meals", due: "2026-10-10T12:00:00+09:00", tz: "Asia/Tokyo", module: "meal", done: false },
];

const ledger: LedgerLine[] = [
  { id: "ld-dep", departureId: "dep-jp40", side: "in", label: z("มัดจำลูกค้า 40%", "Customer deposit 40%"), amount: 608000, due: "2026-08-15", status: "received" },
  { id: "ld-bal", departureId: "dep-jp40", side: "in", label: z("ยอดคงเหลือลูกค้า", "Customer balance"), amount: 912000, due: "2026-09-12", status: "expected" },
  { id: "ld-tg", departureId: "dep-jp40", side: "out", label: z("มัดจำที่นั่งการบินไทย", "TG seat-block deposit"), amount: 300000, due: "2026-08-20", status: "paid" },
  { id: "ld-tg2", departureId: "dep-jp40", side: "out", label: z("ส่วนที่เหลือตั๋วเครื่องบิน", "Air ticket balance"), amount: 700000, due: "2026-10-05", status: "expected" },
  { id: "ld-ht", departureId: "dep-jp40", side: "out", label: z("โรงแรมโตเกียว+ฟูจิ", "Tokyo + Fuji hotels"), amount: 195300, due: "2026-10-01", status: "expected" },
  { id: "ld-bus", departureId: "dep-jp40", side: "out", label: z("รถโค้ช", "Coaches"), amount: 56000, due: "2026-10-08", status: "expected" },
];

export function createSeed(): OsSnapshot {
  return {
    products: [product],
    departures: [departure],
    customers,
    enquiries,
    bookings: [booking],
    passengers: NAMES.map((_, i) => pax(i, "bk-40")),
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
      { at: "2026-08-02T09:10:00+07:00", text: z("รับงานจากสยามอิเล็กทรอนิกส์ 40 คน", "Enquiry received: Siam Electronics, 40 pax") },
      { at: "2026-08-04T11:30:00+07:00", text: z("ยื่นใบเสนอราคาฉบับที่ 2 ยอมรับแล้ว", "Quote v2 accepted") },
      { at: "2026-09-04T16:10:00+07:00", text: z("ถือที่นั่ง TG 40 ที่ PNR OS4JPX/Y", "Held TG 40 seats, PNR OS4JPX/Y") },
    ],
  };
}

export const DEMO_DEP_ID = "dep-jp40";
export const EXTRA_PAX_NAMES = ["Nirun Extra", "Ploy Extra", "Athit Extra", "Kwan Extra", "Bee Extra"];
