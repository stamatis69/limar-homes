import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const production = process.env.LIMAR_DEPLOY_ENV === "production";
  return {
    rules: production
      ? [{ userAgent: "*", allow: "/", disallow: ["/api/", "/compare", "/enquire", "/el/sygkrisi", "/el/aitima", "/tr/karsilastir", "/tr/talep"] }]
      : [{ userAgent: "*", disallow: "/" }], // staging/preview builds are never indexed
    sitemap: `${site.url}/sitemap.xml`,
  };
}
