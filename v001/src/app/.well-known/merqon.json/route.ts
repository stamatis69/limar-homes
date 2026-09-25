import { NextResponse } from "next/server";
import { merqonSignature, provenanceEnabled } from "@/lib/merqon";

/** Machine-readable provenance. Disabled (404) when no valid production Site ID exists. Unsigned: no signing infrastructure yet. */
export function GET() {
  if (!provenanceEnabled || !merqonSignature.siteId) return new NextResponse(null, { status: 404 });
  return NextResponse.json(
    {
      version: 1,
      siteId: merqonSignature.siteId,
      domain: merqonSignature.domain,
      provider: merqonSignature.provider,
      services: merqonSignature.services,
      verification: merqonSignature.verificationUrl,
      signature: null,
      environment: process.env.LIMAR_DEPLOY_ENV === "production" ? "production" : "development",
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
