import type { Dict } from "./i18n";
import { agencyById, type Departure, type DepartureStatus, type Loc, type L10n, type Pkg } from "./data";

export type LFn = (v: Loc | null | undefined) => string;
export type MoneyFn = (n: number) => string;

export function statusInfo(status: DepartureStatus, t: Dict) {
  const base = "text-[11px] font-extrabold uppercase tracking-[0.04em] px-2.5 py-1";
  const m: Record<DepartureStatus, { label: string; cls: string }> = {
    confirmed: { label: t.stConfirmed, cls: "bg-accent text-text" },
    nearly: { label: t.stNearly, cls: "bg-accent-200 text-accent-800" },
    open: { label: t.stOpen, cls: "bg-neutral-200 text-neutral-800" },
    limited: { label: t.stLimited, cls: "bg-accent-700 text-bg" },
    sold: { label: t.stSold, cls: "bg-neutral-800 text-bg" },
    cancelled: { label: t.stCancelled, cls: "bg-neutral-800 text-bg" },
  };
  const v = m[status] || m.open;
  return { label: v.label, cls: `${base} ${v.cls}` };
}

export function tagLabel(tag: string, t: Dict, L: LFn) {
  const m: Record<string, string> = {
    noshop: t.noShopFlag,
    family: t.family,
    elderly: L({ th: "ผู้สูงอายุเดินสบาย", en: "Elderly friendly" }),
    luxury: L({ th: "ลักชัวรี", en: "Luxury" }),
    budget: L({ th: "ประหยัด", en: "Budget" }),
    smallgroup: t.smallGroup,
    freeday: t.freeDayFlag,
    direct: t.directFlight,
    adventure: L({ th: "แอดเวนเจอร์", en: "Adventure" }),
    honeymoon: L({ th: "ฮันนีมูน", en: "Honeymoon" }),
    festival: L({ th: "เทศกาล", en: "Festival", zh: "节庆" }),
    food: L({ th: "อาหารและวัฒนธรรม", en: "Food & culture", zh: "美食文化" }),
    inbound: t.inboundBadge,
  };
  return m[tag] || tag;
}

