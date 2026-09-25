import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { LanguageSwitch, MobileMenu, NavLink } from "./HeaderClient";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = [
    { path: "/projects", label: dict.nav.developments, sheet: "A-02" },
    { path: "/golden-visa", label: dict.nav.goldenVisa, sheet: "A-04" },
    { path: "/about", label: dict.nav.about, sheet: "A-05" },
    { path: "/news", label: dict.nav.insights, sheet: "A-07" },
    { path: "/contact", label: dict.nav.contact, sheet: "A-08" },
  ].map((i) => ({ ...i, href: href(locale, i.path) }));

  return (
    <header className="site-header">
      <div className="shell">
        <Link href={href(locale, "/")} className="wordmark" aria-label="Limar Homes — home">
          <span className="wordmark-name">LIMAR</span>
          <span className="wordmark-sub">HOMES · ATHENS</span>
        </Link>
        <nav className="primary-nav" aria-label={dict.nav.primary}>
          <ul>
            {items.map((i) => (
              <li key={i.path}>
                <NavLink href={i.href}>{i.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <LanguageSwitch locale={locale} label={dict.nav.language} />
          <Link className="btn btn--small" href={href(locale, "/enquire")}>
            {dict.nav.enquire}
          </Link>
        </div>
        <MobileMenu items={items} labels={{ menu: dict.nav.menu, close: dict.nav.close, enquire: dict.nav.enquire }} enquireHref={href(locale, "/enquire")} />
      </div>
    </header>
  );
}
