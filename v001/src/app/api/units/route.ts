import { NextResponse, type NextRequest } from "next/server";
import { resolveUnits } from "@/data/catalog";

export const dynamic = "force-dynamic";

/** Resolve stored unit IDs against current canonical data. Never cached: availability must be live. */
export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 12);
  if (ids.some((id) => id.length > 80 || !/^[\w.:-]+$/.test(id))) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }
  return NextResponse.json(resolveUnits(ids), { headers: { "Cache-Control": "no-store" } });
}
