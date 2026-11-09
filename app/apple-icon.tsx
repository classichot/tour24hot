import { pwaIcon } from "@/lib/pwa-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so draw a full-bleed tile.
export default function AppleIcon() {
  return pwaIcon(180, 0.06);
}
