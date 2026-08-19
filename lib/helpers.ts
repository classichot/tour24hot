import type { Dict } from "./i18n";
import { agencyById, type DepartureStatus, type Loc, type Pkg } from "./data";

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
    festival: L({ th: "เทศกาล", en: "Festival" }),
    food: L({ th: "อาหารและวัฒนธรรม", en: "Food & culture" }),
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
        th: `บิน ${best.airlineName} (ฟูลเซอร์วิส) แทน ${cheap.airlineName} (โลว์คอสต์) และกระเป๋า ${best.baggage} แทน ${cheap.baggage}`,
        en: `${best.airlineName} full service instead of ${cheap.airlineName} low cost, with ${best.baggage} baggage instead of ${cheap.baggage}`,
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
          why.push(L({ th: `บิน ${p.airlineName} ฟูลเซอร์วิส กระเป๋า ${p.baggage}`, en: `${p.airlineName} full service, ${p.baggage} baggage` }));
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

export function similarTours(p: Pkg, all: Pkg[], n = 3) {
  return all
    .filter((x) => x.id !== p.id)
    .map((x) => {
      let s = 0;
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
  notes: { th: string; en: string }[];
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
  const notes: { th: string; en: string }[] = [];

  let dest: string | null = null;
  if (/hokkaido|ฮอกไกโด|sapporo|ซัปโปโร/.test(q)) {
    dest = "Japan";
    notes.push({ th: "จุดหมาย: ฮอกไกโด / ญี่ปุ่น", en: "Destination: Hokkaido / Japan" });
  } else if (/osaka|โอซาก้า|kyoto|เกียวโต/.test(q)) {
    dest = "Japan";
    notes.push({ th: "จุดหมาย: โอซาก้า / เกียวโต", en: "Destination: Osaka / Kyoto" });
  } else if (/japan|ญี่ปุ่น|tokyo|โตเกียว|fuji|ฟูจิ/.test(q)) {
    dest = "Japan";
    notes.push({ th: "จุดหมาย: ญี่ปุ่น", en: "Destination: Japan" });
  } else if (/korea|เกาหลี|seoul|โซล|busan|ปูซาน/.test(q)) {
    dest = "Korea";
    notes.push({ th: "จุดหมาย: เกาหลี", en: "Destination: Korea" });
  } else if (/china|จีน|chengdu|เฉิงตู|zhangjiajie|จางเจียเจี้ย/.test(q)) {
    dest = "China";
    notes.push({ th: "จุดหมาย: จีน", en: "Destination: China" });
  } else if (/taiwan|ไต้หวัน|taipei|ไทเป/.test(q)) {
    dest = "Taiwan";
    notes.push({ th: "จุดหมาย: ไต้หวัน", en: "Destination: Taiwan" });
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

  if (/no shop|ไม่.*ช้อป|minimal shopping|ไม่ลงร้าน|ไม่มีร้าน/.test(q)) {
    answers.shop = "no";
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

  return { answers, dest, notes };
}

export function advisorResults(
  text: string,
  t: Dict,
  L: LFn,
  money: MoneyFn,
  all: Pkg[]
): { parse: AdvisorParse; results: MatchResult[] } {
  const parse = parseAdvisorQuery(text);
  const pool = parse.dest ? all.filter((p) => p.country.en === parse.dest) : all;
  const durationHint = /5.?6|6.?วัน|5.?วัน|5–6|5-6/.test(text.toLowerCase());
  const narrowed = durationHint ? pool.filter((p) => p.days >= 5 && p.days <= 6) : pool;
  const results = matchResults(parse.answers, t, L, money, narrowed.length ? narrowed : pool);
  return { parse, results };
}