/** AI Package Difference Explainer — what the price gap actually buys. */
export function aiDiffFor(cols: Pkg[], t: Dict, L: LFn, money: MoneyFn) {
  if (cols.length < 2) return null;
  const byReal = cols.slice().sort((a, b) => a.real - b.real);
  const cheap = byReal[0];
  let best = cols.slice().sort((a, b) => b.quality.score - a.quality.score)[0];
  if (best.id === cheap.id) best = byReal[byReal.length - 1];
  const gap = best.real - cheap.real;
  const bt = L(best.title), ct = L(cheap.title);
  const b: string[] = [];
  if (best.airlineType !== cheap.airlineType) {
    b.push(
      L({
        th: `${L(best.airlineName)} (${airLabel(best, t)}) แทน ${L(cheap.airlineName)} (${airLabel(cheap, t)}) และกระเป๋า ${best.baggage} แทน ${cheap.baggage}`,
        en: `${L(best.airlineName)} (${airLabel(best, t)}) instead of ${L(cheap.airlineName)} (${airLabel(cheap, t)}), with ${best.baggage} baggage instead of ${cheap.baggage}`,
        zh: `${L(best.airlineName)}（${airLabel(best, t)}）对比 ${L(cheap.airlineName)}（${airLabel(cheap, t)}），行李 ${best.baggage} 对 ${cheap.baggage}`,
      })
    );
  }
  if (best.hotelStar > cheap.hotelStar) {
    b.push(
      L({
        th: `โรงแรม ${best.hotelStar} ดาวระบุชื่อจริง (${L(best.hotels[0].name)}) แทน ${cheap.hotelStar} ดาว`,
        en: `Named ${best.hotelStar}-star hotels (${L(best.hotels[0].name)}) instead of ${cheap.hotelStar}-star`,
      })
    );
  }
  if (best.meals > cheap.meals) {
    b.push(L({ th: `อาหารมากกว่า ${best.meals - cheap.meals} มื้อ`, en: `${best.meals - cheap.meals} more meals included` }));
  }
  if (cheap.shopping > best.shopping) {
    b.push(
      L({
        th: `ไม่มีร้านช้อปบังคับ ขณะที่อีกแพ็กเกจมี ${cheap.shopping} แห่ง`,
        en: `No compulsory shopping, against ${cheap.shopping} stops in the cheaper package`,
      })
    );
  }
  if (best.freeDays > cheap.freeDays) {
    b.push(L({ th: `มีวันอิสระ ${best.freeDays} วัน`, en: `${best.freeDays} free day(s) in the itinerary` }));
  }
  if (best.group < cheap.group) {
    b.push(L({ th: `กลุ่มเล็กกว่า ${best.group} คน เทียบกับ ${cheap.group} คน`, en: `Smaller group of ${best.group} against ${cheap.group}` }));
  }
  if (cheap.truth.length > best.truth.length) {
    b.push(
      L({
        th: `โบรชัวร์ไม่มีข้อความกำกวม ขณะที่อีกแพ็กเกจถูกตั้งข้อสังเกต ${cheap.truth.length} จุด`,
        en: `No misleading wording, against ${cheap.truth.length} flags on the cheaper brochure`,
      })
    );
  }
  if (agencyById(best.agency).trust > agencyById(cheap.agency).trust) {
    b.push(
      L({
        th: `เอเจนซีคะแนน ${agencyById(best.agency).trust} เทียบกับ ${agencyById(cheap.agency).trust}`,
        en: `Agency trust ${agencyById(best.agency).trust} against ${agencyById(cheap.agency).trust}`,
      })
    );
  }
  const summary =
    gap === 0
      ? L({ th: `${bt} และ ${ct} ราคารวมจริงเท่ากัน แต่รายละเอียดต่างกัน`, en: `${bt} and ${ct} cost the same in real terms but differ inside` })
      : L({
          th: `${bt} แพงกว่า ${money(gap)} แต่แลกมาด้วย ${b.length} ข้อที่ต่างกันจริง — คะแนนรายการเดินทาง ${best.quality.score} เทียบกับ ${cheap.quality.score}`,
          en: `${bt} costs ${money(gap)} more and buys ${b.length} real differences — itinerary quality ${best.quality.score} against ${cheap.quality.score}`,
        });
  return { summary, bullets: b.slice(0, 6) };
}

export interface MatchResult {
  p: Pkg;
  score: number;
  why: string[];
}

