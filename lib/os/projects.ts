import type { L10n } from "../data";
import { serviceCost, totals } from "./engines";
import { DEMO_DEP_ID } from "./seed";
import type { OsSnapshot, OsTask } from "./types";

/**
 * Inbound project control: every group the inbound desk runs is a project with phase gates,
 * milestones, a work breakdown, a budget and a risk register. The 40-pax Golden Triangle
 * departure is linked to the live OS file, so its tasks and money come from the snapshot.
 */

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });

/** Fixed "today" for the demo so health and due buckets are stable across renders and visitors. */
export const OS_TODAY = "2026-09-10";

export type Phase = "enquiry" | "quote" | "contract" | "booking" | "final" | "operating" | "closed";
export const PHASES: Phase[] = ["enquiry", "quote", "contract", "booking", "final", "operating", "closed"];
export const PHASE_LABEL: Record<Phase, L10n> = {
  enquiry: z("รับงาน", "Enquiry", "询价", "Запрос"),
  quote: z("เสนอราคา", "Quote", "报价", "Смета"),
  contract: z("สัญญาและมัดจำ", "Contract & deposit", "合同与订金", "Договор и депозит"),
  booking: z("จองซัพพลายเออร์", "Supplier booking", "供应商预订", "Бронирование"),
  final: z("เอกสารสุดท้าย", "Final docs", "最终资料", "Финальные документы"),
  operating: z("ระหว่างเดินทาง", "Operating", "出团中", "В туре"),
  closed: z("ปิดงาน", "Closed", "结团", "Закрыт"),
};

export type Stream = "sales" | "air" | "hotel" | "ground" | "guide" | "docs" | "finance";
export const STREAMS: Stream[] = ["sales", "air", "hotel", "ground", "guide", "docs", "finance"];
export const STREAM_LABEL: Record<Stream, L10n> = {
  sales: z("ขายและลูกค้า", "Sales & client", "销售与客户", "Продажи"),
  air: z("ตั๋วเครื่องบิน", "Air", "机票", "Авиа"),
  hotel: z("โรงแรม", "Hotels", "酒店", "Отели"),
  ground: z("รถ อาหาร กิจกรรม", "Ground, meals & activities", "车餐与活动", "Наземное, питание"),
  guide: z("ไกด์", "Guides", "导游", "Гиды"),
  docs: z("เอกสารและ TDAC", "Docs & TDAC", "证件与 TDAC", "Документы и TDAC"),
  finance: z("การเงิน", "Finance", "财务", "Финансы"),
};

export type Health = "ontrack" | "risk" | "late" | "closed";
export const HEALTH_LABEL: Record<Health, L10n> = {
  ontrack: z("ตามแผน", "On track", "正常", "По плану"),
  risk: z("เสี่ยง", "At risk", "有风险", "Под риском"),
  late: z("ล่าช้า", "Late", "已逾期", "Опоздание"),
  closed: z("ปิดแล้ว", "Closed", "已结团", "Закрыт"),
};

export interface Member {
  id: string;
  name: string;
  role: L10n;
  stream: Stream | "lead";
  langs: string;
  onDuty: boolean;
}

export const TEAM: Member[] = [
  { id: "m-lead", name: "Ploy", role: z("หัวหน้าเดสก์อินบาวด์", "Inbound desk lead", "入境主管", "Руководитель"), stream: "lead", langs: "TH · EN · ZH", onDuty: true },
  { id: "m-sales", name: "Nok", role: z("ขายและใบเสนอราคา", "Sales & quotes", "销售报价", "Продажи"), stream: "sales", langs: "TH · ZH", onDuty: true },
  { id: "m-air", name: "Arm", role: z("ปฏิบัติการ — ไฟลต์", "Ops — flights", "操作 — 机票", "Опер. — рейсы"), stream: "air", langs: "TH · EN", onDuty: true },
  { id: "m-hotel", name: "Fon", role: z("ปฏิบัติการ — โรงแรม", "Ops — hotels", "操作 — 酒店", "Опер. — отели"), stream: "hotel", langs: "TH · EN", onDuty: true },
  { id: "m-ground", name: "Bank", role: z("รถ อาหาร กิจกรรม", "Ground & activities", "地接与活动", "Наземное"), stream: "ground", langs: "TH", onDuty: false },
  { id: "m-docs", name: "Mint", role: z("เอกสารและ TDAC", "Docs & TDAC", "证件与 TDAC", "Документы"), stream: "docs", langs: "TH · ZH", onDuty: true },
  { id: "m-fin", name: "Jay", role: z("การเงิน", "Finance", "财务", "Финансы"), stream: "finance", langs: "TH · EN", onDuty: true },
  { id: "m-guide", name: "Duean", role: z("หัวหน้าทัวร์ / ไกด์", "Tour leader desk", "领队调度", "Гиды"), stream: "guide", langs: "TH · EN · ZH", onDuty: false },
];
export const memberById = (id: string) => TEAM.find((m) => m.id === id);

