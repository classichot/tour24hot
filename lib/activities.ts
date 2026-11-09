/** Inbound short products sold next to multi-day packages: day tours, excursions and special attractions. */
import { hydrateTree } from "./l10n-pack";
import type { L10n } from "./data";

const z = (th: string, en: string, zh?: string, ru?: string): L10n => ({ th, en, zh, ru });
const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export type ActivityKind = "daytour" | "excursion" | "attraction";
export type ActivityRegion = "cnx" | "cei" | "gtr";

export interface Activity {
  id: string;
  kind: ActivityKind;
  agency: string;
  region: ActivityRegion;
  title: L10n;
  place: L10n;
  hours: number;
  start: string;
  /** Advertised price per adult. */
  price: number;
  /** Paid on the day on top of the advertised price — counted into the real total. */
  extras: { label: L10n; amt: number }[];
  child: number;
  pickup: boolean;
  guide: L10n;
  /** Max group size; 0 = self-guided ticket. */
  group: number;
  shopping: number;
  rating: number;
  reviews: number;
  days: L10n;
  highlights: L10n[];
  includes: L10n[];
  plan: { time: string; text: L10n }[];
  cancel: L10n;
  tags: string[];
  warn?: L10n[];
  photo?: string;
}

export const KIND_PATH: Record<ActivityKind, string> = {
  daytour: "/inbound/day-tours",
  excursion: "/inbound/excursions",
  attraction: "/inbound/attractions",
};

export const KIND_COPY: Record<ActivityKind, { title: L10n; sub: L10n }> = {
  daytour: {
    title: z("ทัวร์วันเดียว", "Day tours", "一日游", "Однодневные туры"),
    sub: z(
      "ทริปเต็มวันมีไกด์ รับจากโรงแรม แสดงราคารวมค่าเข้าชมจริง",
      "Full-day guided trips with hotel pickup, priced with the entry fees you will actually pay.",
      "含酒店接送的全天导游行程，价格已含实际门票费用。",
      "Экскурсии на целый день с гидом и трансфером из отеля, цена с реальными входными билетами."
    ),
  },
  excursion: {
    title: z("ทริปสั้นและกิจกรรม", "Excursions", "短途游览", "Экскурсии"),
    sub: z(
      "กิจกรรมครึ่งวันและประสบการณ์ลงมือทำ ช้าง ทำอาหาร น้ำตก",
      "Half-day outings and hands-on experiences: elephants, cooking, waterfalls and temple sunsets.",
      "半日出游与体验活动：大象、烹饪、瀑布与寺庙日落。",
      "Полудневные выезды и мастер-классы: слоны, кулинария, водопады, закат у храма."
    ),
  },
  attraction: {
    title: z("สถานที่พิเศษ", "Special attractions", "特色景点", "Достопримечательности"),
    sub: z(
      "ตั๋วไนท์ซาฟารี โชว์ วัด และพิพิธภัณฑ์ พร้อมบอกชัดว่ารวมอะไรบ้าง",
      "Tickets for night safaris, shows, temples and museums, with exactly what is included.",
      "夜间动物园、演出、寺庙与博物馆门票，写清包含内容。",
      "Билеты на ночное сафари, шоу, в храмы и музеи — с точным составом."
    ),
  },
};

const CN_EN = z("จีน / อังกฤษ", "Chinese / English", "中文 / 英语", "Китайский / английский");
const CN = z("จีน", "Chinese", "中文", "Китайский");
const AUDIO = z("ออดิโอไกด์ภาษาจีน", "Chinese audio guide", "中文语音导览", "Аудиогид на китайском");
const SELF = z("เที่ยวเอง", "Self-guided", "自助参观", "Самостоятельно");
const DAILY = z("ทุกวัน", "Daily", "每天", "Ежедневно");
const FREE24 = z(
  "ยกเลิกฟรีก่อน 24 ชั่วโมง",
  "Free cancellation up to 24 hours before",
  "提前24小时免费取消",
  "Бесплатная отмена за 24 часа"
);

