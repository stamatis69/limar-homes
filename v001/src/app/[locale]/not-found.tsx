import type { Metadata } from "next";
import { NotFoundBody } from "@/components/chrome/NotFoundBody";

export const metadata: Metadata = { title: "404 · Limar Homes", robots: { index: false } };

export default function NotFound() {
  return <NotFoundBody />;
}
