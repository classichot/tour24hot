/**
 * Control Center data, split by marketplace direction and keyed to the menu sections in lib/nav.ts.
 * Listings come from the live catalog (packages, activities, burn deals); the rest is demo ops data.
 */
import { DATA, isInbound, type L10n, type Loc } from "./data";
import { activities, KIND_PATH, realPrice, type ActivityKind } from "./activities";
import { burnDeals } from "./helpers";
import { OPS, type TrustBand } from "./ops";
import { DEMAND } from "./tap";
import { NAV, type NavDir, type NavItem, type NavKind } from "./nav";

const z = (th: string, en: string, zh?: string): L10n => ({ th, en, zh });

/* ── Listings ── */

export type ListingStatus = "live" | "pending" | "held" | "rejected";

export interface ControlListing {
  id: string;
  title: Loc;
  agency: string;
  real: number;
  flags: number;
  status: ListingStatus;
  href?: string;
  note?: L10n;
}

const PKG_STATUS: Record<string, ListingStatus> = Object.fromEntries(OPS.packages.map((p) => [p.id, p.status]));

/** Drafts waiting for moderation — not yet in the public catalog. */
const DRAFTS: Record<string, ControlListing[]> = {
  "out-tours": [
    { id: "new1", title: OPS.packages[2].title, agency: "vela", real: 52900, flags: 2, status: "pending", note: z("ร่างใหม่ ยังไม่ระบุโรงแรม 2 คืน", "New draft: two nights still without hotel names", "新草稿：两晚未写酒店名") },
  ],
  "in-tours": [
    { id: "th04", title: z("เชียงใหม่ ลอยกระทง ยี่เป็ง 5 วัน (ร่าง)", "Chiang Mai Yi Peng lantern festival 5D (draft)", "清迈水灯节天灯 5 天（草稿）"), agency: "siam", real: 26900, flags: 1, status: "pending", note: z("ต้องยืนยันใบอนุญาตปล่อยโคม", "Lantern-release permit still to confirm", "放天灯许可待确认") },
  ],
  "in-daytours": [
    { id: "dt05", title: z("เชียงใหม่–ปาย วันเดียว (ร่าง)", "Chiang Mai to Pai in a day (draft)", "清迈—拜县一日游（草稿）"), agency: "nakara", real: 1890, flags: 1, status: "pending", note: z("ทางโค้ง 762 โค้ง ยังไม่มีคำเตือนเมารถ", "762 curves, no motion-sickness warning yet", "762 道弯，尚无晕车提示") },
  ],
  "in-excursions": [
    { id: "ex05", title: z("ซิปไลน์กลางป่า แม่ริม (ร่าง)", "Jungle zipline, Mae Rim (draft)", "湄林丛林滑索（草稿）"), agency: "bkkjet", real: 2400, flags: 1, status: "pending", note: z("ยังไม่ส่งใบประกันอุบัติเหตุ", "Accident insurance certificate not uploaded", "未上传意外险证明") },
  ],
  "in-attractions": [
    { id: "at05", title: z("พิพิธภัณฑ์พื้นถิ่นล้านนา (ร่าง)", "Lanna Folklife Museum entry (draft)", "兰纳民俗博物馆门票（草稿）"), agency: "siam", real: 180, flags: 0, status: "pending" },
  ],
};

function packageListings(dir: NavDir): ControlListing[] {
  return DATA.packages
    .filter((p) => isInbound(p) === (dir === "inbound"))
    .map((p) => ({
      id: p.id,
      title: p.title,
      agency: p.agency,
      real: p.real,
      flags: p.truth.length,
      status: PKG_STATUS[p.id] ?? "live",
      href: `/packages/${p.id}`,
    }));
}

function activityListings(kind: ActivityKind): ControlListing[] {
  return activities
    .filter((a) => a.kind === kind)
    .map((a) => ({
      id: a.id,
      title: a.title,
      agency: a.agency,
      real: realPrice(a),
      flags: a.warn?.length ?? 0,
      status: "live" as const,
      href: `${KIND_PATH[a.kind]}/${a.id}`,
      note: a.shopping ? z(`แวะร้าน ${a.shopping} จุด`, `${a.shopping} shop stops`, `${a.shopping} 个购物点`) : undefined,
    }));
}

