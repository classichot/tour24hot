import { invokeTap, originOf, parseTapQuery, tapOk } from "@/lib/tap";
import { tapOptions, tapResponse } from "@/lib/tap-http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return tapOptions();
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    tool?: string;
    name?: string;
    arguments?: Record<string, unknown>;
  };
  const name = body.tool || body.name || "";
  const result = invokeTap(name, body.arguments || {}, originOf(req));
  return tapResponse({ ok: tapOk(result), tool: name, result });
}

export function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("tool") || "";
  const result = invokeTap(name, parseTapQuery(url), originOf(req));
  return tapResponse({ ok: tapOk(result), tool: name, result });
}