export const activities: Activity[] = [
  /* ── Day tours ── */
  {
    id: "dt01", kind: "daytour", agency: "siam", region: "cei",
    title: z("เชียงรายวันเดียว วัดร่องขุ่น วัดร่องเสือเต้น สามเหลี่ยมทองคำ", "Chiang Rai in a day: White Temple, Blue Temple & Golden Triangle", "清莱一日游：白庙、蓝庙与金三角", "Чианграй за день: Белый и Синий храмы, Золотой треугольник"),
    place: z("ออกจากเชียงใหม่", "From Chiang Mai", "清迈出发", "Из Чиангмая"),
    hours: 12, start: "07:00", price: 1890, child: 1490,
    extras: [{ label: z("ค่าเข้าวัดร่องขุ่น", "White Temple entry", "白庙门票", "Вход в Белый храм"), amt: 100 }],
    pickup: true, guide: CN_EN, group: 12, shopping: 0, rating: 4.9, reviews: 412, days: DAILY,
    highlights: [
      z("วัดร่องขุ่นช่วงเช้าก่อนคนเยอะ", "White Temple early, before the crowds", "早到白庙，避开人潮", "Белый храм утром, до толп"),
      z("จุดชมวิวสามประเทศ ไทย ลาว เมียนมา", "Thailand–Laos–Myanmar viewpoint", "泰老缅三国交界观景台", "Смотровая трёх стран"),
      z("ไม่แวะร้านช้อป", "No shop stops", "全程不进店", "Без заездов в магазины"),
    ],
    includes: [
      z("รถตู้ปรับอากาศ รับส่งโรงแรมในเมือง", "Air-conditioned van with city hotel pickup", "空调商务车城区酒店接送", "Минивэн с трансфером из отеля"),
      z("อาหารกลางวันแบบไทยเหนือ", "Northern Thai lunch", "泰北风味午餐", "Обед северной тайской кухни"),
      z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游", "Гид на китайском"),
    ],
    plan: [
      { time: "07:00", text: z("รับที่โรงแรม เดินทางสู่เชียงราย", "Hotel pickup, drive to Chiang Rai", "酒店接人，前往清莱", "Выезд из отеля в Чианграй") },
      { time: "10:00", text: z("วัดร่องขุ่น", "Wat Rong Khun (White Temple)", "白庙", "Ват Ронг Кхун (Белый храм)") },
      { time: "12:30", text: z("อาหารกลางวัน แล้ววัดร่องเสือเต้น", "Lunch, then Wat Rong Suea Ten (Blue Temple)", "午餐后参观蓝庙", "Обед, затем Синий храм") },
      { time: "15:00", text: z("สามเหลี่ยมทองคำ จุดชมวิว", "Golden Triangle viewpoint", "金三角观景台", "Смотровая Золотого треугольника") },
      { time: "19:00", text: z("กลับถึงเชียงใหม่", "Back in Chiang Mai", "返回清迈", "Возвращение в Чиангмай") },
    ],
    cancel: FREE24, tags: ["noshop", "smallgroup", "elderly"], photo: u("1671188893377-ee825a53d27f"),
  },
  {
    id: "dt02", kind: "daytour", agency: "nakara", region: "cnx",
    title: z("ดอยอินทนนท์ ยอดดอย พระมหาธาตุ น้ำตก", "Doi Inthanon: summit, twin pagodas & waterfalls", "茵他侬山：山顶、双塔与瀑布", "Дой Интханон: вершина, пагоды и водопады"),
    place: z("อุทยานแห่งชาติดอยอินทนนท์", "Doi Inthanon National Park", "茵他侬国家公园", "Нацпарк Дой Интханон"),
    hours: 10, start: "07:30", price: 1650, child: 1250,
    extras: [{ label: z("ค่าเข้าอุทยาน (ต่างชาติ)", "National park fee (foreign visitors)", "国家公园门票（外国游客）", "Сбор нацпарка (иностранцы)"), amt: 300 }],
    pickup: true, guide: CN, group: 10, shopping: 0, rating: 4.8, reviews: 268, days: DAILY,
    highlights: [
      z("จุดสูงสุดของประเทศไทย 2,565 ม.", "Thailand's highest point, 2,565 m", "泰国最高点 2565 米", "Высшая точка Таиланда, 2565 м"),
      z("พระมหาธาตุนภเมทนีดลและนภพลภูมิสิริ", "The royal twin pagodas", "皇家双塔", "Королевские пагоды-близнецы"),
      z("น้ำตกวชิรธาร", "Wachirathan waterfall", "瓦奇拉坦瀑布", "Водопад Вачиратхан"),
    ],
    includes: [
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
      z("อาหารกลางวัน", "Lunch", "午餐", "Обед"),
      z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游", "Гид на китайском"),
    ],
    plan: [
      { time: "07:30", text: z("รับที่โรงแรม", "Hotel pickup", "酒店接人", "Выезд из отеля") },
      { time: "09:30", text: z("น้ำตกวชิรธาร", "Wachirathan waterfall", "瓦奇拉坦瀑布", "Водопад Вачиратхан") },
      { time: "11:00", text: z("ยอดดอยและเส้นทางอ่างกาหลวง", "Summit and Ang Ka nature trail", "山顶与安卡自然步道", "Вершина и тропа Ангка") },
      { time: "13:30", text: z("พระมหาธาตุคู่", "Twin pagodas and gardens", "双塔与花园", "Пагоды и сады") },
      { time: "17:30", text: z("กลับถึงเชียงใหม่", "Back in Chiang Mai", "返回清迈", "Возвращение в Чиангмай") },
    ],
    cancel: FREE24, tags: ["noshop", "smallgroup", "family"],
  },
  {
    id: "dt03", kind: "daytour", agency: "bkkjet", region: "gtr",
    title: z("สามเหลี่ยมทองคำ เชียงแสน เกาะดอนซาว ราคาประหยัด", "Golden Triangle, Chiang Saen & Laos island: value run", "金三角、清盛与老挝岛特价一日游", "Золотой треугольник и остров Лаоса — эконом"),
    place: z("ออกจากเชียงราย", "From Chiang Rai", "清莱出发", "Из Чианграя"),
    hours: 9, start: "08:00", price: 990, child: 790,
    extras: [
      { label: z("เรือแม่โขงไปเกาะดอนซาว", "Mekong boat to Don Sao island", "湄公河船往东挠岛", "Лодка на остров Дон Сао"), amt: 300 },
      { label: z("ค่าเหยียบเกาะฝั่งลาว", "Laos island landing fee", "老挝岛登岛费", "Сбор за высадку в Лаосе"), amt: 30 },
    ],
    pickup: true, guide: CN, group: 30, shopping: 2, rating: 4.0, reviews: 133, days: DAILY,
    highlights: [
      z("ล่องเรือแม่โขง", "Mekong boat ride", "湄公河游船", "Прогулка по Меконгу"),
      z("ตลาดเกาะดอนซาวฝั่งลาว", "Don Sao market on the Laos side", "老挝东挠岛市场", "Рынок Дон Сао в Лаосе"),
      z("วัดพระธาตุเชียงแสน", "Chiang Saen old town temples", "清盛古城寺庙", "Храмы старого Чиангсаена"),
    ],
    includes: [
      z("รถตู้รับส่ง", "Van transfers", "商务车接送", "Трансфер на минивэне"),
      z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游", "Гид на китайском"),
    ],
    plan: [
      { time: "08:00", text: z("รับที่โรงแรมเชียงราย", "Chiang Rai hotel pickup", "清莱酒店接人", "Выезд из отеля") },
      { time: "09:30", text: z("ร้านหยกและร้านชา", "Jade shop and tea shop stops", "玉器店与茶叶店", "Магазины нефрита и чая") },
      { time: "11:30", text: z("ล่องเรือไปเกาะดอนซาว", "Boat to Don Sao island", "乘船前往东挠岛", "Лодка на Дон Сао") },
      { time: "14:00", text: z("เชียงแสนเมืองเก่า", "Chiang Saen old town", "清盛古城", "Старый Чиангсаен") },
      { time: "17:00", text: z("กลับถึงเชียงราย", "Back in Chiang Rai", "返回清莱", "Возвращение в Чианграй") },
    ],
    cancel: z("ไม่คืนเงินหลังชำระ", "Non-refundable", "付款后不可退", "Без возврата"),
    tags: ["budget"],
    warn: [
      z("แวะร้านหยกและร้านชา 2 แห่งช่วงเช้า", "Two shop stops in the morning: jade and tea", "上午进店两家：玉器与茶叶", "Два магазина утром: нефрит и чай"),
      z("ค่าเรือและค่าเกาะจ่ายเพิ่มหน้างาน", "Boat and island fees are paid on the day", "船费与登岛费需当天另付", "Лодка и сбор оплачиваются на месте"),
    ],
    photo: u("1641382676951-293859d30138"),
  },
  {
    id: "dt04", kind: "daytour", agency: "siam", region: "cnx",
    title: z("วัดดอยสุเทพและเมืองเก่าเชียงใหม่", "Doi Suthep & Chiang Mai old-city temples", "素贴山双龙寺与清迈古城寺庙", "Дой Сутхеп и храмы старого Чиангмая"),
    place: z("เชียงใหม่", "Chiang Mai", "清迈", "Чиангмай"),
    hours: 7, start: "08:30", price: 1290, child: 990,
    extras: [
      { label: z("ค่าเข้าวัดพระธาตุดอยสุเทพ", "Doi Suthep temple entry", "双龙寺门票", "Вход в Дой Сутхеп"), amt: 30 },
      { label: z("ลิฟต์ขึ้นวัด", "Funicular to the temple", "上山缆车", "Фуникулёр к храму"), amt: 20 },
    ],
    pickup: true, guide: CN_EN, group: 12, shopping: 0, rating: 4.7, reviews: 356, days: DAILY,
    highlights: [
      z("วัดพระธาตุดอยสุเทพ", "Wat Phra That Doi Suthep", "素贴山双龙寺", "Ват Пхра Тхат Дой Сутхеп"),
      z("วัดเจดีย์หลวงและวัดพระสิงห์", "Wat Chedi Luang and Wat Phra Singh", "契迪龙寺与帕辛寺", "Ват Чеди Луанг и Ват Пхра Сингх"),
      z("เดินเมืองเก่าจังหวะสบาย", "Easy-paced old-city walk", "古城慢步", "Неспешная прогулка по старому городу"),
    ],
    includes: [
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
      z("อาหารกลางวันข้าวซอย", "Khao soi lunch", "泰北咖喱面午餐", "Обед — као сой"),
      z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游", "Гид на китайском"),
    ],
    plan: [
      { time: "08:30", text: z("รับที่โรงแรม ขึ้นดอยสุเทพ", "Hotel pickup, up to Doi Suthep", "酒店接人，上素贴山", "Выезд из отеля на Дой Сутхеп") },
      { time: "11:30", text: z("ข้าวซอยมื้อกลางวัน", "Khao soi lunch", "咖喱面午餐", "Обед — као сой") },
      { time: "13:00", text: z("วัดพระสิงห์ วัดเจดีย์หลวง", "Wat Phra Singh, Wat Chedi Luang", "帕辛寺、契迪龙寺", "Ват Пхра Сингх, Ват Чеди Луанг") },
      { time: "15:30", text: z("ส่งที่โรงแรม", "Hotel drop-off", "送回酒店", "Возвращение в отель") },
    ],
    cancel: FREE24, tags: ["noshop", "smallgroup", "elderly", "family"], photo: u("1651792999885-85301e235a62"),
  },

  /* ── Excursions ── */
  {
    id: "ex01", kind: "excursion", agency: "siam", region: "cnx",
    title: z("ปางช้างแบบไม่ขี่ ครึ่งวัน", "Ethical elephant sanctuary, half day (no riding)", "人道大象保护营半日游（不骑象）", "Этичный приют слонов, полдня (без катания)"),
    place: z("แม่แตง เชียงใหม่", "Mae Taeng, Chiang Mai", "清迈湄登", "Мае Тэнг, Чиангмай"),
    hours: 5, start: "08:00", price: 2200, child: 1600, extras: [],
    pickup: true, guide: CN_EN, group: 10, shopping: 0, rating: 4.9, reviews: 521, days: DAILY,
    highlights: [
      z("ให้อาหารและเดินกับช้าง ไม่มีการขี่", "Feed and walk with elephants, no riding", "喂食并与大象同行，不骑象", "Кормление и прогулка со слонами, без катания"),
      z("ช่วงอาบน้ำช้างในลำธาร", "River bathing time", "溪中为大象洗澡", "Купание слонов в реке"),
      z("กลุ่มเล็กไม่เกิน 10 คน", "Small group, 10 max", "小团，最多10人", "Малая группа, до 10 человек"),
    ],
    includes: [
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
      z("อาหารกลางวันมังสวิรัติ", "Vegetarian lunch", "素食午餐", "Вегетарианский обед"),
      z("ชุดสำหรับลงน้ำ", "Change of clothes for the river", "下水换洗衣物", "Одежда для купания"),
    ],
    plan: [
      { time: "08:00", text: z("รับที่โรงแรม", "Hotel pickup", "酒店接人", "Выезд из отеля") },
      { time: "09:30", text: z("ทำความรู้จักและให้อาหารช้าง", "Meet and feed the elephants", "认识并喂食大象", "Знакомство и кормление") },
      { time: "11:00", text: z("เดินป่าและอาบน้ำช้าง", "Forest walk and river bath", "林间漫步与溪中洗澡", "Прогулка и купание") },
      { time: "13:00", text: z("ส่งที่โรงแรม", "Hotel drop-off", "送回酒店", "Возвращение в отель") },
    ],
    cancel: FREE24, tags: ["family", "smallgroup", "adventure", "noshop"],
  },
  {
    id: "ex02", kind: "excursion", agency: "nakara", region: "cnx",
    title: z("คลาสทำอาหารไทยพร้อมเดินตลาด", "Thai cooking class with market visit", "泰餐烹饪课（含逛市场）", "Кулинарный класс тайской кухни с рынком"),
    place: z("ฟาร์มนอกเมืองเชียงใหม่", "Farm kitchen outside Chiang Mai", "清迈郊外农场厨房", "Ферма-кухня под Чиангмаем"),
    hours: 5, start: "09:00", price: 1200, child: 900, extras: [],
    pickup: true, guide: CN_EN, group: 12, shopping: 0, rating: 4.8, reviews: 389, days: z("จันทร์–เสาร์", "Mon–Sat", "周一至周六", "Пн–Сб"),
    highlights: [
      z("ทำ 5 เมนู ต้มยำ ผัดไทย แกงเขียวหวาน", "Cook 5 dishes: tom yum, pad thai, green curry", "做5道菜：冬阴功、泰式炒河粉、绿咖喱", "5 блюд: том ям, пад тай, зелёное карри"),
      z("เก็บผักสมุนไพรจากแปลง", "Pick herbs from the garden", "菜园采摘香草", "Сбор трав в огороде"),
      z("ได้สูตรภาษาจีนกลับบ้าน", "Chinese recipe booklet to take home", "附中文食谱", "Рецепты на китайском с собой"),
    ],
    includes: [
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
      z("วัตถุดิบและอุปกรณ์ทั้งหมด", "All ingredients and equipment", "全部食材与厨具", "Все продукты и инвентарь"),
      z("ผู้สอนพูดจีนได้", "Chinese-speaking instructor", "中文厨师讲解", "Инструктор говорит по-китайски"),
    ],
    plan: [
      { time: "09:00", text: z("รับที่โรงแรม เดินตลาดสด", "Hotel pickup, fresh market walk", "酒店接人，逛菜市场", "Выезд, прогулка по рынку") },
      { time: "10:30", text: z("ทำอาหารที่ฟาร์ม", "Cook at the farm kitchen", "农场厨房烹饪", "Готовка на ферме") },
      { time: "12:30", text: z("ทานอาหารที่ทำเอง", "Eat what you cooked", "享用自己做的菜", "Обед из своих блюд") },
      { time: "14:00", text: z("ส่งที่โรงแรม", "Hotel drop-off", "送回酒店", "Возвращение в отель") },
    ],
    cancel: FREE24, tags: ["food", "family", "noshop"],
  },
  {
    id: "ex03", kind: "excursion", agency: "bkkjet", region: "cnx",
    title: z("น้ำตกบัวตอง (น้ำตกเหนียว) และเดินป่า", "Bua Thong 'Sticky' Waterfall & jungle walk", "粘粘瀑布攀爬与丛林徒步", "«Липкий» водопад Буа Тонг и прогулка по джунглям"),
    place: z("แม่แตง เชียงใหม่", "Mae Taeng, Chiang Mai", "清迈湄登", "Мае Тэнг, Чиангмай"),
    hours: 5, start: "09:00", price: 950, child: 750,
    extras: [{ label: z("ค่าจอดรถและอุทยาน", "Park and parking fee", "园区与停车费", "Парк и парковка"), amt: 50 }],
    pickup: true, guide: z("อังกฤษ", "English", "英语", "Английский"), group: 14, shopping: 0, rating: 4.6, reviews: 174, days: DAILY,
    highlights: [
      z("ปีนน้ำตกหินปูนที่ไม่ลื่น", "Climb a waterfall that isn't slippery", "攀爬不打滑的石灰岩瀑布", "Подъём по нескользкому водопаду"),
      z("บ่อน้ำผุดเจ็ดสี", "Seven-colour spring", "七彩泉", "Семицветный источник"),
      z("เดินป่าระยะสั้น", "Short jungle walk", "短途丛林徒步", "Короткая прогулка по джунглям"),
    ],
    includes: [
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
      z("อาหารกลางวันแบบปิกนิก", "Picnic lunch", "野餐午餐", "Обед-пикник"),
    ],
    plan: [
      { time: "09:00", text: z("รับที่โรงแรม", "Hotel pickup", "酒店接人", "Выезд из отеля") },
      { time: "10:15", text: z("ปีนน้ำตกบัวตอง", "Climb Bua Thong falls", "攀爬粘粘瀑布", "Подъём по водопаду") },
      { time: "12:00", text: z("ปิกนิกริมบ่อน้ำผุด", "Picnic by the spring", "泉边野餐", "Пикник у источника") },
      { time: "14:00", text: z("ส่งที่โรงแรม", "Hotel drop-off", "送回酒店", "Возвращение в отель") },
    ],
    cancel: FREE24, tags: ["adventure", "family"],
  },
  {
    id: "ex04", kind: "excursion", agency: "siam", region: "cnx",
    title: z("ดอยสุเทพยามเย็นและคุยกับพระ", "Doi Suthep at sunset with a monk chat", "双龙寺日落与僧侣对话", "Дой Сутхеп на закате и беседа с монахом"),
    place: z("ดอยสุเทพ เชียงใหม่", "Doi Suthep, Chiang Mai", "清迈素贴山", "Дой Сутхеп, Чиангмай"),
    hours: 4, start: "15:00", price: 890, child: 690,
    extras: [{ label: z("ค่าเข้าวัด", "Temple entry", "寺庙门票", "Вход в храм"), amt: 30 }],
    pickup: true, guide: CN_EN, group: 12, shopping: 0, rating: 4.8, reviews: 207, days: DAILY,
    highlights: [
      z("วิวเมืองเชียงใหม่ตอนพระอาทิตย์ตก", "Chiang Mai skyline at sunset", "日落时分俯瞰清迈", "Вид на город на закате"),
      z("ฟังพระสวดมนต์เย็น", "Evening chanting", "聆听晚课诵经", "Вечерние песнопения"),
      z("คุยกับพระ มีล่ามจีน", "Monk chat with a Chinese interpreter", "与僧侣交流（中文翻译）", "Беседа с монахом с переводом"),
    ],
    includes: [
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
      z("ไกด์ภาษาจีน", "Chinese-speaking guide", "中文导游", "Гид на китайском"),
    ],
    plan: [
      { time: "15:00", text: z("รับที่โรงแรม", "Hotel pickup", "酒店接人", "Выезд из отеля") },
      { time: "16:00", text: z("วัดพระธาตุดอยสุเทพ", "Wat Phra That Doi Suthep", "双龙寺", "Ват Пхра Тхат Дой Сутхеп") },
      { time: "17:30", text: z("คุยกับพระและฟังสวดมนต์", "Monk chat and chanting", "僧侣对话与诵经", "Беседа и песнопения") },
      { time: "19:00", text: z("ส่งที่โรงแรม", "Hotel drop-off", "送回酒店", "Возвращение в отель") },
    ],
    cancel: FREE24, tags: ["elderly", "smallgroup", "noshop"], photo: u("1773929291087-ba04f053a765"),
  },

  /* ── Special attractions ── */
  {
    id: "at01", kind: "attraction", agency: "siam", region: "cnx",
    title: z("เชียงใหม่ไนท์ซาฟารี รถรางซาฟารีและโชว์น้ำพุ", "Chiang Mai Night Safari: tram safari & fountain show", "清迈夜间动物园：游园车与音乐喷泉", "Ночное сафари Чиангмая: трамвай и шоу фонтанов"),
    place: z("เชียงใหม่", "Chiang Mai", "清迈", "Чиангмай"),
    hours: 3, start: "18:00", price: 1200, child: 800, extras: [],
    pickup: true, guide: SELF, group: 0, shopping: 0, rating: 4.6, reviews: 640, days: DAILY,
    highlights: [
      z("รถรางซาฟารีกลางคืน 2 โซน", "Two night tram zones", "两个夜间游园车区", "Две ночные зоны на трамвае"),
      z("โชว์น้ำพุดนตรี", "Musical fountain show", "音乐喷泉表演", "Музыкальный фонтан"),
      z("เหมาะกับครอบครัว", "Good for families", "适合家庭", "Подходит для семей"),
    ],
    includes: [
      z("ตั๋วเข้าชมและรถราง", "Entry ticket and tram ride", "门票与游园车", "Билет и трамвай"),
      z("รถรับส่งโรงแรมไป-กลับ", "Round-trip hotel transfer", "往返酒店接送", "Трансфер туда и обратно"),
    ],
    plan: [
      { time: "17:30", text: z("รับที่โรงแรม", "Hotel pickup", "酒店接人", "Выезд из отеля") },
      { time: "18:00", text: z("รถรางซาฟารี", "Night tram safari", "夜间游园车", "Ночное сафари") },
      { time: "20:00", text: z("โชว์น้ำพุ แล้วส่งกลับ", "Fountain show, then drop-off", "喷泉表演后送回", "Шоу фонтанов, возвращение") },
    ],
    cancel: FREE24, tags: ["family", "night"],
  },
  {
    id: "at02", kind: "attraction", agency: "nakara", region: "cnx",
    title: z("ขันโตกดินเนอร์และการแสดงล้านนา", "Khantoke dinner & Lanna dance show", "康托克晚宴与兰纳舞蹈表演", "Ужин кхантоук и шоу ланнского танца"),
    place: z("เชียงใหม่", "Chiang Mai", "清迈", "Чиангмай"),
    hours: 3, start: "18:30", price: 790, child: 500, extras: [],
    pickup: true, guide: SELF, group: 0, shopping: 0, rating: 4.5, reviews: 298, days: DAILY,
    highlights: [
      z("อาหารเหนือแบบขันโตก", "Northern Thai set dinner on a khantoke tray", "泰北康托克套餐", "Северный ужин на подносе кхантоук"),
      z("ฟ้อนเล็บ ฟ้อนเทียน", "Nail and candle dances", "指甲舞与蜡烛舞", "Танцы с ногтями и свечами"),
      z("ที่นั่งกลุ่มสำหรับครอบครัว", "Family seating", "家庭座位", "Семейные места"),
    ],
    includes: [
      z("อาหารเย็นและน้ำดื่ม", "Dinner and soft drinks", "晚餐与饮料", "Ужин и напитки"),
      z("ที่นั่งชมการแสดง", "Show seat", "演出座位", "Место на шоу"),
      z("รถรับส่งโรงแรม", "Hotel transfers", "酒店接送", "Трансфер из отеля"),
    ],
    plan: [
      { time: "18:00", text: z("รับที่โรงแรม", "Hotel pickup", "酒店接人", "Выезд из отеля") },
      { time: "18:30", text: z("ขันโตกดินเนอร์", "Khantoke dinner", "康托克晚宴", "Ужин кхантоук") },
      { time: "19:30", text: z("การแสดงล้านนา", "Lanna dance show", "兰纳舞蹈表演", "Шоу ланнского танца") },
    ],
    cancel: FREE24, tags: ["food", "family", "night", "elderly"],
  },
  {
    id: "at03", kind: "attraction", agency: "siam", region: "cei",
    title: z("วัดร่องขุ่นและบ้านดำ พร้อมออดิโอไกด์ภาษาจีน", "White Temple & Black House with Chinese audio guide", "白庙与黑屋（含中文语音导览）", "Белый храм и Чёрный дом с аудиогидом на китайском"),
    place: z("เชียงราย", "Chiang Rai", "清莱", "Чианграй"),
    hours: 3, start: "08:00", price: 350, child: 200, extras: [],
    pickup: false, guide: AUDIO, group: 0, shopping: 0, rating: 4.7, reviews: 186, days: DAILY,
    highlights: [
      z("ตั๋ววัดร่องขุ่นและบ้านดำรวมในใบเดียว", "One pass for both the White Temple and Baan Dam", "白庙与黑屋联票", "Один билет на оба места"),
      z("ออดิโอไกด์ภาษาจีนบนมือถือ", "Chinese audio guide on your phone", "手机中文语音导览", "Аудиогид на телефоне"),
      z("เข้าได้ทั้งวัน", "Use any time that day", "当天任意时间使用", "В любое время в течение дня"),
    ],
    includes: [
      z("ค่าเข้าวัดร่องขุ่น", "White Temple entry", "白庙门票", "Вход в Белый храм"),
      z("ค่าเข้าบ้านดำ", "Baan Dam entry", "黑屋门票", "Вход в Баан Дам"),
      z("ออดิโอไกด์", "Audio guide", "语音导览", "Аудиогид"),
    ],
    plan: [
      { time: "08:00", text: z("เปิดให้เข้าชมวัดร่องขุ่น", "White Temple opens", "白庙开放", "Открытие Белого храма") },
      { time: "09:00", text: z("บ้านดำเปิด ห่างกัน 25 นาที", "Baan Dam opens, 25 minutes away", "黑屋开放，车程25分钟", "Баан Дам открывается, 25 минут езды") },
      { time: "17:00", text: z("ปิดทั้งสองแห่ง", "Both close", "两处均闭馆", "Оба закрываются") },
    ],
    cancel: z("ยกเลิกฟรีก่อนวันใช้งาน", "Free cancellation before the day of use", "使用日前免费取消", "Бесплатная отмена до дня посещения"),
    tags: ["elderly", "family"], photo: u("1665068551186-1010e3867f99"),
  },
  {
    id: "at04", kind: "attraction", agency: "nakara", region: "gtr",
    title: z("หอฝิ่น อุทยานสามเหลี่ยมทองคำ", "Hall of Opium, Golden Triangle Park", "金三角鸦片博物馆", "Зал опиума, парк Золотого треугольника"),
    place: z("สามเหลี่ยมทองคำ", "Golden Triangle", "金三角", "Золотой треугольник"),
    hours: 2, start: "08:30", price: 200, child: 0, extras: [],
    pickup: false, guide: AUDIO, group: 0, shopping: 0, rating: 4.6, reviews: 92, days: z("อังคาร–อาทิตย์", "Tue–Sun", "周二至周日", "Вт–Вс"),
    highlights: [
      z("นิทรรศการประวัติศาสตร์ฝิ่น 5,000 ปี", "5,000 years of opium history", "鸦片五千年历史展", "5000 лет истории опиума"),
      z("ห้องปรับอากาศ เดินสบาย", "Air-conditioned, easy walking", "全程空调，步行轻松", "Кондиционер, лёгкая прогулка"),
      z("เด็กเข้าฟรี", "Children free", "儿童免费", "Дети бесплатно"),
    ],
    includes: [
      z("ตั๋วเข้าชม", "Entry ticket", "门票", "Входной билет"),
      z("ออดิโอไกด์ภาษาจีน", "Chinese audio guide", "中文语音导览", "Аудиогид на китайском"),
    ],
    plan: [
      { time: "08:30", text: z("เปิดให้เข้าชม", "Opens", "开馆", "Открытие") },
      { time: "16:00", text: z("รอบสุดท้าย", "Last entry", "最后入场", "Последний вход") },
    ],
    cancel: FREE24, tags: ["elderly", "family"], photo: u("1641382676951-293859d30138"),
  },
];

hydrateTree(activities);

export const realPrice = (a: Activity) => a.price + a.extras.reduce((s, x) => s + x.amt, 0);
export const activityById = (id: string) => activities.find((a) => a.id === id);
export const activitiesOf = (kind: ActivityKind) => activities.filter((a) => a.kind === kind);
export const kindFromPath = (path: string): ActivityKind | null =>
  (Object.keys(KIND_PATH) as ActivityKind[]).find((k) => path.startsWith(KIND_PATH[k])) ?? null;
