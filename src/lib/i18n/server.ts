import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "../constants";
import { getDictionary } from ".";

/** Resolve the UI locale on the server: cookie → Accept-Language → default (fr). */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value === "fr" || value === "en") return value;
  const accept = (await headers()).get("accept-language") ?? "";
  if (accept.toLowerCase().startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
