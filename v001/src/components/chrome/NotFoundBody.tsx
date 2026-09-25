"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import en from "@/lib/i18n/dictionaries/en";
import el from "@/lib/i18n/dictionaries/el";
import tr from "@/lib/i18n/dictionaries/tr";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";

const dicts = { en, el, tr };

/** Client-side so the [locale] segment stays statically generated (no request headers needed). */
export function NotFoundBody() {
  const pathname = usePathname();
  // First segment is the same in internal (/el/projects/x) and public (/el/erga/x) forms → hydration-safe.
  const first = (pathname ?? "/").split("/")[1] ?? "";
  const locale: Locale = isLocale(first) ? first : "en";
  const dict = dicts[locale];
  const links = [
    { path: "/projects", label: dict.nav.developments },
    { path: "/golden-visa", label: dict.nav.goldenVisa },
    { path: "/contact", label: dict.nav.contact },
    { path: "/", label: dict.meta.siteName },
  ];
  return (
    <section className="shell section">
      <p className="sheet-no">404</p>
      <h1 className="h1" style={{ maxWidth: "16em", marginTop: "var(--s-4)" }}>{dict.notFound.title}</h1>
      <p className="lead" style={{ marginTop: "var(--s-4)" }}>{dict.notFound.body}</p>
      <ul className="plain-list ledger-list" style={{ marginTop: "var(--s-6)", maxWidth: 560 }}>
        {links.map((l) => (
          <li key={l.path}>
            <Link className="link-arrow" style={{ border: 0, padding: "14px 0", display: "flex" }} href={href(locale, l.path)}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
