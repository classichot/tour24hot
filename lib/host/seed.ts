import type { L10n } from "../data";
import { HOST_STAY_ID, type HostState, type HostStay } from "./types";

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });

const DAYS = [
  z("เชียงใหม่ รับเข้า — ดอยสุเทพ", "Chiang Mai arrival — Doi Suthep", "清迈抵达 — 素贴山"),
  z("เชียงใหม่ เมืองเก่า", "Chiang Mai old city", "清迈古城"),
  z("ไปเชียงราย — วัดร่องขุ่น", "To Chiang Rai — White Temple", "前往清莱 — 白庙"),
  z("เชียงแสน สามเหลี่ยมทองคำ", "Chiang Saen Golden Triangle", "清盛金三角"),
  z("วัดร่องเสือเต้น / บ้านดำ", "Blue Temple / Black House", "蓝庙 / 黑屋"),
  z("ส่งออก เชียงใหม่", "Depart Chiang Mai", "清迈送机"),
];

const CITIES = [
  z("เชียงใหม่", "Chiang Mai", "清迈"),
  z("เชียงใหม่", "Chiang Mai", "清迈"),
  z("เชียงราย", "Chiang Rai", "清莱"),
  z("เชียงแสน", "Chiang Saen", "清盛"),
  z("เชียงราย", "Chiang Rai", "清莱"),
  z("เชียงใหม่", "Chiang Mai", "清迈"),
];

function stay(): HostStay {
  return {
    id: HOST_STAY_ID,
    title: z("สามเหลี่ยมทองคำ — กรุ๊ปจีน 40 คน", "Golden Triangle — 40 Chinese guests", "金三角 — 40人中国团"),
    host: z("โฮสต์ภาคเหนือ TOUR24", "TOUR24 North host", "TOUR24 北泰接待"),
    dateStart: "2026-10-12",
    dateEnd: "2026-10-17",
    days: 6,
    pax: 40,
    rooms: 21,
    sell: 960000,
    daysPlan: DAYS.map((title, i) => ({
      n: i + 1,
      title,
      city: CITIES[i],
      note: z("ยังไม่ถือห้อง — โควตวันตามไฟล์โฮสต์", "Rooms not held — host-day quota only", "未锁房 — 仅接待日程"),
    })),
    guests: [
      { id: "g1", name: "Chen Wei", room: "T-201", status: "arriving" },
      { id: "g2", name: "Li Na", room: "T-201", status: "arriving" },
      { id: "g3", name: "Wang Fang", room: "T-202", status: "arriving" },
      { id: "g4", name: "Zhang Min", room: "S-110", status: "arriving" },
      { id: "g5", name: "Liu Yang", room: "T-203", status: "arriving" },
      { id: "g6", name: "Zhao Lei", room: "T-203", status: "arriving" },
    ],
    arrivals: [
      {
        id: "ar1",
        flight: "CZ3051 CAN–CNX",
        at: "2026-10-12T07:10:00+07:00",
        pax: 40,
        note: z("รับที่ CNX แล้วขึ้นดอยสุเทพ 10:30", "Meet at CNX then Doi Suthep 10:30", "清迈机场接机后素贴山 10:30"),
      },
    ],
  };
}

export function createHostSeed(): HostState {
  return { stay: stay() };
}
