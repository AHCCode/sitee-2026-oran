import { handle, ok, requestLocale } from "@/lib/api";
import { getCountries } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

/** GET /api/countries — all countries. */
export const GET = handle(async (req) => {
  const items = await getCountries(requestLocale(req));
  return ok(items, { meta: { total: items.length } });
});
