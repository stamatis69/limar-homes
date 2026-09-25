import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/i18n/routes";

const deployEnv = process.env.LIMAR_DEPLOY_ENV ?? "development";
if (deployEnv === "production" && process.env.LIMAR_INVENTORY === "fixture") {
  throw new Error(
    "Refusing to build: LIMAR_INVENTORY=fixture (demonstration inventory) cannot be deployed to production.",
  );
}

/**
 * Security headers. CSP is strict: no third-party script origins are used by this site.
 * 'unsafe-inline' for styles is required by Next's inline style injection; scripts use 'self' plus
 * inline bootstrap which Next emits. Tighten with nonces if a proxy-based nonce setup is adopted.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return legacyRedirects.map((r) => ({ ...r, permanent: true }));
  },
  async headers() {
    const headers = [
      { key: "Content-Security-Policy", value: csp },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    ];
    // Merqon provenance header: only with a registry-allocated Site ID (never the dev placeholder in production).
    const merqonId = process.env.MERQON_SITE_ID?.trim();
    if (merqonId && /^MQ-\d{4}-\d{4}$/.test(merqonId)) headers.push({ key: "X-Merqon-Site-ID", value: merqonId });
    if (deployEnv === "production") {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