export interface Milestone {
  id: string;
  phase: Phase;
  title: L10n;
  due: string;
  done: boolean;
}

export interface PTask {
  id: string;
  projectId: string;
  stream: Stream;
  title: L10n;
  owner: string;
  due: string;
  done: boolean;
  /** Task lives in the OS snapshot (toggle through the OS store). */
  snapTask?: boolean;
}

export interface RiskItem {
  id: string;
  title: L10n;
  impact: "high" | "medium" | "low";
  owner: string;
  mitigation: L10n;
  status: "open" | "watch" | "closed";
}

export interface ProjectDef {
  id: string;
  code: string;
  title: L10n;
  client: L10n;
  market: L10n;
  pax: number;
  dateStart: string;
  dateEnd: string;
  phase: Phase;
  owner: string;
  sell: number;
  committed: number;
  exposure: number;
  marginTarget: number;
  departureId?: string;
  milestones: Milestone[];
  tasks: Omit<PTask, "projectId">[];
  risks: RiskItem[];
  log: { at: string; text: L10n }[];
}

const CN = z("จีน", "China", "中国", "Китай");

export const PROJECTS: ProjectDef[] = [
  {
    id: "gt40", code: "IN-2610-GT40", departureId: DEMO_DEP_ID,
    title: z("สามเหลี่ยมทองคำ 40 คน ไม่ลงร้าน", "Golden Triangle 40, no shopping", "金三角 40 人纯玩团", "Золотой треугольник 40"),
    client: z("กวางโจว หนานฟาง ทราเวล", "Guangzhou Nanfang Travel", "广州南方旅行社"), market: CN,
    pax: 40, dateStart: "2026-10-12", dateEnd: "2026-10-17", phase: "booking", owner: "m-lead",
    sell: 0, committed: 0, exposure: 0, marginTarget: 18,
    milestones: [
      { id: "g1", phase: "enquiry", title: z("บรีฟตกลงกับลูกค้า", "Brief agreed", "需求确认"), due: "2026-08-02", done: true },
      { id: "g2", phase: "quote", title: z("ลูกค้ารับใบเสนอฉบับที่ 2", "Quote v2 accepted", "报价 v2 确认"), due: "2026-08-04", done: true },
      { id: "g3", phase: "contract", title: z("รับมัดจำ 40%", "40% deposit received", "收到 40% 订金"), due: "2026-08-15", done: true },
      { id: "g4", phase: "booking", title: z("มัดจำบล็อกที่นั่ง CZ", "CZ seat block deposit", "CZ 座位订金"), due: "2026-08-20", done: true },
      { id: "g5", phase: "final", title: z("เก็บยอดคงเหลือลูกค้า", "Customer balance collected", "收齐尾款"), due: "2026-09-12", done: false },
      { id: "g6", phase: "booking", title: z("ยืนยันโรงแรมและรถทั้งหมด", "All hotels & coaches confirmed", "酒店与车辆全部确认"), due: "2026-09-28", done: false },
      { id: "g7", phase: "final", title: z("ยื่นรายชื่อให้สายการบิน", "Name list to airline", "向航司提交名单"), due: "2026-09-28", done: false },
      { id: "g8", phase: "final", title: z("ออกตั๋ว", "Tickets issued", "出票"), due: "2026-10-05", done: false },
      { id: "g9", phase: "operating", title: z("รับกรุ๊ป CZ3051 ที่ CNX", "Meet CZ3051 at CNX", "清迈接机 CZ3051"), due: "2026-10-12", done: false },
      { id: "g10", phase: "closed", title: z("ปิดกำไรขาดทุนจริง", "Final P&L closed", "结算实际损益"), due: "2026-10-24", done: false },
    ],
    tasks: [
      { id: "gt-room", stream: "hotel", title: z("ส่งรูมมิ่งลิสต์ให้ Le Meridien", "Send rooming list to Le Meridien", "向 Le Meridien 发送分房表"), owner: "m-hotel", due: "2026-09-25", done: false },
      { id: "gt-guide", stream: "guide", title: z("บรีฟไกด์หมิงเรื่องนโยบายไม่ลงร้าน", "Brief guide Ming on the no-shop policy", "向导游明说明不进店政策"), owner: "m-guide", due: "2026-10-08", done: false },
      { id: "gt-tdac", stream: "docs", title: z("เตือนผู้เดินทาง 40 คนกรอก TDAC", "Remind 40 guests to file TDAC", "提醒 40 位客人填写 TDAC"), owner: "m-docs", due: "2026-10-09", done: false },
      { id: "gt-cnx", stream: "sales", title: z("ส่งโปรแกรมฉบับสุดท้ายให้หนานฟาง", "Send final programme to Nanfang", "向南方发送最终行程"), owner: "m-sales", due: "2026-09-30", done: false },
    ],
    risks: [
      { id: "gr1", title: z("พาสปอร์ตขาด 3 ราย", "3 passports still missing", "仍缺 3 本护照"), impact: "high", owner: "m-docs", mitigation: z("โทรผ่านหลินเหวินทุกวันจนถึง 20 ก.ย.", "Chase through Lin Wen daily until 20 Sep", "每天通过林雯跟进至 9 月 20 日"), status: "open" },
      { id: "gr2", title: z("โรงแรมเชียงรายยังเป็นแค่ใบเสนอ", "Chiang Rai hotel is only quoted, not held", "清莱酒店仅报价未留房"), impact: "medium", owner: "m-hotel", mitigation: z("ขอถือห้องก่อน 15 ก.ย. มีโรงแรมสำรอง", "Ask for a hold before 15 Sep; backup hotel shortlisted", "9 月 15 日前申请留房，已备选酒店"), status: "open" },
      { id: "gr3", title: z("CZ3051 ถึง 07:10 รถและสล็อตดอยสุเทพผูกกับเวลานี้", "CZ3051 lands 07:10; coach and Doi Suthep slot depend on it", "CZ3051 07:10 抵达，车辆与双龙寺时段依赖它"), impact: "medium", owner: "m-air", mitigation: z("เตรียมแผนเลื่อนสล็อตเป็น 14:00", "Pre-agree a 14:00 fallback slot", "预先协商 14:00 备用时段"), status: "watch" },
    ],
    log: [],
  },
  {
    id: "sz32", code: "IN-2611-SZ32",
    title: z("ทริปศึกษาดูงานเชียงราย 32 คน", "Chiang Rai study trip 32", "清莱研学团 32 人", "Учебная поездка 32"),
    client: z("โรงเรียนไบรท์ฟิวเจอร์ เซินเจิ้น", "Shenzhen Bright Future School", "深圳光明未来学校"), market: CN,
    pax: 32, dateStart: "2026-11-03", dateEnd: "2026-11-08", phase: "contract", owner: "m-sales",
    sell: 633600, committed: 0, exposure: 512000, marginTarget: 18,
    milestones: [
      { id: "s1", phase: "enquiry", title: z("บรีฟตกลง", "Brief agreed", "需求确认"), due: "2026-08-25", done: true },
      { id: "s2", phase: "quote", title: z("ส่งใบเสนอ", "Quote sent", "报价已发"), due: "2026-09-01", done: true },
      { id: "s3", phase: "contract", title: z("เซ็นสัญญา", "Contract signed", "合同签署"), due: "2026-09-12", done: false },
      { id: "s4", phase: "contract", title: z("รับมัดจำ 30%", "30% deposit received", "收到 30% 订金"), due: "2026-09-18", done: false },
      { id: "s5", phase: "booking", title: z("ยืนยันโรงแรมและรถ", "Hotels & coaches confirmed", "酒店与车辆确认"), due: "2026-10-06", done: false },
      { id: "s6", phase: "final", title: z("ใบยินยอมผู้ปกครองครบ", "All parental consent forms in", "家长同意书收齐"), due: "2026-10-20", done: false },
      { id: "s7", phase: "operating", title: z("เริ่มทริป", "Trip starts", "出团"), due: "2026-11-03", done: false },
      { id: "s8", phase: "closed", title: z("ปิดงาน", "Project closed", "结团"), due: "2026-11-20", done: false },
    ],
    tasks: [
      { id: "sz-redline", stream: "sales", title: z("ตอบแก้ไขสัญญาของโรงเรียน", "Answer the school's contract redlines", "回复学校合同修改意见"), owner: "m-sales", due: "2026-09-11", done: false },
      { id: "sz-ins", stream: "docs", title: z("ใบเสนอประกันกลุ่มนักเรียน", "Student group insurance quote", "学生团体保险报价"), owner: "m-docs", due: "2026-09-15", done: false },
      { id: "sz-hotel", stream: "hotel", title: z("ถือห้อง 16 ห้องที่เชียงราย", "Hold 16 rooms in Chiang Rai", "清莱留房 16 间"), owner: "m-hotel", due: "2026-09-20", done: false },
      { id: "sz-farm", stream: "ground", title: z("จองเวิร์กช็อปไร่ชาดอยแม่สลอง", "Book Mae Salong tea-farm workshop", "预订美斯乐茶园课程"), owner: "m-ground", due: "2026-09-25", done: false },
    ],
    risks: [
      { id: "sr1", title: z("ผู้เดินทางเป็นผู้เยาว์ ต้องมีใบยินยอม", "Travellers are minors; consent forms needed", "未成年人出行，需要同意书"), impact: "high", owner: "m-docs", mitigation: z("ส่งแบบฟอร์มภาษาจีนพร้อมสัญญา", "Send Chinese consent form with the contract", "随合同发送中文同意书"), status: "open" },
      { id: "sr2", title: z("ยังไม่ได้มัดจำ แต่ถือห้องแล้ว", "Rooms held before any deposit", "未收订金已留房"), impact: "medium", owner: "m-fin", mitigation: z("ปล่อยห้องถ้าไม่ได้มัดจำภายใน 18 ก.ย.", "Release rooms if no deposit by 18 Sep", "9 月 18 日前未收订金则放房"), status: "watch" },
    ],
    log: [
      { at: "2026-09-01T15:00:00+07:00", text: z("ส่งใบเสนอ ฿19,800 ต่อคน", "Quote sent at ฿19,800 per person", "报价每人 ฿19,800") },
      { at: "2026-09-08T10:20:00+07:00", text: z("โรงเรียนส่งแก้ไขสัญญา 4 ข้อ", "School returned 4 contract redlines", "学校退回 4 处合同修改") },
    ],
  },
  {
    id: "kl18", code: "IN-2610-KL18",
    title: z("ครอบครัวมาเลเซีย เชียงใหม่ 18 คน (ฮาลาล)", "Malaysian family group, Chiang Mai 18 (halal)", "马来西亚家庭团清迈 18 人（清真）", "Семьи из Малайзии, 18"),
    client: z("ซูเรีย ฮอลิเดย์ กัวลาลัมเปอร์", "Suria Holidays Kuala Lumpur", "吉隆坡 Suria 假期"), market: z("มาเลเซีย", "Malaysia", "马来西亚", "Малайзия"),
    pax: 18, dateStart: "2026-10-24", dateEnd: "2026-10-28", phase: "booking", owner: "m-lead",
    sell: 297000, committed: 182000, exposure: 64000, marginTarget: 16,
    milestones: [
      { id: "k1", phase: "quote", title: z("ลูกค้ารับใบเสนอ", "Quote accepted", "报价确认"), due: "2026-08-12", done: true },
      { id: "k2", phase: "contract", title: z("รับมัดจำ", "Deposit received", "收到订金"), due: "2026-08-20", done: true },
      { id: "k3", phase: "booking", title: z("ยืนยันร้านอาหารฮาลาลทุกมื้อ", "Halal venues confirmed for every meal", "全部清真餐厅确认"), due: "2026-09-08", done: false },
      { id: "k4", phase: "booking", title: z("ยืนยันรถตู้ 2 คัน", "Two vans confirmed", "两辆商务车确认"), due: "2026-09-20", done: false },
      { id: "k5", phase: "final", title: z("ยอดคงเหลือ", "Balance collected", "收齐尾款"), due: "2026-09-24", done: false },
      { id: "k6", phase: "operating", title: z("เริ่มทริป", "Trip starts", "出团"), due: "2026-10-24", done: false },
      { id: "k7", phase: "closed", title: z("ปิดงาน", "Project closed", "结团"), due: "2026-11-04", done: false },
    ],
    tasks: [
      { id: "kl-halal", stream: "ground", title: z("หาร้านฮาลาลที่เชียงรายวันที่ 3", "Find a halal lunch venue in Chiang Rai, day 3", "寻找第 3 天清莱清真午餐"), owner: "m-ground", due: "2026-09-08", done: false },
      { id: "kl-prayer", stream: "ground", title: z("เพิ่มเวลาละหมาดในโปรแกรม", "Add prayer stops to the programme", "行程加入礼拜时间"), owner: "m-sales", due: "2026-09-12", done: true },
      { id: "kl-van", stream: "ground", title: z("ยืนยันรถตู้ 2 คัน", "Confirm two vans", "确认两辆商务车"), owner: "m-ground", due: "2026-09-20", done: false },
      { id: "kl-bal", stream: "finance", title: z("ส่งใบแจ้งยอดคงเหลือ", "Send balance invoice", "发送尾款发票"), owner: "m-fin", due: "2026-09-14", done: false },
    ],
    risks: [
      { id: "kr1", title: z("ร้านฮาลาลเชียงรายยังไม่ยืนยัน", "Halal lunch in Chiang Rai not confirmed", "清莱清真午餐未确认"), impact: "high", owner: "m-ground", mitigation: z("ใช้ข้าวกล่องฮาลาลจากเชียงใหม่เป็นแผนสำรอง", "Fallback: halal boxed lunch from Chiang Mai", "备选：从清迈带清真盒饭"), status: "open" },
    ],
    log: [{ at: "2026-09-05T09:00:00+07:00", text: z("ร้านฮาลาลเดิมปิดปรับปรุง", "Original halal venue closed for renovation", "原清真餐厅装修停业") }],
  },
  {
    id: "sh60", code: "IN-2612-SH60",
    title: z("อินเซนทีฟ กรุงเทพฯ–เชียงใหม่ 60 คน", "Incentive Bangkok–Chiang Mai 60", "曼谷–清迈奖励旅游 60 人", "Инсентив 60"),
    client: z("ประกันภัยหัวซิน เซี่ยงไฮ้", "Shanghai Huaxin Insurance", "上海华信保险"), market: CN,
    pax: 60, dateStart: "2026-12-06", dateEnd: "2026-12-11", phase: "quote", owner: "m-sales",
    sell: 1920000, committed: 0, exposure: 0, marginTarget: 20,
    milestones: [
      { id: "h1", phase: "enquiry", title: z("บรีฟตกลง", "Brief agreed", "需求确认"), due: "2026-09-04", done: true },
      { id: "h2", phase: "quote", title: z("ส่งข้อเสนอ 2 ทางเลือก", "Two-option proposal sent", "发送两套方案"), due: "2026-09-15", done: false },
      { id: "h3", phase: "contract", title: z("เซ็นสัญญาและมัดจำ", "Contract & deposit", "合同与订金"), due: "2026-09-30", done: false },
      { id: "h4", phase: "booking", title: z("บล็อกห้องกรุงเทพฯ ช่วงไฮซีซั่น", "Bangkok peak-season room block", "曼谷旺季房间锁定"), due: "2026-10-10", done: false },
      { id: "h5", phase: "operating", title: z("เริ่มทริป", "Trip starts", "出团"), due: "2026-12-06", done: false },
      { id: "h6", phase: "closed", title: z("ปิดงาน", "Project closed", "结团"), due: "2026-12-20", done: false },
    ],
    tasks: [
      { id: "sh-gala", stream: "ground", title: z("หาสถานที่กาล่าดินเนอร์ริมแม่น้ำ", "Source a riverside gala-dinner venue", "寻找河畔晚宴场地"), owner: "m-ground", due: "2026-09-13", done: false },
      { id: "sh-air", stream: "air", title: z("ขอราคาไฟลต์ในประเทศ BKK–CNX 60 ที่", "Domestic BKK–CNX quote for 60 seats", "BKK–CNX 国内段 60 座报价"), owner: "m-air", due: "2026-09-12", done: false },
      { id: "sh-prop", stream: "sales", title: z("ทำข้อเสนอ 2 ทางเลือก", "Build the two-option proposal", "制作两套方案"), owner: "m-sales", due: "2026-09-15", done: false },
    ],
    risks: [
      { id: "hr1", title: z("ห้องกรุงเทพฯ ธ.ค. เต็มเร็ว", "Bangkok December rooms selling out", "曼谷 12 月房源紧张"), impact: "medium", owner: "m-hotel", mitigation: z("ถือห้องแบบมีเงื่อนไขก่อนเซ็นสัญญา", "Courtesy hold before contract", "签约前申请礼遇留房"), status: "open" },
    ],
    log: [],
  },
  {
    id: "sel12", code: "IN-2609-SEL12",
    title: z("กอล์ฟเชียงใหม่ 12 คน", "Chiang Mai golf 12", "清迈高尔夫 12 人", "Гольф 12"),
    client: z("ชมรมกอล์ฟโซล", "Seoul Golf Society", "首尔高尔夫协会"), market: z("เกาหลีใต้", "South Korea", "韩国", "Южная Корея"),
    pax: 12, dateStart: "2026-09-14", dateEnd: "2026-09-18", phase: "final", owner: "m-lead",
    sell: 342000, committed: 284000, exposure: 6000, marginTarget: 15,
    milestones: [
      { id: "e1", phase: "contract", title: z("รับเงินเต็มจำนวน", "Paid in full", "全款已收"), due: "2026-08-25", done: true },
      { id: "e2", phase: "booking", title: z("ยืนยันทีไทม์ 4 สนาม", "Tee times confirmed at 4 courses", "4 个球场开球时间确认"), due: "2026-08-30", done: true },
      { id: "e3", phase: "final", title: z("ส่งวาวเชอร์แคดดี้และรถกอล์ฟ", "Caddie & cart vouchers sent", "发送球童与球车凭证"), due: "2026-09-11", done: false },
      { id: "e4", phase: "operating", title: z("รับที่สนามบิน", "Airport meet", "接机"), due: "2026-09-14", done: false },
      { id: "e5", phase: "closed", title: z("ปิดงาน", "Project closed", "结团"), due: "2026-09-25", done: false },
    ],
    tasks: [
      { id: "se-vouch", stream: "ground", title: z("ส่งวาวเชอร์แคดดี้", "Send caddie vouchers", "发送球童凭证"), owner: "m-ground", due: "2026-09-11", done: false },
      { id: "se-guide", stream: "guide", title: z("จัดไกด์พูดเกาหลี", "Assign Korean-speaking guide", "安排韩语导游"), owner: "m-guide", due: "2026-09-10", done: true },
      { id: "se-room", stream: "hotel", title: z("ยืนยันห้องเดี่ยว 12 ห้อง", "Reconfirm 12 single rooms", "复核 12 间单人房"), owner: "m-hotel", due: "2026-09-12", done: false },
    ],
    risks: [],
    log: [{ at: "2026-08-30T17:00:00+07:00", text: z("ยืนยันทีไทม์ครบ 4 สนาม", "All four tee times confirmed", "4 个球场开球时间全部确认") }],
  },
  {
    id: "gz24", code: "IN-2608-GZ24",
    title: z("กรุ๊ปผู้สูงอายุ เชียงใหม่ 24 คน", "Senior group, Chiang Mai 24", "清迈长者团 24 人", "Группа пенсионеров 24"),
    client: z("สมาคมผู้สูงอายุกวางโจว", "Guangzhou Seniors Association", "广州长者协会"), market: CN,
    pax: 24, dateStart: "2026-08-18", dateEnd: "2026-08-22", phase: "closed", owner: "m-lead",
    sell: 456000, committed: 377000, exposure: 0, marginTarget: 17,
    milestones: [
      { id: "z1", phase: "operating", title: z("เริ่มทริป", "Trip starts", "出团"), due: "2026-08-18", done: true },
      { id: "z2", phase: "closed", title: z("ปิดกำไรขาดทุนจริง", "Final P&L closed", "结算实际损益"), due: "2026-09-01", done: true },
    ],
    tasks: [{ id: "gz-memory", stream: "sales", title: z("บันทึกบทเรียนลง Tour Memory", "Write lessons into Tour Memory", "写入 Tour Memory 经验"), owner: "m-lead", due: "2026-09-05", done: true }],
    risks: [],
    log: [{ at: "2026-09-01T12:00:00+07:00", text: z("ปิดงาน มาร์จิ้นจริง 17.3%", "Closed at 17.3% actual margin", "结团，实际毛利 17.3%") }],
  },
];

