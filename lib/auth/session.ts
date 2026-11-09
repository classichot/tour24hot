import type { L10n } from "../data";

/**
 * Member roles and the demo session cookie, shared by proxy.ts, the auth API routes and the client.
 *
 * DEMO ONLY: the cookie is unsigned and readable by the page. Before real members use this,
 * swap signIn/signOut and decodeSession for a real provider (Auth.js, Clerk, Supabase…) with
 * signed, httpOnly sessions. Nothing outside this file and lib/auth/demo-accounts.ts needs to change.
 */

export type Role = "out-buyer" | "in-buyer" | "out-seller" | "in-seller" | "os";
export const ROLES: Role[] = ["out-buyer", "in-buyer", "out-seller", "in-seller", "os"];

const z = (th: string, en: string, zh: string, ru?: string): L10n => ({ th, en, zh, ru });

export const ROLE_INFO: Record<Role, { title: L10n; sub: L10n; home: string; group: "buy" | "sell" | "run"; dir: "outbound" | "inbound" | "os" }> = {
  "out-buyer": {
    title: z("ผู้ซื้อทัวร์ขาออก", "Outbound tour buyer", "出境游买家", "Покупатель выездных туров"),
    sub: z("ทริปต่างประเทศของคุณ การชำระเงิน เอกสาร และทัวร์ที่บันทึกไว้", "Your trips abroad, payments, documents and saved tours.", "你的出境行程、付款、证件与收藏线路。"),
    home: "/account", group: "buy", dir: "outbound",
  },
  "in-buyer": {
    title: z("ผู้ซื้อทัวร์อินบาวด์", "Inbound tour buyer", "入境游买家", "Покупатель туров по Таиланду"),
    sub: z("ทริปในไทย คำขอจองทัวร์วันเดียวและกิจกรรม และโปรไฟล์ผู้เดินทาง", "Your Thailand trips, day-tour and activity requests, and traveller profile.", "你的泰国行程、一日游与活动预订申请、旅客资料。"),
    home: "/account", group: "buy", dir: "inbound",
  },
  "out-seller": {
    title: z("ผู้ขายทัวร์ขาออก", "Outbound tour seller", "出境游卖家", "Продавец выездных туров"),
    sub: z("พื้นที่เอเจนซีขาออก: คลังแพ็กเกจ การจอง และอัปโหลดโปรแกรม", "Outbound agency workspace: inventory, bookings and itinerary upload.", "出境旅行社工作台：库存、订单与行程上传。"),
    home: "/agency", group: "sell", dir: "outbound",
  },
  "in-seller": {
    title: z("ผู้ขายทัวร์อินบาวด์", "Inbound tour seller", "入境游卖家", "Продавец туров по Таиланду"),
    sub: z("พื้นที่ DMC อินบาวด์: แพ็กเกจในไทย การจองจากตลาดต่างประเทศ และดีมานด์", "Inbound DMC workspace: Thailand packages, bookings from overseas markets and demand.", "入境地接工作台：泰国线路、海外市场订单与需求。"),
    home: "/inbound/agency", group: "sell", dir: "inbound",
  },
  os: {
    title: z("ระบบปฏิบัติการ (OS)", "Operator OS", "运营商系统 (OS)", "ОС туроператора"),
    sub: z("ทีมปฏิบัติการ: พื้นที่ทำงาน โปรเจกต์ รอบเดินทาง ซัพพลายเออร์ และการเงิน", "Operations team: workspace, projects, departures, suppliers and finance.", "运营团队：工作台、项目、发团、供应商与财务。"),
    home: "/os", group: "run", dir: "os",
  },
};

export interface Session {
  role: Role;
  id: string;
  name: string;
  email: string;
  org?: string;
}

export const SESSION_COOKIE = "t24_member";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function toB64Url(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeSession(s: Session) {
  return toB64Url(JSON.stringify(s));
}

export function decodeSession(raw: string | undefined | null): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(fromB64Url(raw)) as Session;
    return ROLES.includes(s.role) && s.id && s.name ? s : null;
  } catch {
    return null;
  }
}

/** Which roles may open a path. `null` = public. */
export function rolesFor(pathname: string): Role[] | null {
  const under = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (under("/account") || under("/trips")) return ["out-buyer", "in-buyer"];
  if (under("/inbound/agency")) return ["in-seller"];
  if (under("/agency")) return ["out-seller"];
  if (under("/os") || under("/os-legacy")) return ["os"];
  return null;
}

/** The role to offer on the sign-in page for a protected path. */
export function roleForPath(pathname: string, search: string): Role {
  const roles = rolesFor(pathname) || ["out-buyer"];
  if (roles.includes("in-buyer") && /(^|[?&])dir=inbound/.test(search)) return "in-buyer";
  return roles[0];
}
