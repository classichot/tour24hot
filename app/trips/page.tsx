"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { agencyById, pkgById, isInbound, DATA, type DepartureStatus, type L10n } from "@/lib/data";
import { useApp } from "@/lib/store";
import { statusInfo } from "@/lib/helpers";
import { pkgPhoto } from "@/lib/photos";
import PackageCard from "@/components/PackageCard";
import PhotoSlot from "@/components/PhotoSlot";
import ScoreBar from "@/components/ScoreBar";
import InstallButton from "@/components/pwa/InstallButton";
import { usePwa } from "@/lib/pwa";
import { Check, X } from "@/components/icons";

const z = (th: string, en: string, zh: string, ru: string): L10n => ({ th, en, zh, ru });

/** Page copy that has no shared dictionary key yet. */
const C = {
  kicker: z("แอปนักเดินทาง", "Traveler app", "旅客应用", "Приложение путешественника"),
  sub: z(
    "ทุกอย่างของทริปที่จองไว้ในที่เดียว ทั้งการชำระเงิน เอกสาร แผนรายวัน และฝ่ายช่วยเหลือ",
    "Everything for your booked tours in one place: payments, documents, the day-by-day plan and support.",
    "已预订行程的一切都在这里：付款、材料、每日行程与客服。",
    "Всё о забронированных турах в одном месте: оплата, документы, план по дням и поддержка."
  ),
  offline: z(
    "คุณออฟไลน์อยู่ กำลังแสดงข้อมูลที่บันทึกไว้ล่าสุด",
    "You're offline. Showing the copy saved on this device.",
    "当前离线，显示本设备上保存的内容。",
    "Нет сети. Показана копия, сохранённая на этом устройстве."
  ),
  daysToGo: z("วันก่อนออกเดินทาง", "days to departure", "天后出发", "дней до выезда"),
  travelers: z("ผู้เดินทาง", "Travelers", "出行人数", "Путешественники"),
  docsReady: z("เอกสารพร้อมแล้ว", "Documents ready", "材料已备齐", "Документы готовы"),
  dayByDay: z("แผนการเดินทางรายวัน", "Day by day", "每日行程", "План по дням"),
  day: z("วัน", "Day", "天数", "День"),
  plan: z("โปรแกรม", "Plan", "安排", "Программа"),
  meals: z("มื้ออาหาร", "Meals", "餐食", "Питание"),
  hotel: z("โรงแรม", "Hotel", "酒店", "Отель"),
  duration: z("ระยะเวลา", "Duration", "行程天数", "Длительность"),
  guide: z("ไกด์", "Guide", "导游", "Гид"),
  transport: z("การเดินทาง", "Transport", "交通", "Транспорт"),
  group: z("ขนาดกรุ๊ป", "Group size", "团队人数", "Размер группы"),
  upTo: z("ไม่เกิน", "up to", "最多", "до"),
  balance: z("ยอดคงเหลือ", "Balance", "尾款", "Остаток"),
  dueRule: z("ครบกำหนด 30 วันก่อนเดินทาง", "Due 30 days before departure", "需在出发前30天付清", "Оплатить за 30 дней до выезда"),
  operator: z("ผู้จัดทัวร์", "Tour operator", "旅行社", "Туроператор"),
  licence: z("ใบอนุญาต", "Licence", "许可证", "Лицензия"),
  reply: z("ตอบกลับเฉลี่ย", "Typical reply", "平均回复", "Обычно отвечает за"),
  minutes: z("นาที", "min", "分钟", "мин"),
  cancel: z("เงื่อนไขยกเลิก", "Cancellation", "取消政策", "Отмена"),
  noUpcoming: z(
    "ยังไม่มีทริปที่กำลังจะไป",
    "No upcoming trip yet",
    "暂无即将出行的行程",
    "Предстоящих поездок пока нет"
  ),
  savedEmpty: z(
    "ทัวร์ที่คุณบันทึกไว้จะแสดงที่นี่",
    "Tours you save will appear here.",
    "收藏的线路会显示在这里。",
    "Сохранённые туры появятся здесь."
  ),
  trip: z("ทริป", "Trip", "行程", "Поездка"),
  dates: z("วันเดินทาง", "Dates", "日期", "Даты"),
  total: z("ยอดรวม", "Total", "总额", "Итого"),
  completed: z("เดินทางแล้ว", "Completed", "已出行", "Завершена"),
  reviewNote: z(
    "รีวิวได้เพราะจองผ่าน TOUR24",
    "You can review because you booked on TOUR24",
    "通过 TOUR24 预订，可发表评价",
    "Отзыв доступен, так как бронь была на TOUR24"
  ),
};

