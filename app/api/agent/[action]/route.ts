import {
  invokeTap,
  originOf,
  parseTapQuery,
  tapFeed,
  tapMcpManifest,
  tapOk,
  type TapToolName,
} from "@/lib/tap";
import { tapOptions, tapResponse } from "@/lib/tap-http";

export const dynamic = "force-dynamic";

const GET_TOOLS: Record<string, TapToolName> = {
  discover: "discover",
  search: "search",
  availability: "availability",
  price: "get_price",
  quote: "quote",
  status: "status",
  demand: "demand",
  review: "review",
};

const POST_TOOLS: Record<string, TapToolName> = {
  search: "search",
  compare: "compare",
  availability: "availability",
  quote: "quote",
  reserve: "reserve",
  book: "book",
  pay: "pay",
  cancel: "cancel",
  modify: "modify",
  status: "status",
  demand: "demand",
};

export function OPTIONS() {
  return tapOptions();
}

async function bodyArgs(req: Request) {
  const url = new URL(req.url);
  const q = parseTapQuery(url);
  if (req.method === "GET") return q;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const inner =
    body.arguments && typeof body.arguments === "object" ? (body.arguments as Record<string, unknown>) : {};
  const rest = { ...body };
  delete rest.tool;
  delete rest.name;
  delete rest.arguments;
  return { ...q, ...rest, ...inner };
}

export async function GET(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const origin = originOf(req);
  if (action === "mcp") return tapResponse(tapMcpManifest(origin));
  if (action === "feed") return tapResponse(tapFeed());
  if (action === "invoke") {
    const url = new URL(req.url);
    const name = url.searchParams.get("tool") || "";
    const result = invokeTap(name, parseTapQuery(url), origin);
    return tapResponse({ ok: tapOk(result), tool: name, result });
  }
  const tool = GET_TOOLS[action];
  if (!tool) return tapResponse({ error: "unknown_endpoint", path: `/api/agent/${action}` }, 404);
  const result = invokeTap(tool, await bodyArgs(req), origin);
  return tapResponse({ ok: tapOk(result), tool, result });
}

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const origin = originOf(req);
  if (action === "invoke") {
    const body = (await req.json().catch(() => ({}))) as { tool?: string; name?: string; arguments?: Record<string, unknown> };
    const name = body.tool || body.name || "";
    const result = invokeTap(name, body.arguments || {}, origin);
    return tapResponse({ ok: tapOk(result), tool: name, result });
  }
  const tool = POST_TOOLS[action];
  if (!tool) return tapResponse({ error: "unknown_endpoint", path: `/api/agent/${action}` }, 404);
  const result = invokeTap(tool, await bodyArgs(req), origin);
  return tapResponse({ ok: tapOk(result), tool, result });
}
