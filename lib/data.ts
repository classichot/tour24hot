// TOUR24 — prototype dataset. Values are {th, en, zh?}; plain strings are language-neutral.
export type L10n = { th: string; en: string; zh?: string };
export type Loc = string | L10n;
export type TourDirection = "outbound" | "inbound";

const z = (th: string, en: string, zh: string): L10n => ({ th, en, zh });

export type DepartureStatus = "confirmed" | "nearly" | "open" | "limited" | "sold" | "cancelled";

export interface Departure {
  date: L10n;
  status: DepartureStatus;
  seats: number;
}

export interface QualityFactor {
  label: L10n;
  score: number;
}

export interface Pkg {
  id: string;
  code: string;
  agency: string;
  direction?: TourDirection;
  market?: L10n;
  guideLang?: L10n;
  country: L10n;
  city: L10n;
  title: L10n;
  days: number;
  nights: number;
  price: number;
  real: number;
  cost: { label: L10n; amt: number }[];
  airline: string;
  airlineName: Loc;
  airlineType: "full" | "low" | "land";
  direct: boolean;
  flight: { out: string; back: string };
  baggage: string;
  hotels: { name: Loc; star: number; nights: number }[];
  hotelStar: number;
  meals: number;
  attractions: number;
  freeDays: number;
  shopping: number;
  tips: number;
  visa: number;
  optional: { name: L10n; price: number }[];
  group: number;
  cancel: L10n;
  quality: { score: number; factors: QualityFactor[] };
  truth: { level: "warn" | "info"; text: L10n }[];
  tags: string[];
  departures: Departure[];
  review: { score: number; count: number };
  itinerary: { d: number; title: L10n; body: L10n; meals: string; hotel: Loc }[];
}

export interface Agency {
  id: string;
  name: L10n;
  company: L10n;
  licence: string;
  expiry: string;
  years: number;
  bookings: number;
  response: number;
  cancelRate: number;
  refundDays: number;
  rating: number;
  reviews: number;
  trust: number;
  factors: QualityFactor[];
}

const agencies: Record<string, Agency> = {
  siam: {
    id: "siam",
    name: { th: "สยามฮอไรซอนทัวร์", en: "Siam Horizon Tours", zh: "暹罗地平线旅行社" },
    company: { th: "บริษัท สยามฮอไรซอน ทราเวล จำกัด", en: "Siam Horizon Travel Co., Ltd." },
    licence: "11/09876", expiry: "31/03/2028", years: 17, bookings: 1284, response: 12,
    cancelRate: 1.2, refundDays: 3, rating: 4.8, reviews: 612, trust: 94,
    factors: [
      { label: { th: "ใบอนุญาตถูกต้อง", en: "Valid licence" }, score: 100 },
      { label: { th: "ยืนยันตัวตนบริษัท", en: "Company verified" }, score: 100 },
      { label: { th: "การจองสำเร็จ", en: "Booking completion" }, score: 97 },
      { label: { th: "อัตราร้องเรียน", en: "Complaint rate" }, score: 95 },
      { label: { th: "ความเร็วคืนเงิน", en: "Refund speed" }, score: 92 },
      { label: { th: "ความตรงของแพ็กเกจ", en: "Package accuracy" }, score: 96 },
      { label: { th: "ความพึงพอใจลูกค้า", en: "Customer satisfaction" }, score: 96 },
      { label: { th: "เวลาตอบกลับ", en: "Response time" }, score: 89 },
      { label: { th: "ประวัติยกเลิกกลุ่ม", en: "Cancellation record" }, score: 98 },
      { label: { th: "การยืนยันออกเดินทาง", en: "Confirmed departures" }, score: 93 },
    ],
  },
  orient: {
    id: "orient",
    name: { th: "โอเรียนท์ลิงก์ทราเวล", en: "Orient Link Travel" },
    company: { th: "บริษัท โอเรียนท์ลิงก์ ทราเวล จำกัด", en: "Orient Link Travel Co., Ltd." },
    licence: "11/07341", expiry: "12/08/2027", years: 21, bookings: 2106, response: 18,
    cancelRate: 0.9, refundDays: 4, rating: 4.7, reviews: 883, trust: 91,
    factors: [
      { label: { th: "ใบอนุญาตถูกต้อง", en: "Valid licence" }, score: 100 },
      { label: { th: "ยืนยันตัวตนบริษัท", en: "Company verified" }, score: 100 },
      { label: { th: "การจองสำเร็จ", en: "Booking completion" }, score: 95 },
      { label: { th: "อัตราร้องเรียน", en: "Complaint rate" }, score: 91 },
      { label: { th: "ความเร็วคืนเงิน", en: "Refund speed" }, score: 88 },
      { label: { th: "ความตรงของแพ็กเกจ", en: "Package accuracy" }, score: 93 },
      { label: { th: "ความพึงพอใจลูกค้า", en: "Customer satisfaction" }, score: 92 },
      { label: { th: "เวลาตอบกลับ", en: "Response time" }, score: 84 },
      { label: { th: "ประวัติยกเลิกกลุ่ม", en: "Cancellation record" }, score: 97 },
      { label: { th: "การยืนยันออกเดินทาง", en: "Confirmed departures" }, score: 90 },
    ],
  },
  vela: {
    id: "vela",
    name: { th: "เวลาทราเวลกรุ๊ป", en: "Vela Travel Group" },
    company: { th: "บริษัท เวลา ทราเวล กรุ๊ป จำกัด", en: "Vela Travel Group Co., Ltd." },
    licence: "11/10552", expiry: "05/01/2027", years: 9, bookings: 604, response: 26,
    cancelRate: 2.4, refundDays: 6, rating: 4.5, reviews: 271, trust: 86,
    factors: [
      { label: { th: "ใบอนุญาตถูกต้อง", en: "Valid licence" }, score: 100 },
      { label: { th: "ยืนยันตัวตนบริษัท", en: "Company verified" }, score: 100 },
      { label: { th: "การจองสำเร็จ", en: "Booking completion" }, score: 90 },
      { label: { th: "อัตราร้องเรียน", en: "Complaint rate" }, score: 84 },
      { label: { th: "ความเร็วคืนเงิน", en: "Refund speed" }, score: 78 },
      { label: { th: "ความตรงของแพ็กเกจ", en: "Package accuracy" }, score: 88 },
      { label: { th: "ความพึงพอใจลูกค้า", en: "Customer satisfaction" }, score: 88 },
      { label: { th: "เวลาตอบกลับ", en: "Response time" }, score: 76 },
      { label: { th: "ประวัติยกเลิกกลุ่ม", en: "Cancellation record" }, score: 86 },
      { label: { th: "การยืนยันออกเดินทาง", en: "Confirmed departures" }, score: 82 },
    ],
  },
  nakara: {
    id: "nakara",
    name: { th: "นาคาราฮอลิเดย์", en: "Nakara Holiday", zh: "纳卡拉假期" },
    company: { th: "บริษัท นาคารา ฮอลิเดย์ จำกัด", en: "Nakara Holiday Co., Ltd." },
    licence: "11/11208", expiry: "22/11/2026", years: 6, bookings: 318, response: 41,
    cancelRate: 3.8, refundDays: 9, rating: 4.2, reviews: 143, trust: 79,
    factors: [
      { label: { th: "ใบอนุญาตถูกต้อง", en: "Valid licence" }, score: 100 },
      { label: { th: "ยืนยันตัวตนบริษัท", en: "Company verified" }, score: 100 },
      { label: { th: "การจองสำเร็จ", en: "Booking completion" }, score: 84 },
      { label: { th: "อัตราร้องเรียน", en: "Complaint rate" }, score: 72 },
      { label: { th: "ความเร็วคืนเงิน", en: "Refund speed" }, score: 64 },
      { label: { th: "ความตรงของแพ็กเกจ", en: "Package accuracy" }, score: 78 },
      { label: { th: "ความพึงพอใจลูกค้า", en: "Customer satisfaction" }, score: 80 },
      { label: { th: "เวลาตอบกลับ", en: "Response time" }, score: 62 },
      { label: { th: "ประวัติยกเลิกกลุ่ม", en: "Cancellation record" }, score: 74 },
      { label: { th: "การยืนยันออกเดินทาง", en: "Confirmed departures" }, score: 71 },
    ],
  },
  bkkjet: {
    id: "bkkjet",
    name: { th: "บางกอกเจ็ททัวร์", en: "Bangkok Jet Tour", zh: "曼谷捷旅" },
    company: { th: "บริษัท บางกอกเจ็ท ทัวร์ จำกัด", en: "Bangkok Jet Tour Co., Ltd." },
    licence: "11/12043", expiry: "18/02/2027", years: 4, bookings: 197, response: 55,
    cancelRate: 5.1, refundDays: 12, rating: 3.9, reviews: 88, trust: 72,
    factors: [
      { label: { th: "ใบอนุญาตถูกต้อง", en: "Valid licence" }, score: 100 },
      { label: { th: "ยืนยันตัวตนบริษัท", en: "Company verified" }, score: 100 },
      { label: { th: "การจองสำเร็จ", en: "Booking completion" }, score: 78 },
      { label: { th: "อัตราร้องเรียน", en: "Complaint rate" }, score: 61 },
      { label: { th: "ความเร็วคืนเงิน", en: "Refund speed" }, score: 52 },
      { label: { th: "ความตรงของแพ็กเกจ", en: "Package accuracy" }, score: 64 },
      { label: { th: "ความพึงพอใจลูกค้า", en: "Customer satisfaction" }, score: 70 },
      { label: { th: "เวลาตอบกลับ", en: "Response time" }, score: 48 },
      { label: { th: "ประวัติยกเลิกกลุ่ม", en: "Cancellation record" }, score: 63 },
      { label: { th: "การยืนยันออกเดินทาง", en: "Confirmed departures" }, score: 66 },
    ],
  },
};

