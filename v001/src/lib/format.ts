import type { Locale } from "@/lib/i18n/routes";
import type { Localized } from "@/lib/types";

const intlLocale: Record<Locale, string> = { en: "en-GB", el: "el-GR", tr: "tr-TR" };

/** Replace {name} placeholders. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function formatArea(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 1 }).format(value);
}

export function formatPrice(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Athens" }).format(new Date(iso));
}

export function formatRange(min: number | null, max: number | null, locale: Locale, unit = "m²"): string {
  if (min != null && max != null) return `${formatArea(min, locale)}–${formatArea(max, locale)} ${unit}`;
  if (min != null) return `≥ ${formatArea(min, locale)} ${unit}`;
  if (max != null) return `≤ ${formatArea(max, locale)} ${unit}`;
  return "—";
}

export function loc(value: Localized, locale: Locale): string {
  return value[locale] ?? value.en;
}

export function floorLabel(floor: number, locale: Locale, groundWord: string): string {
  if (floor === 0) return groundWord;
  return new Intl.NumberFormat(intlLocale[locale]).format(floor);
}

export function countryNames(locale: Locale): Array<{ code: string; name: string }> {
  const display = new Intl.DisplayNames([intlLocale[locale]], { type: "region" });
  return COUNTRY_CODES.map((code) => ({ code, name: display.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, intlLocale[locale]),
  );
}

/** ISO 3166-1 alpha-2 codes (sovereign states + common territories). */
export const COUNTRY_CODES = "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PS PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TR TT TW TZ UA UG US UY UZ VC VE VN VU WS XK YE ZA ZM ZW".split(" ");
