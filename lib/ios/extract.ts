import type { Company } from "./types";

/**
 * Brief extraction (ENQ03). Proposes values with the exact source excerpt and a confidence level.
 * It never invents dates, currency or suppliers: anything not stated stays unresolved.
 * Pasted and uploaded text is treated as data only (AI05) — nothing in it is executed or obeyed.
 * In production this is the AI "Extract brief" action; the review contract is the same.
 */

export type Confidence = "high" | "medium" | "low";

export interface Proposal {
  field: string;
  label: string;
  value: string;
  excerpt: string;
  confidence: Confidence;
}

export interface Extraction {
  proposals: Proposal[];
  questions: string[];
  warnings: string[];
}

const DESTINATIONS = [
  "Bangkok", "Chiang Mai", "Chiang Rai", "Golden Triangle", "Chiang Saen", "Phuket", "Krabi", "Pattaya", "Ayutthaya",
  "Koh Samui", "Hua Hin", "Kanchanaburi", "Pai", "Sukhothai", "Khao Yai", "Koh Phi Phi", "Phang Nga", "Mae Hong Son",
];
const DEST_ALIASES: Record<string, string> = { 清迈: "Chiang Mai", 清莱: "Chiang Rai", 曼谷: "Bangkok", 普吉: "Phuket", 金三角: "Golden Triangle", 芭提雅: "Pattaya" };
const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const CURRENCIES: Record<string, string> = { thb: "THB", baht: "THB", "฿": "THB", usd: "USD", "us$": "USD", "$": "USD", cny: "CNY", rmb: "CNY", "¥": "CNY", "元": "CNY", eur: "EUR", "€": "EUR", myr: "MYR", rm: "MYR", krw: "KRW", sgd: "SGD" };