const packages: Pkg[] = [
  {
    id: "jp01", code: "TR24-JP-1104", agency: "siam",
    country: { th: "ญี่ปุ่น", en: "Japan" }, city: { th: "โตเกียว · ฟูจิ", en: "Tokyo · Fuji" },
    title: { th: "โตเกียว ฟูจิ คาวาโกเอะ ไม่ลงร้าน", en: "Tokyo Fuji Kawagoe — no shopping stops" },
    days: 5, nights: 3, price: 32900, real: 38400,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 32900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1500 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 3200 },
      { label: { th: "ประกันเดินทางขั้นพื้นฐาน", en: "Basic travel insurance" }, amt: 800 },
    ],
    airline: "TG", airlineName: "Thai Airways", airlineType: "full", direct: true,
    flight: { out: "22:30 → 06:55", back: "17:25 → 22:05" }, baggage: "30 kg",
    hotels: [{ name: "Shinagawa Prince Hotel", star: 4, nights: 2 }, { name: "Fuji Lake Hotel", star: 4, nights: 1 }],
    hotelStar: 4, meals: 8, attractions: 9, freeDays: 1, shopping: 0, tips: 1500, visa: 0,
    optional: [{ name: { th: "ล่องเรือโจรสลัดทะเลสาบอาชิ", en: "Lake Ashi pirate cruise" }, price: 900 }],
    group: 24, cancel: { th: "ยกเลิกก่อน 45 วัน คืนเต็ม · 30–44 วัน คืน 50%", en: "Free before 45 days · 50% at 30–44 days" },
    quality: {
      score: 86, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 88 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 82 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 90 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 100 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 84 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 80 },
      ],
    },
    truth: [], tags: ["noshop", "family", "elderly", "freeday", "direct"],
    departures: [
      { date: { th: "12–16 ต.ค. 2026", en: "12–16 Oct 2026" }, status: "confirmed", seats: 6 },
      { date: { th: "19–23 ต.ค. 2026", en: "19–23 Oct 2026" }, status: "nearly", seats: 11 },
      { date: { th: "02–06 พ.ย. 2026", en: "02–06 Nov 2026" }, status: "open", seats: 24 },
      { date: { th: "05–09 ต.ค. 2026", en: "05–09 Oct 2026" }, status: "sold", seats: 0 },
    ],
    review: { score: 4.8, count: 96 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – ฮาเนดะ", en: "Suvarnabhumi – Haneda" }, body: { th: "ออกเดินทางเที่ยวบินตรงกลางคืน พักผ่อนบนเครื่อง", en: "Overnight direct flight; rest on board." }, meals: "—", hotel: "—" },
      { d: 2, title: { th: "โตเกียว: อาซากุสะ – สกายทรี – ชินจูกุ", en: "Tokyo: Asakusa – Skytree – Shinjuku" }, body: { th: "วัดอาซากุสะ ถ่ายรูปโตเกียวสกายทรี ช่วงบ่ายอิสระย่านชินจูกุ", en: "Senso-ji, Skytree photo stop, free afternoon in Shinjuku." }, meals: "B / L", hotel: "Shinagawa Prince Hotel" },
      { d: 3, title: { th: "ฟูจิชั้น 5 – หมู่บ้านโอชิโนะฮักไก – ออนเซ็น", en: "Mt Fuji 5th station – Oshino Hakkai – onsen" }, body: { th: "ขึ้นฟูจิชั้น 5 ตามสภาพอากาศ เดินหมู่บ้านน้ำใส พักโรงแรมออนเซ็นริมทะเลสาบ", en: "Fuji 5th station (weather permitting), spring village walk, lakeside onsen stay." }, meals: "B / L / D", hotel: "Fuji Lake Hotel" },
      { d: 4, title: { th: "คาวาโกเอะ – วันอิสระโตเกียว", en: "Kawagoe – free day in Tokyo" }, body: { th: "เมืองเก่าคาวาโกเอะช่วงเช้า บ่ายอิสระเต็มวันในโตเกียว มีไกด์ให้คำแนะนำ", en: "Old-town Kawagoe in the morning, full free afternoon with guide on call." }, meals: "B / L", hotel: "Shinagawa Prince Hotel" },
      { d: 5, title: { th: "ฮาเนดะ – สุวรรณภูมิ", en: "Haneda – Suvarnabhumi" }, body: { th: "บินกลับช่วงเย็น ถึงกรุงเทพฯ กลางคืน", en: "Evening flight home, arriving Bangkok late." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "jp02", code: "TR24-JP-2277", agency: "bkkjet",
    country: { th: "ญี่ปุ่น", en: "Japan" }, city: { th: "โตเกียว · ฟูจิ", en: "Tokyo · Fuji" },
    title: { th: "โตเกียว ฟูจิ ราคาประหยัด", en: "Tokyo Fuji budget special" },
    days: 5, nights: 3, price: 27900, real: 36700,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 27900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 2000 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 3900 },
      { label: { th: "ค่าธรรมเนียมเลือกที่นั่งและกระเป๋า", en: "Seat selection & baggage fee" }, amt: 1400 },
      { label: { th: "กิจกรรมบังคับ: บุฟเฟ่ต์ขาปู", en: "Mandatory activity: crab buffet" }, amt: 1500 },
    ],
    airline: "XJ", airlineName: "Thai AirAsia X", airlineType: "low", direct: true,
    flight: { out: "02:15 → 10:40", back: "11:15 → 15:50" }, baggage: "20 kg",
    hotels: [{ name: { th: "โรงแรมระดับ 3 ดาว หรือเทียบเท่า", en: "3-star hotel or equivalent" }, star: 3, nights: 3 }],
    hotelStar: 3, meals: 5, attractions: 7, freeDays: 0, shopping: 3, tips: 2000, visa: 0,
    optional: [
      { name: { th: "ดิสนีย์แลนด์ (แทนวันเที่ยว)", en: "Disneyland (replaces touring day)" }, price: 3200 },
      { name: { th: "บุฟเฟ่ต์ขาปู", en: "Crab buffet" }, price: 1500 },
    ],
    group: 38, cancel: { th: "ยกเลิกไม่คืนเงินทุกกรณี", en: "Non-refundable in all cases" },
    quality: {
      score: 58, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 48 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 40 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 52 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 45 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 55 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 50 },
      ],
    },
    truth: [
      { level: "warn", text: { th: "โรงแรมระบุว่า “ระดับ 3 ดาว หรือเทียบเท่า” ทั้ง 3 คืน ไม่มีชื่อโรงแรมจริง", en: "All 3 nights listed as “3-star or equivalent” — no hotel is actually named." } },
      { level: "warn", text: { th: "บุฟเฟ่ต์ขาปูเขียนว่า “ทัวร์เสริม” แต่รายการเดินทางบังคับเข้าร่วม", en: "Crab buffet is called “optional” but the itinerary requires it." } },
      { level: "warn", text: { th: "ร้านช้อป 3 แห่งไม่ระบุเวลา อาจกินเวลาเที่ยวจริง", en: "3 shopping stops with no stated duration may cut into sightseeing." } },
      { level: "info", text: { th: "ทิป 2,000 บาท เก็บที่สนามบิน ไม่รวมในราคาโฆษณา", en: "฿2,000 tip collected at the airport, not in the advertised price." } },
    ],
    tags: ["budget", "direct"],
    departures: [
      { date: { th: "12–16 ต.ค. 2026", en: "12–16 Oct 2026" }, status: "sold", seats: 0 },
      { date: { th: "19–23 ต.ค. 2026", en: "19–23 Oct 2026" }, status: "open", seats: 22 },
    ],
    review: { score: 3.8, count: 41 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – นาริตะ (บินดึก)", en: "Suvarnabhumi – Narita (red-eye)" }, body: { th: "เช็กอิน 23:30 ออกเดินทาง 02:15", en: "Check-in 23:30, departure 02:15." }, meals: "—", hotel: "—" },
      { d: 2, title: { th: "นาริตะ – ร้านปลอดภาษี – วัดอาซากุสะ", en: "Narita – duty free – Asakusa" }, body: { th: "ถึงเช้า เข้าร้านปลอดภาษี 90 นาที ก่อนเข้าวัด", en: "Morning arrival, 90 minutes at duty free before the temple." }, meals: "L", hotel: { th: "โรงแรม 3 ดาว หรือเทียบเท่า", en: "3-star or equivalent" } },
      { d: 3, title: { th: "ฟูจิชั้น 5 – ศูนย์แผ่นดินไหว – ช้อปโกเท็มบะ", en: "Fuji 5th station – earthquake museum – Gotemba outlet" }, body: { th: "นั่งรถรวม 6 ชั่วโมง มีร้านช้อป 2 แห่งระหว่างทาง", en: "Six hours on the coach with two shopping stops en route." }, meals: "B / L", hotel: { th: "โรงแรม 3 ดาว หรือเทียบเท่า", en: "3-star or equivalent" } },
      { d: 4, title: { th: "ร้านเครื่องสำอาง – โอไดบะ – บุฟเฟ่ต์ขาปู", en: "Cosmetics shop – Odaiba – crab buffet" }, body: { th: "ร้านช้อปช่วงเช้า อิสระโอไดบะ 2 ชั่วโมง", en: "Shopping in the morning, two free hours at Odaiba." }, meals: "B / D", hotel: { th: "โรงแรม 3 ดาว หรือเทียบเท่า", en: "3-star or equivalent" } },
      { d: 5, title: { th: "นาริตะ – สุวรรณภูมิ", en: "Narita – Suvarnabhumi" }, body: { th: "ออกจากโรงแรม 06:00 บินกลับ 11:15", en: "Hotel checkout 06:00, flight home 11:15." }, meals: "—", hotel: "—" },
    ],
  },
  {
    id: "jp03", code: "TR24-JP-3390", agency: "orient",
    country: { th: "ญี่ปุ่น", en: "Japan" }, city: { th: "โอซาก้า · เกียวโต", en: "Osaka · Kyoto" },
    title: { th: "โอซาก้า เกียวโต นารา กลุ่มเล็ก 16 คน", en: "Osaka Kyoto Nara — small group of 16" },
    days: 6, nights: 4, price: 39900, real: 44100,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 39900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1200 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 3000 },
    ],
    airline: "JL", airlineName: "Japan Airlines", airlineType: "full", direct: true,
    flight: { out: "07:35 → 15:05", back: "18:20 → 22:35" }, baggage: "2 × 23 kg",
    hotels: [{ name: "Hotel Granvia Osaka", star: 5, nights: 2 }, { name: "Kyoto Tokyu Hotel", star: 4, nights: 2 }],
    hotelStar: 5, meals: 10, attractions: 11, freeDays: 1, shopping: 0, tips: 1200, visa: 0,
    optional: [{ name: { th: "พิธีชงชาแบบเกียวโต", en: "Kyoto tea ceremony" }, price: 1200 }],
    group: 16, cancel: { th: "ยกเลิกก่อน 60 วัน คืนเต็ม · 30–59 วัน คืน 70%", en: "Free before 60 days · 70% at 30–59 days" },
    quality: {
      score: 92, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 94 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 90 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 92 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 100 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 90 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 88 },
      ],
    },
    truth: [], tags: ["noshop", "luxury", "smallgroup", "elderly", "freeday", "honeymoon", "direct"],
    departures: [
      { date: { th: "12–17 ต.ค. 2026", en: "12–17 Oct 2026" }, status: "nearly", seats: 5 },
      { date: { th: "09–14 พ.ย. 2026", en: "09–14 Nov 2026" }, status: "open", seats: 16 },
      { date: { th: "23–28 พ.ย. 2026", en: "23–28 Nov 2026" }, status: "open", seats: 16 },
    ],
    review: { score: 4.9, count: 74 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – คันไซ – อุเมดะ", en: "Suvarnabhumi – Kansai – Umeda" }, body: { th: "บินเช้า ถึงบ่าย เข้าโรงแรมติดสถานีโอซาก้า", en: "Morning flight, afternoon arrival, hotel above Osaka station." }, meals: "D", hotel: "Hotel Granvia Osaka" },
      { d: 2, title: { th: "นารา – ปราสาทโอซาก้า", en: "Nara – Osaka Castle" }, body: { th: "วัดโทไดจิและสวนกวาง บ่ายปราสาทโอซาก้า เดินไม่เกิน 4 กม.", en: "Todai-ji and deer park, Osaka Castle after lunch; under 4 km walking." }, meals: "B / L", hotel: "Hotel Granvia Osaka" },
      { d: 3, title: { th: "เกียวโต: ฟูชิมิอินาริ – อาราชิยามะ", en: "Kyoto: Fushimi Inari – Arashiyama" }, body: { th: "ศาลเจ้าเช้าตรู่เลี่ยงคนแน่น ป่าไผ่ช่วงบ่าย", en: "Early shrine visit to beat the crowds, bamboo grove in the afternoon." }, meals: "B / L / D", hotel: "Kyoto Tokyu Hotel" },
      { d: 4, title: { th: "วัดคินคะคุจิ – กิออน – ย่านโพนโตะ", en: "Kinkaku-ji – Gion – Pontocho" }, body: { th: "ครึ่งวันเที่ยววัด ครึ่งวันอิสระย่านเมืองเก่า", en: "Half-day temples, half-day free in the old quarters." }, meals: "B / L", hotel: "Kyoto Tokyu Hotel" },
      { d: 5, title: { th: "วันอิสระเต็มวัน", en: "Full free day" }, body: { th: "เลือกไป USJ, โกเบ หรือช้อปปิ้งเอง มีบัตรรถไฟให้", en: "USJ, Kobe or shopping — rail pass provided." }, meals: "B", hotel: "Hotel Granvia Osaka" },
      { d: 6, title: { th: "คันไซ – สุวรรณภูมิ", en: "Kansai – Suvarnabhumi" }, body: { th: "อิสระช่วงเช้า บินกลับเย็น", en: "Free morning, evening flight home." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "jp04", code: "TR24-JP-4415", agency: "vela",
    country: { th: "ญี่ปุ่น", en: "Japan" }, city: { th: "ฮอกไกโด", en: "Hokkaido" },
    title: { th: "ฮอกไคโด ซัปโปโร โอตารุ หน้าหนาว", en: "Hokkaido winter — Sapporo & Otaru" },
    days: 6, nights: 4, price: 45900, real: 51200,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 45900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1800 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 2700 },
      { label: { th: "เช่าชุดกันหนาวและรองเท้าบูต", en: "Winter gear & boot rental" }, amt: 800 },
    ],
    airline: "TG", airlineName: "Thai Airways", airlineType: "full", direct: false,
    flight: { out: "23:45 → 09:30 (+1)", back: "14:40 → 20:15" }, baggage: "30 kg",
    hotels: [{ name: "JR Tower Hotel Nikko Sapporo", star: 5, nights: 2 }, { name: "Noboribetsu Grand Hotel", star: 4, nights: 2 }],
    hotelStar: 5, meals: 11, attractions: 10, freeDays: 1, shopping: 1, tips: 1800, visa: 0,
    optional: [{ name: { th: "สโนว์โมบิล 30 นาที", en: "Snowmobile, 30 minutes" }, price: 1900 }],
    group: 26, cancel: { th: "ยกเลิกก่อน 45 วัน คืนเต็ม · 21–44 วัน คืน 40%", en: "Free before 45 days · 40% at 21–44 days" },
    quality: {
      score: 83, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 74 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 80 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 86 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 88 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 86 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 78 },
      ],
    },
    truth: [{ level: "info", text: { th: "การขึ้นกระเช้าภูเขาโมอิวะขึ้นกับสภาพอากาศ ไม่มีการคืนเงินหากปิด", en: "Mt Moiwa ropeway is weather-dependent with no refund if closed." } }],
    tags: ["family", "luxury", "freeday", "festival"],
    departures: [
      { date: { th: "18–23 ธ.ค. 2026", en: "18–23 Dec 2026" }, status: "limited", seats: 4 },
      { date: { th: "08–13 ม.ค. 2027", en: "08–13 Jan 2027" }, status: "open", seats: 26 },
      { date: { th: "05–10 ก.พ. 2027", en: "05–10 Feb 2027" }, status: "open", seats: 26 },
    ],
    review: { score: 4.6, count: 58 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – ชิโตเสะ (ต่อเครื่องโตเกียว)", en: "Suvarnabhumi – Chitose (via Tokyo)" }, body: { th: "บินกลางคืน ต่อเครื่องที่ฮาเนดะ", en: "Overnight flight with a Haneda connection." }, meals: "—", hotel: "—" },
      { d: 2, title: { th: "โนโบริเบตสึ – หุบเขานรกจิโกกุดานิ", en: "Noboribetsu – Jigokudani valley" }, body: { th: "เดินชมบ่อน้ำร้อน เข้าออนเซ็นตอนเย็น", en: "Geothermal valley walk, onsen in the evening." }, meals: "L / D", hotel: "Noboribetsu Grand Hotel" },
      { d: 3, title: { th: "ทะเลสาบโทยะ – ฟาร์มหมี – โอตารุ", en: "Lake Toya – bear park – Otaru" }, body: { th: "นั่งรถ 3 ชั่วโมง คลองโอตารุช่วงเย็นพร้อมไฟประดับ", en: "Three hours by coach; Otaru canal at dusk with winter lights." }, meals: "B / L", hotel: "JR Tower Hotel Nikko Sapporo" },
      { d: 4, title: { th: "ลานสกีโคคุไซ – ตลาดปลาซัปโปโร", en: "Kokusai ski slope – Sapporo fish market" }, body: { th: "เล่นหิมะครึ่งวัน บ่ายตลาดปลาและร้านช้อป 1 แห่ง", en: "Half-day snow play, fish market and one shopping stop." }, meals: "B / L / D", hotel: "JR Tower Hotel Nikko Sapporo" },
      { d: 5, title: { th: "วันอิสระซัปโปโร", en: "Free day in Sapporo" }, body: { th: "อิสระเต็มวัน แนะนำเทศกาลหิมะหรือช้อปปิ้งทานุกิโคจิ", en: "Full free day — snow festival or Tanukikoji shopping." }, meals: "B", hotel: "JR Tower Hotel Nikko Sapporo" },
      { d: 6, title: { th: "ชิโตเสะ – สุวรรณภูมิ", en: "Chitose – Suvarnabhumi" }, body: { th: "บินกลับช่วงบ่าย", en: "Afternoon flight home." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "kr01", code: "TR24-KR-5502", agency: "nakara",
    country: { th: "เกาหลี", en: "Korea" }, city: { th: "โซล · เกาะนามิ", en: "Seoul · Nami" },
    title: { th: "โซล เกาะนามิ ราคาเบา", en: "Seoul & Nami Island — value run" },
    days: 5, nights: 3, price: 19900, real: 24600,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 19900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1600 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 2100 },
      { label: { th: "K-ETA และประกัน", en: "K-ETA & insurance" }, amt: 1000 },
    ],
    airline: "LJ", airlineName: "Jin Air", airlineType: "low", direct: true,
    flight: { out: "01:20 → 08:40", back: "10:05 → 13:55" }, baggage: "15 kg",
    hotels: [{ name: "Stay Hotel Dongdaemun", star: 3, nights: 3 }],
    hotelStar: 3, meals: 6, attractions: 8, freeDays: 0, shopping: 2, tips: 1600, visa: 0,
    optional: [{ name: { th: "สวนสนุกเอเวอร์แลนด์", en: "Everland theme park" }, price: 1400 }],
    group: 34, cancel: { th: "ยกเลิกก่อน 30 วัน คืน 50% · หลังจากนั้นไม่คืน", en: "50% before 30 days · non-refundable after" },
    quality: {
      score: 64, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 58 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 50 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 62 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 66 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 70 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 60 },
      ],
    },
    truth: [{ level: "warn", text: { th: "เขียนว่า “ฟรี ชุดฮันบก” แต่ค่าใช้จ่ายรวมอยู่ในราคาแพ็กเกจแล้ว", en: "“Free hanbok” is already priced into the package." } }],
    tags: ["budget", "direct"],
    departures: [
      { date: { th: "05–09 ต.ค. 2026", en: "05–09 Oct 2026" }, status: "confirmed", seats: 9 },
      { date: { th: "26–30 ต.ค. 2026", en: "26–30 Oct 2026" }, status: "open", seats: 30 },
    ],
    review: { score: 4.1, count: 63 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – อินชอน", en: "Suvarnabhumi – Incheon" }, body: { th: "บินดึก", en: "Late-night flight." }, meals: "—", hotel: "—" },
      { d: 2, title: { th: "เกาะนามิ – สวนสนุก", en: "Nami Island – theme park" }, body: { th: "นั่งรถ 2 ชั่วโมง เดินชมเกาะนามิ", en: "Two-hour transfer, walking tour of Nami." }, meals: "B / L", hotel: "Stay Hotel Dongdaemun" },
      { d: 3, title: { th: "พระราชวังเคียงบก – ฮงแด", en: "Gyeongbokgung – Hongdae" }, body: { th: "ใส่ชุดฮันบก ช่วงบ่ายเข้าร้านสมุนไพรและเครื่องสำอาง", en: "Hanbok photos; afternoon herb shop and cosmetics stop." }, meals: "B / L", hotel: "Stay Hotel Dongdaemun" },
      { d: 4, title: { th: "โซลทาวเวอร์ – เมียงดง", en: "Seoul Tower – Myeongdong" }, body: { th: "ขึ้นโซลทาวเวอร์ อิสระช้อปปิ้งเมียงดง 3 ชั่วโมง", en: "Seoul Tower, three free hours in Myeongdong." }, meals: "B / D", hotel: "Stay Hotel Dongdaemun" },
      { d: 5, title: { th: "อินชอน – สุวรรณภูมิ", en: "Incheon – Suvarnabhumi" }, body: { th: "ออกจากโรงแรม 05:30", en: "Hotel checkout 05:30." }, meals: "—", hotel: "—" },
    ],
  },
  {
    id: "kr02", code: "TR24-KR-6120", agency: "vela",
    country: { th: "เกาหลี", en: "Korea" }, city: { th: "ปูซาน · คยองจู", en: "Busan · Gyeongju" },
    title: { th: "ปูซาน คยองจู ไม่ลงร้าน", en: "Busan & Gyeongju — no shopping" },
    days: 5, nights: 3, price: 24900, real: 28300,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 24900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1200 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 1200 },
      { label: { th: "K-ETA และประกัน", en: "K-ETA & insurance" }, amt: 1000 },
    ],
    airline: "KE", airlineName: "Korean Air", airlineType: "full", direct: true,
    flight: { out: "09:40 → 17:05", back: "18:40 → 22:20" }, baggage: "23 kg",
    hotels: [{ name: "Lavalse Hotel Busan", star: 4, nights: 3 }],
    hotelStar: 4, meals: 8, attractions: 9, freeDays: 1, shopping: 0, tips: 1200, visa: 0,
    optional: [],
    group: 20, cancel: { th: "ยกเลิกก่อน 45 วัน คืนเต็ม · 21–44 วัน คืน 50%", en: "Free before 45 days · 50% at 21–44 days" },
    quality: {
      score: 81, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 84 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 86 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 80 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 100 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 78 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 76 },
      ],
    },
    truth: [], tags: ["noshop", "smallgroup", "freeday", "family", "direct"],
    departures: [
      { date: { th: "11–15 ต.ค. 2026", en: "11–15 Oct 2026" }, status: "nearly", seats: 7 },
      { date: { th: "15–19 พ.ย. 2026", en: "15–19 Nov 2026" }, status: "open", seats: 20 },
    ],
    review: { score: 4.6, count: 34 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – ปูซาน", en: "Suvarnabhumi – Busan" }, body: { th: "บินเช้า ถึงเย็น เข้าโรงแรมย่านแฮอุนแด", en: "Morning flight, evening arrival, Haeundae hotel." }, meals: "D", hotel: "Lavalse Hotel Busan" },
      { d: 2, title: { th: "คยองจู: วัดพุลกุกซา", en: "Gyeongju: Bulguksa temple" }, body: { th: "เมืองหลวงเก่าและวัดมรดกโลก", en: "Old capital and its UNESCO temple." }, meals: "B / L", hotel: "Lavalse Hotel Busan" },
      { d: 3, title: { th: "หมู่บ้านคัมชอน – วัดแฮดง ยงกุงซา", en: "Gamcheon village – Haedong Yonggungsa" }, body: { th: "หมู่บ้านศิลปะและวัดริมทะเล", en: "Art village and the seaside temple." }, meals: "B / L", hotel: "Lavalse Hotel Busan" },
      { d: 4, title: { th: "วันอิสระปูซาน", en: "Free day in Busan" }, body: { th: "อิสระเต็มวัน แนะนำตลาดจากัลชิหรือชายหาด", en: "Full free day — Jagalchi market or the beach." }, meals: "B", hotel: "Lavalse Hotel Busan" },
      { d: 5, title: { th: "ปูซาน – สุวรรณภูมิ", en: "Busan – Suvarnabhumi" }, body: { th: "อิสระช่วงเช้า บินกลับเย็น", en: "Free morning, evening flight." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "cn01", code: "TR24-CN-7204", agency: "orient",
    country: { th: "จีน", en: "China" }, city: { th: "เฉิงตู · ตูเจียงเยี่ยน", en: "Chengdu · Dujiangyan" },
    title: { th: "เฉิงตู แพนด้า ตูเจียงเยี่ยน", en: "Chengdu pandas & Dujiangyan" },
    days: 5, nights: 4, price: 21900, real: 25100,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 21900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1400 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 1800 },
    ],
    airline: "TG", airlineName: "Thai Airways", airlineType: "full", direct: true,
    flight: { out: "10:55 → 15:05", back: "16:20 → 18:35" }, baggage: "30 kg",
    hotels: [{ name: "Wyndham Chengdu", star: 4, nights: 4 }],
    hotelStar: 4, meals: 9, attractions: 8, freeDays: 0, shopping: 1, tips: 1400, visa: 0,
    optional: [{ name: { th: "โชว์เปลี่ยนหน้ากากเสฉวน", en: "Sichuan face-changing show" }, price: 700 }],
    group: 22, cancel: { th: "ยกเลิกก่อน 40 วัน คืนเต็ม · 20–39 วัน คืน 50%", en: "Free before 40 days · 50% at 20–39 days" },
    quality: {
      score: 78, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 76 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 88 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 74 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 82 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 70 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 80 },
      ],
    },
    truth: [], tags: ["family", "elderly", "direct"],
    departures: [
      { date: { th: "10–14 ต.ค. 2026", en: "10–14 Oct 2026" }, status: "confirmed", seats: 8 },
      { date: { th: "07–11 พ.ย. 2026", en: "07–11 Nov 2026" }, status: "open", seats: 22 },
    ],
    review: { score: 4.5, count: 52 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – เฉิงตู", en: "Suvarnabhumi – Chengdu" }, body: { th: "บินสาย ถึงบ่าย เดินถนนคนเดินไทกู่หลี่", en: "Late-morning flight; Taikoo Li in the afternoon." }, meals: "D", hotel: "Wyndham Chengdu" },
      { d: 2, title: { th: "ศูนย์อนุรักษ์แพนด้า", en: "Panda breeding centre" }, body: { th: "เข้าเช้าตรู่ช่วงแพนด้าตื่น", en: "Early entry while the pandas are active." }, meals: "B / L", hotel: "Wyndham Chengdu" },
      { d: 3, title: { th: "ตูเจียงเยี่ยน – ภูเขาชิงเฉิง", en: "Dujiangyan – Mt Qingcheng" }, body: { th: "ระบบชลประทานโบราณและวัดเต๋า มีลิฟต์และกระเช้า", en: "Ancient irrigation works and Taoist temples; lifts and cable car." }, meals: "B / L / D", hotel: "Wyndham Chengdu" },
      { d: 4, title: { th: "ถนนโบราณจินหลี่ – ร้านผ้าไหม", en: "Jinli street – silk shop" }, body: { th: "ย่านเมืองเก่าและร้านช้อป 1 แห่ง", en: "Old quarter and one shopping stop." }, meals: "B / L", hotel: "Wyndham Chengdu" },
      { d: 5, title: { th: "เฉิงตู – สุวรรณภูมิ", en: "Chengdu – Suvarnabhumi" }, body: { th: "บินกลับบ่าย", en: "Afternoon flight home." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "cn02", code: "TR24-CN-8817", agency: "siam",
    country: { th: "จีน", en: "China" }, city: { th: "จางเจียเจี้ย", en: "Zhangjiajie" },
    title: { th: "จางเจียเจี้ย เทียนเหมินซาน 6 วัน", en: "Zhangjiajie & Tianmen Mountain, 6 days" },
    days: 6, nights: 5, price: 26900, real: 31800,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 26900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1800 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 2100 },
      { label: { th: "ค่ากระเช้าและลิฟต์แก้ว", en: "Cable car & glass lift" }, amt: 1000 },
    ],
    airline: "CZ", airlineName: "China Southern", airlineType: "full", direct: false,
    flight: { out: "02:35 → 09:50 (+1)", back: "12:30 → 17:40" }, baggage: "23 kg",
    hotels: [{ name: "Pullman Zhangjiajie", star: 5, nights: 3 }, { name: "Fenghuang Ancient Town Hotel", star: 4, nights: 2 }],
    hotelStar: 5, meals: 12, attractions: 11, freeDays: 0, shopping: 2, tips: 1800, visa: 0,
    optional: [{ name: { th: "โชว์จิ้งจอกขาว", en: "Charming Xiangxi show" }, price: 1100 }],
    group: 28, cancel: { th: "ยกเลิกก่อน 45 วัน คืนเต็ม · 25–44 วัน คืน 40%", en: "Free before 45 days · 40% at 25–44 days" },
    quality: {
      score: 72, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 62 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 58 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 70 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 80 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 66 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 54 },
      ],
    },
    truth: [{ level: "warn", text: { th: "ค่ากระเช้าและลิฟต์แก้ว 1,000 บาท ไม่รวมในราคาโฆษณาแต่บังคับตามรายการ", en: "฿1,000 cable car and glass lift are mandatory but excluded from the advertised price." } }],
    tags: ["adventure", "budget"],
    departures: [
      { date: { th: "17–22 ต.ค. 2026", en: "17–22 Oct 2026" }, status: "open", seats: 28 },
      { date: { th: "14–19 พ.ย. 2026", en: "14–19 Nov 2026" }, status: "nearly", seats: 9 },
    ],
    review: { score: 4.3, count: 47 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – ฉางซา", en: "Suvarnabhumi – Changsha" }, body: { th: "บินดึก ต่อรถไฟความเร็วสูง", en: "Red-eye flight, then high-speed rail." }, meals: "L / D", hotel: "Pullman Zhangjiajie" },
      { d: 2, title: { th: "อุทยานจางเจียเจี้ย – เทียนจื่อซาน", en: "Zhangjiajie park – Tianzi Mountain" }, body: { th: "ขึ้นลิฟต์แก้วไป๋หลง เดินชมวิวเสาหิน", en: "Bailong glass lift and the sandstone pillars." }, meals: "B / L / D", hotel: "Pullman Zhangjiajie" },
      { d: 3, title: { th: "เทียนเหมินซาน – ทางเดินกระจก", en: "Tianmen Mountain – glass walkway" }, body: { th: "กระเช้ายาว 7 กม. บันได 999 ขั้น", en: "Seven-kilometre cable car and the 999 steps." }, meals: "B / L / D", hotel: "Pullman Zhangjiajie" },
      { d: 4, title: { th: "แกรนด์แคนยอน – สะพานแก้ว", en: "Grand Canyon – glass bridge" }, body: { th: "เดินชมหุบเขาและสะพานแก้วที่ยาวที่สุด", en: "Canyon walk and the long glass bridge." }, meals: "B / L", hotel: "Fenghuang Ancient Town Hotel" },
      { d: 5, title: { th: "เมืองโบราณเฟิ่งหวง", en: "Fenghuang ancient town" }, body: { th: "ล่องเรือแม่น้ำถัวเจียง ร้านช้อป 2 แห่ง", en: "Tuojiang river boat, two shopping stops." }, meals: "B / L / D", hotel: "Fenghuang Ancient Town Hotel" },
      { d: 6, title: { th: "ฉางซา – สุวรรณภูมิ", en: "Changsha – Suvarnabhumi" }, body: { th: "บินกลับเที่ยง", en: "Midday flight home." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "tw01", code: "TR24-TW-9330", agency: "nakara",
    country: { th: "ไต้หวัน", en: "Taiwan" }, city: { th: "ไทเป · อาลีซาน", en: "Taipei · Alishan" },
    title: { th: "ไทเป อาลีซาน จิ่วเฟิ่น", en: "Taipei, Alishan & Jiufen" },
    days: 5, nights: 3, price: 18900, real: 22400,
    cost: [
      { label: { th: "ราคาแพ็กเกจ", en: "Package price" }, amt: 18900 },
      { label: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, amt: 1400 },
      { label: { th: "ภาษีสนามบินและน้ำมัน", en: "Airport tax & fuel surcharge" }, amt: 1600 },
      { label: { th: "ประกันเดินทาง", en: "Travel insurance" }, amt: 500 },
    ],
    airline: "VZ", airlineName: "Thai Vietjet", airlineType: "low", direct: true,
    flight: { out: "06:30 → 11:15", back: "12:25 → 15:20" }, baggage: "20 kg",
    hotels: [{ name: "Hotel Relax Taipei", star: 3, nights: 3 }],
    hotelStar: 3, meals: 7, attractions: 9, freeDays: 1, shopping: 1, tips: 1400, visa: 0,
    optional: [{ name: { th: "อาบน้ำแร่เป่ยโถว", en: "Beitou hot spring" }, price: 600 }],
    group: 30, cancel: { th: "ยกเลิกก่อน 30 วัน คืน 60% · หลังจากนั้นไม่คืน", en: "60% before 30 days · non-refundable after" },
    quality: {
      score: 70, factors: [
        { label: { th: "เวลานั่งรถต่อวัน", en: "Daily travel time" }, score: 60 },
        { label: { th: "เวลาออกเดินทางเช้า", en: "Early departures" }, score: 62 },
        { label: { th: "จำนวนจุดต่อวัน", en: "Stops per day" }, score: 72 },
        { label: { th: "ร้านช้อปซ้ำ", en: "Repeated shopping" }, score: 84 },
        { label: { th: "เวลาอิสระ", en: "Free time" }, score: 76 },
        { label: { th: "เหมาะกับผู้สูงอายุและเด็ก", en: "Elderly & child suitability" }, score: 66 },
      ],
    },
    truth: [{ level: "info", text: { th: "รถไฟอาลีซานอาจเปลี่ยนเป็นรถบัสตามสภาพราง", en: "The Alishan railway may be replaced by a coach depending on track conditions." } }],
    tags: ["budget", "freeday", "direct", "food"],
    departures: [
      { date: { th: "09–13 ต.ค. 2026", en: "09–13 Oct 2026" }, status: "limited", seats: 5 },
      { date: { th: "06–10 พ.ย. 2026", en: "06–10 Nov 2026" }, status: "open", seats: 30 },
      { date: { th: "27 พ.ย.–01 ธ.ค. 2026", en: "27 Nov–01 Dec 2026" }, status: "open", seats: 30 },
    ],
    review: { score: 4.2, count: 71 },
    itinerary: [
      { d: 1, title: { th: "สุวรรณภูมิ – ไทเป", en: "Suvarnabhumi – Taipei" }, body: { th: "บินเช้า บ่ายตึกไทเป 101", en: "Morning flight; Taipei 101 in the afternoon." }, meals: "D", hotel: "Hotel Relax Taipei" },
      { d: 2, title: { th: "อาลีซาน – ป่าสนพันปี", en: "Alishan – cedar forest" }, body: { th: "นั่งรถขึ้นเขา 3 ชั่วโมง เดินป่าสน", en: "Three-hour mountain drive and the cedar trail." }, meals: "B / L", hotel: "Hotel Relax Taipei" },
      { d: 3, title: { th: "จิ่วเฟิ่น – ผิงซี", en: "Jiufen – Pingxi" }, body: { th: "ถนนโบราณและปล่อยโคมผิงซี", en: "Old street and Pingxi sky lanterns." }, meals: "B / L", hotel: "Hotel Relax Taipei" },
      { d: 4, title: { th: "วันอิสระไทเป", en: "Free day in Taipei" }, body: { th: "อิสระเต็มวัน แนะนำซีเหมินติงและตลาดกลางคืน", en: "Full free day — Ximending and the night markets." }, meals: "B", hotel: "Hotel Relax Taipei" },
      { d: 5, title: { th: "ไทเป – สุวรรณภูมิ", en: "Taipei – Suvarnabhumi" }, body: { th: "บินกลับเที่ยง", en: "Midday flight home." }, meals: "B", hotel: "—" },
    ],
  },
  {
    id: "th01", code: "TR24-TH-IN-1101", agency: "siam",
    direction: "inbound",
    market: z("จีน", "China", "中国"),
    guideLang: z("จีน / อังกฤษ", "Chinese / English", "中文 / 英语"),
    country: z("ไทย", "Thailand", "泰国"),
    city: z("เชียงใหม่ · เชียงราย · สามเหลี่ยมทองคำ", "Chiang Mai · Chiang Rai · Golden Triangle", "清迈 · 清莱 · 金三角"),
    title: z("เชียงใหม่ เชียงราย สามเหลี่ยมทองคำ ไม่ลงร้าน", "Chiang Mai, Chiang Rai & Golden Triangle — no shopping", "清迈清莱金三角纯玩无购物"),
    days: 6, nights: 5, price: 21900, real: 23900,
    cost: [
      { label: z("ราคาแพ็กเกจที่ดิน", "Land package price", "落地团费"), amt: 21900 },
      { label: z("ทิปไกด์และคนขับ", "Guide & driver tips", "导游司机小费"), amt: 1200 },
      { label: z("ประกันเดินทางในประเทศ", "Domestic travel insurance", "境内旅行保险"), amt: 800 },
    ],
    airline: "LAND", airlineName: z("แพ็กเกจที่ดิน · รับสนามบินเชียงใหม่", "Land arrangement · CNX airport pickup", "落地安排 · 清迈接机"),
    airlineType: "land", direct: true,
    flight: { out: "CNX pickup", back: "CNX drop-off" }, baggage: "—",
    hotels: [
      { name: "Le Meridien Chiang Mai", star: 5, nights: 2 },
      { name: "Le Meridien Chiang Rai", star: 5, nights: 3 },
    ],
    hotelStar: 5, meals: 12, attractions: 11, freeDays: 1, shopping: 0, tips: 1200, visa: 0,
    optional: [{ name: z("ล่องแม่น้ำโขงข้ามฝั่งลาว", "Mekong boat to the Laos bank", "湄公河游船至老挝岸"), price: 900 }],
    group: 16, cancel: z("ยกเลิกก่อน 30 วัน คืนเต็ม · 15–29 วัน คืน 50%", "Free before 30 days · 50% at 15–29 days", "提前30天全额退 · 15–29天退50%"),
    quality: {
      score: 90, factors: [
        { label: z("เวลานั่งรถต่อวัน", "Daily travel time", "每日车程"), score: 86 },
        { label: z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游"), score: 96 },
        { label: z("จำนวนจุดต่อวัน", "Stops per day", "每日景点"), score: 88 },
        { label: z("ร้านช้อปซ้ำ", "Repeated shopping", "重复购物店"), score: 100 },
        { label: z("เวลาอิสระ", "Free time", "自由活动"), score: 84 },
        { label: z("เหมาะกับผู้สูงอายุ", "Elderly suitability", "适老程度"), score: 88 },
      ],
    },
    truth: [],
    tags: ["inbound", "noshop", "family", "elderly", "food", "smallgroup"],
    departures: [
      { date: z("12–17 ต.ค. 2026", "12–17 Oct 2026", "2026年10月12–17日"), status: "confirmed", seats: 8 },
      { date: z("26–31 ต.ค. 2026", "26–31 Oct 2026", "2026年10月26–31日"), status: "nearly", seats: 12 },
      { date: z("09–14 พ.ย. 2026", "09–14 Nov 2026", "2026年11月9–14日"), status: "open", seats: 16 },
    ],
    review: { score: 4.9, count: 38 },
    itinerary: [
      { d: 1, title: z("ถึงเชียงใหม่ – ดอยสุเทพ", "Arrive Chiang Mai – Doi Suthep", "抵达清迈 – 双龙寺"), body: z("รับที่สนามบินเชียงใหม่ ขึ้นดอยสุเทพ วัดพระธาตุดอยสุเทพ พักโรงแรมกลางเมือง", "CNX pickup, Doi Suthep and Wat Phra That, hotel in the old-city area.", "清迈机场接机，上双龙寺参观素贴山佛寺，入住古城酒店。"), meals: "D", hotel: "Le Meridien Chiang Mai" },
      { d: 2, title: z("เชียงใหม่เมืองเก่า – วันอิสระ", "Old city – free afternoon", "清迈古城 – 自由下午"), body: z("วัดเจดีย์หลวง ถนนคนเดิน บ่ายอิสระย่านนิมมาน", "Wat Chedi Luang and the walking street; free afternoon in Nimman.", "参观契迪龙寺与步行街，下午宁曼路自由活动。"), meals: "B / L", hotel: "Le Meridien Chiang Mai" },
      { d: 3, title: z("เชียงใหม่ – เชียงราย วัดร่องขุ่น", "Chiang Mai – Chiang Rai White Temple", "清迈赴清莱 – 白庙"), body: z("รถประมาณ 3 ชั่วโมง วัดร่องขุ่น ไม่แวะร้าน เข้าเชียงรายเย็น", "About 3 hours by coach, Wat Rong Khun, no shop stop, evening in Chiang Rai.", "大巴约3小时，参观白庙，途中不进购物店，傍晚抵清莱。"), meals: "B / L / D", hotel: "Le Meridien Chiang Rai" },
      { d: 4, title: z("สามเหลี่ยมทองคำ – แม่โขง", "Golden Triangle – Mekong", "金三角 – 湄公河"), body: z("เชียงแสน จุดบรรจบไทย-ลาว-เมียนมา ล่องแม่น้ำโขง พิพิธภัณฑ์ฝิ่น", "Chiang Saen, Thailand–Laos–Myanmar viewpoint, Mekong boat, Hall of Opium.", "清盛金三角三国交界观景、湄公河游船、鸦片博物馆。"), meals: "B / L", hotel: "Le Meridien Chiang Rai" },
      { d: 5, title: z("วัดร่องเสือเต้น – บ้านดำ", "Blue Temple – Black House", "蓝庙 – 黑屋"), body: z("วัดร่องเสือเต้นและบ้านดำ บ่ายอิสระเชียงราย", "Wat Rong Suea Ten and Baan Dam, free afternoon in Chiang Rai.", "参观蓝庙与黑屋，下午清莱自由活动。"), meals: "B / L", hotel: "Le Meridien Chiang Rai" },
      { d: 6, title: z("ส่งสนามบินเชียงใหม่", "Transfer to CNX", "送机清迈"), body: z("รถกลับเชียงใหม่ ส่งสนามบินตามเที่ยวบิน", "Return coach to Chiang Mai and airport drop-off.", "返回清迈并送机。"), meals: "B", hotel: "—" },
    ],
  },
  {
    id: "th02", code: "TR24-TH-IN-2288", agency: "bkkjet",
    direction: "inbound",
    market: z("จีน", "China", "中国"),
    guideLang: z("จีน", "Chinese", "中文"),
    country: z("ไทย", "Thailand", "泰国"),
    city: z("เชียงใหม่ · เชียงราย", "Chiang Mai · Chiang Rai", "清迈 · 清莱"),
    title: z("เชียงใหม่ เชียงราย ราคาเบา", "Chiang Mai & Chiang Rai value run", "清迈清莱特价团"),
    days: 5, nights: 4, price: 12900, real: 18400,
    cost: [
      { label: z("ราคาแพ็กเกจที่ดิน", "Land package price", "落地团费"), amt: 12900 },
      { label: z("ทิปไกด์และคนขับ", "Guide & driver tips", "导游司机小费"), amt: 1500 },
      { label: z("ร้านชาและเครื่องหนัง (บังคับ)", "Tea & leather shops (compulsory)", "茶叶皮具店（强制）"), amt: 2800 },
      { label: z("ประกันขั้นต่ำ", "Minimum insurance", "最低保险"), amt: 1200 },
    ],
    airline: "LAND", airlineName: z("แพ็กเกจที่ดิน · รวมร้านช้อป", "Land arrangement · shopping stops included", "落地安排 · 含购物店"),
    airlineType: "land", direct: true,
    flight: { out: "CNX pickup", back: "CNX drop-off" }, baggage: "—",
    hotels: [{ name: z("โรงแรม 3 ดาว หรือเทียบเท่า", "3-star hotel or equivalent", "三星或同级酒店"), star: 3, nights: 4 }],
    hotelStar: 3, meals: 8, attractions: 7, freeDays: 0, shopping: 4, tips: 1500, visa: 0,
    optional: [{ name: z("ล่องแม่โขงสามเหลี่ยมทองคำ", "Golden Triangle Mekong boat", "金三角湄公河游船"), price: 1200 }],
    group: 38, cancel: z("ยกเลิกไม่คืนเงิน", "Non-refundable", "不可退款"),
    quality: {
      score: 56, factors: [
        { label: z("เวลานั่งรถต่อวัน", "Daily travel time", "每日车程"), score: 48 },
        { label: z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游"), score: 80 },
        { label: z("จำนวนจุดต่อวัน", "Stops per day", "每日景点"), score: 52 },
        { label: z("ร้านช้อปซ้ำ", "Repeated shopping", "重复购物店"), score: 40 },
        { label: z("เวลาอิสระ", "Free time", "自由活动"), score: 42 },
        { label: z("เหมาะกับผู้สูงอายุ", "Elderly suitability", "适老程度"), score: 50 },
      ],
    },
    truth: [
      { level: "warn", text: z("โรงแรมระบุแค่ “3 ดาว หรือเทียบเท่า” ไม่มีชื่อจริง", "Hotels listed only as “3-star or equivalent” — no names.", "酒店仅写“三星或同级”，无真实店名。") },
      { level: "warn", text: z("แวะร้านชา เครื่องหนัง เครื่องเงิน และสมุนไพร รวม 4 แห่ง", "Four compulsory shops: tea, leather, silver, herbs.", "强制进店4家：茶叶、皮具、银器、药材。") },
      { level: "info", text: z("สามเหลี่ยมทองคำเป็นทัวร์เสริม เก็บที่รถ", "Golden Triangle is an optional extra sold on the coach.", "金三角为车上加购项目。") },
    ],
    tags: ["inbound", "budget"],
    departures: [
      { date: z("10–14 ต.ค. 2026", "10–14 Oct 2026", "2026年10月10–14日"), status: "open", seats: 22 },
      { date: z("24–28 ต.ค. 2026", "24–28 Oct 2026", "2026年10月24–28日"), status: "open", seats: 30 },
    ],
    review: { score: 3.6, count: 19 },
    itinerary: [
      { d: 1, title: z("ถึงเชียงใหม่ – ร้านชา", "Arrive Chiang Mai – tea shop", "抵清迈 – 茶叶店"), body: z("รับสนามบิน เข้าร้านชา 90 นาที ก่อนขึ้นดอยสุเทพสั้น ๆ", "Airport pickup, 90 minutes at a tea shop, short Doi Suthep stop.", "接机后先入茶叶店90分钟，再短停双龙寺。"), meals: "D", hotel: z("โรงแรม 3 ดาว หรือเทียบเท่า", "3-star or equivalent", "三星或同级") },
      { d: 2, title: z("ร้านเครื่องหนัง – เมืองเก่า", "Leather shop – old city", "皮具店 – 古城"), body: z("เช้าเข้าโรงงานหนัง บ่ายเดินตลาดนัด", "Morning leather factory, afternoon market walk.", "上午皮具工厂，下午逛市场。"), meals: "B / L", hotel: z("โรงแรม 3 ดาว หรือเทียบเท่า", "3-star or equivalent", "三星或同级") },
      { d: 3, title: z("เชียงราย วัดร่องขุ่น – ร้านเงิน", "Chiang Rai White Temple – silver shop", "清莱白庙 – 银器店"), body: z("แวะร้านเงินก่อนเข้าวัดร่องขุ่น", "Silver shop before Wat Rong Khun.", "先入银器店再进白庙。"), meals: "B / L / D", hotel: z("โรงแรม 3 ดาว หรือเทียบเท่า", "3-star or equivalent", "三星或同级") },
      { d: 4, title: z("ร้านสมุนไพร – วันอิสระจำกัด", "Herb shop – limited free time", "药材店 – 有限自由"), body: z("เช้าเข้าคลินิกสมุนไพร บ่ายมีเวลาอิสระ 90 นาที", "Morning herb clinic, 90 minutes free in the afternoon.", "上午药材店，下午仅90分钟自由活动。"), meals: "B / L", hotel: z("โรงแรม 3 ดาว หรือเทียบเท่า", "3-star or equivalent", "三星或同级") },
      { d: 5, title: z("ส่งสนามบิน", "Airport drop-off", "送机"), body: z("ออกเช้า ส่งเชียงใหม่", "Early departure to CNX.", "早出发送清迈机场。"), meals: "B", hotel: "—" },
    ],
  },
  {
    id: "th03", code: "TR24-TH-IN-3310", agency: "nakara",
    direction: "inbound",
    market: z("จีน", "China", "中国"),
    guideLang: z("จีน", "Chinese", "中文"),
    country: z("ไทย", "Thailand", "泰国"),
    city: z("เชียงใหม่ · เชียงราย · สามเหลี่ยมทองคำ", "Chiang Mai · Chiang Rai · Golden Triangle", "清迈 · 清莱 · 金三角"),
    title: z("เชียงใหม่ วัดร่องขุ่น สามเหลี่ยมทองคำ กลุ่มจีน", "Chiang Mai, White Temple & Golden Triangle — Chinese group", "清迈白庙金三角华语团"),
    days: 5, nights: 4, price: 17900, real: 20400,
    cost: [
      { label: z("ราคาแพ็กเกจที่ดิน", "Land package price", "落地团费"), amt: 17900 },
      { label: z("ทิปไกด์และคนขับ", "Guide & driver tips", "导游司机小费"), amt: 1300 },
      { label: z("ประกันเดินทาง", "Travel insurance", "旅行保险"), amt: 1200 },
    ],
    airline: "LAND", airlineName: z("แพ็กเกจที่ดิน · ไกด์ภาษาจีน", "Land arrangement · Chinese-speaking guide", "落地安排 · 中文导游"),
    airlineType: "land", direct: true,
    flight: { out: "CNX pickup", back: "CNX drop-off" }, baggage: "—",
    hotels: [
      { name: "Shangri-La Chiang Mai", star: 5, nights: 2 },
      { name: "The Riverie by Katathani", star: 4, nights: 2 },
    ],
    hotelStar: 4, meals: 10, attractions: 10, freeDays: 0, shopping: 0, tips: 1300, visa: 0,
    optional: [{ name: z("อาบน้ำแร่ฝาง", "Fang hot springs", "芳县温泉"), price: 800 }],
    group: 20, cancel: z("ยกเลิกก่อน 21 วัน คืนเต็ม · 8–20 วัน คืน 40%", "Free before 21 days · 40% at 8–20 days", "提前21天全额退 · 8–20天退40%"),
    quality: {
      score: 84, factors: [
        { label: z("เวลานั่งรถต่อวัน", "Daily travel time", "每日车程"), score: 80 },
        { label: z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游"), score: 94 },
        { label: z("จำนวนจุดต่อวัน", "Stops per day", "每日景点"), score: 82 },
        { label: z("ร้านช้อปซ้ำ", "Repeated shopping", "重复购物店"), score: 100 },
        { label: z("เวลาอิสระ", "Free time", "自由活动"), score: 70 },
        { label: z("เหมาะกับผู้สูงอายุ", "Elderly suitability", "适老程度"), score: 82 },
      ],
    },
    truth: [],
    tags: ["inbound", "noshop", "family", "food"],
    departures: [
      { date: z("15–19 ต.ค. 2026", "15–19 Oct 2026", "2026年10月15–19日"), status: "confirmed", seats: 9 },
      { date: z("05–09 พ.ย. 2026", "05–09 Nov 2026", "2026年11月5–9日"), status: "open", seats: 20 },
    ],
    review: { score: 4.7, count: 27 },
    itinerary: [
      { d: 1, title: z("ถึงเชียงใหม่ – ดอยสุเทพ", "Arrive Chiang Mai – Doi Suthep", "抵达清迈 – 双龙寺"), body: z("รับสนามบิน วัดพระธาตุดอยสุเทพ คืนนี้ตลาดกลางคืน", "CNX pickup, Doi Suthep, night bazaar.", "接机后上双龙寺，晚上夜市。"), meals: "D", hotel: "Shangri-La Chiang Mai" },
      { d: 2, title: z("เชียงใหม่ – เชียงราย วัดร่องขุ่น", "To Chiang Rai – White Temple", "赴清莱 – 白庙"), body: z("ออกเช้า วัดร่องขุ่น ไม่ลงร้าน เข้าที่พักริมน้ำ", "Morning departure, Wat Rong Khun, riverside hotel, no shops.", "早出发，参观白庙，不住店购物，入住河景酒店。"), meals: "B / L / D", hotel: "The Riverie by Katathani" },
      { d: 3, title: z("สามเหลี่ยมทองคำ", "Golden Triangle", "金三角"), body: z("เชียงแสน จุดสามประเทศ ล่องแม่โขง พิพิธภัณฑ์ฝิ่น", "Chiang Saen, three-country viewpoint, Mekong, Hall of Opium.", "清盛三国点、湄公河、鸦片博物馆。"), meals: "B / L", hotel: "The Riverie by Katathani" },
      { d: 4, title: z("วัดร่องเสือเต้น – กลับเชียงใหม่", "Blue Temple – return Chiang Mai", "蓝庙 – 返回清迈"), body: z("เช้าวัดสีฟ้า รถกลับเชียงใหม่เย็น", "Blue Temple in the morning, return to Chiang Mai in the evening.", "上午蓝庙，傍晚返回清迈。"), meals: "B / L", hotel: "Shangri-La Chiang Mai" },
      { d: 5, title: z("ส่งสนามบินเชียงใหม่", "CNX drop-off", "清迈送机"), body: z("เช้าอิสระสั้น ส่งสนามบิน", "Short free morning, then airport.", "上午短暂自由后送机。"), meals: "B", hotel: "—" },
    ],
  },
];

export const destinations = [
  { id: "jp", name: { th: "ญี่ปุ่น", en: "Japan", zh: "日本" }, count: 128, from: 27900 },
  { id: "kr", name: { th: "เกาหลี", en: "Korea", zh: "韩国" }, count: 74, from: 19900 },
  { id: "cn", name: { th: "จีน", en: "China", zh: "中国" }, count: 63, from: 16900 },
  { id: "tw", name: { th: "ไต้หวัน", en: "Taiwan", zh: "台湾" }, count: 41, from: 18900 },
  { id: "vn", name: { th: "เวียดนาม", en: "Vietnam", zh: "越南" }, count: 38, from: 11900 },
  { id: "eu", name: { th: "ยุโรป", en: "Europe", zh: "欧洲" }, count: 26, from: 78900 },
  { id: "th", name: { th: "ไทย", en: "Thailand", zh: "泰国" }, count: 86, from: 12900 },
];

export const inboundRegions = [
  { id: "cnx", name: z("เชียงใหม่", "Chiang Mai", "清迈"), count: 42, from: 17900, q: "Chiang Mai" },
  { id: "cei", name: z("เชียงราย", "Chiang Rai", "清莱"), count: 28, from: 17900, q: "Chiang Rai" },
  { id: "gtr", name: z("สามเหลี่ยมทองคำ", "Golden Triangle", "金三角"), count: 16, from: 20400, q: "Golden Triangle" },
];

export const reviews = [
  { name: { th: "ปิยะวรรณ ก.", en: "Piyawan K." }, trip: { th: "โอซาก้า เกียวโต · โอเรียนท์ลิงก์", en: "Osaka Kyoto · Orient Link" }, score: 5, text: { th: "รายการเดินทางตรงกับที่เขียนไว้ทุกวัน ไม่มีร้านช้อปแทรก ไกด์ดูแลคุณแม่ที่เดินช้าได้ดีมาก", en: "Every day matched the itinerary, no shopping inserted, and the guide looked after my mother who walks slowly." } },
  { name: { th: "ธนกฤต พ.", en: "Thanakrit P." }, trip: { th: "โตเกียว ฟูจิ · สยามฮอไรซอน", en: "Tokyo Fuji · Siam Horizon" }, score: 5, text: { th: "ตัดสินใจจากราคารวมจริง ต่างกับอีกเจ้าแค่ 1,700 บาท แต่ได้บินตรงกับโรงแรมมีชื่อ", en: "I chose on real total cost — ฿1,700 more than the other one, but a direct flight and named hotels." } },
  { name: { th: "อรุณี ส.", en: "Arunee S." }, trip: { th: "ฮอกไคโด · เวลาทราเวล", en: "Hokkaido · Vela Travel" }, score: 4, text: { th: "กระเช้าปิดเพราะลมแรง เอเจนซีจัดที่เที่ยวสำรองให้ทันที แจ้งล่วงหน้าดี", en: "The ropeway closed in high wind; the agency arranged a substitute the same morning and told us early." } },
  { name: { th: "หลิน เหวิน", en: "Lin Wen", zh: "林雯" }, trip: z("เชียงใหม่ เชียงราย · สยามฮอไรซอน", "Chiang Mai Chiang Rai · Siam Horizon", "清迈清莱 · 暹罗地平线"), score: 5, text: z("ไกด์จีนชัดเจน ไม่แวะร้าน วัดร่องขุ่นและสามเหลี่ยมทองคำตรงปก", "Chinese guide was clear, no shop stops, White Temple and Golden Triangle matched the brochure.", "中文导游讲解清楚，全程不进店，白庙和金三角与行程一致。") },
  { name: { th: "เฉิน เจีย", en: "Chen Jia", zh: "陈佳" }, trip: z("สามเหลี่ยมทองคำ · นาคารา", "Golden Triangle · Nakara", "金三角 · 纳卡拉"), score: 5, text: z("ล่องแม่โขงไม่เร่ง โรงแรมริมน้ำดี พ่อแม่เดินไหว", "Unhurried Mekong boat, good riverside hotel, parents could keep the pace.", "湄公河不赶时间，河景酒店舒适，父母跟得上。") },
];

export interface QuizQ {
  id: string;
  q: L10n;
  opts: { v: string; label: L10n }[];
}

export const quiz: QuizQ[] = [
  {
    id: "who", q: { th: "ใครเดินทางไปด้วย", en: "Who is travelling?" },
    opts: [
      { v: "family", label: { th: "ครอบครัวมีเด็ก", en: "Family with children" } },
      { v: "elderly", label: { th: "มีผู้สูงอายุ", en: "With elderly travellers" } },
      { v: "couple", label: { th: "คู่รัก", en: "A couple" } },
      { v: "friends", label: { th: "กลุ่มเพื่อน", en: "Friends" } },
    ],
  },
  {
    id: "budget", q: { th: "งบต่อคน รวมทุกอย่างแล้ว", en: "Budget per person, all in" },
    opts: [
      { v: "25000", label: { th: "ไม่เกิน 25,000 บาท", en: "Up to ฿25,000" } },
      { v: "40000", label: { th: "25,000–40,000 บาท", en: "฿25,000–40,000" } },
      { v: "60000", label: { th: "40,000–60,000 บาท", en: "฿40,000–60,000" } },
      { v: "99999", label: { th: "ไม่จำกัด", en: "No limit" } },
    ],
  },
  {
    id: "when", q: { th: "ช่วงที่อยากไป", en: "When would you go?" },
    opts: [
      { v: "oct", label: { th: "ตุลาคม 2026", en: "October 2026" } },
      { v: "nov", label: { th: "พฤศจิกายน 2026", en: "November 2026" } },
      { v: "dec", label: { th: "ธันวาคม–มกราคม", en: "December–January" } },
      { v: "any", label: { th: "ยืดหยุ่นได้", en: "Flexible" } },
    ],
  },
  {
    id: "pace", q: { th: "จังหวะการเที่ยวที่ชอบ", en: "Preferred pace" },
    opts: [
      { v: "slow", label: { th: "สบาย ๆ วันละ 2–3 จุด", en: "Relaxed, 2–3 stops a day" } },
      { v: "balanced", label: { th: "กำลังดี", en: "Balanced" } },
      { v: "packed", label: { th: "อัดแน่น เที่ยวให้คุ้ม", en: "Packed, see everything" } },
    ],
  },
  {
    id: "focus", q: { th: "ให้น้ำหนักกับอะไรมากกว่า", en: "What matters more?" },
    opts: [
      { v: "sights", label: { th: "สถานที่เที่ยวและธรรมชาติ", en: "Sights and nature" } },
      { v: "food", label: { th: "อาหารและวัฒนธรรม", en: "Food and culture" } },
      { v: "shopping", label: { th: "ช้อปปิ้ง", en: "Shopping" } },
    ],
  },
  {
    id: "shop", q: { th: "ร้านช้อปบังคับรับได้ไหม", en: "Compulsory shopping stops?" },
    opts: [
      { v: "no", label: { th: "ไม่รับเลย", en: "None at all" } },
      { v: "some", label: { th: "รับได้ 1–2 แห่ง", en: "One or two is fine" } },
      { v: "ok", label: { th: "ไม่เป็นปัญหา", en: "Not a problem" } },
    ],
  },
  {
    id: "air", q: { th: "สายการบิน", en: "Airline" },
    opts: [
      { v: "full", label: { th: "ฟูลเซอร์วิสเท่านั้น", en: "Full service only" } },
      { v: "any", label: { th: "อะไรก็ได้ถ้าราคาดี", en: "Any, if the price is right" } },
      { v: "direct", label: { th: "ขอบินตรง", en: "Direct flight please" } },
    ],
  },
  {
    id: "free", q: { th: "ต้องการวันอิสระไหม", en: "Do you want a free day?" },
    opts: [
      { v: "yes", label: { th: "ต้องมีอย่างน้อย 1 วัน", en: "At least one" } },
      { v: "no", label: { th: "ไม่จำเป็น", en: "Not needed" } },
    ],
  },
];

export const trips = [
  {
    ref: "T24-908311", pkg: "jp01", date: { th: "12–16 ต.ค. 2026", en: "12–16 Oct 2026" }, daysAway: 54, pax: 3,
    paid: 15000, total: 115200, status: "confirmed",
    docs: [
      { label: { th: "สำเนาหนังสือเดินทาง 3 ท่าน", en: "Passport copies ×3" }, done: true },
      { label: { th: "แบบฟอร์มข้อมูลผู้เดินทาง", en: "Passenger information form" }, done: true },
      { label: { th: "หลักฐานการชำระเงินส่วนที่เหลือ", en: "Balance payment" }, done: false },
      { label: { th: "ประกันเดินทางเพิ่มเติม (ถ้าต้องการ)", en: "Optional extra insurance" }, done: false },
    ],
  },
  {
    ref: "T24-871004", pkg: "tw01", date: { th: "09–13 มี.ค. 2026", en: "09–13 Mar 2026" }, daysAway: -160, pax: 2,
    paid: 44800, total: 44800, status: "past", docs: [],
  },
];

export const agencyBookings = [
  { ref: "T24-908311", cust: { th: "ธนกฤต พ.", en: "Thanakrit P." }, pkg: "jp01", date: { th: "12 ต.ค.", en: "12 Oct" }, pax: 3, value: 115200, status: "confirmed" },
  { ref: "T24-908455", cust: { th: "ณิชา ว.", en: "Nicha W." }, pkg: "cn02", date: { th: "17 ต.ค.", en: "17 Oct" }, pax: 2, value: 63600, status: "deposit" },
  { ref: "T24-908502", cust: { th: "สมชาย ต.", en: "Somchai T." }, pkg: "jp01", date: { th: "19 ต.ค.", en: "19 Oct" }, pax: 4, value: 153600, status: "new" },
  { ref: "T24-908517", cust: { th: "Wanida R.", en: "Wanida R." }, pkg: "cn02", date: { th: "14 พ.ย.", en: "14 Nov" }, pax: 2, value: 63600, status: "new" },
  { ref: "T24-908380", cust: { th: "ปิยะวรรณ ก.", en: "Piyawan K." }, pkg: "jp01", date: { th: "02 พ.ย.", en: "02 Nov" }, pax: 2, value: 76800, status: "pending" },
  { ref: "T24-908199", cust: { th: "Kittipong S.", en: "Kittipong S." }, pkg: "cn02", date: { th: "17 ต.ค.", en: "17 Oct" }, pax: 6, value: 190800, status: "confirmed" },
  { ref: "T24-907961", cust: { th: "อรุณี ส.", en: "Arunee S." }, pkg: "jp01", date: { th: "12 ต.ค.", en: "12 Oct" }, pax: 2, value: 76800, status: "cancelled" },
];

export const extraction = [
  { field: { th: "ประเทศและเมือง", en: "Country & cities" }, value: { th: "ญี่ปุ่น · โตเกียว, ฟูจิ, คาวาโกเอะ", en: "Japan · Tokyo, Fuji, Kawagoe" }, conf: 99 },
  { field: { th: "จำนวนวัน", en: "Duration" }, value: { th: "5 วัน 3 คืน", en: "5 days, 3 nights" }, conf: 99 },
  { field: { th: "ราคาโฆษณา", en: "Advertised price" }, value: "฿32,900", conf: 98 },
  { field: { th: "วันเดินทาง", en: "Departure dates" }, value: { th: "3 รอบ · ต.ค.–พ.ย. 2026", en: "3 departures · Oct–Nov 2026" }, conf: 96 },
  { field: { th: "สายการบินและไฟลต์", en: "Airline & flights" }, value: "TG 660 / TG 661 · 22:30–06:55", conf: 94 },
  { field: { th: "น้ำหนักกระเป๋า", en: "Baggage" }, value: "30 kg", conf: 97 },
  { field: { th: "โรงแรม", en: "Hotels" }, value: "Shinagawa Prince ×2, Fuji Lake Hotel ×1", conf: 92 },
  { field: { th: "มื้ออาหาร", en: "Meals" }, value: { th: "8 มื้อ (เช้า 3 · กลางวัน 4 · เย็น 1)", en: "8 meals (3 B / 4 L / 1 D)" }, conf: 90 },
  { field: { th: "สถานที่เที่ยว", en: "Attractions" }, value: { th: "9 แห่ง", en: "9 attractions" }, conf: 93 },
  { field: { th: "ทิปไกด์และคนขับ", en: "Guide & driver tips" }, value: "฿1,500", conf: 88 },
  { field: { th: "ค่าวีซ่า", en: "Visa fee" }, value: { th: "ไม่ต้องขอวีซ่า", en: "Not required" }, conf: 99 },
  { field: { th: "ร้านช้อปบังคับ", en: "Compulsory shopping" }, value: { th: "ไม่มี", en: "None" }, conf: 86 },
  { field: { th: "ทัวร์เสริม", en: "Optional activities" }, value: { th: "ล่องเรือทะเลสาบอาชิ ฿900", en: "Lake Ashi cruise ฿900" }, conf: 74, check: true },
  { field: { th: "เงื่อนไขยกเลิก", en: "Cancellation terms" }, value: { th: "45 วัน คืนเต็ม · 30–44 วัน คืน 50%", en: "45 days full · 30–44 days 50%" }, conf: 71, check: true },
];

export const analytics = {
  views: 18420, viewsDelta: 12.4, comparisons: 6183, comparisonsDelta: 21.8,
  inquiryRate: 7.9, bookingRate: 3.1, revenue: 2846000, commission: 227680,
  cancelRate: 1.2, rating: 4.8,
  top: [
    { pkg: "jp01", views: 6120, bookings: 41 },
    { pkg: "cn02", views: 4380, bookings: 22 },
    { pkg: "jp03", views: 3110, bookings: 17 },
  ],
  trend: [42, 51, 47, 63, 58, 74, 69, 88, 81, 96, 104, 112],
  pricePosition: [
    { pkg: "jp01", delta: -4.2, note: "cheaper" },
    { pkg: "cn02", delta: 2.8, note: "pricier" },
  ],
};

export const DATA = { agencies, packages, destinations, inboundRegions, reviews, quiz, trips, agencyBookings, extraction, analytics };

export const isInbound = (p: Pkg) => p.direction === "inbound";
export const inboundPackages = () => packages.filter(isInbound);

export const pkgById = (id: string) => packages.find((p) => p.id === id);
export const agencyById = (id: string) => agencies[id];
