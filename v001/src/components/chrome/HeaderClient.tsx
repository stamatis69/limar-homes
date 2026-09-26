"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { href, locales, resolvePublicPath, type Locale } from "@/lib/i18n/routes";
import { usePublicPath } from "@/lib/client/use-public-path";

const labels: Record<Locale, { short: string; name: string }> = {
  en: { short: "EN", name: "English" },
  el: { short: "ΕΛ", name: "Ελληνικά" },
  tr: { short: "TR", name: "Türkçe" },
};

function internalOf(pathname: string): string {
  const r = resolvePublicPath(pathname);
  return r.kind === "ok" ? r.internalPath : "/";
}

export function NavLink({ href: to, children }: { href: string; children: ReactNode }) {
  const pathname = usePublicPath();
  const active = pathname != null && (pathname === to || (to !== "/" && pathname.startsWith(to + "/")));
  return (
    <Link href={to} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePublicPath();
  const internal = pathname ? internalOf(pathname) : "/";
  return (
    <nav className="lang-switch" aria-label={label}>
      {locales.map((l) => (
        <a key={l} href={href(l, internal)} hrefLang={l} lang={l} aria-current={l === locale ? "true" : undefined} title={labels[l].name}>
          <span aria-hidden="true">{labels[l].short}</span>
          <span className="visually-hidden">{labels[l].name}</span>
        </a>
      ))}
    </nav>
  );
}

export function MobileMenu({
  items,
  labels: l,
  enquireHref,
}: {
  items: Array<{ href: string; label: string; sheet: string }>;
  labels: { menu: string; close: string; enquire: string };
  enquireHref: string;
}) {
  const pathname = usePathname();
  // Menu is open only for the path it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("limar:scroll-lock", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("limar:scroll-lock", { detail: false }));
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
        {open ? l.close : l.menu}
      </button>
      {open && (
        <div id="mobile-nav" className="mobile-nav" data-lenis-prevent="">
          <ul>
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>
                  <span>{i.label}</span>
                  <span className="sheet-no">{i.sheet}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="btn btn--primary" href={enquireHref}>
            {l.enquire} <span className="arrow">→</span>
          </Link>
        </div>
      )}
    </>
  );
}
