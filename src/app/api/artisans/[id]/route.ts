import { apiError, handle, ok, requestLocale } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { getPublicArtisan } from "@/lib/services/artisans";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/artisans/:id — full public profile + gallery + services + similar artisans. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const locale = requestLocale(req);
  const { id } = await params;
  const artisan = await getPublicArtisan(id, locale);
  if (!artisan) return apiError("NOT_FOUND", getDictionary(locale).api.notFound);
  return ok(artisan);
});
