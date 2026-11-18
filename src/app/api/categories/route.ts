import { handle, ok, requestLocale } from "@/lib/api";
import { getCategoriesWithCounts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

/** GET /api/categories — all trades with their number of PUBLISHED artisans. */
export const GET = handle(async (req) => {
  const items = await getCategoriesWithCounts(requestLocale(req));
  return ok(items, { meta: { total: items.length } });
});
