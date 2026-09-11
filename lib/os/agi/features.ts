import type { L10n } from "../../data";
import type { AiDraft } from "../types";
import { AGENT_ORDER } from "./copy";
import { FLAGSHIP_BRIEF, parseBrief, type ParsedBrief } from "./engine";
import {
  DEFAULT_AUTHORITY,
  emptyAgi,
  type AgiAutopilot,
  type AgiFact,
  type AgiIngest,
  type AgiJob,
  type AgiMemory,
  type AgiMission,
  type AgiNegotiation,
  type AgiRehearsalCase,
  type AgiScorecard,
  type AgiState,
  type AgiTapBrief,
  type IngestKind,
  type RehearsalId,
} from "./types";

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });

function now() {
  return new Date().toISOString();
}

export const FLAGSHIP_TAP: AgiTapBrief = {
  protocol: "TAP",
  version: "0.1.0",
  channel: "agent-direct",
  agency: "nanfang-travel",
  objective: FLAGSHIP_BRIEF,
  pax: 40,
  days: 6,
  dest: "Golden Triangle",
  nationality: "Chinese",
  hotelClass: 4,
  visibility: { sell: true, cost: false, margin: false },
  sellHint: 24000,
};

export function tryTapBrief(raw: string): AgiTapBrief | null {
  const t = raw.trim();
  if (!t.startsWith("{")) return null;
  try {
    const j = JSON.parse(t) as Partial<AgiTapBrief> & { marginTarget?: number };
    if (j.protocol !== "TAP") return null;
    return {
      ...FLAGSHIP_TAP,
      ...j,
      protocol: "TAP",
      channel: "agent-direct",
      visibility: { sell: true, cost: false, margin: false, ...j.visibility },
      objective: j.objective || FLAGSHIP_BRIEF,
      pax: Number(j.pax) || 40,
      days: Number(j.days) || 6,
    };
  } catch {
    return null;
  }
}

export function briefFromTap(tap: AgiTapBrief): string {
  return tap.objective || `${tap.days}-day ${tap.dest} tour for ${tap.pax} ${tap.nationality} travelers.`;
}

