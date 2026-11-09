import type { AuditEvent, Company, IosState, ItineraryDay, Member, QuoteLine, QuoteVersion, Rate, ServiceItem, Settings, Task, TripFile } from "./types";
import { addBusinessDays, addDays, quoteHash, toMinor } from "./rules";

/** Default first-use values (SCP02): English UI, Thailand, THB, Asia/Bangkok — all configurable. */
export const DEFAULT_SETTINGS: Settings = {
  setupDone: false,
  companyName: "",
  country: "Thailand",
  timezone: "Asia/Bangkok",
  currency: "THB",
  marginThreshold: 18,
  firstResponseBizDays: 1,
  quoteFollowUpBizDays: 2,
  readinessHours: 48,
  defaultMarkupPct: 25,
};

/** Staff that match the demo sign-in accounts (password tour24demo). */
export const DEFAULT_MEMBERS: Member[] = [
  { id: "m-lead", name: "Ploy", email: "ploy@tour24.demo", role: "manager" },
  { id: "m-sales", name: "Nok", email: "nok@tour24.demo", role: "sales" },
  { id: "m-hotel", name: "Fon", email: "fon@tour24.demo", role: "ops" },
  { id: "m-docs", name: "Mint", email: "mint@tour24.demo", role: "ops" },
  { id: "m-fin", name: "Jay", email: "jay@tour24.demo", role: "finance" },
];

export function emptyState(): IosState {
  return { settings: DEFAULT_SETTINGS, members: DEFAULT_MEMBERS, companies: [], trips: [], tasks: [], audit: [], seq: { trip: 0 } };
}

