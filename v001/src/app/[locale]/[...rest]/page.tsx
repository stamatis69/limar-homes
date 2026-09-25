import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = true;

export const metadata: Metadata = { title: "404 · Limar Homes", robots: { index: false } };

/** Any unmatched localized path renders the localized 404 inside the site chrome. */
export default function CatchAll() {
  notFound();
}