function dealListings(): ControlListing[] {
  return burnDeals(DATA.packages).map((d) => ({
    id: `burn-${d.p.id}`,
    title: d.p.title,
    agency: d.p.agency,
    real: d.now,
    flags: 0,
    // Selling at cost needs a margin sign-off before it goes live.
    status: d.atCost ? ("pending" as const) : ("live" as const),
    href: "/burn?dir=outbound",
    note: z(
      `ลด ${Math.round(d.disc * 100)}% · อีก ${d.days} วันเดินทาง${d.atCost ? " · ขายเท่าทุน" : ""}`,
      `−${Math.round(d.disc * 100)}% · departs in ${d.days} days${d.atCost ? " · at cost" : ""}`,
      `减 ${Math.round(d.disc * 100)}% · ${d.days} 天后出发${d.atCost ? " · 按成本价" : ""}`
    ),
  }));
}

export function listingsFor(item: NavItem): ControlListing[] {
  const drafts = DRAFTS[item.id] ?? [];
  switch (item.kind) {
    case "catalog":
      return [...packageListings(item.dir), ...drafts];
    case "daytour":
    case "excursion":
    case "attraction":
      return [...activityListings(item.kind), ...drafts];
    case "deals":
      return dealListings();
    default:
      return [];
  }
}

export const needsReview = (l: ControlListing) => l.status === "pending" || (l.status === "live" && l.flags > 0);

/* ── Operators ── */

export interface ControlAgency {
  id: string;
  name: L10n;
  licence: string;
  trust: number;
  band: TrustBand;
  bookings: number;
  cancel: number;
  listings: number;
}

export function agenciesFor(dir: NavDir): ControlAgency[] {
  const count: Record<string, number> = {};
  for (const item of NAV[dir]) for (const l of listingsFor(item)) count[l.agency] = (count[l.agency] ?? 0) + 1;
  return OPS.agencies
    .filter((a) => count[a.id])
    .map((a) => ({ id: a.id, name: a.name, licence: a.licence, trust: a.trust, band: a.band, bookings: a.bookings, cancel: a.cancel, listings: count[a.id] }));
}

export const agencyName = (id: string): L10n => OPS.agencies.find((a) => a.id === id)?.name ?? z(id, id);
export const agencyTrust = (id: string) => OPS.agencies.find((a) => a.id === id)?.trust ?? 0;

export interface QueueAgency {
  id: string;
  name: L10n;
  licence: string;
  stage: L10n;
}

const QUEUE: Record<NavDir, QueueAgency[]> = {
  outbound: OPS.queue.map(({ id, name, licence, stage }) => ({ id, name, licence, stage })),
  inbound: [
    { id: "q4", name: z("ล้านนาเทรลส์ ดีเอ็มซี", "Lanna Trails DMC", "兰纳步道地接社"), licence: "21/00412", stage: z("ตรวจบัตรไกด์ภาษาจีน", "Chinese-guide licence check", "中文导游证审核") },
    { id: "q5", name: z("แม่โขงเกตทราเวล", "Mekong Gate Travel", "湄公门旅行社"), licence: "57/00218", stage: z("ยืนยันบัญชีธนาคาร", "Bank verification", "银行账户核验") },
  ],
};
export const queueFor = (dir: NavDir) => QUEUE[dir];

/* ── Bookings ── */

export type BookingStatus = "confirmed" | "deposit" | "awaiting" | "completed";

export interface ControlBooking {
  ref: string;
  traveler: L10n;
  item: Loc;
  kind: NavKind | ActivityKind;
  pax: number;
  value: number;
  status: BookingStatus;
  href?: string;
}

