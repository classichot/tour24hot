import { NextResponse } from "next/server";
import { corsHeaders } from "./tap";

export function tapResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}

export function tapOptions() {
  return new NextResponse(null, { headers: corsHeaders() });
}
