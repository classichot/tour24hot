import type { L10n } from "@/lib/data";
import type { NavKind } from "@/lib/nav";
import type { BookingStatus, GroupStatus, ListingStatus } from "@/lib/control";

const z = (th: string, en: string, zh: string): L10n => ({ th, en, zh });

/** Control Center copy that has no shared dictionary key. */
export const CC = {
  synced: z("ซิงก์กับเมนูหน้าร้าน", "Synced with the marketplace menu", "与前台菜单同步"),
  sections: z("ส่วน", "sections", "个版块"),
  overview: z("ภาพรวม", "Overview", "总览"),
  menuGroup: z("เมนูหน้าร้าน", "Marketplace menu", "前台菜单"),
  opsGroup: z("งานปฏิบัติการ", "Operations", "运营"),
  sectionsNav: z("ส่วนของศูนย์ควบคุม", "Control Center sections", "控制台版块"),
  toReview: z("รอตรวจ", "to review", "待处理"),
  manage: z("จัดการ", "Manage", "管理"),
  openPage: z("เปิดหน้า", "Open page", "打开页面"),
  view: z("ดู", "View", "查看"),
  listing: z("รายการ", "Listing", "产品"),
  liveListings: z("รายการออนไลน์", "Live listings", "在线产品"),
  toReviewKpi: z("รายการรอตรวจ", "Listings to review", "待审核产品"),
  feature: z("แนะนำ", "Feature", "推荐"),
  featured: z("แนะนำแล้ว", "Featured", "已推荐"),
  none: z("ไม่มีรายการ", "Nothing here yet", "暂无内容"),
  noRisk: z("ไม่มีความเสี่ยงที่ต้องดู", "No risk alerts", "暂无风险提醒"),
  openFor: z("เปิดมาแล้ว", "Open for", "已开"),
  sectionOf: z("เมนู", "Menu", "菜单"),
  pax: z("คน", "Pax", "人数"),
  // advisor
  questions: z("คำถามเดือนนี้", "Questions this month", "本月提问"),
  aiAnswered: z("AI ตอบเองได้", "Answered by AI", "AI 自主回答"),
  handoffs: z("ส่งต่อให้คน", "Handed to a person", "转人工"),
  openHandoffs: z("รอคนตอบ", "Waiting for a person", "待人工回复"),
  reply: z("เวลาตอบเฉลี่ย", "Median reply", "回复中位数"),
  topQuestions: z("คำถามยอดนิยม", "Top questions", "热门问题"),
  asked: z("ถาม", "Asked", "提问次数"),
  booked: z("จองต่อ", "Booked after", "提问后预订"),
  sec: z("วินาที", "s", "秒"),
  // agents
  agentCalls: z("คำขอจาก AI agent (24 ชม.)", "AI-agent requests (24 h)", "AI 代理请求（24 小时）"),
  agentBookings: z("การจองผ่าน AI agent", "Bookings from AI agents", "AI 代理带来的预订"),
  directOps: z("ผู้ให้บริการ Agent Direct", "Agent Direct operators", "Agent Direct 服务商"),
  // group
  requester: z("ผู้ขอ", "Requested by", "询价方"),
  destination: z("ปลายทาง", "Destination", "目的地"),
  budget: z("งบต่อคน", "Budget / person", "人均预算"),
  when: z("ช่วงเดินทาง", "Travel window", "出行时间"),
  assign: z("รับงาน", "Assign to me", "分配给我"),
  assigned: z("รับแล้ว", "Assigned", "已分配"),
  markQuoted: z("ส่งราคาแล้ว", "Mark quoted", "标记已报价"),
  // trips
  bookedItem: z("รายการที่จอง", "Booked item", "预订内容"),
  // agency
  listingsHere: z("รายการในฝั่งนี้", "Listings here", "本方向产品"),
  cancelRate: z("อัตรายกเลิก", "Cancel rate", "取消率"),
  operators: z("ผู้ให้บริการ", "Operators", "服务商"),
};

export const STATUS: Record<ListingStatus, { label: L10n; cls: string }> = {
  live: { label: z("ออนไลน์", "Live", "已上线"), cls: "bg-accent text-text" },
  pending: { label: z("รออนุมัติ", "Pending", "待审核"), cls: "bg-neutral-200 text-neutral-800" },
  held: { label: z("ระงับชั่วคราว", "Held", "已暂停"), cls: "bg-neutral-800 text-bg" },
  rejected: { label: z("ไม่อนุมัติ", "Rejected", "已拒绝"), cls: "bg-neutral-100 text-neutral-600 line-through" },
};

export const BOOKING_STATUS: Record<BookingStatus, { label: L10n; cls: string }> = {
  confirmed: { label: z("ยืนยันแล้ว", "Confirmed", "已确认"), cls: "bg-accent text-text" },
  deposit: { label: z("มัดจำแล้ว", "Deposit paid", "已付定金"), cls: "bg-accent-200 text-accent-800" },
  awaiting: { label: z("รอผู้ให้บริการยืนยัน", "Awaiting operator", "待服务商确认"), cls: "bg-neutral-800 text-bg" },
  completed: { label: z("เดินทางแล้ว", "Completed", "已出行"), cls: "bg-neutral-200 text-neutral-800" },
};

export const GROUP_STATUS: Record<GroupStatus, { label: L10n; cls: string }> = {
  new: { label: z("ใหม่", "New", "新询价"), cls: "bg-neutral-800 text-bg" },
  quoted: { label: z("ส่งราคาแล้ว", "Quoted", "已报价"), cls: "bg-accent-200 text-accent-800" },
  won: { label: z("ได้งาน", "Won", "已成交"), cls: "bg-accent text-text" },
};

/** Small label above each overview card, and the unit for its headline number. */
export const KIND: Record<NavKind, { tag: L10n; unit: L10n }> = {
  catalog: { tag: z("แพ็กเกจหลายวัน", "Multi-day packages", "多日游产品"), unit: z("รายการ", "listings", "个产品") },
  daytour: { tag: z("กิจกรรม", "Activities", "活动"), unit: z("รายการ", "listings", "个产品") },
  excursion: { tag: z("กิจกรรม", "Activities", "活动"), unit: z("รายการ", "listings", "个产品") },
  attraction: { tag: z("ตั๋วสถานที่", "Tickets", "门票"), unit: z("รายการ", "listings", "个产品") },
  deals: { tag: z("ดีลใกล้เดินทาง", "Last-minute deals", "临期特价"), unit: z("ดีล", "deals", "个特价") },
  advisor: { tag: z("ผู้ช่วย AI", "AI advisor", "AI 顾问"), unit: z("คำถาม", "questions", "个提问") },
  agents: { tag: z("AI agent", "AI agents", "AI 代理"), unit: z("สัญญาณความต้องการ", "demand signals", "个需求信号") },
  group: { tag: z("โต๊ะงานกรุ๊ป", "Group desk", "团队询价台"), unit: z("คำขอ", "requests", "个询价") },
  trips: { tag: z("การจองของนักเดินทาง", "Traveler bookings", "旅客预订"), unit: z("การจอง", "bookings", "个预订") },
  agency: { tag: z("ผู้ให้บริการ", "Operators", "服务商"), unit: z("ราย", "operators", "家服务商") },
};
