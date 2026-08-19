import { invokeTap, originOf, parseTapQuery, tapOk } from "@/lib/tap";
import { tapOptions, tapResponse } from "@/lib/tap-http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return tapOptions();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const args = { ...parseTapQuery(new URL(req.url)), package_id: id };
  const result = invokeTap("get_package", args, originOf(req));
  return tapResponse({ ok: tapOk(result), tool: "get_package", result });
}