export const SEED_MEMORY: AgiMemory[] = [
  {
    id: "mem-cnx-4star",
    topic: z("โรงแรม 4 ดาวเชียงใหม่ — เรทกลุ่ม", "Chiang Mai 4-star — group rates"),
    body: z(
      "ทวินกลุ่ม ฿2,400–2,800 รวมอาหารเช้า ภาษี ห้องไกด์ ตามซีซันฝน 2025 ไม่ใช่โควต้าที่ถืออยู่",
      "Group twins ฿2,400–2,800 incl. breakfast, tax, guide room — 2025 rain-season memory, not a held allotment."
    ),
    source: "Hotel desk extract · Q3 2025",
    validFrom: "2025-07-01",
    validTo: "2026-10-31",
    region: "North Thailand",
  },
  {
    id: "mem-can-cnx",
    topic: z("ไฟลต์กลุ่ม CAN–CNX", "Group air CAN–CNX"),
    body: z(
      "คอนโซจีนให้ประมาณ ฿9,200/คน ไปกลับ มัดจำ 30% ปล่อย T-21 — ยังไม่ใช่บล็อก",
      "China consolidator ~฿9,200/pax RT, 30% deposit, release T-21 — not a block."
    ),
    source: "Consolidator email 2025-11",
    validFrom: "2025-11-01",
    validTo: "2026-11-30",
    region: "CAN / CNX",
  },
  {
    id: "mem-coach-north",
    topic: z("โค้ชเหนือ + กระเป๋า", "North coach + luggage"),
    body: z(
      "45 ที่ ฿18,000/วัน ล่วงเวลา ฿800/ชม. กลุ่ม 40 คนต้องรถกระเป๋า กลุ่ม 32 อาจตัดได้",
      "45-seat ฿18,000/day, OT ฿800/hr. 40 pax needs a luggage van; 32 may drop it."
    ),
    source: "North coach hire · contract 2025",
    validFrom: "2025-01-01",
    validTo: "2026-12-31",
    region: "North Thailand",
  },
  {
    id: "mem-ming",
    topic: z("ไกด์จีน เชียงใหม่–เชียงราย", "Chinese-speaking guide, Chiang Mai–Chiang Rai"),
    body: z(
      "หมิง ฿5,500/วัน ตอบช้าช่วงไฮซีซัน ต้องขอคิวก่อน 14 วัน ไม่ยืนยันจนกว่าไกด์ตอบ",
      "Ming ฿5,500/day. Slow in high season — request 14 days out. Not confirmed until she replies."
    ),
    source: "Guide roster · ops log 2025",
    validFrom: "2025-01-01",
    validTo: "2026-12-31",
    region: "North Thailand",
  },
  {
    id: "mem-mekong-rain",
    topic: z("แม่โขงหน้าฝน", "Mekong in the rain"),
    body: z(
      "เรือเชียงแสนยกเลิกได้หลังฝนหนัก บ้านดำยังรับกลุ่ม 40 ได้ถึง 17:00",
      "Chiang Saen boats can cancel after heavy rain. Baan Dam still takes 40 until 17:00."
    ),
    source: "Trip failure log · Aug 2025",
    validFrom: "2025-08-01",
    validTo: "2026-10-31",
    region: "Golden Triangle",
  },
  {
    id: "mem-late-rest",
    topic: z("ร้านเหนือที่ตอบช้า", "Late-ack North restaurant"),
    body: z(
      "ร้านริมคูเมืองตอบช้าปีที่แล้ว ห้ามวางมื้อค่ำวันแรกโดยไม่มีสำรอง",
      "Old-city restaurant acked late last year — do not stack night-1 dinner without a backup."
    ),
    source: "Quality agent · 2025 post-trip",
    validFrom: "2025-09-01",
    validTo: "2026-09-30",
    region: "Chiang Mai",
  },
];

export function seedNegotiation(): AgiNegotiation {
  return {
    offers: [
      {
        id: "off-ht-a",
        supplier: z("โรงแรมนิมมาน 4 ดาว (รอชื่อ)", "Nimman 4-star (unnamed)"),
        module: "hotel",
        inclusions: [z("อาหารเช้า", "Breakfast"), z("ภาษี", "Tax"), z("ห้องไกด์", "Guide room")],
        exclusions: [z("รถรับส่งสนามบิน", "Airport transfer"), z("ถือห้อง", "Room hold")],
        unit: 2500,
        total: 2500 * 20 * 5,
        klass: "estimate",
        via: "email",
        round: 1,
      },
      {
        id: "off-ht-b",
        supplier: z("โรงแรมเก่าเมือง 4 ดาว", "Old-city 4-star"),
        module: "hotel",
        inclusions: [z("อาหารเช้า", "Breakfast"), z("ภาษี", "Tax")],
        exclusions: [z("ห้องไกด์", "Guide room"), z("ถือห้อง", "Room hold")],
        unit: 2400,
        total: 2400 * 20 * 5,
        klass: "estimate",
        via: "extract",
        round: 1,
      },
      {
        id: "off-ht-c",
        supplier: z("รีสอร์ทแม่ริม", "Mae Rim resort"),
        module: "hotel",
        inclusions: [z("อาหารเช้า", "Breakfast"), z("ภาษี", "Tax"), z("รถรับส่งในเมือง 1 เที่ยว", "One town transfer")],
        exclusions: [z("ถือห้อง", "Room hold")],
        unit: 2800,
        total: 2800 * 20 * 5,
        klass: "estimate",
        via: "portal",
        round: 1,
      },
      {
        id: "off-bus-a",
        supplier: z("รถเช่าเหนือ", "North coach hire"),
        module: "bus",
        inclusions: [z("คนขับ", "Driver"), z("น้ำมันในเส้นทาง", "Fuel on route")],
        exclusions: [z("ล่วงเวลา", "Overtime"), z("ยืนยันคัน", "Named vehicle")],
        unit: 18000,
        total: 18000 * 6,
        klass: "estimate",
        via: "portal",
        round: 1,
      },
    ],
    rounds: [
      {
        n: 1,
        status: "waiting",
        authorized: true,
        note: z("รอบ 1 ส่งแล้ว — ขอเรทและอินคลูชัน ไม่ขอถือของ", "Round 1 sent — rates and inclusions only, no hold."),
      },
    ],
  };
}