const BOOKINGS: Record<NavDir, ControlBooking[]> = {
  outbound: [
    ...OPS.bookingRows.map((b) => ({
      ref: b.ref,
      traveler: b.traveler,
      item: b.pkg,
      kind: "catalog" as const,
      pax: b.ref === "T24-908311" ? 3 : b.ref === "T24-908455" ? 2 : 4,
      value: b.value,
      status: (b.status.en === "Confirmed" ? "confirmed" : b.status.en === "Deposit paid" ? "deposit" : "awaiting") as BookingStatus,
    })),
    { ref: "T24-871004", traveler: z("ปวีณา ร.", "Paweena R."), item: DATA.packages.find((p) => p.id === "tw01")!.title, kind: "catalog", pax: 2, value: 44800, status: "completed", href: "/packages/tw01" },
  ],
  inbound: [
    { ref: "T24-915620", traveler: z("หลิน เหวิน", "Lin Wen", "林雯"), item: DATA.packages.find((p) => p.id === "th01")!.title, kind: "catalog", pax: 4, value: 87600, status: "deposit", href: "/packages/th01" },
    { ref: "T24-DT01-261012", traveler: z("จาง เว่ย", "Zhang Wei", "张伟"), item: activities.find((a) => a.id === "dt01")!.title, kind: "daytour", pax: 2, value: 3980, status: "confirmed", href: "/inbound/day-tours/dt01" },
    { ref: "T24-EX01-261013", traveler: z("หลี่ น่า", "Li Na", "李娜"), item: activities.find((a) => a.id === "ex01")!.title, kind: "excursion", pax: 2, value: 4400, status: "confirmed", href: "/inbound/excursions/ex01" },
    { ref: "T24-AT01-261014", traveler: z("หวัง ฟาง", "Wang Fang", "王芳"), item: activities.find((a) => a.id === "at01")!.title, kind: "attraction", pax: 3, value: 3600, status: "awaiting", href: "/inbound/attractions/at01" },
    { ref: "T24-879352", traveler: z("เฉิน เจีย", "Chen Jia", "陈佳"), item: DATA.packages.find((p) => p.id === "th02")!.title, kind: "catalog", pax: 2, value: 25800, status: "completed", href: "/packages/th02" },
  ],
};
export const bookingsFor = (dir: NavDir) => BOOKINGS[dir];

/* ── Group quote requests ── */

export type GroupStatus = "new" | "quoted" | "won";

export interface GroupRequest {
  id: string;
  requester: L10n;
  destination: L10n;
  pax: number;
  budget: number;
  when: L10n;
  status: GroupStatus;
}

const GROUPS: Record<NavDir, GroupRequest[]> = {
  outbound: [
    { id: "G-201", requester: z("บริษัทประกันชีวิตกรุงเทพ (อินเซนทีฟ)", "Bangkok Life Assurance incentive"), destination: z("ญี่ปุ่น โตเกียว ฟูจิ", "Japan · Tokyo, Fuji"), pax: 40, budget: 45000, when: z("ต.ค. 2026", "Oct 2026"), status: "new" },
    { id: "G-198", requester: z("โรงเรียนสาธิต ทัศนศึกษา", "Satit school study trip"), destination: z("เกาหลี โซล", "Korea · Seoul"), pax: 32, budget: 28000, when: z("พ.ย. 2026", "Nov 2026"), status: "new" },
    { id: "G-195", requester: z("โรตารีคลับภูเก็ต", "Rotary Club Phuket"), destination: z("ไต้หวัน ไทเป", "Taiwan · Taipei"), pax: 18, budget: 24000, when: z("ธ.ค. 2026", "Dec 2026"), status: "quoted" },
  ],
  inbound: [
    { id: "G-310", requester: z("ไบรท์สตาร์ทราเวล เซี่ยงไฮ้ (อินเซนทีฟ)", "Shanghai Bright Star Travel incentive", "上海明星旅行社奖励团"), destination: z("เชียงใหม่ เชียงราย สามเหลี่ยมทองคำ", "Chiang Mai · Chiang Rai · Golden Triangle", "清迈 · 清莱 · 金三角"), pax: 40, budget: 21000, when: z("ต.ค. 2026", "Oct 2026", "2026年10月"), status: "new" },
    { id: "G-307", requester: z("ครอบครัวรวมญาติ กัวลาลัมเปอร์", "Kuala Lumpur family reunion", "吉隆坡家族聚会团"), destination: z("เชียงใหม่", "Chiang Mai", "清迈"), pax: 22, budget: 16500, when: z("ธ.ค. 2026", "Dec 2026", "2026年12月"), status: "new" },
    { id: "G-305", requester: z("ชมรมผู้สูงวัยเฉิงตู", "Chengdu Senior Club", "成都老年俱乐部"), destination: z("สามเหลี่ยมทองคำ", "Golden Triangle", "金三角"), pax: 28, budget: 19800, when: z("ม.ค. 2027", "Jan 2027", "2027年1月"), status: "quoted" },
  ],
};
export const groupsFor = (dir: NavDir) => GROUPS[dir];

