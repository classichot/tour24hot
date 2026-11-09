import type { Lang } from "../i18n";

const en = {
  desk: "Host Desk",
  system: "AI host operating system",
  home: "Host home",
  stay: "Stay",
  days: "Days",
  guests: "Guests",
  arrivals: "Arrivals",
  maxDays: "Max stay",
  usedDays: "Days on this stay",
  addDay: "Add a day",
  atCap: "45-day host cap reached",
  pax: "Guests",
  rooms: "Rooms",
  nextIn: "Next arrival",
  rule: "A hosted stay cannot exceed 45 days.",
  os: "Operator OS",
  site: "Marketplace",
  reset: "Reset stay",
};

const th: typeof en = {
  ...en,
  desk: "โต๊ะโฮสต์",
  system: "ระบบปฏิบัติการโฮสต์ด้วย AI",
  home: "หน้าโฮสต์",
  stay: "การเข้าพัก",
  days: "วัน",
  guests: "ผู้เข้าพัก",
  arrivals: "ขาเข้า",
  maxDays: "เข้าพักสูงสุด",
  usedDays: "วันในไฟล์นี้",
  addDay: "เพิ่มวัน",
  atCap: "ครบเพดานโฮสต์ 45 วัน",
  pax: "ผู้เข้าพัก",
  rooms: "ห้อง",
  nextIn: "ขาเข้าถัดไป",
  rule: "การเข้าพักที่โฮสต์รับได้ไม่เกิน 45 วัน",
  os: "ระบบปฏิบัติการ",
  site: "ตลาด",
  reset: "รีเซ็ตไฟล์",
};

const zh: typeof en = {
  ...en,
  desk: "接待台",
  system: "AI 接待操作系统",
  home: "接待首页",
  stay: "接待档期",
  days: "日程",
  guests: "客人",
  arrivals: "抵达",
  maxDays: "最长接待",
  usedDays: "本档天数",
  addDay: "加一天",
  atCap: "已达 45 天接待上限",
  pax: "客人",
  rooms: "房间",
  nextIn: "下一班抵达",
  rule: "一次接待最长 45 天。",
  os: "运营商系统",
  site: "市场",
  reset: "重置档期",
};

const ru: typeof en = {
  ...en,
  desk: "Стол хоста",
  system: "ИИ-система хоста",
  home: "Главная хоста",
  stay: "Размещение",
  days: "Дни",
  guests: "Гости",
  arrivals: "Прилёты",
  maxDays: "Макс. срок",
  usedDays: "Дней в файле",
  addDay: "Добавить день",
  atCap: "Лимит хоста 45 дней",
  pax: "Гости",
  rooms: "Номера",
  nextIn: "Следующий прилёт",
  rule: "Размещение у хоста не длиннее 45 дней.",
  os: "ОС оператора",
  site: "Витрина",
  reset: "Сбросить",
};

export function hostCopy(lang: Lang) {
  if (lang === "th") return th;
  if (lang === "zh") return zh;
  if (lang === "ru") return ru;
  return en;
}
