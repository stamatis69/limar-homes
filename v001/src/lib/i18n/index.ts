import en, { type Dictionary } from "./dictionaries/en";
import el from "./dictionaries/el";
import tr from "./dictionaries/tr";
import type { Locale } from "./routes";

const dictionaries: Record<Locale, Dictionary> = { en, el, tr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