/* ── Ask AI ── */

export interface AdvisorStats {
  questions: number;
  aiAnswered: number;
  handoffs: number;
  openHandoffs: number;
  replySec: number;
  top: { q: L10n; asked: number; booked: number }[];
}

const ADVISOR: Record<NavDir, AdvisorStats> = {
  outbound: {
    questions: 12480, aiAnswered: 91, handoffs: 1120, openHandoffs: 6, replySec: 4,
    top: [
      { q: z("ญี่ปุ่น ต.ค. งบไม่เกิน 40,000 ไม่ลงร้าน", "Japan in October under ฿40,000, no shopping"), asked: 1840, booked: 6.2 },
      { q: z("ทัวร์เกาหลีไหนเหมาะกับพ่อแม่สูงวัย", "Which Korea tour suits elderly parents?"), asked: 960, booked: 4.8 },
      { q: z("ฮอกไกโดสกี ธ.ค. คุ้มไหม", "Is a Hokkaido ski tour worth it in December?"), asked: 610, booked: 3.1 },
    ],
  },
  inbound: {
    questions: 3260, aiAnswered: 88, handoffs: 390, openHandoffs: 3, replySec: 5,
    top: [
      { q: z("เชียงใหม่มีทัวร์ไม่ลงร้านไหม", "Is there a no-shopping tour in Chiang Mai?", "清迈有不进店的纯玩团吗？"), asked: 720, booked: 7.4 },
      { q: z("ปางช้างไม่ขี่ใกล้เชียงใหม่", "Elephant sanctuary without riding near Chiang Mai", "清迈附近不骑象的大象保护营"), asked: 540, booked: 9.1 },
      { q: z("วัดร่องขุ่นวันเดียว ไกด์จีน", "White Temple day trip with a Chinese guide", "白庙一日游，中文导游"), asked: 410, booked: 8.3 },
    ],
  },
};
export const advisorFor = (dir: NavDir) => ADVISOR[dir];

/* ── AI agents ── */

export const demandFor = (dir: NavDir) => DEMAND.filter((d) => /thailand/i.test(d.destination) === (dir === "inbound"));

const AGENT_STATS: Record<NavDir, { calls: number; bookings: number; direct: number }> = {
  outbound: { calls: 18640, bookings: 37, direct: 3 },
  inbound: { calls: 4210, bookings: 12, direct: 2 },
};
export const agentStatsFor = (dir: NavDir) => AGENT_STATS[dir];

/* ── KPIs ── */

const KPI: Record<NavDir, { gmv: number; bookings: number; conversion: number }> = {
  outbound: { gmv: OPS.gmv, bookings: OPS.bookingCount, conversion: OPS.conversion },
  inbound: { gmv: 6850000, bookings: 168, conversion: 4.2 },
};
export const kpiFor = (dir: NavDir) => KPI[dir];

/* ── Risk & support ── */

export interface ControlRisk {
  id: string;
  level: TrustBand;
  title: L10n;
  body: L10n;
}