let n = 0;
const id = (p: string) => `${p}-${(++n).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const at = (date: string, time = "09:00") => `${date}T${time}:00.000+07:00`;

function rate(serviceType: Rate["serviceType"], name: string, basis: Rate["basis"], major: number, validFrom: string, validTo: string, sourceRef: string): Rate {
  return { id: id("rate"), serviceType, name, basis, amount: toMinor(major), currency: "THB", taxMode: "incl", validFrom, validTo, source: "contract", sourceRef, rateVersion: 1 };
}

function company(name: string, roles: Company["roles"], city: string, country: string, extra: Partial<Company> = {}): Company {
  return {
    id: id("co"), name, sample: true, roles, city, country, languages: "English", currencies: "THB", contacts: [], rates: [], version: 1, ...extra,
  };
}

function svc(category: ServiceItem["category"], name: string, basis: ServiceItem["basis"], qty: number, supplier: Company | undefined, r: Rate | undefined, unitMajor: number, spec: Record<string, string> = {}, extra: Partial<ServiceItem> = {}): ServiceItem {
  return {
    id: id("svc"), category, name, basis, qty, supplierId: supplier?.id, rateId: r?.id, costSource: r ? "contract" : "estimate",
    unitCost: toMinor(unitMajor), costCurrency: "THB", mandatory: true, spec, specVersion: 1, ...extra,
  };
}

function lines(days: ItineraryDay[], markup: number): QuoteLine[] {
  const out: QuoteLine[] = [];
  days.forEach((d, i) =>
    d.services.forEach((s) =>
      out.push({
        id: id("ql"), serviceId: s.id, description: `Day ${i + 1} · ${s.name}`, basis: s.basis, qty: s.qty,
        unitCost: s.unitCost ?? 0, unitPrice: Math.ceil(((s.unitCost ?? 0) * markup) / 1000) * 1000, discount: 0, optional: !s.mandatory, foc: 0,
      })
    )
  );
  return out;
}

function quote(number: number, status: QuoteVersion["status"], ql: QuoteLine[], created: string, validUntil: string, by: string, extra: Partial<QuoteVersion> = {}): QuoteVersion {
  const q: QuoteVersion = {
    id: id("q"), number, status, currency: "THB", lines: ql, validUntil,
    paymentTerms: "30% deposit within 7 days of acceptance; balance 30 days before arrival.",
    cancellationTerms: "Over 30 days before arrival: deposit retained. 15–30 days: 50%. Under 15 days: 100%.",
    inclusions: "Hotels as listed, private air-conditioned transport, guide as listed, meals as listed, entrance fees as listed.",
    exclusions: "International flights, visas, personal expenses, gratuities.",
    assumptions: "Rates subject to supplier availability at the time of booking.",
    fromItineraryVersion: 1, createdAt: created, createdBy: by, ...extra,
  };
  return q;
}

export function buildSample(today: string, members: Member[], settings: Settings): Pick<IosState, "companies" | "trips" | "tasks" | "audit" | "seq"> {
  const lead = members.find((m) => m.role === "manager")?.id ?? members[0].id;
  const sales = members.find((m) => m.role === "sales")?.id ?? lead;
  const ops = members.find((m) => m.role === "ops")?.id ?? lead;
  const yr = today.slice(0, 4);
  const yearStart = `${yr}-01-01`;
  const yearEnd = `${Number(yr) + 1}-03-31`;
  const markup = 1 + settings.defaultMarkupPct / 100;

  /* Directory: partners, suppliers and one company holding both roles (PAR01). */
  const nanfang = company("Guangzhou Nanfang Travel", ["partner"], "Guangzhou", "China", {
    languages: "Chinese, English", currencies: "THB, CNY",
    contacts: [{ id: id("ct"), name: "Lin Wen", email: "lin.wen@nanfang.example", role: "Group desk" }],
    partnerTerms: { accountOwnerId: sales, model: "net", creditLimit: toMinor(1000000), creditCurrency: "THB", paymentDays: 30, refConvention: "NF-YYYY-###" },
  });
  const suria = company("Suria Holidays Kuala Lumpur", ["partner"], "Kuala Lumpur", "Malaysia", {
    languages: "Malay, English", currencies: "THB, MYR",
    contacts: [{ id: id("ct"), name: "Aisyah Rahman", email: "aisyah@suria.example", role: "Product manager" }],
    partnerTerms: { accountOwnerId: sales, model: "commission", commissionPct: 10, creditLimit: toMinor(300000), creditCurrency: "THB", paymentDays: 14 },
  });
  const school = company("Shenzhen Bright Future School", ["partner"], "Shenzhen", "China", {
    languages: "Chinese", currencies: "THB, CNY", contacts: [{ id: id("ct"), name: "Ms Zhao", email: "zhao@brightfuture.example", role: "Trip coordinator" }],
    partnerTerms: { model: "net", creditCurrency: "THB", paymentDays: 0 },
  });
  const seoul = company("Seoul Golf Society", ["partner"], "Seoul", "South Korea", {
    languages: "Korean, English", currencies: "THB, KRW", contacts: [{ id: id("ct"), name: "Park Min-jun", email: "park@seoulgolf.example" }],
    partnerTerms: { model: "net", creditCurrency: "THB", paymentDays: 7 },
  });
  const huaxin = company("Shanghai Huaxin Insurance", ["partner"], "Shanghai", "China", {
    languages: "Chinese", currencies: "THB, CNY", contacts: [{ id: id("ct"), name: "Chen Hao", email: "chen.hao@huaxin.example", role: "HR events" }],
    partnerTerms: { accountOwnerId: lead, model: "net", creditCurrency: "THB", paymentDays: 14 },
  });
  const merCnx = company("Le Meridien Chiang Mai", ["supplier"], "Chiang Mai", "Thailand", {
    contacts: [{ id: id("ct"), name: "Reservations", email: "res.cnx@hotel.example", phone: "+66 53 000 100" }],
    supplierTerms: { categories: ["hotel"], locations: "Chiang Mai", cancellation: "Release 14 days before arrival", childRules: "Under 12 free in parents' room", paymentDays: 30 },
  });
  merCnx.rates = [rate("hotel", "Deluxe twin, breakfast", "per_room_night", 3600, yearStart, yearEnd, "Contract INB-2026-CNX")];
  const merCei = company("Le Meridien Chiang Rai", ["supplier"], "Chiang Rai", "Thailand", {
    contacts: [{ id: id("ct"), name: "Reservations", email: "res.cei@hotel.example" }],
    supplierTerms: { categories: ["hotel"], locations: "Chiang Rai", cancellation: "Release 10 days before arrival", childRules: "Extra bed THB 1,200", paymentDays: 30 },
  });
  merCei.rates = [rate("hotel", "Deluxe river view, breakfast", "per_room_night", 4800, yearStart, yearEnd, "Email offer, rate sheet v3")];
  const coach = company("North Thailand Coach Hire", ["supplier"], "Chiang Mai", "Thailand", {
    contacts: [{ id: id("ct"), name: "Dispatch", phone: "+66 81 000 2200", emergency: true }],
    supplierTerms: { categories: ["transport"], locations: "Northern Thailand", cancellation: "Free until 72 hours", childRules: "—", paymentDays: 15 },
  });
  coach.rates = [
    rate("transport", "45-seat coach, full day", "per_vehicle", 18000, yearStart, yearEnd, "Rate card 2026"),
    rate("transport", "13-seat van, full day", "per_vehicle", 3500, yearStart, yearEnd, "Rate card 2026"),
  ];
  const guide = company("Ming — Chinese-speaking guide", ["supplier"], "Chiang Mai", "Thailand", {
    languages: "Chinese, Thai, English", contacts: [{ id: id("ct"), name: "Ming", phone: "+66 81 240 1102" }],
    supplierTerms: { categories: ["guide"], locations: "Chiang Mai, Chiang Rai", cancellation: "50% within 7 days", childRules: "—", paymentDays: 7 },
  });
  guide.rates = [rate("guide", "Licensed guide, full day", "per_group", 5500, yearStart, yearEnd, "Guide roster")];
  const nimman = company("Nimman Group Table", ["supplier"], "Chiang Mai", "Thailand", {
    supplierTerms: { categories: ["meal"], locations: "Chiang Mai", cancellation: "Headcount 48 hours before", childRules: "Child 50%", paymentDays: 15 },
  });
  nimman.rates = [rate("meal", "Northern Thai set lunch", "per_person", 420, yearStart, yearEnd, "Menu 2026")];
  const doi = company("Doi Suthep Group Tickets", ["supplier"], "Chiang Mai", "Thailand", {
    supplierTerms: { categories: ["attraction"], locations: "Chiang Mai", cancellation: "Cancel 24 hours before", childRules: "Under 120 cm free", paymentDays: 0 },
  });
  // Deliberately expired: quoting with it must trigger revalidation (PAR04).
  doi.rates = [rate("attraction", "Temple entry + funicular", "per_person", 350, `${Number(yr) - 1}-01-01`, addDays(today, -30), "Allotment letter (expired)")];
  const lanna = company("Lanna Connect Co.", ["partner", "supplier"], "Chiang Mai", "Thailand", {
    contacts: [{ id: id("ct"), name: "Krit", email: "krit@lannaconnect.example" }],
    partnerTerms: { model: "commission", commissionPct: 8, creditCurrency: "THB", paymentDays: 30 },
    supplierTerms: { categories: ["transport"], locations: "Chiang Mai", cancellation: "Free until 48 hours", childRules: "—", paymentDays: 15 },
  });
  lanna.rates = [rate("transport", "Airport transfer, van", "per_vehicle", 900, yearStart, yearEnd, "Rate card 2026")];
  const companies = [nanfang, suria, school, seoul, huaxin, lanna, merCnx, merCei, coach, guide, nimman, doi];

  const trips: TripFile[] = [];
  const tasks: Task[] = [];
  const audit: AuditEvent[] = [];
  let seqN = 0;
  const ref = () => `T24-${today.slice(2, 4)}${today.slice(5, 7)}-${String(++seqN).padStart(4, "0")}`;
  const log = (tripId: string, when: string, actorId: string, action: string, summary: string) =>
    audit.push({ id: id("ev"), at: when, actorId, action, recordType: action.startsWith("quote") ? "quote" : "trip", recordId: tripId, tripId, summary });
  const base = (p: Partial<TripFile> & Pick<TripFile, "name" | "destinations">, created: string): TripFile => ({
    id: id("trip"), ref: ref(), sample: true, team: "sales", commercial: "enquiry", operational: "not_started", financial: "open",
    source: { channel: "email", original: "", files: [] }, qual: {}, itinerary: [], itineraryVersion: 1, quotes: [], notes: [],
    reservations: [], guests: [], guestsVersion: 1, documents: [], incidents: [], changes: [],
    createdAt: created, updatedAt: created, createdBy: lead, version: 3, ...p,
  });

  /* 1. Golden Triangle 40 — booked, arranging, not paid. */
  {
    const s0 = addDays(today, 32);
    const r = (i: number) => addDays(s0, i);
    const cnx = svc("hotel", "Le Meridien Chiang Mai — 21 rooms × 2 nights", "per_room_night", 42, merCnx, merCnx.rates[0], 3600, { checkIn: r(0), checkOut: r(2), roomType: "Deluxe twin", rooms: "21" });
    const cei = svc("hotel", "Le Meridien Chiang Rai — 21 rooms × 3 nights", "per_room_night", 63, merCei, merCei.rates[0], 4800, { checkIn: r(2), checkOut: r(5), roomType: "Deluxe river view", rooms: "21" });
    const bus = svc("transport", "Two 45-seat coaches, 6 days", "per_vehicle", 12, coach, coach.rates[0], 18000, { pickup: "CNX airport", capacity: "90", luggage: "40 large cases" });
    const gd = svc("guide", "Chinese-speaking guide, 6 days", "per_group", 6, guide, guide.rates[0], 5500, { language: "Chinese", hours: "08:00–18:00" });
    const lunch = svc("meal", "Nimman group lunch", "per_person", 40, nimman, nimman.rates[0], 420, { mealDate: r(1), guests: "40" });
    const days: ItineraryDay[] = [
      { id: id("day"), title: "Arrive Chiang Mai", destination: "Chiang Mai", notes: "Meet CZ3051 at CNX 07:10", services: [cnx, bus, gd] },
      { id: id("day"), title: "Old city and free afternoon", destination: "Chiang Mai", services: [lunch] },
      { id: id("day"), title: "Chiang Mai to Chiang Rai, White Temple", destination: "Chiang Rai", services: [cei] },
      { id: id("day"), title: "Golden Triangle and Mekong", destination: "Golden Triangle", services: [] },
      { id: id("day"), title: "Blue Temple and Black House", destination: "Chiang Rai", services: [] },
      { id: id("day"), title: "Transfer to CNX", destination: "Chiang Mai", notes: "CZ3052 departs 12:40", services: [] },
    ];
    const created = at(addDays(today, -40));
    const ql = lines(days, markup);
    const v1 = quote(1, "superseded", ql.map((l) => ({ ...l, id: id("ql") })), created, addDays(today, -26), sales, { supersededBy: 2, recipientName: "Lin Wen", recipientEmail: "lin.wen@nanfang.example" });
    v1.sent = { at: at(addDays(today, -38)), by: sales, channel: "email", recipient: "Lin Wen <lin.wen@nanfang.example>", hash: quoteHash(v1) };
    const v2 = quote(2, "accepted", ql, at(addDays(today, -36)), addDays(today, -22), sales, { recipientName: "Lin Wen", recipientEmail: "lin.wen@nanfang.example", inclusions: "Named hotels, two coaches, Chinese-speaking guide, lunch on day 2. No shopping stops." });
    v2.sent = { at: at(addDays(today, -35)), by: sales, channel: "email", recipient: "Lin Wen <lin.wen@nanfang.example>", hash: quoteHash(v2) };
    v2.accepted = { at: at(addDays(today, -33)), by: sales, person: "Lin Wen", date: addDays(today, -33), evidence: "Email from Lin Wen: “We confirm version 2 for 40 guests.”" };
    const t = base({ name: "Golden Triangle 40, no shopping", destinations: ["Chiang Mai", "Chiang Rai", "Golden Triangle"], partnerId: nanfang.id, ownerId: sales, startDate: s0, endDate: r(5), adults: 40, language: "Chinese", arrival: "CZ3051 CAN–CNX 07:10", departure: "CZ3052 CNX–CAN 12:40", hotelPref: "Named 5-star hotels", dietary: "1 vegetarian, 1 no pork", commercial: "booked", operational: "arranging", itinerary: days, quotes: [v1, v2], externalRef: "NF-2026-114", source: { channel: "email", original: "Chinese group of 40, Chinese guide, Chiang Mai / Chiang Rai / Chiang Saen / Mekong, no shops, all-in budget THB 24,000 per person.", files: [] } }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from email`);
    log(t.id, v1.sent.at, sales, "quote.sent", "Recorded send of v1 to Lin Wen by email");
    log(t.id, v2.sent.at, sales, "quote.sent", "Recorded send of v2 to Lin Wen by email; v1 superseded");
    log(t.id, v2.accepted.at, sales, "quote.accepted", "Lin Wen accepted v2. Trip booked; suppliers not yet confirmed; nothing paid.");
    for (const s of [cnx, cei, bus, gd, lunch]) {
      tasks.push({ id: id("task"), type: "arrange_service", title: `Arrange ${s.name}`, tripId: t.id, tab: "bookings", team: "ops", ownerId: ops, due: `${addDays(s0, -14)}T10:00:00.000Z`, priority: "normal", status: "open", ruleKey: `arrange:${s.id}`, history: [{ at: v2.accepted.at, by: sales, text: "Created on acceptance of v2. Reservation still unconfirmed." }], version: 1 });
    }
  }

  /* 2. Bangkok & Chiang Mai incentive 20 — the spec example: 20 × THB 10,000 at 25% margin; draft, recipient missing. */
  {
    const s0 = addDays(today, 45);
    const pkg = svc("other", "Land package per person (5 days)", "per_person", 20, undefined, undefined, 7500, {}, { costSource: "estimate" });
    const days: ItineraryDay[] = [
      { id: id("day"), title: "Arrive Bangkok", destination: "Bangkok", services: [pkg] },
      { id: id("day"), title: "Bangkok city and river", destination: "Bangkok", services: [] },
      { id: id("day"), title: "Fly to Chiang Mai", destination: "Chiang Mai", services: [] },
      { id: id("day"), title: "Doi Suthep and old city", destination: "Chiang Mai", services: [] },
      { id: id("day"), title: "Depart Chiang Mai", destination: "Chiang Mai", services: [] },
    ];
    const created = at(addDays(today, -3), "10:30");
    const v1 = quote(1, "draft", [{ id: id("ql"), serviceId: pkg.id, description: "Land package per person (5 days)", basis: "per_person", qty: 20, unitCost: toMinor(7500), unitPrice: toMinor(10000), discount: 0, optional: false, foc: 0 }], at(addDays(today, -1)), addDays(today, 13), sales, { inclusions: "4-star hotels, transport, English-speaking guide, daily breakfast." });
    const t = base({ name: "Bangkok & Chiang Mai incentive 20", destinations: ["Bangkok", "Chiang Mai"], partnerId: huaxin.id, ownerId: sales, startDate: s0, endDate: addDays(s0, 4), adults: 20, language: "Chinese", hotelPref: "4-star", commercial: "quoting", itinerary: days, quotes: [v1], source: { channel: "wechat", original: "20 guests, Bangkok and Chiang Mai, 5 days. 4-star. Chinese guide please.", files: [] } }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from wechat`);
    log(t.id, v1.createdAt, sales, "quote.created", "Quote v1 drafted from itinerary v1");
  }

  /* 3. Chiang Rai study trip 32 — quote sent, awaiting the school. */
  {
    const s0 = addDays(today, 60);
    const hotel = svc("hotel", "Le Meridien Chiang Rai — 16 rooms × 4 nights", "per_room_night", 64, merCei, merCei.rates[0], 4800, { rooms: "16", roomType: "Triple" });
    const van = svc("transport", "13-seat vans × 3, 5 days", "per_vehicle", 15, coach, coach.rates[1], 3500);
    const days: ItineraryDay[] = [{ id: id("day"), title: "Arrive Chiang Rai", destination: "Chiang Rai", services: [hotel, van] }, { id: id("day"), title: "Tea farm workshop", destination: "Mae Salong", services: [] }];
    const created = at(addDays(today, -9));
    const v1 = quote(1, "sent", lines(days, markup), at(addDays(today, -7)), addDays(today, 5), sales, { recipientName: "Ms Zhao", recipientEmail: "zhao@brightfuture.example" });
    v1.sent = { at: at(addDays(today, -6)), by: sales, channel: "email", recipient: "Ms Zhao <zhao@brightfuture.example>", hash: quoteHash(v1) };
    const t = base({ name: "Chiang Rai study trip 32", destinations: ["Chiang Rai"], partnerId: school.id, ownerId: sales, startDate: s0, endDate: addDays(s0, 4), adults: 4, children: 28, language: "Chinese", commercial: "awaiting", itinerary: days, quotes: [v1], qual: { nextFollowUp: addDays(today, -1) } }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from email`);
    log(t.id, v1.sent.at, sales, "quote.sent", "Recorded send of v1 to Ms Zhao by email");
    tasks.push({ id: id("task"), type: "quote_follow_up", title: "Follow up quote v1 with Ms Zhao", tripId: t.id, tab: "money", ownerId: sales, team: "sales", due: addBusinessDays(v1.sent.at, 2), priority: "normal", status: "open", ruleKey: `quote_follow_up:${t.id}:1`, history: [{ at: v1.sent.at, by: sales, text: "Company policy: follow up after 2 business days" }], version: 1 });
  }

  /* 4. Halal family 18 — new, unassigned, first response overdue. */
  {
    const created = at(addDays(today, -2), "16:20");
    const t = base({ name: "Halal family group, Chiang Mai 18", destinations: ["Chiang Mai"], partnerId: suria.id, adults: 12, children: 6, dietary: "Halal", flexibleDates: "late October or November", source: { channel: "whatsapp", original: "Assalamualaikum, 18 pax (12 adults 6 kids) Chiang Mai, halal food all meals, late Oct or Nov, budget around MYR 3,500 per person. Please quote.", files: [] }, version: 1 }, created);
    trips.push(t);
    log(t.id, created, lead, "trip.created", `Enquiry ${t.ref} created from whatsapp`);
    tasks.push({ id: id("task"), type: "first_response", title: `First response to ${t.name}`, tripId: t.id, tab: "overview", team: "sales", due: addBusinessDays(created, 1), priority: "high", status: "open", ruleKey: `first_response:${t.id}`, history: [{ at: created, by: lead, text: "Created by company policy: first response within 1 business day(s)" }], version: 1 });
  }

  /* 5. Chiang Mai golf 12 — booked and arriving today. */
  {
    const vanSvc = svc("transport", "Airport transfer, 2 vans", "per_vehicle", 2, lanna, lanna.rates[0], 900, { pickup: "CNX arrivals 14:20", capacity: "26", luggage: "12 golf bags" });
    const days: ItineraryDay[] = [{ id: id("day"), title: "Arrive, check in", destination: "Chiang Mai", services: [vanSvc] }, { id: id("day"), title: "Golf: Alpine", destination: "Chiang Mai", services: [] }];
    const created = at(addDays(today, -30));
    const v1 = quote(1, "accepted", lines(days, markup), at(addDays(today, -28)), addDays(today, -14), lead, { recipientName: "Park Min-jun", recipientEmail: "park@seoulgolf.example" });
    v1.sent = { at: at(addDays(today, -28)), by: lead, channel: "email", recipient: "Park Min-jun <park@seoulgolf.example>", hash: quoteHash(v1) };
    v1.accepted = { at: at(addDays(today, -25)), by: lead, person: "Park Min-jun", date: addDays(today, -25), evidence: "Signed proposal returned by email." };
    const t = base({ name: "Chiang Mai golf 12", destinations: ["Chiang Mai"], partnerId: seoul.id, ownerId: lead, startDate: today, endDate: addDays(today, 4), adults: 12, language: "Korean", arrival: "KE661 ICN–CNX 14:20", commercial: "booked", operational: "arranging", itinerary: days, quotes: [v1] }, created);
    trips.push(t);
    log(t.id, created, lead, "trip.created", `Enquiry ${t.ref} created from email`);
    log(t.id, v1.accepted.at, lead, "quote.accepted", "Park Min-jun accepted v1. Trip booked; suppliers not yet confirmed; nothing paid.");
  }

  /* 6. Incentive 30 — below-threshold margin, waiting for manager approval. */
  {
    const s0 = addDays(today, 75);
    const pkg = svc("other", "Incentive land package per person", "per_person", 30, undefined, undefined, 9800);
    const days: ItineraryDay[] = [{ id: id("day"), title: "Arrive Phuket", destination: "Phuket", services: [pkg] }];
    const created = at(addDays(today, -4));
    const v1 = quote(1, "awaiting_approval", [{ id: id("ql"), serviceId: pkg.id, description: "Incentive land package per person (4 days)", basis: "per_person", qty: 30, unitCost: toMinor(9800), unitPrice: toMinor(10800), discount: 0, optional: false, foc: 0 }], at(addDays(today, -1)), addDays(today, 10), sales, { recipientName: "Krit", recipientEmail: "krit@lannaconnect.example" });
    const t = base({ name: "Phuket sales incentive 30", destinations: ["Phuket"], partnerId: lanna.id, ownerId: sales, startDate: s0, endDate: addDays(s0, 3), adults: 30, commercial: "quoting", itinerary: days, quotes: [v1] }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from email`);
    log(t.id, v1.createdAt, sales, "quote.approval_requested", "Approval requested for v1: Margin below threshold");
    tasks.push({ id: id("task"), type: "approval", title: `Approve quote v1 · ${t.name}`, tripId: t.id, tab: "money", team: "manager", due: addBusinessDays(v1.createdAt, 1), priority: "high", status: "open", ruleKey: `approval:${v1.id}`, history: [{ at: v1.createdAt, by: sales, text: "Requested: Margin below threshold" }], version: 1 });
  }

  /* 7. Kanchanaburi 16 — direct customer, quote validity passed. */
  {
    const s0 = addDays(today, 20);
    const pkg = svc("other", "History tour package per person", "per_person", 16, undefined, undefined, 5200);
    const days: ItineraryDay[] = [{ id: id("day"), title: "Bangkok to Kanchanaburi", destination: "Kanchanaburi", services: [pkg] }];
    const created = at(addDays(today, -20));
    const v1 = quote(1, "sent", lines(days, markup), at(addDays(today, -18)), addDays(today, -2), sales, { recipientName: "Daniel Moore", recipientEmail: "daniel@example.com" });
    v1.sent = { at: at(addDays(today, -18)), by: sales, channel: "email", recipient: "Daniel Moore <daniel@example.com>", hash: quoteHash(v1) };
    const t = base({ name: "Kanchanaburi history tour 16", destinations: ["Kanchanaburi"], directContact: { name: "Daniel Moore", email: "daniel@example.com" }, ownerId: sales, startDate: s0, endDate: addDays(s0, 2), adults: 16, language: "English", commercial: "awaiting", itinerary: days, quotes: [v1] }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from website`);
  }

  /* 9. Chiang Mai family 6 — in progress since yesterday (operations sample, milestone C). */
  {
    const s0 = addDays(today, -1);
    const van = svc("transport", "Private van with driver, 3 days", "per_vehicle", 3, lanna, lanna.rates[0], 2400, { pickup: "Hotel lobby 08:30", capacity: "10", luggage: "6 cases" });
    const gd = svc("guide", "English-speaking guide, 3 days", "per_group", 3, guide, guide.rates[0], 5500, { language: "English", hours: "08:30–17:30" });
    const days: ItineraryDay[] = [
      { id: id("day"), title: "Old city temples", destination: "Chiang Mai", services: [van, gd] },
      { id: id("day"), title: "Elephant sanctuary and Mae Rim", destination: "Mae Rim", services: [] },
      { id: id("day"), title: "Doi Inthanon", destination: "Chom Thong", services: [] },
    ];
    const created = at(addDays(today, -21));
    const v1 = quote(1, "accepted", lines(days, markup), at(addDays(today, -20)), addDays(today, -6), sales, { recipientName: "Emma Clarke", recipientEmail: "emma.clarke@example.com" });
    v1.sent = { at: at(addDays(today, -20)), by: sales, channel: "email", recipient: "Emma Clarke <emma.clarke@example.com>", hash: quoteHash(v1) };
    v1.accepted = { at: at(addDays(today, -18)), by: sales, person: "Emma Clarke", date: addDays(today, -18), evidence: "Email from Emma Clarke: “Happy with version 1, please go ahead.”" };
    const t = base({ name: "Chiang Mai family discovery 6", destinations: ["Chiang Mai", "Mae Rim", "Chom Thong"], directContact: { name: "Emma Clarke", email: "emma.clarke@example.com" }, ownerId: sales, startDate: s0, endDate: addDays(s0, 2), adults: 4, children: 2, language: "English", arrival: "Staying at Rachamankha Hotel (own booking)", commercial: "booked", operational: "arranging", itinerary: days, quotes: [v1] }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from website`);
    log(t.id, v1.accepted.at, sales, "quote.accepted", "Emma Clarke accepted v1. Trip booked.");
  }

  /* 8. Phuket wedding 60 — lost. */
  {
    const created = at(addDays(today, -50));
    const t = base({ name: "Phuket destination wedding 60", destinations: ["Phuket"], directContact: { name: "S. Lee" }, ownerId: sales, adults: 60, commercial: "lost", qual: { lostReason: "Budget: customer chose a resort package" } }, created);
    trips.push(t);
    log(t.id, created, sales, "trip.created", `Enquiry ${t.ref} created from email`);
    log(t.id, at(addDays(today, -40)), sales, "trip.lost", "Marked lost: Budget");
  }

  return { companies, trips, tasks, audit: audit.sort((a, b) => b.at.localeCompare(a.at)), seq: { trip: seqN } };
}
