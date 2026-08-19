"use client";

import { useState } from "react";
import { PHOTO } from "@/lib/photos";

export default function PhotoSlot({
  label,
  src,
  className = "",
}: {
  label: string;
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(0);
  const url = !src || failed >= 2 ? null : failed === 1 ? PHOTO.hero : src;

  if (!url) {
    return (
      <div className={`plate absolute inset-0 flex items-center justify-center p-3 ${className}`}>
        <span className="line-clamp-2">{label}</span>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden bg-surface ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailed((n) => n + 1)}
      />
    </div>
  );
}