const RISK: Record<NavDir, ControlRisk[]> = {
  outbound: OPS.risk,
  inbound: [
    { id: "r4", level: "risk", title: z("ทัวร์ราคาประหยัดแวะร้าน 2 จุด", "Value day tour hides two shop stops", "特价一日游含两个购物点"), body: z("dt03 ของบางกอกเจ็ทแวะร้านหยกและร้านชาช่วงเช้า และเก็บค่าเรือหน้างาน ราคาจริงสูงกว่าที่โฆษณา 33%", "Bangkok Jet's dt03 stops at jade and tea shops and collects boat fees on the day: real price is 33% above the advertised one.", "曼谷捷旅 dt03 上午进玉器店和茶叶店，船费现场另收，实际价格比宣传高 33%。") },
    { id: "r5", level: "watch", title: z("ร้านช้อปบังคับในทัวร์ th02", "Compulsory shops on th02", "th02 强制购物"), body: z("th02 แวะร้านบังคับ 4 แห่งและไม่ระบุชื่อโรงแรม ถูกตั้งข้อสังเกต 3 จุด", "th02 has four compulsory shop stops and no named hotels: three truth-checker flags.", "th02 含 4 个强制购物点且未写酒店名，已被标记 3 处。") },
    { id: "r6", level: "good", title: z("ครบกำหนดตรวจสวัสดิภาพปางช้าง", "Elephant sanctuary welfare audit due", "大象保护营福利审核到期"), body: z("ex01 ต้องส่งผลตรวจสวัสดิภาพสัตว์ประจำปีภายใน 30 วัน", "ex01 must upload its yearly animal-welfare audit within 30 days.", "ex01 需在 30 天内上传年度动物福利审核。") },
  ],
};
export const riskFor = (dir: NavDir) => RISK[dir];

export interface ControlTicket {
  id: string;
  subject: L10n;
  agency: L10n;
  age: L10n;
}

const TICKETS: Record<NavDir, ControlTicket[]> = {
  outbound: OPS.tickets,
  inbound: [
    { id: "D-452", subject: z("ไม่มีคนรับที่สนามบินเชียงใหม่ กลุ่ม 4 คน", "No pickup at CNX airport for a group of 4", "清迈机场 4 人未接机"), agency: z("สยามฮอไรซอน", "Siam Horizon", "暹罗地平线"), age: z("1 วัน", "1 day", "1 天") },
    { id: "D-449", subject: z("เก็บค่าเรือซ้ำ ทัวร์สามเหลี่ยมทองคำ", "Boat fee charged twice on the Golden Triangle day tour", "金三角一日游船费重复收取"), agency: z("บางกอกเจ็ท", "Bangkok Jet", "曼谷捷旅"), age: z("3 วัน", "3 days", "3 天") },
    { id: "D-446", subject: z("ลิงก์ออดิโอไกด์ภาษาจีนเปิดไม่ได้", "Chinese audio-guide link not working (White Temple pass)", "白庙联票中文语音导览链接打不开"), agency: z("สยามฮอไรซอน", "Siam Horizon", "暹罗地平线"), age: z("6 วัน", "6 days", "6 天") },
  ],
};
export const ticketsFor = (dir: NavDir) => TICKETS[dir];

/* ── Per-section summary for the overview cards and nav badges ── */

export function sectionSummary(item: NavItem): { total: number; pending: number } {
  switch (item.kind) {
    case "catalog":
    case "daytour":
    case "excursion":
    case "attraction":
    case "deals": {
      const ls = listingsFor(item);
      return { total: ls.length, pending: ls.filter(needsReview).length };
    }
    case "advisor": {
      const a = advisorFor(item.dir);
      return { total: a.questions, pending: a.openHandoffs };
    }
    case "agents": {
      const d = demandFor(item.dir);
      return { total: d.length, pending: d.filter((x) => x.gap > 1000).length };
    }
    case "group": {
      const g = groupsFor(item.dir);
      return { total: g.length, pending: g.filter((x) => x.status === "new").length };
    }
    case "trips": {
      const b = bookingsFor(item.dir);
      return { total: b.length, pending: b.filter((x) => x.status === "awaiting").length };
    }
    case "agency":
      return { total: agenciesFor(item.dir).length, pending: queueFor(item.dir).length };
  }
}
