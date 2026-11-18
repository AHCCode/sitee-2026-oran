import { apiError, handle, ok, requestLocale } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { searchParamsToObject } from "@/lib/services/artisans";
import { adminQuoteQuerySchema, listAdminQuotes } from "@/lib/services/quotes";
import { zodToFieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/quotes — filterable list (status, q, forwarded, artisanId, page, pageSize) + per-status counts. */
export const GET = handle(async (req) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const parsed = adminQuoteQuerySchema.safeParse(searchParamsToObject(new URL(req.url).searchParams));
  if (!parsed.success) {
    return apiError("BAD_REQUEST", getDictionary(locale).api.invalidQuery, { fields: zodToFieldErrors(parsed.error, locale) });
  }
  const { items, ...meta } = await listAdminQuotes(parsed.data);
  return ok(items, { meta });
});