const clip = (text: string, idx: number, len: number) => {
  const a = Math.max(0, idx - 24);
  const b = Math.min(text.length, idx + len + 24);
  return `${a > 0 ? "…" : ""}${text.slice(a, b).replace(/\s+/g, " ").trim()}${b < text.length ? "…" : ""}`;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function extractBrief(raw: string, companies: Company[], refYear: number): Extraction {
  const text = raw.slice(0, 20000);
  const lower = text.toLowerCase();
  const proposals: Proposal[] = [];
  const questions: string[] = [];
  const warnings: string[] = [];
  const add = (field: string, label: string, value: string, idx: number, len: number, confidence: Confidence) =>
    proposals.push({ field, label, value, excerpt: clip(text, idx, len), confidence });

  // Guest counts
  const adultsM = /(\d{1,4})\s*(?:adults?|guests?|pax|people|persons?|travell?ers?|participants|名?(?:客人|游客|人))/i.exec(text);
  const kidsM = /(\d{1,3})\s*(?:children|child|kids?|儿童)/i.exec(text);
  const infM = /(\d{1,2})\s*(?:infants?|babies|婴儿)/i.exec(text);
  if (adultsM) {
    const isAdults = /adult/i.test(adultsM[0]);
    let adults = Number(adultsM[1]);
    if (!isAdults && kidsM) adults = Math.max(0, adults - Number(kidsM[1]) - (infM ? Number(infM[1]) : 0));
    add("adults", "Adults", String(adults), adultsM.index, adultsM[0].length, isAdults || !kidsM ? "high" : "medium");
    if (!isAdults && !kidsM) questions.push(`“${adultsM[0].trim()}” — are all of them adults, or are children or infants included?`);
  } else questions.push("How many guests (adults, children, infants)?");
  if (kidsM) add("children", "Children", kidsM[1], kidsM.index, kidsM[0].length, "high");
  if (infM) add("infants", "Infants", infM[1], infM.index, infM[0].length, "high");

  // Destinations
  const dests: { name: string; idx: number; len: number }[] = [];
  for (const d of DESTINATIONS) {
    const i = lower.indexOf(d.toLowerCase());
    if (i >= 0) dests.push({ name: d, idx: i, len: d.length });
  }
  for (const [alias, d] of Object.entries(DEST_ALIASES)) {
    const i = text.indexOf(alias);
    if (i >= 0 && !dests.some((x) => x.name === d)) dests.push({ name: d, idx: i, len: alias.length });
  }
  dests.sort((a, b) => a.idx - b.idx);
  if (dests.length) add("destinations", "Destinations", dests.map((d) => d.name).join(", "), dests[0].idx, Math.min(80, dests[dests.length - 1].idx + dests[dests.length - 1].len - dests[0].idx), "high");
  else questions.push("Which destinations should the trip cover?");

  // Duration
  const durM = /(\d{1,2})\s*(?:days?|d\b|天)(?:\s*\/?\s*(\d{1,2})\s*(?:nights?|n\b|晚))?/i.exec(text) || /(\d{1,2})D(\d{1,2})N/i.exec(text);
  if (durM) add("duration", "Duration (days)", durM[1], durM.index, durM[0].length, "high");

  // Dates: "12–17 Oct 2026", "12 Oct 2026", "2026-10-12", "12/10/2026"
  let start: string | undefined;
  let end: string | undefined;
  const range = /(\d{1,2})\s*(?:–|-|to)\s*(\d{1,2})\s+([A-Za-z]{3,9})\.?\s*(\d{4})?/i.exec(text);
  const single = /(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})/i.exec(text);
  const iso = /(20\d{2})-(\d{2})-(\d{2})/.exec(text);
  const rangeMonth = range ? MONTHS[range[3].slice(0, 3).toLowerCase()] : undefined;
  if (range && rangeMonth) {
    const m = rangeMonth;
    const y = range[4] ? Number(range[4]) : refYear;
    start = `${y}-${pad(m)}-${pad(Number(range[1]))}`;
    end = `${y}-${pad(m)}-${pad(Number(range[2]))}`;
    add("startDate", "Start date", start, range.index, range[0].length, range[4] ? "high" : "low");
    add("endDate", "End date", end, range.index, range[0].length, range[4] ? "high" : "low");
    if (!range[4]) questions.push(`The year for “${range[0].trim()}” is not stated — confirm ${y}.`);
  } else if (iso) {
    start = `${iso[1]}-${iso[2]}-${iso[3]}`;
    add("startDate", "Start date", start, iso.index, iso[0].length, "high");
  } else if (single && MONTHS[single[2].slice(0, 3).toLowerCase()]) {
    start = `${single[3]}-${pad(MONTHS[single[2].slice(0, 3).toLowerCase()])}-${pad(Number(single[1]))}`;
    add("startDate", "Start date", start, single.index, single[0].length, "medium");
  }
  if (!start) {
    const monthOnly = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b(?:\s+(\d{4}))?/i.exec(text);
    if (monthOnly) {
      add("flexibleDates", "Flexible dates", monthOnly[0], monthOnly.index, monthOnly[0].length, "medium");
      questions.push(`Exact travel dates are not stated — only “${monthOnly[0]}”.`);
    } else questions.push("What are the travel dates? (none stated)");
  }
  if (start && !end && durM) questions.push("End date not stated — derive it from the duration once the start date is confirmed.");

  // Budget and currency
  const money = /(thb|usd|cny|rmb|eur|myr|krw|sgd|us\$|฿|\$|¥|€|rm)\s?([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s?(thb|baht|usd|cny|rmb|eur|myr|krw|sgd|元)/i.exec(text);
  if (money) {
    const cur = CURRENCIES[(money[1] || money[4]).toLowerCase()] ?? (money[1] || money[4]).toUpperCase();
    const amt = (money[2] || money[3]).replace(/,/g, "");
    const after = lower.slice(money.index, money.index + money[0].length + 30);
    const perPerson = /per\s*(?:person|pax|head|guest)|\bpp\b|\/\s*(?:person|pax)|每人/.test(after);
    add("budget", "Budget", `${cur} ${Number(amt).toLocaleString("en-US")} ${perPerson ? "per person" : "total"}`, money.index, money[0].length + 14, perPerson ? "high" : "medium");
    if (!perPerson && !/total|in total|overall/.test(after)) questions.push("Is the budget per person or for the whole group?");
  } else {
    const bare = /budget[^\d]{0,20}([\d,]{3,})/i.exec(text);
    if (bare) {
      add("budgetAmount", "Budget amount (currency unknown)", bare[1], bare.index, bare[0].length, "low");
      questions.push("Which currency is the budget in? (not stated)");
    } else questions.push("Is there a budget, and in which currency?");
  }

  // Language, hotels, dietary, access
  const lang = /(mandarin|chinese|cantonese|english|korean|japanese|russian|malay|thai)[- ]?(?:speaking)?\s*guide|guide[^.]{0,20}(mandarin|chinese|english|korean|japanese|russian)|中文导游/i.exec(text);
  if (lang) add("language", "Guide language", (lang[1] || lang[2] || "Chinese").replace(/^\w/, (c) => c.toUpperCase()), lang.index, lang[0].length, "high");
  const hotel = /(\d)\s*[- ]?(?:star|\*|星)/i.exec(text);
  if (hotel) add("hotelPref", "Hotel preference", `${hotel[1]}-star`, hotel.index, hotel[0].length, "medium");
  const diet = /(halal|vegetarian|vegan|no pork|gluten[- ]free|kosher|清真|素食)/i.exec(text);
  if (diet) add("dietary", "Dietary", diet[1], diet.index, diet[0].length, "high");
  const access = /(wheelchair|elderly|seniors?|limited mobility|accessible)/i.exec(text);
  if (access) add("accessibility", "Accessibility", access[1], access.index, access[0].length, "medium");
  const noShop = /(no shopping|no shops?|without shopping|纯玩|不进店)/i.exec(text);
  if (noShop) add("requirements", "Requirement", "No shopping stops", noShop.index, noShop[0].length, "high");

  // Partner match against the directory (never created automatically)
  for (const c of companies.filter((x) => x.roles.includes("partner"))) {
    const key = c.name.split(/[ ·]/).find((w) => w.length > 4);
    const i = key ? lower.indexOf(key.toLowerCase()) : -1;
    if (i >= 0) {
      add("partnerId", "Sales partner", c.id, i, key!.length, "medium");
      break;
    }
  }
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(text);
  if (email) add("contactEmail", "Contact email", email[0], email.index, email[0].length, "high");
  if (!proposals.some((p) => p.field === "partnerId") && !email) questions.push("Who is the customer or sales partner, and who should receive the quotation?");

  // Embedded instructions are data, not commands (AI05, AT15).
  if (/(ignore (all|previous)|send (all|every)|export|passport files|disclose|forward .* to)/i.test(text)) {
    warnings.push("The text contains instructions (for example to send or export data). They were treated as data and not acted on.");
  }
  return { proposals, questions, warnings };
}

export const SUPPORTED_UPLOADS = [".txt", ".csv", ".md", ".eml", ".json", ".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"];
export const READABLE_IN_BROWSER = [".txt", ".csv", ".md", ".eml", ".json"];
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES = 10;
