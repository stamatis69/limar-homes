/**
 * Merqon Site Signature — single source of truth.
 *
 * Production rule: MQ-DEV-PENDING is a development placeholder and must never ship.
 * When LIMAR_DEPLOY_ENV=production and no registry-allocated MERQON_SITE_ID is set,
 * the machine-readable provenance layer (meta, headers, /.well-known/merqon.json) is
 * DISABLED. The visible credit is service-accurate and does not depend on the ID.
 */
const DEV_PLACEHOLDER = "MQ-DEV-PENDING";
const allocated = process.env.MERQON_SITE_ID?.trim() || null;
const isProduction = process.env.LIMAR_DEPLOY_ENV === "production";

const validId = allocated && /^MQ-\d{4}-\d{4}$/.test(allocated) ? allocated : null;

export const merqonSignature = {
  siteId: validId ?? (isProduction ? null : DEV_PLACEHOLDER),
  provider: { name: "Merqon Group", url: "https://www.merqongroup.com" },
  domain: "limarhomes.com",
  services: { design: true, development: true, hostingManagement: false, maintenance: false },
  /** Central verification endpoint not yet implemented by Merqon; left null deliberately. */
  verificationUrl: null as string | null,
  credit: "Designed & developed by Merqon Group",
} as const;

/** Provenance layer is emitted only with a real ID, or in non-production with the dev placeholder. */
export const provenanceEnabled = merqonSignature.siteId !== null;
