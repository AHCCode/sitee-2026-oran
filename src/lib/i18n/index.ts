import { en } from "./en";
import { fr, type Dictionary } from "./fr";
import type { Locale } from "../constants";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? fr;
}

/** Pick FR/EN variant of a bilingual DB record. */
export function localName(record: { nameFr: string; nameEn: string }, locale: Locale): string {
  return locale === "en" ? record.nameEn : record.nameFr;
}

/** French treats 0 and 1 as singular, English only 1. */
export function plural(count: number, one: string, other: string, locale: Locale = "fr"): string {
  const singular = locale === "fr" ? Math.abs(count) < 2 : count === 1;
  return (singular ? one : other).replace("{count}", formatNumber(count, locale));
}

export function formatDate(date: Date | string, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", opts ?? { dateStyle: "medium" }).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  return formatDate(date, locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR").format(n);
}
