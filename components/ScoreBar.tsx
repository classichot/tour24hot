"use client";

// Thin score bar used for cost breakdowns, quality factors and trust factors.
export default function ScoreBar({
  pct,
  fill = "var(--color-text)",
  track = "var(--color-neutral-300)",
  height = 4,
}: {
  pct: number;
  fill?: string;
  track?: string;
  height?: number;
}) {
  return (
    <svg viewBox="0 0 100 4" preserveAspectRatio="none" style={{ width: "100%", height, display: "block", marginTop: 3 }}>
      <rect x="0" y="0" width="100" height="4" fill={track} />
      <rect x="0" y="0" width={`${pct}`} height="4" fill={fill} />
    </svg>
  );
}
