import { pwaIcon } from "@/lib/pwa-icon";

const VARIANTS: Record<string, { size: number; pad: number }> = {
  "192": { size: 192, pad: 0 },
  "512": { size: 512, pad: 0 },
  maskable: { size: 512, pad: 0.1 },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const v = VARIANTS[variant];
  if (!v) return new Response("Not found", { status: 404 });
  return pwaIcon(v.size, v.pad);
}
