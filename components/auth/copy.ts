import type { L10n } from "@/lib/data";

const z = (th: string, en: string, zh: string, ru?: string): L10n => ({ th, en, zh, ru });

/** Copy for sign-in, the member menu and the buyer account space. */
export const AU = {
  kicker: z("เข้าสู่ระบบสมาชิก", "Member sign-in", "会员登录", "Вход для участников"),
  title: z("เข้าสู่พื้นที่ของคุณบน TOUR24", "Sign in to your TOUR24 space", "登录你的 TOUR24 空间", "Войдите в своё пространство TOUR24"),
  sub: z(
    "เลือกว่าคุณใช้ TOUR24 ในบทบาทไหน แต่ละบทบาทมีพื้นที่ของตัวเอง",
    "Pick how you use TOUR24. Each kind of member gets its own space.",
    "选择你使用 TOUR24 的身份，每种会员都有自己的空间。",
    "Выберите, как вы используете TOUR24 — у каждой роли своё пространство."
  ),
  groupBuy: z("ซื้อทัวร์", "Buy tours", "买团", "Покупать туры"),
  groupSell: z("ขายทัวร์", "Sell tours", "卖团", "Продавать туры"),
  groupRun: z("ปฏิบัติการ", "Run operations", "运营", "Операции"),
  opens: z("เปิดที่", "Opens", "进入", "Открывает"),
  email: z("อีเมล", "Email", "邮箱", "Email"),
  password: z("รหัสผ่าน", "Password", "密码", "Пароль"),
  signIn: z("เข้าสู่ระบบ", "Sign in", "登录", "Войти"),
  signingIn: z("กำลังเข้าสู่ระบบ…", "Signing in…", "登录中…", "Вход…"),
  signOut: z("ออกจากระบบ", "Sign out", "退出登录", "Выйти"),
  bad: z("อีเมลหรือรหัสผ่านไม่ถูกต้อง", "That email and password don't match a member.", "邮箱或密码不正确。", "Неверный email или пароль."),
  wrongRoleTail: z("บัญชีนี้เป็น", "This account is a", "该账号身份为", "Этот аккаунт —"),
  pickThatRole: z("เลือกบทบาทนั้นแล้วเข้าสู่ระบบอีกครั้ง", "Pick that role and sign in again.", "请选择该身份后重新登录。", "Выберите эту роль и войдите снова."),
  demo: z("บัญชีทดลอง", "Demo accounts", "演示账号", "Демо-аккаунты"),
  demoNote: z(
    "ระบบเข้าสู่ระบบสำหรับเดโม ทุกบัญชีใช้รหัสผ่าน",
    "Demo sign-in. Every demo account uses the password",
    "演示登录。所有演示账号的密码均为",
    "Демо-вход. Пароль всех демо-аккаунтов —"
  ),
  useAccount: z("ใช้บัญชีนี้", "Use this account", "使用此账号", "Войти этим аккаунтом"),
  wrongSpace: z("บัญชีที่เข้าอยู่เปิดพื้นที่นี้ไม่ได้", "Your signed-in account can't open that space", "当前账号无法进入该空间", "Текущий аккаунт не открывает это пространство"),
  signedInAs: z("เข้าสู่ระบบในชื่อ", "Signed in as", "当前登录", "Вы вошли как"),
  goSpace: z("ไปที่พื้นที่ของฉัน", "Go to my space", "进入我的空间", "Моё пространство"),
  mySpace: z("พื้นที่ของฉัน", "My space", "我的空间", "Моё пространство"),
  signInShort: z("เข้าสู่ระบบ", "Sign in", "登录", "Войти"),

  // buyer account
  hi: z("สวัสดี", "Hi", "你好", "Здравствуйте"),
  accountSub: z(
    "ทริป คำขอจอง ทัวร์ที่บันทึกไว้ และโปรไฟล์ของคุณในที่เดียว",
    "Your trips, booking requests, saved tours and profile in one place.",
    "你的行程、预订申请、收藏线路与个人资料都在这里。",
    "Поездки, заявки, сохранённые туры и профиль в одном месте."
  ),
  nextTrip: z("ทริปถัดไป", "Next trip", "下一次出行", "Следующая поездка"),
  openTrips: z("เปิดทริปของฉัน", "Open my trips", "打开我的行程", "Мои поездки"),
  noTrip: z("ยังไม่มีทริปที่จะไป", "No upcoming trip yet", "暂无即将出行的行程", "Предстоящих поездок нет"),
  requests: z("คำขอจอง", "Booking requests", "预订申请", "Заявки на бронь"),
  noRequests: z(
    "ยังไม่มีคำขอ ส่งคำขอจองจากหน้าทัวร์วันเดียว กิจกรรม หรือสถานที่พิเศษ",
    "No requests yet. Send one from any day tour, excursion or attraction page.",
    "暂无申请。可在一日游、短途游览或特色景点页面提交。",
    "Заявок пока нет."
  ),
  waiting: z("รอผู้ให้บริการยืนยัน", "Waiting for operator", "等待服务商确认", "Ждёт подтверждения"),
  saved: z("ทัวร์ที่บันทึกไว้", "Saved tours", "收藏线路", "Сохранённые туры"),
  noSaved: z("ยังไม่มีทัวร์ที่บันทึกไว้", "No saved tours yet", "暂无收藏", "Сохранённых туров нет"),
  shortcuts: z("ทางลัด", "Shortcuts", "快捷入口", "Быстрые ссылки"),
  profile: z("โปรไฟล์ผู้เดินทาง", "Traveller profile", "旅客资料", "Профиль путешественника"),
  fullName: z("ชื่อ-นามสกุลตามพาสปอร์ต", "Full name as on passport", "护照姓名", "Имя как в паспорте"),
  phone: z("เบอร์โทร", "Phone", "电话", "Телефон"),
  homeCountry: z("สัญชาติ", "Nationality", "国籍", "Гражданство"),
  prefLang: z("ภาษาที่ต้องการให้ไกด์ใช้", "Preferred guide language", "导游语言偏好", "Язык гида"),
  diet: z("อาหารและความต้องการพิเศษ", "Diet and access needs", "饮食与特殊需求", "Питание и особые потребности"),
  save: z("บันทึก", "Save", "保存", "Сохранить"),
  savedOk: z("บันทึกแล้ว", "Saved", "已保存", "Сохранено"),
  savedLocal: z("บันทึกไว้ในอุปกรณ์นี้ (เดโม)", "Stored on this device (demo)", "保存在本设备（演示）", "Хранится на этом устройстве (демо)"),
  memberId: z("รหัสสมาชิก", "Member ID", "会员编号", "ID участника"),
  guarantee: z(
    "จองผ่าน TOUR24 ได้รับการคุ้มครอง TOUR24 Guarantee และรีวิวได้หลังเดินทาง",
    "Bookings made on TOUR24 are covered by the TOUR24 Guarantee, and you can review after you travel.",
    "通过 TOUR24 预订享受 TOUR24 保障，出行后可发表评价。",
    "Брони на TOUR24 защищены TOUR24 Guarantee."
  ),
  browse: z("ค้นหาทัวร์", "Browse tours", "浏览线路", "Найти туры"),
  askAi: z("ถาม AI", "Ask AI", "问 AI", "Спросить ИИ"),
  groupQuote: z("ขอราคากรุ๊ป", "Group quote", "团队询价", "Групповой запрос"),
  people: z("คน", "people", "人", "чел."),
};