function SectionHead({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-[21px]">{children}</h2>
      {aside}
    </div>
  );
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-2 border-divider bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3">
        <h3 className="text-[15px]">{title}</h3>
        {aside}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export default function TripsPage() {
  const { t, L, money, saved, inboundMode } = useApp();
  const { online } = usePwa();
  const router = useRouter();

  const deskTrips = DATA.trips.filter((tr) => {
    const p = pkgById(tr.pkg);
    return !!p && isInbound(p) === inboundMode;
  });
  const up = deskTrips.find((tr) => tr.status !== "past");
  const pastTrips = deskTrips.filter((tr) => tr.status === "past");
  const upPkg = up ? pkgById(up.pkg) : undefined;
  const savedList = saved
    .map(pkgById)
    .filter((p): p is NonNullable<typeof p> => !!p && isInbound(p) === inboundMode);

  const browseHref = inboundMode ? "/inbound" : "/search?dir=outbound";
  const browseLabel = inboundMode ? t.navInbound : t.navSearch;

  return (
    <main className="w-full max-w-[1360px] mx-auto px-5 lg:px-10 pb-24">
      <header className="pt-8 pb-6 border-b-2 border-text flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="min-w-0">
          <div className="kicker">{L(C.kicker)}</div>
          <h1 className="mt-1.5 text-[clamp(30px,3.2vw,46px)]">{inboundMode ? t.navInTrips : t.tripsTitle}</h1>
          <p className="mt-2 max-w-[640px] text-[15px] text-neutral-800">{L(C.sub)}</p>
        </div>
        <InstallButton />
      </header>

      {!online && (
        <div role="status" className="mt-5 border-2 border-accent-700 bg-accent-100 px-4 py-2.5 text-[14px] text-accent-800">
          {L(C.offline)}
        </div>
      )}

      {up && upPkg ? (
        <UpcomingTrip trip={up} />
      ) : (
        <div className="mt-8 border-2 border-divider px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-[17px] font-extrabold">{L(C.noUpcoming)}</div>
          <Link href={browseHref} className="btn btn-primary no-underline">
            {browseLabel}
          </Link>
        </div>
      )}

      {/* saved */}
      <section className="mt-14">
        <SectionHead
          aside={
            <Link href={browseHref} className="btn btn-ghost no-underline text-[14px]">
              {browseLabel} →
            </Link>
          }
        >
          {t.tSaved} <span className="text-neutral-600 font-normal">({savedList.length})</span>
        </SectionHead>
        {savedList.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {savedList.map((p) => (
              <PackageCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-divider px-6 py-8 text-[14px] text-neutral-700">{L(C.savedEmpty)}</div>
        )}
      </section>

      {/* past */}
      {pastTrips.length > 0 && (
        <section className="mt-14">
          <SectionHead>{t.tHistory}</SectionHead>
          <div className="border-2 border-divider overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[14px]">
              <thead className="bg-surface">
                <tr className="text-left">
                  <th className="px-5 py-3 font-extrabold">{L(C.trip)}</th>
                  <th className="px-5 py-3 font-extrabold whitespace-nowrap">{L(C.dates)}</th>
                  <th className="px-5 py-3 font-extrabold whitespace-nowrap">{t.bkRef}</th>
                  <th className="px-5 py-3 font-extrabold text-right">{L(C.travelers)}</th>
                  <th className="px-5 py-3 font-extrabold text-right">{L(C.total)}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pastTrips.map((tr) => {
                  const p = pkgById(tr.pkg)!;
                  return (
                    <tr key={tr.ref} className="border-t border-divider align-middle">
                      <td className="px-5 py-4">
                        <div className="font-extrabold">{L(p.title)}</div>
                        <div className="mt-0.5 text-[12px] text-neutral-700">
                          {L(C.completed)} · {L(C.reviewNote)}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">{L(tr.date)}</td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-[13px]">{tr.ref}</td>
                      <td className="px-5 py-4 text-right">{tr.pax}</td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">{money(tr.total)}</td>
                      <td className="px-5 py-4 text-right">
                        <button type="button" className="btn btn-primary whitespace-nowrap" onClick={() => router.push(`/packages/${p.id}`)}>
                          {t.tReview}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function UpcomingTrip({ trip }: { trip: (typeof DATA.trips)[number] }) {
  const { t, L, money } = useApp();
  const router = useRouter();
  const p = pkgById(trip.pkg)!;
  const ag = agencyById(p.agency);
  const st = statusInfo(trip.status as DepartureStatus, t);
  const paidPct = Math.round((trip.paid / trip.total) * 100);
  const docsDone = trip.docs.filter((d) => d.done).length;

  const stats = [
    { v: String(trip.daysAway), l: L(C.daysToGo), hot: true },
    { v: String(trip.pax), l: L(C.travelers) },
    { v: `${paidPct}%`, l: `${t.tPaid} · ${money(trip.paid)}` },
    { v: `${docsDone}/${trip.docs.length}`, l: L(C.docsReady) },
  ];

  const facts = [
    { k: L(C.duration), v: `${p.days} ${t.days} ${p.nights} ${t.nights}` },
    { k: L(C.hotel), v: `${p.hotelStar} ${t.stars}` },
    { k: L(C.guide), v: p.guideLang ? L(p.guideLang) : "—" },
    { k: L(C.transport), v: L(p.airlineName) },
    { k: L(C.group), v: `${L(C.upTo)} ${p.group}` },
  ];

  return (
    <>
      {/* summary strip */}
      <section aria-label={t.tUpcoming} className="mt-7 grid grid-cols-2 lg:grid-cols-4 border-2 border-text">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`px-6 py-5 border-divider ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""}`}
          >
            <div
              className={`font-[family-name:var(--font-heading)] font-extrabold text-[34px] leading-none tracking-[-0.02em] ${s.hot ? "text-accent-700" : ""}`}
            >
              {s.v}
            </div>
            <div className="mt-1.5 text-[13px] text-neutral-700">{s.l}</div>
          </div>
        ))}
      </section>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 flex flex-col gap-12">
          {/* trip */}
          <section>
            <SectionHead>{t.tUpcoming}</SectionHead>
            <article className="border-2 border-text grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="relative min-h-[240px]">
                <PhotoSlot label={L(p.city)} src={pkgPhoto(p.id)} />
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="kicker">
                    {t.bkRef} {trip.ref}
                  </span>
                  <span className={st.cls}>{st.label}</span>
                </div>
                <h3 className="text-[27px] leading-[1.15] [text-wrap:pretty]">{L(p.title)}</h3>
                <div className="text-[14px] text-neutral-800">
                  {L(trip.date)} · {trip.pax} {t.people} · {L(p.city)}
                </div>
                <dl className="mt-2 grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3 border-t border-divider pt-4">
                  {facts.map((f) => (
                    <div key={f.k} className="min-w-0">
                      <dt className="microlabel">{f.k}</dt>
                      <dd className="m-0 mt-0.5 text-[14px] font-semibold">{f.v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto pt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => router.push(`/packages/${p.id}`)}>
                    {t.viewPackage}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => router.push(`/packages/${p.id}`)}>
                    {t.tSupport}
                  </button>
                </div>
              </div>
            </article>
          </section>

          {/* itinerary */}
          <section>
            <SectionHead>{L(C.dayByDay)}</SectionHead>
            <div className="border-2 border-divider overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-[14px]">
                <thead className="bg-surface">
                  <tr className="text-left">
                    <th className="w-[84px] px-5 py-3 font-extrabold">{L(C.day)}</th>
                    <th className="px-5 py-3 font-extrabold">{L(C.plan)}</th>
                    <th className="px-5 py-3 font-extrabold whitespace-nowrap">{L(C.meals)}</th>
                    <th className="px-5 py-3 font-extrabold">{L(C.hotel)}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.itinerary.map((d) => (
                    <tr key={d.d} className="border-t border-divider align-top">
                      <td className="px-5 py-4">
                        <span className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] leading-none text-accent-700">
                          {String(d.d).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold">{L(d.title)}</div>
                        <div className="mt-1 text-[13px] text-neutral-700">{L(d.body)}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">{d.meals}</td>
                      <td className="px-5 py-4">{L(d.hotel)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* side rail */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-[104px]">
          <Card title={t.tPayment} aside={<span className="text-[13px] font-extrabold">{paidPct}%</span>}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-[family-name:var(--font-heading)] font-extrabold text-[24px] leading-none">{money(trip.paid)}</span>
              <span className="text-[13px] text-neutral-700">/ {money(trip.total)}</span>
            </div>
            <div className="mt-3">
              <ScoreBar pct={paidPct} fill="var(--color-accent)" height={6} />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-neutral-700">{L(C.balance)}</span>
              <span className="font-extrabold">{money(trip.total - trip.paid)}</span>
            </div>
            <div className="mt-1 text-[12px] text-neutral-700">{L(C.dueRule)}</div>
          </Card>

          <Card
            title={t.tDocs}
            aside={
              <span className="text-[13px] font-extrabold">
                {docsDone}/{trip.docs.length}
              </span>
            }
          >
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {trip.docs.map((d, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] items-start">
                  {d.done ? (
                    <Check className="flex-none mt-[3px]" stroke="var(--color-accent-700)" />
                  ) : (
                    <X className="flex-none mt-[3px]" stroke="var(--color-neutral-600)" />
                  )}
                  <span className={d.done ? "" : "text-neutral-700"}>{L(d.label)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={L(C.operator)}>
            <div className="font-extrabold text-[16px]">{L(ag.name)}</div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <dt className="text-neutral-700">{L(C.licence)}</dt>
              <dd className="m-0 text-right font-semibold">{ag.licence}</dd>
              <dt className="text-neutral-700">{t.trust}</dt>
              <dd className="m-0 text-right font-semibold">{ag.trust}</dd>
              <dt className="text-neutral-700">{L(C.reply)}</dt>
              <dd className="m-0 text-right font-semibold">
                {ag.response} {L(C.minutes)}
              </dd>
            </dl>
            <div className="mt-4 border-t border-divider pt-3">
              <div className="microlabel">{L(C.cancel)}</div>
              <div className="mt-1 text-[13px]">{L(p.cancel)}</div>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
