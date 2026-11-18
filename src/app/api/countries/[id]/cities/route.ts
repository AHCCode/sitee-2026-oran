import { apiError, handle, ok, requestLocale } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { getCitiesOfCountry } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/countries/:id/cities — cities of a country (for cascading dropdowns). */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const t = getDictionary(requestLocale(req));
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return apiError("BAD_REQUEST", t.api.badRequest, { fields: { id: [t.validation.invalid] } });
  const cities = await getCitiesOfCountry(Number(id));
  if (!cities) return apiError("NOT_FOUND", t.api.notFound);
  return ok(cities, { meta: { total: cities.length, countryId: Number(id) } });
});
