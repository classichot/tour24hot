"use client";

import { useApp } from "@/lib/store";
import { usePwa } from "@/lib/pwa";
import type { L10n } from "@/lib/data";
import { Check } from "@/components/icons";

const z = (th: string, en: string, zh: string, ru: string): L10n => ({ th, en, zh, ru });

const C = {
  install: z("ติดตั้งแอป", "Install app", "安装应用", "Установить приложение"),
  why: z(
    "เปิดในหน้าต่างของตัวเอง ดูทริปได้แม้ออฟไลน์",
    "Opens in its own window. Your trips stay available offline.",
    "在独立窗口打开，离线也能查看行程。",
    "Открывается в отдельном окне, поездки доступны офлайн."
  ),
  installed: z("ติดตั้งแอปแล้ว", "Installed app", "已安装应用", "Приложение установлено"),
  offlineReady: z("พร้อมใช้งานออฟไลน์", "Available offline", "可离线查看", "Доступно офлайн"),
  ios: z(
    "ติดตั้งบน iPhone/iPad: แชร์ → เพิ่มลงในหน้าจอโฮม",
    "On iPhone or iPad: Share → Add to Home Screen",
    "iPhone/iPad 安装：分享 → 添加到主屏幕",
    "На iPhone/iPad: Поделиться → На экран «Домой»"
  ),
  menu: z(
    "ติดตั้งเป็นแอปได้จากเมนูของเบราว์เซอร์",
    "Install it as an app from your browser menu",
    "可通过浏览器菜单安装为应用",
    "Установите как приложение через меню браузера"
  ),
};

export default function InstallButton() {
  const { L } = useApp();
  const { canInstall, installed, offlineReady, ios, install } = usePwa();

  const ready = offlineReady && (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-accent-800">
      <Check width={13} height={13} stroke="var(--color-accent-700)" />
      {L(C.offlineReady)}
    </span>
  );

  if (installed) {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <span className="tag tag-accent font-extrabold">{L(C.installed)}</span>
        {ready}
      </div>
    );
  }

  return (
    <div className="flex max-w-[300px] flex-col items-start gap-1.5 sm:items-end sm:text-right">
      {canInstall ? (
        <>
          <button type="button" className="btn btn-primary" onClick={install}>
            {L(C.install)}
          </button>
          <span className="text-[12px] text-neutral-700">{L(C.why)}</span>
        </>
      ) : (
        <span className="text-[12px] text-neutral-700">{L(ios ? C.ios : C.menu)}</span>
      )}
      {ready}
    </div>
  );
}