const OWNER_BY_LABEL: Record<string, string> = {
  "Ops — flights": "m-air",
  "Ops — hotels": "m-hotel",
  Docs: "m-docs",
  Finance: "m-fin",
  "Ops — meals": "m-ground",
};
const STREAM_BY_MODULE: Record<OsTask["module"], Stream> = {
  flight: "air", hotel: "hotel", bus: "ground", meal: "ground", activity: "ground", guide: "guide", other: "ground", docs: "docs", finance: "finance", sales: "sales",
};

export interface Project extends ProjectDef {
  allTasks: PTask[];
  health: Health;
  progress: number;
  forecastMargin: number;
  nextMilestone?: Milestone;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);
export const daysFromToday = (iso: string) => daysBetween(OS_TODAY, iso);

/** Build live projects: overlay task ticks and, for the linked departure, the OS snapshot. */
export function buildProjects(snap: OsSnapshot, ticks: Record<string, boolean>): Project[] {
  return PROJECTS.map((def) => {
    let p: ProjectDef = def;
    let snapTasks: PTask[] = [];
    if (def.departureId) {
      const t = totals(snap, def.departureId);
      const svcs = snap.services.filter((s) => s.departureId === def.departureId && s.state !== "cancelled");
      const committed = svcs.filter((s) => s.state === "confirmed" || s.state === "completed").reduce((a, s) => a + serviceCost(s), 0);
      p = { ...def, pax: t.pax || def.pax, sell: t.sell, committed, exposure: t.cost - committed, log: snap.log };
      snapTasks = snap.tasks
        .filter((x) => x.departureId === def.departureId)
        .map((x) => ({
          id: x.id, projectId: def.id, stream: STREAM_BY_MODULE[x.module], title: x.title,
          owner: OWNER_BY_LABEL[x.owner] || "m-lead", due: x.due.slice(0, 10), done: x.done, snapTask: true,
        }));
    }
    const own: PTask[] = p.tasks.map((x) => ({ ...x, projectId: p.id, done: ticks[x.id] ?? x.done }));
    const allTasks = [...snapTasks, ...own].sort((a, b) => a.due.localeCompare(b.due));
    const openMs = p.milestones.filter((m) => !m.done).sort((a, b) => a.due.localeCompare(b.due));
    const cost = p.committed + p.exposure;
    const forecastMargin = p.sell ? ((p.sell - cost) / p.sell) * 100 : 0;
    let health: Health = "ontrack";
    if (p.phase === "closed") health = "closed";
    else if (openMs.some((m) => daysFromToday(m.due) < 0) || allTasks.some((x) => !x.done && daysFromToday(x.due) < 0)) health = "late";
    else if (openMs.some((m) => daysFromToday(m.due) <= 3) || p.risks.some((r) => r.impact === "high" && r.status === "open") || (cost > 0 && forecastMargin < p.marginTarget)) health = "risk";
    const units = p.milestones.length + allTasks.length;
    const doneUnits = p.milestones.filter((m) => m.done).length + allTasks.filter((x) => x.done).length;
    return { ...p, allTasks, health, progress: units ? Math.round((doneUnits / units) * 100) : 0, forecastMargin, nextMilestone: openMs[0] };
  });
}

