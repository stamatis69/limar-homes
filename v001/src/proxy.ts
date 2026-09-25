import { NextResponse, type NextRequest } from "next/server";
import { goneUrls, resolvePublicPath } from "@/lib/i18n/routes";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (goneUrls.includes(pathname.replace(/\/$/, ""))) {
    return new NextResponse(
      '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page removed · Limar Homes</title><body style="font-family:system-ui;padding:3rem;background:#F1ECE3;color:#1B1A18"><h1 style="font-weight:400">This page has been retired.</h1><p><a href="/">Limar Homes</a></p></body></html>',
      { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const resolved = resolvePublicPath(pathname);
  if (resolved.kind === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = resolved.to || "/";
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${resolved.locale}${resolved.internalPath === "/" ? "" : resolved.internalPath}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-limar-locale", resolved.locale);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals, well-known files and files with an extension.
    "/((?!api|_next|\\.well-known|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