/** AI Travel Match scoring — ranks packages against quiz answers, with reasons. */
export function matchResults(answers: Record<string, string>, t: Dict, L: LFn, money: MoneyFn, all: Pkg[]): MatchResult[] {
  const a = answers;
  if (!a || Object.keys(a).length === 0) return [];
  const budget = Number(a.budget || 99999);
  const scored = all
    .map((p) => {
      let sc = 58;
      const why: string[] = [];
      const tags = p.tags || [];
      if (a.who === "family" && tags.includes("family")) {
        sc += 12;
        why.push(L({ th: "จัดจังหวะเหมาะกับครอบครัวที่มีเด็ก", en: "Paced for families with children" }));
      }
      if (a.who === "elderly" && tags.includes("elderly")) {
        sc += 13;
        why.push(L({ th: "เดินน้อย โรงแรมมีลิฟต์ เหมาะกับผู้สูงอายุ", en: "Short walks and lift-served hotels for elderly travellers" }));
      }
      if (a.who === "couple" && tags.includes("honeymoon")) {
        sc += 10;
        why.push(L({ th: "เหมาะกับคู่รัก กลุ่มเล็ก", en: "Suits couples, small group" }));
      }
      if (p.real <= budget) {
        sc += 14;
        why.push(L({ th: `ราคารวมจริง ${money(p.real)} อยู่ในงบของคุณ`, en: `Real total cost ${money(p.real)} is inside your budget` }));
      } else {
        sc -= 26;
      }
      if (a.pace === "slow" && p.quality.factors[0].score >= 80) {
        sc += 8;
        why.push(L({ th: "นั่งรถต่อวันไม่นาน จังหวะสบาย", en: "Low daily travel time — a relaxed pace" }));
      }
      if (a.pace === "packed" && p.attractions >= 9) {
        sc += 7;
        why.push(L({ th: `เที่ยว ${p.attractions} จุด คุ้มค่าเวลา`, en: `${p.attractions} attractions — a full itinerary` }));
      }
      if (a.focus === "food" && tags.includes("food")) sc += 6;
      if (a.focus === "shopping" && p.shopping > 0) sc += 5;
      if (a.shop === "no") {
        if (p.shopping === 0) {
          sc += 15;
          why.push(L({ th: "ไม่มีร้านช้อปบังคับเลย", en: "Zero compulsory shopping stops" }));
        } else sc -= 20;
      } else if (a.shop === "some" && p.shopping <= 2) sc += 5;
      if (a.air === "full") {
        if (p.airlineType === "full") {
          sc += 10;
          why.push(L({ th: `บิน ${L(p.airlineName)} ฟูลเซอร์วิส กระเป๋า ${p.baggage}`, en: `${L(p.airlineName)} full service, ${p.baggage} baggage` }));
        } else sc -= 12;
      }
      if (a.air === "direct") {
        if (p.direct) {
          sc += 8;
          why.push(L({ th: "บินตรง ไม่ต่อเครื่อง", en: "Direct flight, no connection" }));
        } else sc -= 10;
      }
      if (a.free === "yes") {
        if (p.freeDays > 0) {
          sc += 10;
          why.push(L({ th: `มีวันอิสระ ${p.freeDays} วัน`, en: `${p.freeDays}${p.freeDays === 1 ? " free day" : " free days"} built in` }));
        } else sc -= 12;
      }
      sc += Math.round((p.quality.score - 70) / 4);
      if (p.truth.length === 0) {
        sc += 4;
        why.push(L({ th: "โบรชัวร์ไม่มีข้อความกำกวม", en: "Brochure carries no misleading wording" }));
      } else sc -= p.truth.length * 3;
      const ag = agencyById(p.agency);
      if (ag.trust >= 90) {
        sc += 4;
        why.push(L({ th: `เอเจนซีคะแนน ${ag.trust} · ${L(ag.name)}`, en: `Agency trust ${ag.trust} · ${L(ag.name)}` }));
      }
      return { p, score: Math.max(41, Math.min(98, sc)), why: why.slice(0, 4) };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
  return scored;
}

export interface BurnDeal {
  p: Pkg;
  depIndex: number;
  days: number;
  disc: number;
  atCost: boolean;
  need: number;
  now: number;
  save: number;
}

export const BURN_DEFS = [
  { id: "jp02", dep: 0, days: 9, disc: 0.34, atCost: true, need: 5 },
  { id: "tw01", dep: 0, days: 12, disc: 0.27, atCost: false, need: 4 },
  { id: "kr01", dep: 0, days: 16, disc: 0.19, atCost: false, need: 0 },
  { id: "jp04", dep: 0, days: 21, disc: 0.22, atCost: true, need: 6 },
  { id: "cn02", dep: 1, days: 26, disc: 0.14, atCost: false, need: 7 },
];

export function burnDeals(packages: Pkg[]): BurnDeal[] {
  return BURN_DEFS.map((d) => {
    const p = packages.find((x) => x.id === d.id);
    if (!p) return null;
    const dep = p.departures[d.dep] || p.departures[0];
    const need = Math.min(d.need, dep.seats);
    const now = Math.round((p.real * (1 - d.disc)) / 100) * 100;
    return { p, depIndex: d.dep, days: d.days, disc: d.disc, atCost: d.atCost, need, now, save: p.real - now };
  }).filter((x): x is BurnDeal => x !== null);
}

export type ShopLevel = "none" | "low" | "med" | "high";

export function shopLevel(p: Pkg): ShopLevel {
  if (p.shopping === 0) return "none";
  if (p.shopping === 1) return "low";
  if (p.shopping === 2) return "med";
  return "high";
}

export function shopLabel(level: ShopLevel, t: Dict) {
  const m: Record<ShopLevel, string> = {
    none: t.shopNone,
    low: t.shopLow,
    med: t.shopMed,
    high: t.shopHigh,
  };
  return m[level];
}

export function valueBadge(p: Pkg, t: Dict) {
  if (p.quality.score >= 88 && p.real <= 45000) return t.valueBest;
  if (p.hotelStar >= 5 || p.tags.includes("luxury")) return t.valuePremium;
  if (p.tags.includes("budget")) return t.valueBudget;
  return null;
}

export function isInbound(p: Pkg) {
  return p.direction === "inbound";
}

export function airLabel(p: Pkg, t: Dict) {
  if (p.airlineType === "land") return t.landPackage;
  return p.airlineType === "full" ? t.fullService : t.lowCost;
}

export function similarTours(p: Pkg, all: Pkg[], n = 3) {
  return all
    .filter((x) => x.id !== p.id)
    .map((x) => {
      let s = 0;
      if ((x.direction === "inbound") === (p.direction === "inbound")) s += 25;
      if (x.country.en === p.country.en) s += 40;
      if (x.city.en === p.city.en) s += 20;
      s += 20 - Math.min(20, Math.abs(x.days - p.days) * 6);
      s += 15 - Math.min(15, Math.abs(x.real - p.real) / 2500);
      s += 10 - Math.min(10, Math.abs(x.quality.score - p.quality.score) / 4);
      return { p: x, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.p);
}

export interface AdvisorParse {
  answers: Record<string, string>;
  dest: string | null;
  region: string | null;
  shopExplicit: boolean;
  notes: L10n[];
}

export interface AdvisorFollowUp {
  id: "dest" | "region" | "shop";
  q: L10n;
  opts: { v: string; label: L10n }[];
}

export interface AdvisorExtras {
  dest?: string | null;
  region?: string | null;
  shop?: string;
}

export interface PriceIntel {
  n: number;
  low: number;
  avg: number;
  high: number;
  pct: number;
  band: "great" | "fair" | "high";
}

export interface GroupBid {
  agency: string;
  price: number;
  days: number;
  hotel: L10n;
  shopping: L10n;
  airline: L10n;
  note: L10n;
  delay: number;
}

export function parseAdvisorQuery(text: string): AdvisorParse {
  const q = text.toLowerCase();
  const answers: Record<string, string> = {
    who: "friends",
    budget: "99999",
    when: "any",
    pace: "balanced",
    focus: "sights",
    shop: "some",
    air: "any",
    free: "no",
  };
  const notes: L10n[] = [];

  let dest: string | null = null;
  let region: string | null = null;
  if (/hokkaido|ฮอกไกโด|sapporo|ซัปโปโร/.test(q)) {
    dest = "Japan";
    region = "hokkaido";
    notes.push({ th: "จุดหมาย: ฮอกไกโด / ญี่ปุ่น", en: "Destination: Hokkaido / Japan" });
  } else if (/osaka|โอซาก้า|kyoto|เกียวโต/.test(q)) {
    dest = "Japan";
    region = "kansai";
    notes.push({ th: "จุดหมาย: โอซาก้า / เกียวโต", en: "Destination: Osaka / Kyoto" });
  } else if (/tokyo|โตเกียว|fuji|ฟูจิ|kawaguchiko|คาวากุชิโกะ/.test(q)) {
    dest = "Japan";
    region = "kanto";
    notes.push({ th: "จุดหมาย: โตเกียว / ฟูจิ", en: "Destination: Tokyo / Fuji" });
  } else if (/japan|ญี่ปุ่น/.test(q)) {
    dest = "Japan";
    notes.push({ th: "จุดหมาย: ญี่ปุ่น", en: "Destination: Japan" });
  } else if (/golden triangle|สามเหลี่ยมทองคำ|金三角|chiang mai|chiang rai|เชียงใหม่|เชียงราย|清迈|清莱|inbound|อินบาวด์|入境/.test(q)) {
    dest = "Thailand";
    region = "north";
    notes.push({ th: "จุดหมาย: เชียงใหม่ / เชียงราย / สามเหลี่ยมทองคำ", en: "Destination: Chiang Mai / Chiang Rai / Golden Triangle", zh: "目的地：清迈 / 清莱 / 金三角" });
  } else if (/korea|เกาหลี|seoul|โซล|busan|ปูซาน/.test(q)) {
    dest = "Korea";
    notes.push({ th: "จุดหมาย: เกาหลี", en: "Destination: Korea" });
  } else if (/china|จีน|chengdu|เฉิงตู|zhangjiajie|จางเจียเจี้ย/.test(q)) {
    dest = "China";
    notes.push({ th: "จุดหมาย: จีน", en: "Destination: China" });
  } else if (/taiwan|ไต้หวัน|taipei|ไทเป/.test(q)) {
    dest = "Taiwan";
    notes.push({ th: "จุดหมาย: ไต้หวัน", en: "Destination: Taiwan" });
  } else if (/vietnam|เวียดนาม|hoi an|ฮอยอัน/.test(q)) {
    dest = "Vietnam";
    notes.push({ th: "จุดหมาย: เวียดนาม", en: "Destination: Vietnam" });
  }

  if (/parent|elderly|ผู้สูงอายุ|พ่อแม่|คุณแม่|คุณพ่อ|เดินน้อย|minimal walking/.test(q)) {
    answers.who = "elderly";
    answers.pace = "slow";
    notes.push({ th: "กลุ่ม: มีผู้สูงอายุ / จังหวะสบาย", en: "Party: elderly / relaxed pace" });
  } else if (/family|ครอบครัว|เด็ก|kids/.test(q)) {
    answers.who = "family";
    notes.push({ th: "กลุ่ม: ครอบครัว", en: "Party: family" });
  } else if (/couple|คู่รัก|honeymoon|ฮันนีมูน/.test(q)) {
    answers.who = "couple";
    notes.push({ th: "กลุ่ม: คู่รัก", en: "Party: couple" });
  }

  const k = q.match(/(\d+)\s*k\b/);
  const plain = q.match(/฿?\s*(\d{1,3}(?:,\d{3})+|\d{4,6})/);
  let budget = 99999;
  if (k) budget = Number(k[1]) * 1000;
  else if (plain) budget = Number(plain[1].replace(/,/g, ""));
  if (budget < 1000) budget = 99999;
  if (budget <= 25000) answers.budget = "25000";
  else if (budget <= 40000) answers.budget = "40000";
  else if (budget <= 60000) answers.budget = "60000";
  else answers.budget = "99999";
  if (budget < 99999) notes.push({ th: `งบไม่เกิน ฿${budget.toLocaleString("en-US")}`, en: `Budget up to ฿${budget.toLocaleString("en-US")}` });

  if (/oct|ตุลา/.test(q)) {
    answers.when = "oct";
    notes.push({ th: "เดือน: ตุลาคม", en: "Month: October" });
  } else if (/nov|พฤศจิกา/.test(q)) {
    answers.when = "nov";
    notes.push({ th: "เดือน: พฤศจิกายน", en: "Month: November" });
  } else if (/dec|jan|ธันวา|มกรา/.test(q)) {
    answers.when = "dec";
    notes.push({ th: "เดือน: ธ.ค.–ม.ค.", en: "Month: Dec–Jan" });
  }

  if (/5.?6|6.?วัน|5.?วัน|5–6|5-6/.test(q)) {
    notes.push({ th: "ระยะ: 5–6 วัน", en: "Duration: 5–6 days" });
  }

  let shopExplicit = false;
  if (/no shop|ไม่.*ช้อป|minimal shopping|ไม่ลงร้าน|ไม่มีร้าน/.test(q)) {
    answers.shop = "no";
    shopExplicit = true;
    notes.push({ th: "ร้านช้อป: ไม่รับเลย", en: "Shopping: none" });
  }

  if (/direct|บินตรง/.test(q)) {
    answers.air = "direct";
    notes.push({ th: "บินตรง", en: "Direct flight" });
  } else if (/full.?service|ฟูลเซอร์วิส|thai airways|jal|ana/.test(q)) {
    answers.air = "full";
    notes.push({ th: "สายการบินฟูลเซอร์วิส", en: "Full-service airline" });
  }

  if (/free day|วันอิสระ/.test(q)) {
    answers.free = "yes";
    notes.push({ th: "ต้องการวันอิสระ", en: "Wants a free day" });
  }

  return { answers, dest, region, shopExplicit, notes };
}

export function advisorFollowups(parse: AdvisorParse): AdvisorFollowUp[] {
  const out: AdvisorFollowUp[] = [];
  if (!parse.dest) {
    out.push({
      id: "dest",
      q: { th: "อยากไปประเทศไหนเป็นหลัก", en: "Which destination should we search first?" },
      opts: [
        { v: "Japan", label: { th: "ญี่ปุ่น", en: "Japan" } },
        { v: "Korea", label: { th: "เกาหลี", en: "Korea" } },
        { v: "China", label: { th: "จีน", en: "China" } },
        { v: "Taiwan", label: { th: "ไต้หวัน", en: "Taiwan" } },
        { v: "Thailand", label: { th: "ไทยอินบาวด์", en: "Thailand inbound", zh: "泰国入境" } },
        { v: "any", label: { th: "ไม่จำกัด", en: "No preference" } },
      ],
    });
  } else if (parse.dest === "Japan" && !parse.region) {
    out.push({
      id: "region",
      q: { th: "ญี่ปุ่นโซนไหน — โตเกียว/ฟูจิ โอซาก้า/เกียวโต หรือฮอกไกโด", en: "Japan — Tokyo/Fuji, Osaka/Kyoto, or Hokkaido?" },
      opts: [
        { v: "kanto", label: { th: "โตเกียว / ฟูจิ", en: "Tokyo / Fuji" } },
        { v: "kansai", label: { th: "โอซาก้า / เกียวโต", en: "Osaka / Kyoto" } },
        { v: "hokkaido", label: { th: "ฮอกไกโด", en: "Hokkaido" } },
        { v: "any", label: { th: "อะไรก็ได้", en: "Any Japan" } },
      ],
    });
  }
  if (!parse.shopExplicit) {
    out.push({
      id: "shop",
      q: { th: "ร้านช้อปบังคับรับได้แค่ไหน", en: "How do you feel about compulsory shopping stops?" },
      opts: [
        { v: "no", label: { th: "ไม่รับเลย", en: "None — skip shopping tours" } },
        { v: "some", label: { th: "มีได้บ้าง", en: "A little is fine" } },
      ],
    });
  }
  return out.slice(0, 2);
}

function regionMatch(p: Pkg, region: string | null) {
  if (!region || region === "any") return true;
  const hay = `${p.city.en} ${p.city.th} ${p.city.zh || ""} ${p.city.ru || ""} ${p.title.en} ${p.title.th} ${p.title.zh || ""} ${p.title.ru || ""}`.toLowerCase();
  if (region === "hokkaido") return /hokkaido|sapporo|ฮอกไกโด|ซัปโปโร/.test(hay);
  if (region === "kansai") return /osaka|kyoto|โอซาก้า|เกียวโต/.test(hay);
  if (region === "kanto") return /tokyo|fuji|โตเกียว|ฟูจิ/.test(hay);
  if (region === "north") return /chiang mai|chiang rai|golden|เชียงใหม่|เชียงราย|สามเหลี่ยม|清迈|清莱|金三角/.test(hay);
  return true;
}

export function applyAdvisorExtras(parse: AdvisorParse, extras?: AdvisorExtras): AdvisorParse {
  if (!extras) return parse;
  const next: AdvisorParse = {
    ...parse,
    answers: { ...parse.answers },
    notes: parse.notes.slice(),
  };
  if (extras.dest && extras.dest !== "any") {
    next.dest = extras.dest;
    next.notes.push({ th: `จุดหมาย: ${extras.dest}`, en: `Destination: ${extras.dest}` });
  }
  if (extras.dest === "any") next.dest = null;
  if (extras.region && extras.region !== "any") {
    next.region = extras.region;
    const labels: Record<string, L10n> = {
      kanto: { th: "โซน: โตเกียว / ฟูจิ", en: "Region: Tokyo / Fuji" },
      kansai: { th: "โซน: โอซาก้า / เกียวโต", en: "Region: Osaka / Kyoto" },
      hokkaido: { th: "โซน: ฮอกไกโด", en: "Region: Hokkaido" },
    };
    if (labels[extras.region]) next.notes.push(labels[extras.region]);
  }
  if (extras.shop) {
    next.answers.shop = extras.shop;
    next.shopExplicit = true;
    next.notes.push(
      extras.shop === "no"
        ? { th: "ร้านช้อป: ไม่รับเลย", en: "Shopping: none" }
        : { th: "ร้านช้อป: มีได้บ้าง", en: "Shopping: a little is fine" }
    );
  }
  return next;
}

export function advisorResults(
  text: string,
  t: Dict,
  L: LFn,
  money: MoneyFn,
  all: Pkg[],
  extras?: AdvisorExtras
): { parse: AdvisorParse; followups: AdvisorFollowUp[]; results: MatchResult[] } {
  const parse = applyAdvisorExtras(parseAdvisorQuery(text), extras);
  const followups = extras ? [] : advisorFollowups(parse);
  const pool = parse.dest ? all.filter((p) => p.country.en === parse.dest) : all;
  const regional = pool.filter((p) => regionMatch(p, parse.region));
  const durationHint = /5.?6|6.?วัน|5.?วัน|5–6|5-6/.test(text.toLowerCase());
  const narrowed = durationHint ? regional.filter((p) => p.days >= 5 && p.days <= 6) : regional;
  const base = narrowed.length ? narrowed : regional.length ? regional : pool;
  const results = followups.length ? [] : matchResults(parse.answers, t, L, money, base.length ? base : all);
  return { parse, followups, results };
}

export function priceIntel(p: Pkg, all: Pkg[]): PriceIntel | null {
  const peers = all.filter((x) => x.country.en === p.country.en && Math.abs(x.days - p.days) <= 2);
  if (peers.length < 2) return null;
  const prices = peers.map((x) => x.real).sort((a, b) => a - b);
  const low = prices[0];
  const high = prices[prices.length - 1];
  const avg = Math.round(prices.reduce((s, n) => s + n, 0) / prices.length / 100) * 100;
  const pct = Math.round(((p.real - avg) / avg) * 100);
  const band: PriceIntel["band"] = pct <= -8 ? "great" : pct >= 8 ? "high" : "fair";
  return { n: peers.length, low, avg, high, pct, band };
}

export function depUnavailable(d: Departure) {
  return d.status === "sold" || d.status === "cancelled" || d.seats <= 0;
}

export function soldOutAlts(p: Pkg, depIndex: number, all: Pkg[]) {
  const dates = p.departures
    .map((d, i) => ({ d, i }))
    .filter(({ d, i }) => i !== depIndex && !depUnavailable(d));
  const tours = similarTours(p, all, 4).filter((x) => x.departures.some((d) => !depUnavailable(d)));
  return { dates, tours };
}

export function groupBids(dest: string, pax: number, budget: number, notes: string): GroupBid[] {
  const roster: Record<string, string[]> = {
    Japan: ["siam", "orient", "vela"],
    Korea: ["orient", "vela", "bkkjet"],
    China: ["siam", "nakara", "vela"],
    Taiwan: ["orient", "siam", "vela"],
    Vietnam: ["nakara", "bkkjet", "vela"],
    Europe: ["vela", "siam", "orient"],
    Thailand: ["siam", "nakara", "vela"],
  };
  const ids = roster[dest] || ["siam", "orient", "vela"];
  const noshop = /no shop|ไม่ลงร้าน|ไม่มีร้าน|noshop/i.test(notes);
  const cap = Math.max(12000, budget || 45000);
  const paxAdj = pax >= 20 ? -800 : pax >= 15 ? 0 : 1200;
  return ids.map((agency, i) => {
    const price = Math.round((cap * (0.94 + i * 0.05) + paxAdj) / 100) * 100;
    const days = dest === "Europe" ? 8 + i : 6 + (i === 2 ? 1 : 0);
    return {
      agency,
      price,
      days,
      hotel: i === 0
        ? { th: "โรงแรม 4 ดาว มีชื่อ", en: "Named 4-star hotels", zh: "具名四星酒店" }
        : i === 1
          ? { th: dest === "Thailand" ? "โรงแรม 4 ดาวริมน้ำ" : "โรงแรม 4 ดาว + ออนเซ็น 1 คืน", en: dest === "Thailand" ? "4-star riverside hotels" : "4-star + one onsen night", zh: dest === "Thailand" ? "四星河景酒店" : "四星+一晚温泉" }
          : { th: dest === "Thailand" ? "โรงแรม 5 ดาวเชียงใหม่" : "โรงแรม 5 ดาว ทำเลกลางเมือง", en: dest === "Thailand" ? "5-star Chiang Mai hotels" : "5-star central hotels", zh: dest === "Thailand" ? "清迈五星酒店" : "市中心五星酒店" },
      shopping: noshop || i === 0
        ? { th: "ไม่มีร้านช้อปบังคับ", en: "No compulsory shopping", zh: "无强制购物" }
        : { th: `${i} ร้านช้อป`, en: `${i} shopping stop${i > 1 ? "s" : ""}`, zh: `${i} 家购物店` },
      airline: dest === "Thailand"
        ? { th: "แพ็กเกจที่ดิน รับเชียงใหม่", en: "Land package · CNX pickup", zh: "落地安排 · 清迈接机" }
        : i === 1
          ? { th: "บินตรง ฟูลเซอร์วิส", en: "Direct full-service" }
          : { th: "บินตรง", en: "Direct flight" },
      note: i === 0
        ? dest === "Thailand"
          ? { th: "กลุ่มส่วนตัวตามจำนวนที่ขอ · ไกด์ภาษาจีน", en: "Private group at your size · Chinese-speaking guide", zh: "按人数独立成团 · 中文导游" }
          : { th: "กลุ่มส่วนตัวตามจำนวนที่ขอ · ไกด์ภาษาไทย", en: "Private group at your size · Thai-speaking guide" }
        : i === 1
          ? { th: "เพิ่มวันอิสระครึ่งวัน · กระเป๋า 30 กก.", en: "Half free day added · 30 kg baggage" }
          : { th: "ห้องพักอัปเกรด · ประกันการเดินทางรวม", en: "Room upgrade · travel insurance included" },
      delay: 700 + i * 900,
    };
  });
}
