type XR = { zh: string; ru: string };

const MON: Record<string, XR> = {
  Jan: { zh: "1月", ru: "янв." },
  Feb: { zh: "2月", ru: "февр." },
  Mar: { zh: "3月", ru: "мар." },
  Apr: { zh: "4月", ru: "апр." },
  May: { zh: "5月", ru: "мая" },
  Jun: { zh: "6月", ru: "июн." },
  Jul: { zh: "7月", ru: "июл." },
  Aug: { zh: "8月", ru: "авг." },
  Sep: { zh: "9月", ru: "сент." },
  Oct: { zh: "10月", ru: "окт." },
  Nov: { zh: "11月", ru: "нояб." },
  Dec: { zh: "12月", ru: "дек." },
};

function dateFill(en: string): XR | undefined {
  const range = en.match(/^(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (range) {
    const [, a, b, mon, y] = range;
    const m = MON[mon];
    if (!m) return;
    return { zh: `${y}年${m.zh}${Number(a)}–${Number(b)}日`, ru: `${Number(a)}–${Number(b)} ${m.ru} ${y}` };
  }
  const dmy = en.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (dmy) {
    const [, d, mon, y] = dmy;
    const m = MON[mon];
    if (!m) return;
    return { zh: `${y}年${m.zh}${Number(d)}日`, ru: `${Number(d)} ${m.ru} ${y}` };
  }
  const single = en.match(/^(\d{1,2})\s+(\w+)$/);
  if (single) {
    const [, d, mon] = single;
    const m = MON[mon];
    if (!m) return;
    return { zh: `${m.zh}${Number(d)}日`, ru: `${Number(d)} ${m.ru}` };
  }
}

function ruCount(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} ${one}`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

function patternFill(en: string): XR | undefined {
  let m = en.match(/^(\d+) points? to check before booking$/);
  if (m) {
    const n = Number(m[1]);
    return { zh: `预订前有 ${n} 处需核对`, ru: `${ruCount(n, "пункт", "пункта", "пунктов")} проверить до брони` };
  }
  m = en.match(/^(\d+) nights accommodation$/);
  if (m) {
    const n = Number(m[1]);
    return { zh: `住宿 ${n} 晚`, ru: `${ruCount(n, "ночь", "ночи", "ночей")} проживания` };
  }
  m = en.match(/^(\d+) meals$/);
  if (m) return { zh: `${m[1]} 餐`, ru: ruCount(Number(m[1]), "питание", "питания", "питаний") };
  m = en.match(/^Entrance to (\d+) attractions$/);
  if (m) return { zh: `景点门票 ${m[1]} 处`, ru: `Вход на ${m[1]} объектов` };
  m = en.match(/^Return flights on (.+)$/);
  if (m) {
    const air = PACK[m[1]];
    return { zh: `往返机票 ${air?.zh || m[1]}`, ru: `Авиабилеты ${air?.ru || m[1]}` };
  }
  m = en.match(/^(\d+) more meals included$/);
  if (m) return { zh: `多含 ${m[1]} 餐`, ru: `на ${m[1]} питаний больше` };
  m = en.match(/^(\d+) free day\(s\) in the itinerary$/);
  if (m) return { zh: `行程含 ${m[1]} 天自由活动`, ru: `${ruCount(Number(m[1]), "свободный день", "свободных дня", "свободных дней")} в программе` };
  m = en.match(/^(\d+) free days? built in$/);
  if (m) return { zh: `含 ${m[1]} 天自由活动`, ru: `включено ${ruCount(Number(m[1]), "свободный день", "свободных дня", "свободных дней")}` };
  m = en.match(/^(\d+) attractions — a full itinerary$/);
  if (m) return { zh: `${m[1]} 个景点，行程充实`, ru: `${m[1]} объектов — насыщенная программа` };
  m = en.match(/^No compulsory shopping, against (\d+) stops in the cheaper package$/);
  if (m) return { zh: `无强制购物，便宜团有 ${m[1]} 家店`, ru: `Без магазинов, у более дешёвого тура ${m[1]}` };
  m = en.match(/^No misleading wording, against (\d+) flags on the cheaper brochure$/);
  if (m) return { zh: `无误导措辞，便宜团有 ${m[1]} 处需核对`, ru: `Без двусмысленностей, у дешёвого тура ${m[1]} флагов` };
  m = en.match(/^Smaller group of (\d+) against (\d+)$/);
  if (m) return { zh: `小团 ${m[1]} 人，对比 ${m[2]} 人`, ru: `Группа ${m[1]} против ${m[2]}` };
  m = en.match(/^Agency trust (\d+) against (\d+)$/);
  if (m) return { zh: `旅行社信任分 ${m[1]}，对比 ${m[2]}`, ru: `Доверие ${m[1]} против ${m[2]}` };
  m = en.match(/^Named (\d+)-star hotels \((.+)\) instead of (\d+)-star$/);
  if (m) return { zh: `具名 ${m[1]} 星酒店（${m[2]}），对比 ${m[3]} 星`, ru: `Именные отели ${m[1]}★ (${m[2]}) вместо ${m[3]}★` };
  m = en.match(/^Guide and driver tips (.+)$/);
  if (m) return { zh: `导游司机小费 ${m[1]}`, ru: `Чаевые гиду и водителю ${m[1]}` };
  m = en.match(/^Visa fee (.+)$/);
  if (m) return { zh: `签证费 ${m[1]}`, ru: `Виза ${m[1]}` };
  m = en.match(/^Real total cost (.+) is inside your budget$/);
  if (m) return { zh: `真实总价 ${m[1]} 在预算内`, ru: `Реальная цена ${m[1]} в вашем бюджете` };
  m = en.match(/^Paid in full for (\d+) travellers$/);
  if (m) return { zh: `已付清 ${m[1]} 人`, ru: `Оплачено полностью за ${m[1]}` };
}

const PACK: Record<string, XR> = {
  Japan: { zh: "日本", ru: "Япония" },
  Korea: { zh: "韩国", ru: "Корея" },
  China: { zh: "中国", ru: "Китай" },
  Taiwan: { zh: "台湾", ru: "Тайвань" },
  Vietnam: { zh: "越南", ru: "Вьетнам" },
  Europe: { zh: "欧洲", ru: "Европа" },
  Thailand: { zh: "泰国", ru: "Таиланд" },

  "Tokyo · Fuji": { zh: "东京 · 富士", ru: "Токио · Фудзи" },
  "Osaka · Kyoto": { zh: "大阪 · 京都", ru: "Осака · Киото" },
  Hokkaido: { zh: "北海道", ru: "Хоккайдо" },
  "Seoul · Nami": { zh: "首尔 · 南怡岛", ru: "Сеул · Нами" },
  "Busan · Gyeongju": { zh: "釜山 · 庆州", ru: "Пусан · Кёнджу" },
  "Chengdu · Dujiangyan": { zh: "成都 · 都江堰", ru: "Чэнду · Дуцзянъянь" },
  Zhangjiajie: { zh: "张家界", ru: "Чжанцзяцзе" },
  "Taipei · Alishan": { zh: "台北 · 阿里山", ru: "Тайбэй · Алишань" },
  "Chiang Mai · Chiang Rai · Golden Triangle": { zh: "清迈 · 清莱 · 金三角", ru: "Чиангмай · Чианграй · Золотой треугольник" },
  "Chiang Mai · Chiang Rai": { zh: "清迈 · 清莱", ru: "Чиангмай · Чианграй" },
  "Chiang Mai": { zh: "清迈", ru: "Чиангмай" },
  "Chiang Rai": { zh: "清莱", ru: "Чианграй" },
  "Golden Triangle": { zh: "金三角", ru: "Золотой треугольник" },

  "Tokyo Fuji Kawagoe — no shopping stops": { zh: "东京富士川越纯玩无购物", ru: "Токио, Фудзи, Кавагоэ — без магазинов" },
  "Tokyo Fuji budget special": { zh: "东京富士特价团", ru: "Токио и Фудзи — выгодный тур" },
  "Osaka Kyoto Nara — small group of 16": { zh: "大阪京都奈良16人小团", ru: "Осака, Киото, Нара — группа 16 человек" },
  "Hokkaido winter — Sapporo & Otaru": { zh: "北海道札幌小樽冬季团", ru: "Хоккайдо зимой — Саппоро и Отару" },
  "Seoul & Nami Island — value run": { zh: "首尔南怡岛特价团", ru: "Сеул и остров Нами — выгодный тур" },
  "Busan & Gyeongju — no shopping": { zh: "釜山庆州纯玩无购物", ru: "Пусан и Кёнджу — без магазинов" },
  "Chengdu pandas & Dujiangyan": { zh: "成都熊猫都江堰", ru: "Чэнду: панды и Дуцзянъянь" },
  "Zhangjiajie & Tianmen Mountain, 6 days": { zh: "张家界天门山6日", ru: "Чжанцзяцзе и гора Тяньмэнь, 6 дней" },
  "Taipei, Alishan & Jiufen": { zh: "台北阿里山九份", ru: "Тайбэй, Алишань и Цзюфэнь" },
  "Chiang Mai, Chiang Rai & Golden Triangle — no shopping": { zh: "清迈清莱金三角纯玩无购物", ru: "Чиангмай, Чианграй и Золотой треугольник — без магазинов" },
  "Chiang Mai & Chiang Rai value run": { zh: "清迈清莱特价团", ru: "Чиангмай и Чианграй — выгодный тур" },
  "Chiang Mai, White Temple & Golden Triangle — Chinese group": { zh: "清迈白庙金三角华语团", ru: "Чиангмай, Белый храм и Золотой треугольник — китайская группа" },
  "Tokyo Fuji Kawagoe — no shopping": { zh: "东京富士川越纯玩", ru: "Токио Фудзи Кавагоэ — без магазинов" },
  "Zhangjiajie & Tianmen": { zh: "张家界天门山", ru: "Чжанцзяцзе и Тяньмэнь" },
  "Tokyo Fuji no shopping": { zh: "东京富士纯玩", ru: "Токио Фудзи без магазинов" },
  "Zhangjiajie 6D": { zh: "张家界6日", ru: "Чжанцзяцзе 6 дней" },
  "Hokkaido ski 6D (draft)": { zh: "北海道滑雪6日（草稿）", ru: "Хоккайдо лыжи 6 дней (черновик)" },

  "Siam Horizon Tours": { zh: "暹罗地平线旅行社", ru: "Сиам Хорайзон" },
  "Orient Link Travel": { zh: "东方连线旅行社", ru: "Ориент Линк" },
  "Vela Travel Group": { zh: "维拉旅行集团", ru: "Вела Тревел" },
  "Nakara Holiday": { zh: "纳卡拉假期", ru: "Накара Холидей" },
  "Bangkok Jet Tour": { zh: "曼谷捷旅", ru: "Бангкок Джет Тур" },
  "Siam Horizon": { zh: "暹罗地平线", ru: "Сиам Хорайзон" },
  "Bangkok Jet": { zh: "曼谷捷旅", ru: "Бангкок Джет" },
  "Vela Travel": { zh: "维拉旅行", ru: "Вела Тревел" },
  "Siam Horizon Travel Co., Ltd.": { zh: "暹罗地平线旅行有限公司", ru: "Siam Horizon Travel Co., Ltd." },
  "Orient Link Travel Co., Ltd.": { zh: "东方连线旅行有限公司", ru: "Orient Link Travel Co., Ltd." },
  "Vela Travel Group Co., Ltd.": { zh: "维拉旅行集团有限公司", ru: "Vela Travel Group Co., Ltd." },
  "Nakara Holiday Co., Ltd.": { zh: "纳卡拉假期有限公司", ru: "Nakara Holiday Co., Ltd." },
  "Bangkok Jet Tour Co., Ltd.": { zh: "曼谷捷旅有限公司", ru: "Bangkok Jet Tour Co., Ltd." },

  "Thai Airways": { zh: "泰国航空", ru: "Thai Airways" },
  "Thai AirAsia X": { zh: "泰国亚航X", ru: "Thai AirAsia X" },
  "Japan Airlines": { zh: "日本航空", ru: "Japan Airlines" },
  "Jin Air": { zh: "真航空", ru: "Jin Air" },
  "Korean Air": { zh: "大韩航空", ru: "Korean Air" },
  "China Southern": { zh: "中国南方航空", ru: "China Southern" },
  "Thai Vietjet": { zh: "泰国越捷", ru: "Thai Vietjet" },
  "CNX pickup": { zh: "清迈接机", ru: "Встреча в CNX" },
  "CNX drop-off": { zh: "清迈送机", ru: "Трансфер в CNX" },

  "Package price": { zh: "线路价格", ru: "Цена пакета" },
  "Land package price": { zh: "落地团费", ru: "Цена наземного пакета" },
  "Guide & driver tips": { zh: "导游司机小费", ru: "Чаевые гиду и водителю" },
  "Airport tax & fuel surcharge": { zh: "机场税与燃油附加", ru: "Аэропортовый сбор и топливо" },
  "Basic travel insurance": { zh: "基础旅行保险", ru: "Базовая страховка" },
  "Domestic travel insurance": { zh: "境内旅行保险", ru: "Внутренняя страховка" },
  "Seat selection & baggage fee": { zh: "选座与行李费", ru: "Выбор места и багаж" },
  "Mandatory activity: crab buffet": { zh: "强制活动：蟹腿自助", ru: "Обязательно: крабовый буфет" },
  "K-ETA & insurance": { zh: "K-ETA与保险", ru: "K-ETA и страховка" },
  "Winter gear & boot rental": { zh: "防寒装备与雪靴租赁", ru: "Аренда зимней одежды и ботинок" },
  "Tea & leather shops (compulsory)": { zh: "茶叶皮具店（强制）", ru: "Чай и кожа (обязательно)" },
  "Minimum insurance": { zh: "最低保险", ru: "Минимальная страховка" },
  "Travel insurance": { zh: "旅行保险", ru: "Страховка" },

  "Daily travel time": { zh: "每日车程", ru: "Время в дороге" },
  "Early departures": { zh: "早出发", ru: "Ранние выезды" },
  "Stops per day": { zh: "每日景点", ru: "Остановок в день" },
  "Repeated shopping": { zh: "重复购物店", ru: "Повторный шопинг" },
  "Free time": { zh: "自由活动", ru: "Свободное время" },
  "Elderly & child suitability": { zh: "适老适童", ru: "Для пожилых и детей" },
  "Chinese-speaking guide": { zh: "中文导游", ru: "Китаеязычный гид" },
  "Elderly suitability": { zh: "适老程度", ru: "Для пожилых" },
  "Valid licence": { zh: "执照有效", ru: "Лицензия действительна" },
  "Company verified": { zh: "公司已核验", ru: "Компания проверена" },
  "Booking completion": { zh: "预订完成率", ru: "Завершённые брони" },
  "Complaint rate": { zh: "投诉率", ru: "Жалобы" },
  "Refund speed": { zh: "退款速度", ru: "Скорость возврата" },
  "Package accuracy": { zh: "行程准确度", ru: "Точность пакета" },
  "Customer satisfaction": { zh: "客户满意度", ru: "Удовлетворённость" },
  "Response time": { zh: "响应时间", ru: "Время ответа" },
  "Cancellation record": { zh: "取消记录", ru: "Отмены групп" },
  "Confirmed departures": { zh: "确认发团", ru: "Подтверждённые выезды" },

  "Lake Ashi pirate cruise": { zh: "芦之湖海盗船", ru: "Пиратский круиз по озеру Аси" },
  "Disneyland (replaces touring day)": { zh: "迪士尼（替换游览日）", ru: "Диснейленд (вместо дня экскурсий)" },
  "Crab buffet": { zh: "蟹腿自助", ru: "Крабовый буфет" },
  "Kyoto tea ceremony": { zh: "京都茶道", ru: "Чайная церемония в Киото" },
  "Snowmobile, 30 minutes": { zh: "雪地摩托30分钟", ru: "Снегоход, 30 минут" },
  "Everland theme park": { zh: "爱宝乐园", ru: "Эверленд" },
  "Sichuan face-changing show": { zh: "川剧变脸", ru: "Сычуаньская смена масок" },
  "Mekong boat to the Laos bank": { zh: "湄公河游船至老挝岸", ru: "Катер по Меконгу к берегу Лаоса" },
  "Golden Triangle Mekong boat": { zh: "金三角湄公河游船", ru: "Катер по Меконгу, Золотой треугольник" },
  "Fang hot springs": { zh: "芳县温泉", ru: "Горячие источники Фанг" },

  "3-star hotel or equivalent": { zh: "三星或同级酒店", ru: "3 звезды или аналог" },
  "3-star or equivalent": { zh: "三星或同级", ru: "3 звезды или аналог" },
  "Land arrangement · CNX airport pickup": { zh: "落地安排 · 清迈接机", ru: "Наземный пакет · встреча в CNX" },
  "Land arrangement · shopping stops included": { zh: "落地安排 · 含购物店", ru: "Наземный пакет · с магазинами" },
  "Land arrangement · Chinese-speaking guide": { zh: "落地安排 · 中文导游", ru: "Наземный пакет · гид на китайском" },
  "Chinese / English": { zh: "中文 / 英语", ru: "Китайский / английский" },
  Chinese: { zh: "中文", ru: "Китайский" },

  "Free before 45 days · 50% at 30–44 days": { zh: "提前45天全额退 · 30–44天退50%", ru: "Бесплатно за 45 дней · 50% за 30–44 дня" },
  "Free before 60 days · 70% at 30–59 days": { zh: "提前60天全额退 · 30–59天退70%", ru: "Бесплатно за 60 дней · 70% за 30–59 дней" },
  "Free before 45 days · 40% at 21–44 days": { zh: "提前45天全额退 · 21–44天退40%", ru: "Бесплатно за 45 дней · 40% за 21–44 дня" },
  "Free before 40 days · 50% at 20–39 days": { zh: "提前40天全额退 · 20–39天退50%", ru: "Бесплатно за 40 дней · 50% за 20–39 дней" },
  "Free before 30 days · 50% at 15–29 days": { zh: "提前30天全额退 · 15–29天退50%", ru: "Бесплатно за 30 дней · 50% за 15–29 дней" },
  "Free before 21 days · 40% at 8–20 days": { zh: "提前21天全额退 · 8–20天退40%", ru: "Бесплатно за 21 день · 40% за 8–20 дней" },
  "50% before 30 days · non-refundable after": { zh: "提前30天退50% · 之后不退", ru: "50% за 30 дней · далее без возврата" },
  "Non-refundable in all cases": { zh: "任何情况不可退款", ru: "Не возвращается" },
  "Non-refundable": { zh: "不可退款", ru: "Не возвращается" },

  "Elderly friendly": { zh: "适老慢行", ru: "Для пожилых" },
  Luxury: { zh: "奢华", ru: "Люкс" },
  Budget: { zh: "特价", ru: "Бюджет" },
  Adventure: { zh: "探险", ru: "Приключение" },
  Honeymoon: { zh: "蜜月", ru: "Медовый месяц" },
  Festival: { zh: "节庆", ru: "Фестиваль" },
  "Food & culture": { zh: "美食文化", ru: "Еда и культура" },
  Flexible: { zh: "灵活", ru: "Гибко" },
  "October 2026": { zh: "2026年10月", ru: "Октябрь 2026" },
  "November 2026": { zh: "2026年11月", ru: "Ноябрь 2026" },
  "December 2026": { zh: "2026年12月", ru: "Декабрь 2026" },
  Any: { zh: "不限", ru: "Любой" },
  "4–5 days": { zh: "4–5 天", ru: "4–5 дней" },
  "5–6 days": { zh: "5–6 天", ru: "5–6 дней" },
  "6+ days": { zh: "6天以上", ru: "6+ дней" },
  "3–4 days": { zh: "3–4 天", ru: "3–4 дня" },
  "7–9 days": { zh: "7–9 天", ru: "7–9 дней" },
  "10+ days": { zh: "10天以上", ru: "10+ дней" },
  "10+": { zh: "10天以上", ru: "10+ дней" },
  "฿25,000–40,000": { zh: "฿25,000–40,000", ru: "฿25,000–40,000" },
  "฿40,000–60,000": { zh: "฿40,000–60,000", ru: "฿40,000–60,000" },
  "Up to ฿25,000": { zh: "不超过 ฿25,000", ru: "До ฿25,000" },
  "Up to ฿40,000": { zh: "不超过 ฿40,000", ru: "До ฿40,000" },
  "Up to ฿60,000": { zh: "不超过 ฿60,000", ru: "До ฿60,000" },
  "No limit": { zh: "不限", ru: "Без лимита" },
  "All countries": { zh: "全部国家", ru: "Все страны" },
  "All types": { zh: "全部类型", ru: "Все типы" },
  None: { zh: "无", ru: "Нет" },
  meals: { zh: "餐", ru: "питаний" },
  flags: { zh: "需注意", ru: "флаги" },
  Clean: { zh: "通过", ru: "Чисто" },
  "Not required": { zh: "无需签证", ru: "Не требуется" },
  reviews: { zh: "评价", ru: "отзывов" },
  "verified reviews": { zh: "核验评价", ru: "проверенных отзывов" },
  "With connection": { zh: "转机", ru: "С пересадкой" },
  Outbound: { zh: "去程", ru: "Туда" },
  Return: { zh: "回程", ru: "Обратно" },
  "added later": { zh: "后收费用", ru: "добавлено позже" },
  "days to departure": { zh: "天后出发", ru: "дней до выезда" },
  "Searching all inventory": { zh: "搜索全部库存", ru: "Поиск по всему каталогу" },
  "Tour leader and local guide": { zh: "领队与当地导游", ru: "Руководитель группы и местный гид" },
  "Air-conditioned coach throughout": { zh: "全程空调大巴", ru: "Автобус с кондиционером" },
  "Single room supplement ฿6,500": { zh: "单房差 ฿6,500", ru: "Доплата за одноместный номер ฿6,500" },
  "Personal expenses and optional tours": { zh: "个人消费与自费项目", ru: "Личные расходы и доп. экскурсии" },
  "Visa (not required for this destination)": { zh: "签证（本线路无需签证）", ru: "Виза не нужна" },
  "The agency confirms your seats within 24 hours": { zh: "旅行社24小时内确认座位", ru: "Агентство подтвердит места в течение 24 часов" },
  "Upload passport copies in My trips": { zh: "在“我的行程”上传护照复印件", ru: "Загрузите копии паспортов в «Мои поездки»" },
  "Pay the balance 30 days before departure": { zh: "出发前30天付清余款", ru: "Доплатите остаток за 30 дней" },
  "Receive final documents 7 days before departure": { zh: "出发前7天收到最终文件", ru: "Документы за 7 дней до выезда" },

  "Paced for families with children": { zh: "节奏适合带孩子的家庭", ru: "Темп для семей с детьми" },
  "Short walks and lift-served hotels for elderly travellers": { zh: "少走路、酒店有电梯，适合长者", ru: "Короткие прогулки и отели с лифтом" },
  "Suits couples, small group": { zh: "适合情侣、小团", ru: "Для пар, малая группа" },
  "Low daily travel time — a relaxed pace": { zh: "每日车程不长，节奏轻松", ru: "Мало часов в дороге — спокойный темп" },
  "Zero compulsory shopping stops": { zh: "全程无强制购物", ru: "Без обязательных магазинов" },
  "Direct flight, no connection": { zh: "直飞，不转机", ru: "Прямой рейс, без пересадки" },
  "Brochure carries no misleading wording": { zh: "行程无误导措辞", ru: "В брошюре нет двусмысленностей" },
  "1 points to check before booking": { zh: "预订前有 1 处需核对", ru: "1 пункт проверить до брони" },
  "2 points to check before booking": { zh: "预订前有 2 处需核对", ru: "2 пункта проверить до брони" },
  "3 points to check before booking": { zh: "预订前有 3 处需核对", ru: "3 пункта проверить до брони" },
  "4 points to check before booking": { zh: "预订前有 4 处需核对", ru: "4 пункта проверить до брони" },

  "Who is travelling?": { zh: "和谁一起旅行？", ru: "Кто едет?" },
  "Family with children": { zh: "带孩子的家庭", ru: "Семья с детьми" },
  "With elderly travellers": { zh: "有长者", ru: "С пожилыми" },
  "A couple": { zh: "情侣", ru: "Пара" },
  Friends: { zh: "朋友", ru: "Друзья" },
  "Budget per person, all in": { zh: "人均总预算", ru: "Бюджет на человека, всё включено" },
  "When would you go?": { zh: "想什么时候出发？", ru: "Когда поедете?" },
  "December–January": { zh: "12月–1月", ru: "Декабрь–январь" },
  "Preferred pace": { zh: "喜欢的节奏", ru: "Какой темп" },
  "Relaxed, 2–3 stops a day": { zh: "轻松，每天2–3个点", ru: "Спокойно, 2–3 точки в день" },
  Balanced: { zh: "适中", ru: "Средний" },
  "Packed, see everything": { zh: "紧凑，尽量多看", ru: "Насыщенно, увидеть всё" },
  "What matters more?": { zh: "更看重什么？", ru: "Что важнее?" },
  "Sights and nature": { zh: "景点和自然", ru: "Достопримечательности и природа" },
  "Food and culture": { zh: "美食与文化", ru: "Еда и культура" },
  Shopping: { zh: "购物", ru: "Шопинг" },
  "Compulsory shopping stops?": { zh: "能接受强制购物店吗？", ru: "Обязательные магазины?" },
  "None at all": { zh: "完全不要", ru: "Совсем нет" },
  "One or two is fine": { zh: "一两家可以", ru: "Один-два нормально" },
  "Not a problem": { zh: "没问题", ru: "Не проблема" },
  Airline: { zh: "航空", ru: "Авиакомпания" },
  "Full service only": { zh: "只要全服务航空", ru: "Только полный сервис" },
  "Any, if the price is right": { zh: "价格合适即可", ru: "Любая, если цена ок" },
  "Direct flight please": { zh: "希望直飞", ru: "Только прямой рейс" },
  "Do you want a free day?": { zh: "需要自由活动日吗？", ru: "Нужен свободный день?" },
  "At least one": { zh: "至少一天", ru: "Хотя бы один" },
  "Not needed": { zh: "不需要", ru: "Не нужно" },

  "Suvarnabhumi – Haneda": { zh: "素万那普 – 羽田", ru: "Суварнабхуми – Ханэда" },
  "Overnight direct flight; rest on board.": { zh: "夜间直飞，机上休息。", ru: "Ночной прямой рейс; отдых в самолёте." },
  "Tokyo: Asakusa – Skytree – Shinjuku": { zh: "东京：浅草 – 天空树 – 新宿", ru: "Токио: Асакуса – Скайтри – Синдзюку" },
  "Senso-ji, Skytree photo stop, free afternoon in Shinjuku.": { zh: "浅草寺、天空树拍照，下午新宿自由活动。", ru: "Сэнсо-дзи, фото у Скайтри, свободный день в Синдзюку." },
  "Mt Fuji 5th station – Oshino Hakkai – onsen": { zh: "富士山五合目 – 忍野八海 – 温泉", ru: "Фудзи 5-я станция – Осино Хаккай – онсэн" },
  "Fuji 5th station (weather permitting), spring village walk, lakeside onsen stay.": { zh: "视天气上五合目，走忍野八海，湖畔温泉住宿。", ru: "5-я станция Фудзи (по погоде), прогулка у родников, онсэн у озера." },
  "Kawagoe – free day in Tokyo": { zh: "川越 – 东京自由日", ru: "Кавагоэ – свободный день в Токио" },
  "Old-town Kawagoe in the morning, full free afternoon with guide on call.": { zh: "上午川越古城，下午东京自由，导游待命。", ru: "Утром старый Кавагоэ, свободный день, гид на связи." },
  "Haneda – Suvarnabhumi": { zh: "羽田 – 素万那普", ru: "Ханэда – Суварнабхуми" },
  "Evening flight home, arriving Bangkok late.": { zh: "晚间返程，深夜抵达曼谷。", ru: "Вечерний рейс домой, прибытие в Бангкок поздно." },
  "Suvarnabhumi – Narita (red-eye)": { zh: "素万那普 – 成田（红眼）", ru: "Суварнабхуми – Нарита (ночной)" },
  "Check-in 23:30, departure 02:15.": { zh: "23:30值机，02:15起飞。", ru: "Регистрация 23:30, вылет 02:15." },
  "Narita – duty free – Asakusa": { zh: "成田 – 免税店 – 浅草", ru: "Нарита – дьюти-фри – Асакуса" },
  "Morning arrival, 90 minutes at duty free before the temple.": { zh: "早到后先逛免税店90分钟再进寺。", ru: "Утренний прилёт, 90 минут в дьюти-фри до храма." },
  "Fuji 5th station – earthquake museum – Gotemba outlet": { zh: "富士五合目 – 地震馆 – 御殿场奥特莱斯", ru: "Фудзи 5-я – музей землетрясений – Готэмба" },
  "Six hours on the coach with two shopping stops en route.": { zh: "车程约6小时，途中两家购物店。", ru: "Шесть часов в автобусе и два магазина по пути." },
  "Cosmetics shop – Odaiba – crab buffet": { zh: "化妆品店 – 台场 – 蟹腿自助", ru: "Косметика – Одайба – крабовый буфет" },
  "Shopping in the morning, two free hours at Odaiba.": { zh: "上午购物，台场自由两小时。", ru: "Утром магазины, два свободных часа на Одайбе." },
  "Narita – Suvarnabhumi": { zh: "成田 – 素万那普", ru: "Нарита – Суварнабхуми" },
  "Hotel checkout 06:00, flight home 11:15.": { zh: "6:00退房，11:15返程。", ru: "Выезд в 06:00, рейс в 11:15." },
  "Suvarnabhumi – Kansai – Umeda": { zh: "素万那普 – 关西 – 梅田", ru: "Суварнабхуми – Кансай – Умеда" },
  "Morning flight, afternoon arrival, hotel above Osaka station.": { zh: "早飞午到，入住大阪站上酒店。", ru: "Утренний рейс, отель над вокзалом Осаки." },
  "Nara – Osaka Castle": { zh: "奈良 – 大阪城", ru: "Нара – замок Осака" },
  "Todai-ji and deer park, Osaka Castle after lunch; under 4 km walking.": { zh: "东大寺与鹿苑，午后大阪城，步行不超过4公里。", ru: "Тодай-дзи и парк оленей, после обеда замок; меньше 4 км пешком." },
  "Kyoto: Fushimi Inari – Arashiyama": { zh: "京都：伏见稻荷 – 岚山", ru: "Киото: Фусими Инари – Арасияма" },
  "Early shrine visit to beat the crowds, bamboo grove in the afternoon.": { zh: "清晨神社避开人潮，下午竹林。", ru: "Ранний храм без толпы, днём бамбуковая роща." },
  "Kinkaku-ji – Gion – Pontocho": { zh: "金阁寺 – 祇园 – 先斗町", ru: "Кинкаку-дзи – Гион – Понтотё" },
  "Half-day temples, half-day free in the old quarters.": { zh: "半天寺庙，半天古城自由。", ru: "Полдня храмы, полдня свободно в старом городе." },
  "Full free day": { zh: "全日自由活动", ru: "Полный свободный день" },
  "USJ, Kobe or shopping — rail pass provided.": { zh: "可选USJ、神户或购物，含交通卡。", ru: "USJ, Кобе или шопинг — проездной включён." },
  "Kansai – Suvarnabhumi": { zh: "关西 – 素万那普", ru: "Кансай – Суварнабхуми" },
  "Free morning, evening flight home.": { zh: "上午自由，晚间返程。", ru: "Свободное утро, вечерний рейс." },
  "Suvarnabhumi – Chitose (via Tokyo)": { zh: "素万那普 – 千岁（经东京）", ru: "Суварнабхуми – Титосе (через Токио)" },
  "Overnight flight with a Haneda connection.": { zh: "过夜航班，经羽田转机。", ru: "Ночной рейс с пересадкой в Ханэде." },
  "Noboribetsu – Jigokudani valley": { zh: "登别 – 地狱谷", ru: "Ноборибэцу – долина Дзигокудани" },
  "Geothermal valley walk, onsen in the evening.": { zh: "走地热谷，晚上泡温泉。", ru: "Прогулка по термальной долине, вечером онсэн." },
  "Lake Toya – bear park – Otaru": { zh: "洞爷湖 – 熊牧场 – 小樽", ru: "Озеро Тоя – парк медведей – Отару" },
  "Three hours by coach; Otaru canal at dusk with winter lights.": { zh: "车程约3小时，黄昏小樽运河看冬灯。", ru: "Три часа на автобусе; канал Отару в сумерках." },
  "Kokusai ski slope – Sapporo fish market": { zh: "国际滑雪场 – 札幌鱼市场", ru: "Склон Кокусай – рыбный рынок Саппоро" },
  "Half-day snow play, fish market and one shopping stop.": { zh: "半天玩雪，鱼市场和一家购物店。", ru: "Полдня снег, рынок и один магазин." },
  "Free day in Sapporo": { zh: "札幌自由日", ru: "Свободный день в Саппоро" },
  "Full free day — snow festival or Tanukikoji shopping.": { zh: "全日自由：雪祭或狸小路购物。", ru: "Полный день — фестиваль снега или Танукикодзи." },
  "Chitose – Suvarnabhumi": { zh: "千岁 – 素万那普", ru: "Титосе – Суварнабхуми" },
  "Afternoon flight home.": { zh: "下午返程。", ru: "Дневной рейс домой." },
  "Suvarnabhumi – Incheon": { zh: "素万那普 – 仁川", ru: "Суварнабхуми – Инчхон" },
  "Late-night flight.": { zh: "深夜航班。", ru: "Ночной рейс." },
  "Nami Island – theme park": { zh: "南怡岛 – 乐园", ru: "Остров Нами – парк" },
  "Two-hour transfer, walking tour of Nami.": { zh: "车程约2小时，步行游览南怡岛。", ru: "Два часа трансфера, прогулка по Нами." },
  "Gyeongbokgung – Hongdae": { zh: "景福宫 – 弘大", ru: "Кёнбоккун – Хондэ" },
  "Hanbok photos; afternoon herb shop and cosmetics stop.": { zh: "韩服拍照，下午药材店和化妆品店。", ru: "Ханбок, днём травы и косметика." },
  "Seoul Tower – Myeongdong": { zh: "首尔塔 – 明洞", ru: "Сеульская башня – Мёндон" },
  "Seoul Tower, three free hours in Myeongdong.": { zh: "首尔塔，明洞自由三小时。", ru: "Башня и три свободных часа в Мёндоне." },
  "Incheon – Suvarnabhumi": { zh: "仁川 – 素万那普", ru: "Инчхон – Суварнабхуми" },
  "Hotel checkout 05:30.": { zh: "5:30退房。", ru: "Выезд в 05:30." },
  "Suvarnabhumi – Busan": { zh: "素万那普 – 釜山", ru: "Суварнабхуми – Пусан" },
  "Morning flight, evening arrival, Haeundae hotel.": { zh: "早飞晚到，入住海云台酒店。", ru: "Утренний рейс, отель в Хэундэ." },
  "Gyeongju: Bulguksa temple": { zh: "庆州：佛国寺", ru: "Кёнджу: Пульгукса" },
  "Old capital and its UNESCO temple.": { zh: "古都与世界遗产寺庙。", ru: "Древняя столица и храм ЮНЕСКО." },
  "Gamcheon village – Haedong Yonggungsa": { zh: "甘川文化村 – 海东龙宫寺", ru: "Гамчхон – Хэдон Ёнгунса" },
  "Art village and the seaside temple.": { zh: "艺术村与海边寺庙。", ru: "Художественная деревня и храм у моря." },
  "Free day in Busan": { zh: "釜山自由日", ru: "Свободный день в Пусане" },
  "Full free day — Jagalchi market or the beach.": { zh: "全日自由：札嘎其市场或海滩。", ru: "Полный день — рынок Чагальчхи или пляж." },
  "Busan – Suvarnabhumi": { zh: "釜山 – 素万那普", ru: "Пусан – Суварнабхуми" },
  "Free morning, evening flight.": { zh: "上午自由，晚间返程。", ru: "Свободное утро, вечерний рейс." },
  "Suvarnabhumi – Chengdu": { zh: "素万那普 – 成都", ru: "Суварнабхуми – Чэнду" },
  "Late-morning flight; Taikoo Li in the afternoon.": { zh: "上午航班，下午太古里。", ru: "Поздний утренний рейс; днём Тайку Ли." },
  "Panda breeding centre": { zh: "大熊猫繁育基地", ru: "Центр панд" },
  "Early entry while the pandas are active.": { zh: "清晨入园看熊猫活动。", ru: "Ранний вход, пока панды активны." },
  "Dujiangyan – Mt Qingcheng": { zh: "都江堰 – 青城山", ru: "Дуцзянъянь – Цинчэншань" },
  "Ancient irrigation works and Taoist temples; lifts and cable car.": { zh: "古水利与道教寺庙，含电梯与索道。", ru: "Древняя ирригация и даосские храмы; лифты и канатка." },
  "Jinli street – silk shop": { zh: "锦里 – 丝绸店", ru: "Цзиньли – магазин шёлка" },
  "Old quarter and one shopping stop.": { zh: "古街区和一家购物店。", ru: "Старый квартал и один магазин." },
  "Chengdu – Suvarnabhumi": { zh: "成都 – 素万那普", ru: "Чэнду – Суварнабхуми" },
  "Suvarnabhumi – Changsha": { zh: "素万那普 – 长沙", ru: "Суварнабхуми – Чанша" },
  "Red-eye flight, then high-speed rail.": { zh: "红眼航班后转高铁。", ru: "Ночной рейс, затем скоростная железная дорога." },
  "Zhangjiajie park – Tianzi Mountain": { zh: "张家界公园 – 天子山", ru: "Парк Чжанцзяцзе – Тяньцзышань" },
  "Bailong glass lift and the sandstone pillars.": { zh: "百龙观光电梯与石英砂岩柱。", ru: "Стеклянный лифт Байлун и скалы." },
  "Tianmen Mountain – glass walkway": { zh: "天门山 – 玻璃栈道", ru: "Тяньмэнь – стеклянная тропа" },
  "Seven-kilometre cable car and the 999 steps.": { zh: "7公里索道与999级阶梯。", ru: "Канатка 7 км и 999 ступеней." },
  "Grand Canyon – glass bridge": { zh: "大峡谷 – 玻璃桥", ru: "Гранд-каньон – стеклянный мост" },
  "Canyon walk and the long glass bridge.": { zh: "峡谷步行与长玻璃桥。", ru: "Прогулка по каньону и длинный стеклянный мост." },
  "Fenghuang ancient town": { zh: "凤凰古城", ru: "Древний Фэнхуан" },
  "Tuojiang river boat, two shopping stops.": { zh: "沱江游船，两家购物店。", ru: "Лодка по Тоцзян и два магазина." },
  "Changsha – Suvarnabhumi": { zh: "长沙 – 素万那普", ru: "Чанша – Суварнабхуми" },
  "Midday flight home.": { zh: "中午返程。", ru: "Дневной рейс домой." },
  "Suvarnabhumi – Taipei": { zh: "素万那普 – 台北", ru: "Суварнабхуми – Тайбэй" },
  "Morning flight; Taipei 101 in the afternoon.": { zh: "早飞，下午台北101。", ru: "Утренний рейс; днём Taipei 101." },
  "Alishan – cedar forest": { zh: "阿里山 – 神木林", ru: "Алишань – кедровый лес" },
  "Three-hour mountain drive and the cedar trail.": { zh: "上山约3小时，走神木步道。", ru: "Три часа в горы и тропа среди кедров." },
  "Jiufen – Pingxi": { zh: "九份 – 平溪", ru: "Цзюфэнь – Пинси" },
  "Old street and Pingxi sky lanterns.": { zh: "老街与平溪天灯。", ru: "Старая улица и фонари Пинси." },
  "Free day in Taipei": { zh: "台北自由日", ru: "Свободный день в Тайбэе" },
  "Full free day — Ximending and the night markets.": { zh: "全日自由：西门町与夜市。", ru: "Полный день — Симыньдин и ночные рынки." },
  "Taipei – Suvarnabhumi": { zh: "台北 – 素万那普", ru: "Тайбэй – Суварнабхуми" },

  "Arrive Chiang Mai – Doi Suthep": { zh: "抵达清迈 – 双龙寺", ru: "Прибытие в Чиангмай – Дой Сутхеп" },
  "CNX pickup, Doi Suthep and Wat Phra That, hotel in the old-city area.": { zh: "清迈接机，上双龙寺，入住古城酒店。", ru: "Встреча в CNX, Дой Сутхеп, отель у старого города." },
  "Old city – free afternoon": { zh: "古城 – 自由下午", ru: "Старый город – свободный день" },
  "Wat Chedi Luang and the walking street; free afternoon in Nimman.": { zh: "契迪龙寺与步行街，下午宁曼自由。", ru: "Ват Чеди Луанг и пешеходная улица; свободно в Нимман." },
  "Chiang Mai – Chiang Rai White Temple": { zh: "清迈赴清莱 – 白庙", ru: "Чиангмай – Чианграй, Белый храм" },
  "About 3 hours by coach, Wat Rong Khun, no shop stop, evening in Chiang Rai.": { zh: "大巴约3小时，参观白庙不进店，傍晚抵清莱。", ru: "Около 3 часов, Ват Ронг Кхун, без магазинов." },
  "Golden Triangle – Mekong": { zh: "金三角 – 湄公河", ru: "Золотой треугольник – Меконг" },
  "Chiang Saen, Thailand–Laos–Myanmar viewpoint, Mekong boat, Hall of Opium.": { zh: "清盛三国交界、湄公河、鸦片博物馆。", ru: "Чианг Саен, смотровая, катер по Меконгу, музей опиума." },
  "Blue Temple – Black House": { zh: "蓝庙 – 黑屋", ru: "Синий храм – Чёрный дом" },
  "Wat Rong Suea Ten and Baan Dam, free afternoon in Chiang Rai.": { zh: "蓝庙与黑屋，下午清莱自由。", ru: "Синий храм и Баан Дам, свободный день в Чианграе." },
  "Transfer to CNX": { zh: "送机清迈", ru: "Трансфер в CNX" },
  "Return coach to Chiang Mai and airport drop-off.": { zh: "返回清迈并送机。", ru: "Автобус в Чиангмай и трансфер в аэропорт." },
  "Arrive Chiang Mai – tea shop": { zh: "抵清迈 – 茶叶店", ru: "Прибытие в Чиангмай – чайный магазин" },
  "Airport pickup, 90 minutes at a tea shop, short Doi Suthep stop.": { zh: "接机后茶叶店90分钟，再短停双龙寺。", ru: "Встреча, 90 минут в чайном магазине, короткая остановка на Дой Сутхеп." },
  "Leather shop – old city": { zh: "皮具店 – 古城", ru: "Кожа – старый город" },
  "Morning leather factory, afternoon market walk.": { zh: "上午皮具工厂，下午逛市场。", ru: "Утром кожевенная фабрика, днём рынок." },
  "Chiang Rai White Temple – silver shop": { zh: "清莱白庙 – 银器店", ru: "Белый храм – серебро" },
  "Silver shop before Wat Rong Khun.": { zh: "先入银器店再进白庙。", ru: "Магазин серебра до Белого храма." },
  "Herb shop – limited free time": { zh: "药材店 – 有限自由", ru: "Травы – мало свободного времени" },
  "Morning herb clinic, 90 minutes free in the afternoon.": { zh: "上午药材店，下午仅90分钟自由。", ru: "Утром клиника трав, 90 минут свободно." },
  "Airport drop-off": { zh: "送机", ru: "Трансфер в аэропорт" },
  "Early departure to CNX.": { zh: "早出发送清迈机场。", ru: "Ранний выезд в CNX." },
  "CNX pickup, Doi Suthep, night bazaar.": { zh: "接机后上双龙寺，晚上夜市。", ru: "Встреча, Дой Сутхеп, ночной базар." },
  "To Chiang Rai – White Temple": { zh: "赴清莱 – 白庙", ru: "В Чианграй – Белый храм" },
  "Morning departure, Wat Rong Khun, riverside hotel, no shops.": { zh: "早出发，参观白庙，不进店，入住河景酒店。", ru: "Утром выезд, Белый храм, отель у реки, без магазинов." },
  "Chiang Saen, three-country viewpoint, Mekong, Hall of Opium.": { zh: "清盛三国点、湄公河、鸦片博物馆。", ru: "Чианг Саен, три страны, Меконг, музей опиума." },
  "Blue Temple – return Chiang Mai": { zh: "蓝庙 – 返回清迈", ru: "Синий храм – возврат в Чиангмай" },
  "Blue Temple in the morning, return to Chiang Mai in the evening.": { zh: "上午蓝庙，傍晚返回清迈。", ru: "Утром Синий храм, вечером в Чиангмай." },
  "Short free morning, then airport.": { zh: "上午短暂自由后送机。", ru: "Короткое свободное утро, затем аэропорт." },

  "Every day matched the itinerary, no shopping inserted, and the guide looked after my mother who walks slowly.": {
    zh: "每天都按行程走，没有临时进店，导游把走得慢的妈妈照顾得很好。",
    ru: "Каждый день совпал с программой, магазины не вставляли, гид помогал маме.",
  },
  "I chose on real total cost — ฿1,700 more than the other one, but a direct flight and named hotels.": {
    zh: "我按真实总价选的——比另一家贵฿1,700，但直飞而且酒店有真名。",
    ru: "Выбрала по реальной цене — на ฿1,700 дороже, но прямой рейс и названные отели.",
  },
  "The ropeway closed in high wind; the agency arranged a substitute the same morning and told us early.": {
    zh: "缆车因大风关闭，旅行社当天早上就安排了替代并提前告知。",
    ru: "Канатку закрыли из-за ветра; агентство сразу заменило программу.",
  },
  "Chinese guide was clear, no shop stops, White Temple and Golden Triangle matched the brochure.": {
    zh: "中文导游讲解清楚，全程不进店，白庙和金三角与行程一致。",
    ru: "Гид говорил понятно, без магазинов, Белый храм и треугольник как в брошюре.",
  },
  "Unhurried Mekong boat, good riverside hotel, parents could keep the pace.": {
    zh: "湄公河不赶时间，河景酒店舒适，父母跟得上。",
    ru: "Спокойный катер по Меконгу, хороший отель у реки, родители успевали.",
  },
  "Osaka Kyoto · Orient Link": { zh: "大阪京都 · 东方连线", ru: "Осака Киото · Orient Link" },
  "Tokyo Fuji · Siam Horizon": { zh: "东京富士 · 暹罗地平线", ru: "Токио Фудзи · Siam Horizon" },
  "Hokkaido · Vela Travel": { zh: "北海道 · 维拉旅行", ru: "Хоккайдо · Vela Travel" },
  "Chiang Mai Chiang Rai · Siam Horizon": { zh: "清迈清莱 · 暹罗地平线", ru: "Чиангмай Чианграй · Siam Horizon" },
  "Golden Triangle · Nakara": { zh: "金三角 · 纳卡拉", ru: "Золотой треугольник · Nakara" },
  "Piyawan K.": { zh: "Piyawan K.", ru: "Piyawan K." },
  "Thanakrit P.": { zh: "Thanakrit P.", ru: "Thanakrit P." },
  "Arunee S.": { zh: "Arunee S.", ru: "Arunee S." },
  "Lin Wen": { zh: "林雯", ru: "Линь Вэнь" },
  "Chen Jia": { zh: "陈佳", ru: "Чэнь Цзя" },

  "All 3 nights listed as “3-star or equivalent” — no hotel is actually named.": {
    zh: "三晚都只写“三星或同级”，没有真实酒店名。",
    ru: "Все 3 ночи — «3 звезды или аналог», без названий отелей.",
  },
  "Crab buffet is called “optional” but the itinerary requires it.": {
    zh: "蟹腿自助写成“自费”，但行程强制参加。",
    ru: "Крабовый буфет назван «опцией», но в программе он обязателен.",
  },
  "3 shopping stops with no stated duration may cut into sightseeing.": {
    zh: "3家购物店未写停留时间，可能挤占游览。",
    ru: "3 магазина без времени — могут съесть экскурсии.",
  },
  "฿2,000 tip collected at the airport, not in the advertised price.": {
    zh: "小费฿2,000在机场收取，未计入宣传价。",
    ru: "Чаевые ฿2,000 берут в аэропорту, не в рекламной цене.",
  },
  "Mt Moiwa ropeway is weather-dependent with no refund if closed.": {
    zh: "藻岩山缆车视天气而定，关闭不退款。",
    ru: "Канатка Мойва зависит от погоды, при закрытии без возврата.",
  },
  "“Free hanbok” is already priced into the package.": {
    zh: "所谓“免费韩服”已包含在团费里。",
    ru: "«Бесплатный ханбок» уже заложен в цену пакета.",
  },
  "฿1,000 cable car and glass lift are mandatory but excluded from the advertised price.": {
    zh: "缆车和玻璃电梯฿1,000为必付，但未计入宣传价。",
    ru: "Канатка и стеклянный лифт ฿1,000 обязательны, но не в рекламной цене.",
  },
  "The Alishan railway may be replaced by a coach depending on track conditions.": {
    zh: "阿里山森林铁路可能因路况改乘大巴。",
    ru: "Железная дорога Алишань может быть заменена автобусом.",
  },
  "Hotels listed only as “3-star or equivalent” — no names.": {
    zh: "酒店仅写“三星或同级”，无真实店名。",
    ru: "Отели только как «3 звезды или аналог» — без названий.",
  },
  "Four compulsory shops: tea, leather, silver, herbs.": {
    zh: "强制进店4家：茶叶、皮具、银器、药材。",
    ru: "Четыре обязательных магазина: чай, кожа, серебро, травы.",
  },
  "Golden Triangle is an optional extra sold on the coach.": {
    zh: "金三角为车上加购项目。",
    ru: "Золотой треугольник продают в автобусе как доплату.",
  },
  "Passport copies ×3": { zh: "护照复印件 ×3", ru: "Копии паспортов ×3" },
  "Passenger information form": { zh: "旅客信息表", ru: "Анкета пассажиров" },
  "Balance payment": { zh: "余款凭证", ru: "Доплата остатка" },
  "Optional extra insurance": { zh: "额外保险（可选）", ru: "Доп. страховка" },
  "New package": { zh: "新线路", ru: "Новый пакет" },
  bookings: { zh: "笔预订", ru: "брони" },
  departures: { zh: "个团期", ru: "выездов" },
};

function extraFor(en: string): XR | undefined {
  return PACK[en] || dateFill(en) || patternFill(en);
}

export function fillL10n<T extends { th: string; en: string; zh?: string; ru?: string }>(v: T): T {
  const extra = extraFor(v.en);
  if (!extra) return v;
  return { ...v, zh: v.zh || extra.zh, ru: v.ru || extra.ru };
}

export function resolveLoc(v: { th: string; en: string; zh?: string; ru?: string } | string, lang: "th" | "en" | "zh" | "ru"): string {
  if (typeof v === "string") {
    const extra = extraFor(v);
    if (lang === "zh") return extra?.zh || v;
    if (lang === "ru") return extra?.ru || v;
    return v;
  }
  const x = fillL10n(v);
  if (lang === "zh") return x.zh || x.en;
  if (lang === "ru") return x.ru || x.en;
  if (lang === "th") return x.th !== undefined ? x.th : x.en;
  return x.en;
}

const LOC_KEYS = new Set(["th", "en", "zh", "ru"]);

export function hydrateTree(node: unknown): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) hydrateTree(item);
    return;
  }
  const rec = node as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (typeof rec.th === "string" && typeof rec.en === "string" && keys.every((k) => LOC_KEYS.has(k))) {
    const filled = fillL10n(rec as { th: string; en: string; zh?: string; ru?: string });
    if (filled.zh) rec.zh = filled.zh;
    if (filled.ru) rec.ru = filled.ru;
    return;
  }
  for (const val of Object.values(rec)) hydrateTree(val);
}
