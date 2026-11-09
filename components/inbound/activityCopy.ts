import type { L10n } from "@/lib/data";

const z = (th: string, en: string, zh: string, ru?: string): L10n => ({ th, en, zh, ru });

/** Copy for the inbound day tour / excursion / attraction pages. */
export const AC = {
  multiDay: z("ทัวร์หลายวัน", "Multi-day tours", "多日游", "Многодневные туры"),
  allRegions: z("ทุกพื้นที่", "All regions", "全部地区", "Все регионы"),
  maxPrice: z("ราคารวมจริงไม่เกิน", "Real total up to", "实际总价不超过", "Реальная цена до"),
  durAny: z("ทุกระยะเวลา", "Any length", "不限时长", "Любая длительность"),
  durShort: z("ไม่เกิน 4 ชม.", "Up to 4 h", "4小时以内", "До 4 ч"),
  durMid: z("4–8 ชม.", "4–8 h", "4–8小时", "4–8 ч"),
  durLong: z("เต็มวัน 8 ชม.+", "Full day, 8 h+", "全天 8小时以上", "Весь день, 8 ч+"),
  pickup: z("รับจากโรงแรม", "Hotel pickup", "酒店接送", "Трансфер из отеля"),
  cnGuide: z("ไกด์หรือออดิโอภาษาจีน", "Chinese guide or audio", "中文导游或语音导览", "Китайский гид или аудио"),
  sortRating: z("คะแนนรีวิวสูงสุด", "Top rated", "评分最高", "Лучший рейтинг"),
  sortShort: z("ใช้เวลาน้อยสุด", "Shortest first", "时长最短", "Сначала короткие"),
  options: z("ตัวเลือก", "options", "个选择", "вариантов"),
  option: z("ตัวเลือก", "option", "个选择", "вариант"),
  noMatch: z("ไม่พบรายการที่ตรงกับตัวกรอง", "Nothing matches these filters", "没有符合筛选条件的项目", "Ничего не найдено"),
  view: z("ดูรายละเอียด", "View details", "查看详情", "Подробнее"),
  shops: z("จุดแวะร้าน", "shop stops", "个购物点", "магазина"),
  shopStops: z("จุดแวะร้านช้อป", "Shop stops", "购物点", "Заезды в магазины"),
  starts: z("เริ่ม", "Starts", "出发", "Начало"),
  guide: z("ไกด์", "Guide", "导游", "Гид"),
  groupMax: z("กลุ่มไม่เกิน", "Group up to", "每团最多", "Группа до"),
  ticketOnly: z("ตั๋วเข้าชม ไม่มีไกด์ประจำกลุ่ม", "Ticket, no group guide", "仅门票，无随团导游", "Билет, без гида"),
  highlights: z("ไฮไลต์", "Highlights", "亮点", "Главное"),
  schedule: z("กำหนดการ", "Schedule", "行程安排", "Расписание"),
  openTimes: z("เวลาเปิด", "Opening times", "开放时间", "Часы работы"),
  included: z("รวมในราคา", "Included", "费用包含", "Включено"),
  payOnDay: z("จ่ายเพิ่มหน้างาน", "Paid on the day", "当天另付", "Оплата на месте"),
  nothingExtra: z("ไม่มีค่าใช้จ่ายเพิ่มหน้างาน", "Nothing extra to pay on the day", "当天无需另付费用", "На месте доплачивать не нужно"),
  goodToKnow: z("ข้อมูลควรรู้", "Good to know", "须知", "Полезно знать"),
  pickupYes: z("รับ-ส่งโรงแรมในตัวเมือง", "Hotel pickup and drop-off in town", "城区酒店接送", "Трансфер из отеля в городе"),
  pickupNo: z("เดินทางไปเอง พบกันที่สถานที่", "Make your own way, meet at the venue", "自行前往，现场集合", "Добираетесь сами, встреча на месте"),
  runs: z("วันให้บริการ", "Runs", "开放日", "Дни работы"),
  none: z("ไม่มี", "None", "无", "Нет"),
  cancel: z("เงื่อนไขยกเลิก", "Cancellation", "取消政策", "Отмена"),
  childPrice: z("ราคาเด็ก (3–11 ปี)", "Child price (3–11)", "儿童价（3–11岁）", "Детская цена (3–11)"),
  free: z("ฟรี", "Free", "免费", "Бесплатно"),
  checkFirst: z("ควรรู้ก่อนจอง", "Check before booking", "预订前请注意", "Проверьте перед бронированием"),
  operator: z("ผู้ให้บริการ", "Operator", "服务商", "Оператор"),
  perAdult: z("ต่อผู้ใหญ่ 1 ท่าน", "per adult", "每位成人", "за взрослого"),
  date: z("วันที่", "Date", "日期", "Дата"),
  adults: z("ผู้ใหญ่", "Adults", "成人", "Взрослые"),
  children: z("เด็ก (3–11 ปี)", "Children (3–11)", "儿童（3–11岁）", "Дети (3–11)"),
  total: z("ยอดรวม", "Total", "合计", "Итого"),
  request: z("ส่งคำขอจอง", "Request booking", "提交预订", "Запросить бронь"),
  pickDate: z("เลือกวันที่ก่อน", "Choose a date first", "请先选择日期", "Сначала выберите дату"),
  sent: z("ส่งคำขอแล้ว", "Request sent", "已提交预订", "Запрос отправлен"),
  ref: z("เลขอ้างอิง", "Reference", "预订编号", "Номер"),
  confirmsIn: z("ผู้ให้บริการยืนยันภายในประมาณ", "The operator confirms in about", "服务商约在以下时间内确认：", "Оператор подтвердит примерно за"),
  minutes: z("นาที", "minutes", "分钟", "минут"),
  change: z("แก้ไขคำขอ", "Change request", "修改预订", "Изменить запрос"),
  more: z("ตัวเลือกอื่นที่น่าสนใจ", "You may also like", "猜你喜欢", "Вам может понравиться"),
  reviews: z("รีวิว", "reviews", "条评价", "отзывов"),
};

export function hoursLabel(h: number, lang: string) {
  if (lang === "th") return `${h} ชม.`;
  if (lang === "zh") return `${h} 小时`;
  if (lang === "ru") return `${h} ч`;
  return `${h} h`;
}
