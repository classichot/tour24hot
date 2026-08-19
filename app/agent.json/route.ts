import { buildAgentJson, originOf } from "@/lib/tap";
import { tapOptions, tapResponse } from "@/lib/tap-http";

export function OPTIONS() {
  return tapOptions();
}

export function GET(req: Request) {
  return tapResponse(buildAgentJson(originOf(req)));
}
