// Shared inline SVG icons (stroke-based, currentColor).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export const ArrowRight = (p: P) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

export const ChevronLeft = (p: P) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const Check = (p: P) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const X = (p: P) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

export const StarSolid = (p: P) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const Sparkle = (p: P) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </svg>
);

export const ShieldCheck = (p: P) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
);

export const AlertTriangle = (p: P) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5-5 5 5" /><path d="M12 5v12" />
  </svg>
);

export const Spinner = (p: P) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" {...p}>
    <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
  </svg>
);

export const Circle = (p: P) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" {...p}>
    <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" />
  </svg>
);
