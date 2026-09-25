import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Elevation } from "@/components/Elevation";
import { JsonLd } from "@/components/JsonLd";
import { ChapterHead, Metric, StateMark } from "@/components/ui";
import { AvailabilityExplorer } from "@/components/projects/AvailabilityExplorer";
import { Gallery } from "@/components/projects/Gallery";
import Image from "next/image";
import { TrackView } from "@/components/chrome/Dock";
import { availableCount, getCatalog, getDevelopmentBySlug, unitsFor } from "@/data/catalog";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, locales, type Locale } from "@/lib/i18n/routes";
import { fill, formatRange, loc } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbLd, developmentLd } from "@/lib/structured-data";

/** Unknown slugs render on demand and hit notFound() (clean 404, no internal no-fallback error). */
export const dynamicParams = true;

export function generateStaticParams() {
  return locales.flatMap((locale) => getCatalog().developments.map((d) => ({ locale, slug: d.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const dev = getDevelopmentBySlug(slug);
  if (!isLocale(locale) || !dev) return {};
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: `/projects/${dev.slug}`,
    title: `${dev.name}, ${loc(dev.locality, locale)}`,
    description: `${loc(dev.copy.tagline, locale)} ${dict.status[dev.status]}.`,
    noindex: dev.id === "fixture-stress",
  });
}

export default async function DevelopmentPage({ params }: PageProps<"/[locale]/projects/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const dev = getDevelopmentBySlug(slug);
  if (!dev) notFound();
  const dict = getDictionary(locale);
  const catalog = getCatalog();
  const units = unitsFor(dev.id);
  const available = availableCount(dev);
  const t = dev.unverified;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dev.address.street}, ${dev.address.postalCode ?? ""} ${dev.address.locality}, Greece`)}`;
  const enquire = (extra = "") => href(locale, `/enquire?development=${dev.id}${extra}&source=development`);

  const sections = [
    ["architecture", dict.development.architectureTitle],
    ["residences", dict.development.residencesTitle],
    ["specification", dict.development.specsTitle],
    ["location", dict.development.locationTitle],
    ["investment", dict.development.investmentTitle],
    ...(dev.goldenVisa.limarStatement ? [["golden-visa", dict.development.gvTitle]] : []),
    ["enquire", dict.nav.enquire],
  ] as Array<[string, string]>;

  return (
    <>
      <TrackView event="development_view" developmentId={dev.id} />
      <section className="dev-hero shell" aria-labelledby="dev-title">
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--s-5)" }}>
          <Link href={href(locale, "/")}>Limar Homes</Link> <span aria-hidden="true">/</span>
          <Link href={href(locale, "/projects")}>{dict.development.breadcrumb}</Link> <span aria-hidden="true">/</span>
          <span aria-current="page">{dev.name}</span>
        </nav>
        <div className="dev-hero-grid">
          <div className="dev-hero-copy">
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span className="sheet-no">{dict.common.sheet} {dev.sheet}</span>
              <StateMark status={dev.status} label={dict.status[dev.status]} />
            </div>
            <h1 className="display" id="dev-title" style={{ fontSize: "var(--step-5)", overflowWrap: "anywhere" }}>
              {dev.name}
            </h1>
            <p className="kicker">
              {loc(dev.locality, locale)} · {loc(dev.city, locale)}
            </p>
            <p className="lead">{loc(dev.copy.tagline, locale)}</p>
            <div className="cta-row">
              {dev.status === "selling" ? (
                <>
                  <Link className="btn btn--primary" href={units.length ? "#residences" : enquire("&interest=purchase")}>
                    {units.length ? dict.explorer.title : dict.common.requestInformation} <span className="arrow">→</span>
                  </Link>
                  <Link className="link-arrow" href={enquire("&interest=brochure")}>
                    {dict.common.requestBrochure}
                  </Link>
                </>
              ) : (
                <Link className="btn" href={href(locale, "/projects?status=selling")}>
                  {dict.development.seeCurrent} <span className="arrow">→</span>
                </Link>
              )}
            </div>
          </div>
          {dev.media.hero ? (
            <figure className="hero-photo">
              <Image src={dev.media.hero.src} alt={loc(dev.media.hero.alt, locale)} width={dev.media.hero.width} height={dev.media.hero.height} priority sizes="(max-width: 900px) 100vw, 55vw" />
            </figure>
          ) : (
            <Elevation
              spec={dev.drawing}
              title={`${dev.name} — ${dict.common.schematic}`}
              caption={`${dict.common.sheet} ${dev.sheet} · ${dev.name} · ${dev.drawing.illustrative ? dict.common.illustrative : dict.common.schematic}`}
            />
          )}
        </div>
        <dl className="metrics" style={{ marginTop: "var(--s-7)" }} aria-label={dict.development.metrics}>
          <Metric label={dict.common.units} value={loc(dev.unitsTotalLabel, locale)} tbc={t.includes("unitsTotal")} />
          <Metric label={dict.common.size} value={formatRange(dev.sizeMin, dev.sizeMax, locale)} tbc={t.includes("sizeRange") || t.includes("sizeMax")} />
          <Metric label={dict.common.bedrooms} value={`${dev.bedroomsMin}–${dev.bedroomsMax}`} />
          <Metric label={dict.common.completion} value={loc(dev.completion.label, locale)} tbc={t.includes("completion")} />
          <Metric label={dict.common.energyClass} value={dev.energyClassLabel} tbc={t.includes("energyClass")} />
          {dev.floors != null && <Metric label={dict.common.floors} value={dev.floors} tbc={t.includes("floors")} />}
        </dl>
        {t.length > 0 && (
          <p className="label" style={{ marginTop: "var(--s-3)" }}>
            {dict.development.unverifiedNote}
          </p>
        )}
      </section>

      <nav className="subnav" aria-label={dev.name}>
        <div className="shell">
          <ul>
            {sections.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <section id="architecture" className="section shell" aria-labelledby="h-arch">
        <ChapterHead sheet={`${dev.sheet}.1`} title={dict.development.architectureTitle} id="h-arch" />
        <div className="split">
          <div className="body stack-4">
            <p className="lead" style={{ color: "var(--ink)" }}>{loc(dev.copy.intro, locale)}</p>
            <p>{loc(dev.copy.architecture, locale)}</p>
          </div>
          {dev.media.gallery.length === 0 ? (
            <div className="pending-slot">
              <p className="label">{dict.development.galleryTitle}</p>
              <p>{dict.development.galleryPending}</p>
            </div>
          ) : (
            <Elevation spec={dev.drawing} title={`${dev.name} — ${dict.common.schematic}`} caption={dict.common.schematic} animate={false} />
          )}
        </div>
        {dev.media.gallery.length > 0 && (
          <div style={{ marginTop: "var(--s-7)" }}>
            <Gallery media={dev.media.gallery} locale={locale} labels={dict.development.galleryKinds} />
          </div>
        )}
        <div>
        </div>
      </section>

      <section id="residences" className="section shell" aria-labelledby="h-res" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead
          sheet={`${dev.sheet}.2`}
          title={dict.development.residencesTitle}
          id="h-res"
          lead={units.length > 0 ? dict.explorer.lead : undefined}
        />
        {units.length > 0 ? (
          <AvailabilityExplorer
            locale={locale}
            development={{ id: dev.id, slug: dev.slug, name: dev.name, drawing: dev.drawing }}
            units={units}
            asOf={catalog.inventory.asOf}
            dict={{ explorer: dict.explorer, status: dict.status, common: dict.common, compare: dict.compare }}
          />
        ) : dev.status === "selling" ? (
          <div className="notice">
            <p className="h3">{available == null ? dict.projects.availabilityPending : fill(dict.projects.availabilityCount, { count: available })}</p>
            <p className="muted">{dict.development.residencesPending}</p>
            <div className="cta-row">
              <Link className="btn btn--primary" href={enquire("&interest=purchase")}>
                {dict.development.residencesPendingCta} <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="notice" style={{ borderLeftColor: "var(--ink-2)", background: "rgba(27,26,24,0.04)" }}>
            <p className="h3">{dict.development.soldOutTitle}</p>
            <p className="muted">{dict.development.soldOutBody}</p>
            <div className="cta-row">
              <Link className="btn" href={href(locale, "/projects?status=selling")}>
                {dict.development.seeCurrent} <span className="arrow">→</span>
              </Link>
              <Link className="link-arrow" href={enquire("&interest=general")}>
                {dict.development.notifyFuture}
              </Link>
            </div>
          </div>
        )}
      </section>

      <section id="specification" className="section shell" aria-labelledby="h-spec" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet={`${dev.sheet}.3`} title={dict.development.specsTitle} id="h-spec" />
        <ul className="spec-list plain-list">
          {dev.amenities.map((a) => (
            <li key={a}>{dict.amenities[a]}</li>
          ))}
          <li>
            {dict.common.energyClass}: <span className="num">{dev.energyClassLabel}</span>
            {t.includes("energyClass") && <span className="tbc"> * {dict.common.toBeConfirmed}</span>}
          </li>
        </ul>
        {dev.announcedFeatures && (
          <p className="muted" style={{ marginTop: "var(--s-4)" }}>
            <span className="label">{dict.development.announced}: </span>
            {loc(dev.announcedFeatures, locale)} <span className="tbc">({dict.common.toBeConfirmed})</span>
          </p>
        )}
      </section>

      <section id="location" className="section shell" aria-labelledby="h-loc" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet={`${dev.sheet}.4`} title={dict.development.locationTitle} id="h-loc" />
        <div className="split">
          <p className="body">{loc(dev.copy.location, locale)}</p>
          <dl className="facts">
            <dt className="label">{dict.common.address}</dt>
            <dd>
              {dev.address.street}, {dev.address.postalCode ? `${dev.address.postalCode} ` : ""}
              {loc(dev.locality, locale)}
            </dd>
            <dt className="label">{dict.common.location}</dt>
            <dd>
              <a href={mapsUrl} target="_blank" rel="noopener">
                {dict.common.openInMaps} ↗
              </a>
            </dd>
          </dl>
        </div>
      </section>

      <section id="investment" className="night section" aria-labelledby="h-inv">
        <div className="shell">
          <ChapterHead sheet={`${dev.sheet}.5`} title={dict.development.investmentTitle} id="h-inv" />
          <div className="split">
            <p className="lead">{loc(dev.copy.investment, locale)}</p>
            {dev.goldenVisa.limarStatement && (
              <div id="golden-visa" className="stack-4">
                <h3 className="kicker">{dict.development.gvTitle}</h3>
                <p className="muted">{dict.development.gvStatement}</p>
                <Link className="btn" href={href(locale, "/golden-visa/pathfinder")}>
                  {dict.development.gvCta} <span className="arrow">→</span>
                </Link>
                <p className="label">{dict.common.notLegalAdvice}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="enquire" className="section shell" aria-labelledby="h-enq">
        <div className="finale">
          <div className="stack-4">
            <span className="sheet-no">{dev.sheet}.6</span>
            <h2 className="h1" id="h-enq">{fill(dict.development.enquiryTitle, { name: dev.name })}</h2>
            <p className="lead">{dict.development.enquiryBody}</p>
          </div>
          <div className="cta-row">
            <Link className="btn btn--primary" href={enquire("&interest=purchase")}>
              {dict.common.requestInformation} <span className="arrow">→</span>
            </Link>
            <Link className="btn" href={enquire("&interest=brochure")}>
              {dict.common.requestBrochure}
            </Link>
          </div>
        </div>
      </section>
      <JsonLd
        data={[
          developmentLd(dev, locale),
          breadcrumbLd([
            { name: "Limar Homes", url: href(locale, "/") },
            { name: dict.development.breadcrumb, url: href(locale, "/projects") },
            { name: dev.name, url: href(locale, `/projects/${dev.slug}`) },
          ]),
        ]}
      />
    </>
  );
}