export function seedRehearsal(): { cases: AgiRehearsalCase[] } {
  return {
    cases: [
      {
        id: "late-arrival",
        label: z("ถึงดึก 3 ชม.", "Late arrival +3h"),
        trigger: z("ไฟลต์ขาเข้าเลื่อนถึง 10:40", "Inbound slides to 10:40"),
        fragile: z("รถรับ → เช็คอินโรงแรม → มื้อค่ำ 19:00", "Transfer → hotel check-in → 19:00 dinner"),
        assumption: z("บัฟเฟอร์รับส่ง 90 นาที และโรงยังไม่ล็อกชื่อ", "90-minute transfer buffer; hotel unnamed / not held"),
        outcome: z("มื้อค่ำพลาด ต้องเลื่อน 20:30 หรือตัดวัดวันแรก", "Dinner window fails — shift to 20:30 or drop day-1 temple"),
        ran: false,
      },
      {
        id: "slow-board",
        label: z("ขึ้นรถช้า", "Slow boarding"),
        trigger: z("กรุ๊ปจีนขึ้นรถ +10 นาทีโดยสถิติ", "Chinese groups board +10 min on average"),
        fragile: z("สล็อตมื้อกลางวันติดวัด", "Lunch slot stacked on the temple"),
        assumption: z("หัวอาหารยังเป็นประมาณ 40 ไม่มีรายชื่อแพ้", "Meal headcount still assumed 40; allergens unknown"),
        outcome: z("ร้านตัดหัวหลัง 13:15 — อย่าวางมื้อติดสล็อต", "Restaurant cuts the group after 13:15 — do not stack meals"),
        ran: false,
      },
      {
        id: "rain",
        label: z("ฝนเชียงแสน", "Rain at Chiang Saen"),
        trigger: z("ฝนหนักยกเลิกเรือแม่โขง", "Heavy rain cancels the Mekong boat"),
        fragile: z("วันสามเหลี่ยมทองคำไม่มีแผนสำรองในบรีฟ", "Golden Triangle day has no rain plan in the brief"),
        assumption: z("ความจำบริษัท: บ้านดำยังรับ 40 ถึง 17:00", "Company memory: Baan Dam still takes 40 until 17:00"),
        outcome: z("สลับบ้านดำ — ไม่เสียมื้อ แต่เสียล่องแม่โขง", "Swap Baan Dam — meals kept, Mekong boat lost"),
        ran: false,
      },
      {
        id: "missed-meal",
        label: z("พลาดหน้าต่างมื้อ", "Missed meal window"),
        trigger: z("ดอยสุเทพล้น กลุ่มออกช้า 70 นาที", "Doi Suthep overrun, group leaves +70 min"),
        fragile: z("ร้านค่ำตัดโต๊ะ 20:00", "Dinner restaurant releases tables at 20:00"),
        assumption: z("ร้านยังไม่คอนเฟิร์ม — นี่คือประมาณการความจุ", "Restaurant not confirmed — capacity is an estimate"),
        outcome: z("ต้องมีร้านสำรองในอำนาจ ฿20,000 หรือเลื่อนมื้อ", "Need a backup inside the ฿20,000 spend cap, or move dinner"),
        ran: false,
      },
    ],
  };
}