/* ── Workspace feeds ── */

export interface InboxItem {
  id: string;
  kind: "supplier" | "client" | "guide" | "system";
  from: string;
  projectId: string;
  text: L10n;
  at: string;
  owner: string;
}

export const INBOX: InboxItem[] = [
  { id: "in1", kind: "supplier", from: "Le Meridien Chiang Rai", projectId: "gt40", owner: "m-hotel", at: "2026-09-10T08:40:00+07:00", text: z("ข้อเสนอห้องหมดอายุ 15 ก.ย. ต้องการถือห้องไหม", "Room offer expires 15 Sep — do you want a hold?", "房价报价 9 月 15 日到期，是否留房？") },
  { id: "in2", kind: "client", from: "Lin Wen · Nanfang", projectId: "gt40", owner: "m-sales", at: "2026-09-10T08:05:00+07:00", text: z("ขอจำนวนมังสวิรัติล่าสุดและห้องเดี่ยว 3 ห้อง", "Asks for the latest vegetarian count and 3 single rooms", "询问最新素食人数和 3 间单人房") },
  { id: "in3", kind: "client", from: "Bright Future School", projectId: "sz32", owner: "m-sales", at: "2026-09-09T17:30:00+07:00", text: z("ส่งแก้ไขสัญญา 4 ข้อ ขอคำตอบภายใน 11 ก.ย.", "4 contract redlines, reply needed by 11 Sep", "4 处合同修改，需 9 月 11 日前回复") },
  { id: "in4", kind: "supplier", from: "Halal Kitchen Chiang Rai", projectId: "kl18", owner: "m-ground", at: "2026-09-09T15:10:00+07:00", text: z("รับกรุ๊ปได้วันที่ 26 ต.ค. แต่ขั้นต่ำ 20 ที่", "Can host on 26 Oct but minimum is 20 covers", "10 月 26 日可接待，但最低 20 位") },
  { id: "in5", kind: "guide", from: "Ming (guide)", projectId: "gt40", owner: "m-guide", at: "2026-09-09T11:00:00+07:00", text: z("ยืนยันว่างทั้ง 6 วัน", "Confirms availability for all 6 days", "确认 6 天均可带团") },
  { id: "in6", kind: "system", from: "TDAC", projectId: "sel12", owner: "m-docs", at: "2026-09-09T09:00:00+07:00", text: z("เปิดให้กรอก TDAC สำหรับวันถึง 14 ก.ย. แล้ว", "TDAC filing is now open for 14 Sep arrivals", "9 月 14 日抵达的 TDAC 已开放填写") },
];

