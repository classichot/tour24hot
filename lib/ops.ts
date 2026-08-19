import type { L10n } from "./data";

export type TrustBand = "excellent" | "good" | "watch" | "risk";

export interface PendingAgency {
  id: string;
  name: L10n;
  licence: string;
  submitted: L10n;
  years: number;
  stage: L10n;
}

export interface QueuePackage {
  id: string;
  title: L10n;
  agency: L10n;
  flags: number;
  status: "pending" | "live" | "held";
}

export interface OpsBooking {
  ref: string;
  traveler: L10n;
  pkg: L10n;
  value: number;
  status: L10n;
}

export interface RiskAlert {
  id: string;
  level: TrustBand;
  title: L10n;
  body: L10n;
}

export interface Dispute {
  id: string;
  subject: L10n;
  agency: L10n;
  age: L10n;
}

export const OPS = {
  gmv: 18420000,
  bookingCount: 412,
  conversion: 3.1,
  livePackages: 340,
  pendingAgencies: 7,
  pendingPackages: 18,
  disputes: 4,
  agencies: [
    { id: "siam", name: { th: "สยามฮอไรซอนทัวร์", en: "Siam Horizon Tours" }, licence: "11/09876", trust: 94, band: "excellent" as TrustBand, bookings: 1284, cancel: 1.2, status: "live" },
    { id: "orient", name: { th: "โอเรียนท์ลิงก์ทราเวล", en: "Orient Link Travel" }, licence: "11/07341", trust: 91, band: "excellent" as TrustBand, bookings: 2106, cancel: 0.9, status: "live" },
    { id: "vela", name: { th: "เวลาทราเวลกรุ๊ป", en: "Vela Travel Group" }, licence: "11/10552", trust: 86, band: "good" as TrustBand, bookings: 604, cancel: 2.4, status: "live" },
    { id: "nakara", name: { th: "นาคาราฮอลิเดย์", en: "Nakara Holiday" }, licence: "11/11208", trust: 79, band: "watch" as TrustBand, bookings: 318, cancel: 3.8, status: "live" },
    { id: "bkkjet", name: { th: "บางกอกเจ็ททัวร์", en: "Bangkok Jet Tour" }, licence: "11/12043", trust: 72, band: "risk" as TrustBand, bookings: 197, cancel: 5.1, status: "watch" },
  ],
  queue: [
    { id: "q1", name: { th: "แปซิฟิกสกายทราเวล", en: "Pacific Sky Travel" }, licence: "11/13402", submitted: { th: "18 ส.ค. 2026", en: "18 Aug 2026" }, years: 8, stage: { th: "ตรวจใบอนุญาต", en: "Licence check" } },
    { id: "q2", name: { th: "โกลเด้นรูททัวร์", en: "Golden Route Tours" }, licence: "11/12881", submitted: { th: "16 ส.ค. 2026", en: "16 Aug 2026" }, years: 12, stage: { th: "ยืนยันบัญชีธนาคาร", en: "Bank verification" } },
    { id: "q3", name: { th: "นอร์ทสตาร์ฮอลิเดย์", en: "Northstar Holiday" }, licence: "11/14119", submitted: { th: "12 ส.ค. 2026", en: "12 Aug 2026" }, years: 3, stage: { th: "ตรวจกรรมการ", en: "Director check" } },
  ] satisfies PendingAgency[],
  packages: [
    { id: "jp01", title: { th: "โตเกียว ฟูจิ คาวาโกเอะ ไม่ลงร้าน", en: "Tokyo Fuji Kawagoe — no shopping" }, agency: { th: "สยามฮอไรซอน", en: "Siam Horizon" }, flags: 0, status: "live" },
    { id: "jp02", title: { th: "โตเกียว ฟูจิ ราคาประหยัด", en: "Tokyo Fuji budget special" }, agency: { th: "บางกอกเจ็ท", en: "Bangkok Jet" }, flags: 4, status: "held" },
    { id: "new1", title: { th: "ฮอกไกโด ลานสกี 6 วัน (ร่าง)", en: "Hokkaido ski 6D (draft)" }, agency: { th: "เวลาทราเวล", en: "Vela Travel" }, flags: 2, status: "pending" },
    { id: "cn02", title: { th: "จางเจียเจี้ย เทียนเหมินซาน", en: "Zhangjiajie & Tianmen" }, agency: { th: "สยามฮอไรซอน", en: "Siam Horizon" }, flags: 1, status: "live" },
  ] satisfies QueuePackage[],
  bookingRows: [
    { ref: "T24-908311", traveler: { th: "ธนกฤต พ.", en: "Thanakrit P." }, pkg: { th: "โตเกียว ฟูจิ ไม่ลงร้าน", en: "Tokyo Fuji no shopping" }, value: 115200, status: { th: "ยืนยันแล้ว", en: "Confirmed" } },
    { ref: "T24-908455", traveler: { th: "ณิชา ว.", en: "Nicha W." }, pkg: { th: "จางเจียเจี้ย 6 วัน", en: "Zhangjiajie 6D" }, value: 63600, status: { th: "มัดจำแล้ว", en: "Deposit paid" } },
    { ref: "T24-908502", traveler: { th: "สมชาย ต.", en: "Somchai T." }, pkg: { th: "โตเกียว ฟูจิ ไม่ลงร้าน", en: "Tokyo Fuji no shopping" }, value: 153600, status: { th: "รอยืนยันที่นั่ง", en: "Seat hold" } },
  ] satisfies OpsBooking[],
  risk: [
    { id: "r1", level: "risk", title: { th: "รีวิวกระชากขึ้นผิดปกติ", en: "Unusual review spike" }, body: { th: "บางกอกเจ็ทได้รีวิว 5 ดาว 19 รายใน 48 ชั่วโมง จากบัญชีที่เพิ่งสร้าง", en: "Bangkok Jet received nineteen 5-star reviews in 48 hours from newly created accounts." } },
    { id: "r2", level: "watch", title: { th: "อัตรายกเลิกกลุ่มสูง", en: "High group-cancellation rate" }, body: { th: "นาคาราฮอลิเดย์ยกเลิก 3.8% ใน 90 วัน เทียบค่าเฉลี่ยตลาด 1.4%", en: "Nakara Holiday cancelled 3.8% of groups in 90 days versus a 1.4% market average." } },
    { id: "r3", level: "watch", title: { th: "โบรชัวร์ระบุโรงแรมกำกวม", en: "Vague hotel wording" }, body: { th: "แพ็กเกจ jp02 ใช้คำว่า “3 ดาว หรือเทียบเท่า” ทั้ง 3 คืน — ถูกตั้งข้อสังเกต 4 จุด", en: "Package jp02 lists “3-star or equivalent” for all 3 nights — four truth-checker flags." } },
  ] satisfies RiskAlert[],
  tickets: [
    { id: "D-441", subject: { th: "โรงแรมไม่ตรงโบรชัวร์ — ฮอกไกโด", en: "Hotel not as advertised — Hokkaido" }, agency: { th: "เวลาทราเวล", en: "Vela Travel" }, age: { th: "2 วัน", en: "2 days" } },
    { id: "D-438", subject: { th: "ขอคืนมัดจำหลังกลุ่มไม่ครบ", en: "Deposit refund after group missed minimum" }, agency: { th: "นาคาราฮอลิเดย์", en: "Nakara Holiday" }, age: { th: "5 วัน", en: "5 days" } },
    { id: "D-429", subject: { th: "ทิปถูกเก็บซ้ำที่สนามบิน", en: "Tips collected twice at the airport" }, agency: { th: "บางกอกเจ็ท", en: "Bangkok Jet" }, age: { th: "8 วัน", en: "8 days" } },
  ] satisfies Dispute[],
};

export function trustBand(score: number): TrustBand {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 75) return "watch";
  return "risk";
}