export function hydrateAgi(raw: Partial<AgiState> | null | undefined, on?: boolean): AgiState {
  const base = emptyAgi(on ?? raw?.on ?? false);
  return {
    ...base,
    ...raw,
    on: on ?? raw?.on ?? false,
    authority: { ...DEFAULT_AUTHORITY, ...raw?.authority },
    missions: raw?.missions ?? [],
    activeId: raw?.activeId,
    ingests: raw?.ingests ?? [],
    memory: raw?.memory?.length ? raw.memory : SEED_MEMORY,
    negotiation: raw?.negotiation ?? seedNegotiation(),
    rehearsal: raw?.rehearsal ?? seedRehearsal(),
    tapInbox: raw?.tapInbox?.length ? raw.tapInbox : [FLAGSHIP_TAP],
    adapter: "local-engine",
  };
}

function factsFromBrief(b: ParsedBrief, source: string): AgiFact[] {
  return [
    { id: "in-pax", label: z("จำนวนผู้เดินทาง", "Traveller count"), value: z(`${b.pax} คน`, `${b.pax} travellers`), klass: "confirmed", source, module: "sales" },
    { id: "in-nat", label: z("สัญชาติ", "Nationality"), value: z(b.nationality, b.nationality), klass: "confirmed", source, module: "guide" },
    { id: "in-days", label: z("จำนวนวัน", "Length"), value: z(`${b.days} วัน`, `${b.days} days`), klass: "confirmed", source, module: "sales" },
    { id: "in-dest", label: z("ปลายทาง", "Destination"), value: z(b.dest, b.dest), klass: "estimate", source, module: "sales" },
    { id: "in-hotel", label: z("ระดับโรงแรม", "Hotel class"), value: z(`${b.hotelClass} ดาว`, `${b.hotelClass}-star`), klass: "estimate", source, module: "hotel" },
    { id: "in-hold", label: z("ของที่ถืออยู่", "Inventory held"), value: z("ไม่มี — อัปโหลดนี้ไม่ใช่การจอง", "None — this upload is not a booking"), klass: "missing", source: "Authority policy", module: "flight" },
    { id: "in-dates", label: z("วันเดินทาง", "Travel dates"), value: z("ยังไม่ล็อกในไฟล์", "Not locked in the file"), klass: "missing", source, module: "sales" },
  ];
}

function kindFromName(name: string, fallback: IngestKind): IngestKind {
  const n = name.toLowerCase();
  if (n.endsWith(".csv") || n.endsWith(".tsv")) return "csv";
  if (n.endsWith(".json")) return "json";
  if (n.endsWith(".txt") || n.endsWith(".eml") || n.endsWith(".msg") || n.endsWith(".md")) return "txt";
  if (n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".ods")) return "spreadsheet";
  if (n.endsWith(".pdf")) return "pdf";
  if (/\.(mp3|m4a|wav|webm|ogg|aac)$/.test(n)) return "voice";
  return fallback;
}

export const INGEST_ACCEPT = ".txt,.csv,.json,.tsv,.eml,.msg,.md,.pdf,.mp3,.m4a,.wav,.webm,.xlsx,.xls,.ods";

export function ingestFromVoice(text: string): AgiIngest {
  return buildIngest("paste", "voice.txt", text);
}

export async function ingestFromFile(file: File): Promise<AgiIngest> {
  const kind = kindFromName(file.name, "txt");
  const readable = kind === "txt" || kind === "csv" || kind === "json" || kind === "paste";
  const text = readable ? await file.text() : "";
  return buildIngest(kind, file.name, text);
}

