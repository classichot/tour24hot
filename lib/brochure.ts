import { DATA, type L10n } from "./data";

export interface ExtractRow {
  field: L10n;
  value: L10n | string;
  conf: number;
  check?: boolean;
}

const KOREA: ExtractRow[] = [
  { field: { th: "ประเทศและเมือง", en: "Country & cities" }, value: { th: "เกาหลี · โซล, เกาะนามิ", en: "Korea · Seoul, Nami Island" }, conf: 98 },
  { field: { th: "จำนวนวัน", en: "Duration" }, value: { th: "5 วัน 3 คืน", en: "5 days, 3 nights" }, conf: 99 },
  { field: { th: "ราคาโฆษณา", en: "Advertised price" }, value: "฿19,900", conf: 97 },
  { field: { th: "วันเดินทาง", en: "Departure dates" }, value: { th: "2 รอบ · ต.ค. 2026", en: "2 departures · Oct 2026" }, conf: 94 },
  { field: { th: "สายการบินและไฟลต์", en: "Airline & flights" }, value: "XJ 700 / XJ 701", conf: 91 },
  { field: { th: "โรงแรม", en: "Hotels" }, value: "Stay Hotel Dongdaemun ×3", conf: 88 },
  { field: { th: "ร้านช้อปบังคับ", en: "Compulsory shopping" }, value: { th: "2 แห่ง · สมุนไพร, เครื่องสำอาง", en: "2 stops · herbs, cosmetics" }, conf: 82, check: true },
  { field: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, value: "฿1,600", conf: 90 },
];

const HOKKAIDO: ExtractRow[] = [
  { field: { th: "ประเทศและเมือง", en: "Country & cities" }, value: { th: "ญี่ปุ่น · ฮอกไกโด, ซัปโปโร", en: "Japan · Hokkaido, Sapporo" }, conf: 99 },
  { field: { th: "จำนวนวัน", en: "Duration" }, value: { th: "6 วัน 4 คืน", en: "6 days, 4 nights" }, conf: 99 },
  { field: { th: "ราคาโฆษณา", en: "Advertised price" }, value: "฿42,900", conf: 96 },
  { field: { th: "สายการบินและไฟลต์", en: "Airline & flights" }, value: "TG 670 / TG 671 · บินตรง", conf: 95 },
  { field: { th: "โรงแรม", en: "Hotels" }, value: "JR Tower Hotel Nikko Sapporo ×4", conf: 93 },
  { field: { th: "ร้านช้อปบังคับ", en: "Compulsory shopping" }, value: { th: "1 แห่ง", en: "1 stop" }, conf: 84 },
  { field: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, value: "฿1,800", conf: 89 },
  { field: { th: "ทัวร์เสริม", en: "Optional activities" }, value: { th: "กระเช้าลานสกี ฿1,200", en: "Ski-slope ropeway ฿1,200" }, conf: 71, check: true },
];

const TAIWAN: ExtractRow[] = [
  { field: { th: "ประเทศและเมือง", en: "Country & cities" }, value: { th: "ไต้หวัน · ไทเป, จิ่วเฟิน, อาลีซาน", en: "Taiwan · Taipei, Jiufen, Alishan" }, conf: 98 },
  { field: { th: "จำนวนวัน", en: "Duration" }, value: { th: "5 วัน 3 คืน", en: "5 days, 3 nights" }, conf: 99 },
  { field: { th: "ราคาโฆษณา", en: "Advertised price" }, value: "฿18,900", conf: 97 },
  { field: { th: "สายการบินและไฟลต์", en: "Airline & flights" }, value: "CI 833 / CI 834", conf: 94 },
  { field: { th: "โรงแรม", en: "Hotels" }, value: { th: "โรงแรม 3 ดาว ไทเป ×3", en: "3-star Taipei ×3" }, conf: 80, check: true },
  { field: { th: "ร้านช้อปบังคับ", en: "Compulsory shopping" }, value: { th: "1 แห่ง", en: "1 stop" }, conf: 86 },
];

export function extractBrochure(filename: string): ExtractRow[] {
  const f = filename.toLowerCase();
  if (/korea|seoul|busan|เกาหลี|โซล/.test(f)) return KOREA;
  if (/hokkaido|ฮอกไกโด|sapporo/.test(f)) return HOKKAIDO;
  if (/taiwan|taipei|ไต้หวัน|ไทเป/.test(f)) return TAIWAN;
  return DATA.extraction;
}
