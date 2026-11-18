import { apiError, handle, ok, requestLocale } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { artisanQuerySchema, searchParamsToObject, searchPublicArtisans } from "@/lib/services/artisans";
import { zodToFieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/artisans — paginated search over PUBLISHED artisans.
 * Query: q, category (slug|id), country (ISO code|id), city (id), sort, featured, page, pageSize
 */
export const GET = handle(async (req) => {
  const locale = requestLocale(req);
  const parsed = artisanQuerySchema.safeParse(searchParamsToObject(new URL(req.url).searchParams));
  if (!parsed.success) {
    return apiError("BAD_REQUEST", getDictionary(locale).api.invalidQuery, {
      fields: zodToFieldErrors(parsed.error, locale),
    });
  }
  const result = await searchPublicArtisans(parsed.data, locale);
  return ok(result.items, {
    meta: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      filters: parsed.data,
    },
  });
});