export function draftsFromIngest(ingest: AgiIngest): AiDraft[] {
  const confirmed = ingest.facts.filter((f) => f.klass === "confirmed");
  const estimate = ingest.facts.filter((f) => f.klass === "estimate");
  const missing = ingest.facts.filter((f) => f.klass === "missing");
  const lines = ingest.facts.map((f) => `${f.label.en}: ${f.value.en} [${f.klass}]`).join("\n");
  return [
    {
      id: `ai-ingest-${ingest.id}`,
      feature: "AI Tour Producer",
      title: z(`จาก ${ingest.name}`, `From ${ingest.name}`),
      body: ingest.note,
      editable: lines || ingest.rawPreview,
      applied: false,
    },
    {
      id: `ai-ingest-gap-${ingest.id}`,
      feature: "AI Operations Assistant",
      title: z("แยกฟิลด์แล้ว — ยังไม่ถือของ", "Fields extracted — nothing held"),
      body: z(
        `ยืนยัน ${confirmed.length} · ประมาณ ${estimate.length} · ขาด ${missing.length}`,
        `Confirmed ${confirmed.length} · estimate ${estimate.length} · missing ${missing.length}`
      ),
      editable: missing.map((f) => `${f.label.en}: ${f.value.en}`).join("\n") || "No missing fields marked.",
      applied: false,
    },
  ];
}

