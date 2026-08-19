import { buildTour24Json, originOf } from "@/lib/tap";
import { tapOptions, tapResponse } from "@/lib/tap-http";

export function OPTIONS() {
  return tapOptions();
}

export function GET(req: Request) {
  const url = new URL(req.url);
  const agency = url.searchParams.get("agency") || "siam";
  return tapResponse(buildTour24Json(agency, originOf(req)));
}