export interface DocItem {
  id: string;
  projectId: string;
  name: L10n;
  status: "missing" | "draft" | "sent" | "signed";
  owner: string;
  updated: string;
}

export const DOCS: DocItem[] = [
  { id: "d1", projectId: "gt40", name: z("รูมมิ่งลิสต์ 21 ห้อง", "Rooming list, 21 rooms", "分房表 21 间"), status: "draft", owner: "m-hotel", updated: "2026-09-09" },
  { id: "d2", projectId: "gt40", name: z("รายชื่อผู้โดยสาร CZ3051/3052", "Passenger name list CZ3051/3052", "CZ3051/3052 乘客名单"), status: "draft", owner: "m-air", updated: "2026-09-08" },
  { id: "d3", projectId: "gt40", name: z("โปรแกรมภาษาจีนฉบับลูกค้า", "Chinese client programme", "中文客户行程"), status: "sent", owner: "m-sales", updated: "2026-08-04" },
  { id: "d4", projectId: "sz32", name: z("สัญญาโรงเรียน", "School contract", "学校合同"), status: "sent", owner: "m-sales", updated: "2026-09-02" },
  { id: "d5", projectId: "sz32", name: z("ใบยินยอมผู้ปกครอง 28 ฉบับ", "28 parental consent forms", "28 份家长同意书"), status: "missing", owner: "m-docs", updated: "2026-09-02" },
  { id: "d6", projectId: "kl18", name: z("เมนูฮาลาลเชียงราย", "Chiang Rai halal menu", "清莱清真菜单"), status: "missing", owner: "m-ground", updated: "2026-09-05" },
  { id: "d7", projectId: "sel12", name: z("วาวเชอร์ทีไทม์ 4 สนาม", "Tee-time vouchers, 4 courses", "4 个球场开球凭证"), status: "signed", owner: "m-ground", updated: "2026-08-30" },
];