function textFromStructured(kind: IngestKind, name: string, text: string): string {
  if (kind === "pdf" || kind === "voice" || kind === "spreadsheet") {
    if (text.trim()) return text;
    const n = name.toLowerCase();
    const bits = ["Thailand tour"];
    if (/golden|triangle|gt40|nanfang|จีน|chinese/.test(n)) bits.push("40 Chinese travelers, Golden Triangle");
    else if (/swedish|สวีเดน|se40|nordic/.test(n)) bits.push("40 Swedish travelers");
    else if (/(\d{2})/.test(n)) bits.push(`${n.match(/(\d{2})/)?.[1]} travelers`);
    if (/6|six/.test(n)) bits.push("six-day");
    if (/thai|thailand|cnx|chiang/.test(n)) bits.push("Thailand");
    bits.push("18% margin");
    return `${bits.join(", ")}. Recorded upload — no speech-to-text / PDF parse. Fields estimated from the filename.`;
  }
  if (kind === "csv" && text.includes(",")) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    return lines
      .map((ln) => {
        const [k, v] = ln.split(/[,;\t]/).map((s) => s.trim());
        return v ? `${k} ${v}` : ln;
      })
      .join(". ");
  }
  if (kind === "json") {
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      return Object.entries(j)
        .map(([k, v]) => `${k} ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(". ");
    } catch {
      return text;
    }
  }
  return text;
}

export function buildIngest(kind: IngestKind, name: string, text: string): AgiIngest {
  const resolved = kindFromName(name, kind);
  const body = textFromStructured(resolved, name, text);
  const tap = tryTapBrief(text);
  const brief = parseBrief(tap ? briefFromTap(tap) : body || FLAGSHIP_BRIEF);
  const source = resolved === "pdf" || resolved === "voice" ? `Recorded ${resolved} · ${name}` : `Ingest · ${name}`;
  return {
    id: `ing-${Date.now()}`,
    kind: resolved,
    name,
    at: now(),
    rawPreview: (text || body).slice(0, 280),
    facts: factsFromBrief(brief, source),
    note: name.toLowerCase().startsWith("voice")
      ? z("ถอดเสียงแล้ว แยก confirmed / estimate / missing — ยังไม่ถือของ", "Speech transcribed. Split confirmed / estimate / missing — nothing held.")
      : resolved === "pdf" || resolved === "voice"
        ? z("บันทึกการอัปโหลด — ดึงฟิลด์จากชื่อไฟล์/เดโม ไม่ถอดเสียงหรืออ่าน PDF จริง", "Recorded upload — fields from filename/demo, no live STT or PDF lib.")
        : z("ดึงข้อความแล้ว แยก confirmed / estimate / missing — ยังไม่ถือของ", "Text read. Split confirmed / estimate / missing — nothing held."),
  };
}

export function applyIngest(state: AgiState, ingest: AgiIngest): AgiState {
  const missions = state.activeId
    ? state.missions.map((m) =>
        m.id === state.activeId
          ? {
              ...m,
              facts: [...ingest.facts, ...m.facts.filter((f) => !ingest.facts.some((x) => x.id === f.id))],
              log: [{ at: now(), agent: "sales" as const, text: z(`รับไฟล์ ${ingest.name}`, `Ingested ${ingest.name}`) }, ...m.log],
            }
          : m
      )
    : state.missions;
  return { ...state, ingests: [ingest, ...state.ingests].slice(0, 12), missions };
}

export function resumeJob(mission: AgiMission, jobId: string): AgiMission {
  return {
    ...mission,
    jobs: mission.jobs.map((j) =>
      j.id === jobId
        ? {
            ...j,
            status: "done",
            note: z("ซัพพลายเออร์ตอบแล้ว — นี่คือใบเสนอ ไม่ใช่การถือของ", "Supplier replied — this is a quote, not a hold."),
          }
        : j
    ),
    log: [{ at: now(), agent: "director", text: z(`งาน ${jobId} ทำต่อหลังซัพพลายเออร์ตอบ`, `Resumed ${jobId} after supplier reply`) }, ...mission.log],
    status: mission.paused ? "paused" : "working",
  };
}

export function resumeJobInState(state: AgiState, jobId: string): AgiState {
  return {
    ...state,
    missions: state.missions.map((m) => (m.id === state.activeId ? resumeJob(m, jobId) : m)),
  };
}

export function buildScorecards(mission?: AgiMission): AgiScorecard[] {
  return AGENT_ORDER.map((id) => {
    const jobs = mission?.jobs.filter((j) => j.agent === id) ?? [];
    const completed = jobs.filter((j) => j.status === "done").length;
    const waiting = jobs.filter((j) => j.status === "waiting" || j.status === "working").length;
    const line = mission?.changePlan?.lines.find((ln) => moduleOf(id) === ln.module);
    const rescueCost = mission?.rescue?.chosen
      ? mission.rescue.options.find((o) => o.id === mission.rescue?.chosen)?.extraCost || 0
      : 0;
    const costImpact = (line?.cost || 0) + (id === "guide" || id === "director" ? rescueCost : 0);
    const corrections = mission?.changePlan?.applied && (id === "director" || id === "finance" || id === "flight") ? 1 : 0;
    return {
      agent: id,
      completed,
      waiting,
      corrections,
      costImpact,
      note:
        waiting > 0
          ? z("ยังรอคนหรือซัพพลายเออร์ — อย่าข้ามเป็นคอนเฟิร์ม", "Still waiting on a human or supplier — not a confirmation.")
          : z("งานในภารกิจนี้จบแล้วจากเอนจินท้องถิ่น", "Jobs on this mission closed by the local engine."),
    };
  });
}

function moduleOf(id: string) {
  if (id === "flight") return "flight";
  if (id === "hotel") return "hotel";
  if (id === "bus") return "bus";
  if (id === "venue") return "meal";
  if (id === "guide") return "guide";
  return "";
}

export function buildAutopilot(mission?: AgiMission): AgiAutopilot {
  const lead = mission?.options[0];
  const pax = lead?.pax || 40;
  const sold = 0;
  const committedCost = 0;
  const estimatedCost = lead?.cost || 0;
  const sell = lead?.sell || 0;
  const margin = lead?.margin || 18;
  const changePen = mission?.changePlan?.applied ? mission.changePlan.lines.filter((l) => l.cost > 0).reduce((n, l) => n + l.cost, 0) : 0;
  return {
    sold,
    committedCost,
    estimatedCost,
    margin,
    cash: -changePen,
    releases: [
      { label: z("ไฟลต์กลุ่ม T-21", "Group air T-21"), due: "2026-10-18T17:00:00+07:00", risk: z("ยังไม่มีบล็อกให้ปล่อย", "No block exists to release") },
      { label: z("โรงแรม T-14", "Hotel T-14"), due: "2026-10-25T17:00:00+07:00", risk: z("ห้องยัง requested", "Rooms still requested") },
    ],
    recs: [
      {
        id: "ap-price",
        action: "price",
        title: z("คงราคาขายจนกว่าใบเสนอจะกลับ", "Hold the sell price until quotes return"),
        marginDelta: 0,
        cashDelta: 0,
        penalty: 0,
        assumption: z("มาร์จิ้นคำนวณจากประมาณการ ไม่ใช่ต้นทุนที่ยืนยัน", "Margin is on estimates, not committed cost"),
      },
      {
        id: "ap-release",
        action: "release",
        title: z("ห้ามปล่อยห้อง — ไม่มีของที่ถือ", "Do not release rooms — nothing is held"),
        marginDelta: 0,
        cashDelta: 0,
        penalty: 0,
        assumption: z("ปล่อยของที่ไม่ได้ถือ = สื่อผิดว่าจองแล้ว", "Releasing unheld inventory implies a booking"),
      },
      {
        id: "ap-promote",
        action: "promote",
        title: z(`โปรโมทที่นั่ง Agent Direct ที่ราคาขาย · ${pax - sold} ที่`, `Promote Agent Direct seats at sell price · ${pax - sold} seats`),
        marginDelta: 0,
        cashDelta: 0,
        penalty: 0,
        assumption: z("เอเจนต์ภายนอกเห็นราคาขายเท่านั้น", "External agents see sell price only"),
      },
      {
        id: "ap-vehicle",
        action: "vehicle",
        title: pax <= 32 ? z("ตัดรถกระเป๋า เหลือโค้ช 45 ที่", "Drop luggage van, keep 45-seat coach") : z("คงโค้ช 45 ที่ + รถกระเป๋า", "Keep 45-seat coach + luggage van"),
        marginDelta: pax <= 32 ? 0.4 : 0,
        cashDelta: pax <= 32 ? 12000 : 0,
        penalty: 0,
        assumption: z("คันรถยังไม่ถูกจัดสรร", "No named vehicle is assigned"),
      },
    ],
  };
}

export function authorizeNextRound(state: AgiState): AgiState {
  const neg = state.negotiation ?? seedNegotiation();
  const nextN = (neg.rounds[neg.rounds.length - 1]?.n || 0) + 1;
  return {
    ...state,
    negotiation: {
      ...neg,
      rounds: [
        ...neg.rounds,
        {
          n: nextN,
          status: "waiting",
          authorized: true,
          note: z(`รอบ ${nextN} อนุมัติแล้ว — ส่งเทียบอินคลูชัน ไม่ถือของ`, `Round ${nextN} authorized — compare inclusions, no hold.`),
        },
      ],
    },
  };
}

export function markRoundReplied(state: AgiState): AgiState {
  const neg = state.negotiation ?? seedNegotiation();
  const rounds = neg.rounds.map((r, i) => (i === neg.rounds.length - 1 ? { ...r, status: "replied" as const } : r));
  const waiting = (state.missions.find((m) => m.id === state.activeId)?.jobs || []).find((j) => j.status === "waiting");
  let next: AgiState = { ...state, negotiation: { ...neg, rounds } };
  if (waiting) next = resumeJobInState(next, waiting.id);
  return next;
}

export function runRehearsalCase(state: AgiState, id: RehearsalId): AgiState {
  const base = state.rehearsal ?? seedRehearsal();
  return {
    ...state,
    rehearsal: {
      lastId: id,
      cases: base.cases.map((c) => (c.id === id ? { ...c, ran: true } : c)),
    },
  };
}

export function waitingJobs(mission?: AgiMission): AgiJob[] {
  return (mission?.jobs || []).filter((j) => j.status === "waiting" || j.status === "working");
}

export { type ParsedBrief };
