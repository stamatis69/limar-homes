import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { site } from "@/lib/site";
import { merqonSignature } from "@/lib/merqon";
import { CookieSettingsButton } from "./Dock";

export function Footer({ locale, dict, developments }: { locale: Locale; dict: Dictionary; developments: Array<{ slug: string; name: string }> }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" data-tone="dark">
      <div className="shell">
        <div className="footer-grid">
          <div className="stack-4">
            <p className="wordmark">
              <span className="wordmark-name">LIMAR</span>
              <span className="wordmark-sub">HOMES · ATHENS</span>
            </p>
            <p className="muted">{dict.footer.tagline}</p>
            <address className="contact-lines" style={{ fontStyle: "normal" }}>
              <span>
                {site.office.street}, {site.office.postalCode} {site.office.locality}
              </span>
              <a href={`tel:${site.phone.tel}`}>{site.phone.display}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </address>
          </div>
          <nav aria-labelledby="f-explore">
            <h2 id="f-explore">{dict.footer.explore}</h2>
            <ul>
              {developments.map((d) => (
                <li key={d.slug}>
                  <Link href={href(locale, `/projects/${d.slug}`)}>{d.name}</Link>
                </li>
              ))}
              <li>
                <Link href={href(locale, "/golden-visa/pathfinder")}>{dict.meta.pathfinderTitle}</Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="f-company">
            <h2 id="f-company">{dict.footer.company}</h2>
            <ul>
              <li><Link href={href(locale, "/about")}>{dict.nav.about}</Link></li>
              <li><Link href={href(locale, "/news")}>{dict.nav.insights}</Link></li>
              <li><Link href={href(locale, "/contact")}>{dict.nav.contact}</Link></li>
              <li><a href={site.social.instagram} rel="noopener" target="_blank">Instagram</a></li>
              <li><a href={site.social.linkedin} rel="noopener" target="_blank">LinkedIn</a></li>
              <li><a href={site.social.youtube} rel="noopener" target="_blank">YouTube</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="f-legal">
            <h2 id="f-legal">{dict.footer.legal}</h2>
            <ul>
              <li><Link href={href(locale, "/privacy-policy")}>{dict.footer.privacy}</Link></li>
              <li><CookieSettingsButton label={dict.footer.cookies} /></li>
            </ul>
          </nav>
        </div>
        <div className="footer-titleblock" aria-label={dict.footer.titleBlock}>
          <div>
            <span className="label">{dict.footer.titleBlock}</span>
            <div>© {year} Limar Homes. {dict.footer.rights}</div>
          </div>
          <div>
            <span className="label">{dict.footer.revision}</span>
            <div className="num">{site.revision}</div>
          </div>
          <div>
            <span className="label">{dict.nav.language}</span>
            <div className="num">{locale.toUpperCase()}</div>
          </div>
          <div>
            <span className="label">Credit</span>
            <div>
              <a href={merqonSignature.provider.url} rel="nofollow noopener" target="_blank">
                {merqonSignature.credit}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-mark" data-enter="" aria-hidden="true">
        <span>LIMAR</span>
      </div>
    </footer>
  );
}
