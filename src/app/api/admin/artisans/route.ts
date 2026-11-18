import { apiError, handle, ok, readJson, requestLocale, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import {
  adminArtisanQuerySchema,
  buildSearchText,
  checkArtisanReferences,
  createArtisan,
  getAdminArtisan,
  listAdminArtisans,
  searchParamsToObject,
} from "@/lib/services/artisans";
import { artisanSchema, zodToFieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/artisans — filterable, paginated list (q, category, country, status, page, pageSize). */
export const GET = handle(async (req) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const parsed = adminArtisanQuerySchema.safeParse(searchParamsToObject(new URL(req.url).searchParams));
  if (!parsed.success) {
    return apiError("BAD_REQUEST", getDictionary(locale).api.invalidQuery, { fields: zodToFieldErrors(parsed.error, locale) });
  }
  const { items, ...meta } = await listAdminArtisans(parsed.data, locale);
  return ok(items, { meta });
});

/** POST /api/admin/artisans — create an artisan (server-side validated). */
export const POST = handle(async (req) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const t = getDictionary(locale);

  const body = await readJson(req);
  if (!body || typeof body !== "object") return apiError("BAD_REQUEST", t.api.badRequest);
  const parsed = artisanSchema.safeParse(body);
  if (!parsed.success) return validationError(locale, zodToFieldErrors(parsed.error, locale));

  const { errors, refs } = await checkArtisanReferences(parsed.data, locale);
  if (errors || !refs) return validationError(locale, errors ?? {});

  const created = await createArtisan(parsed.data, buildSearchText(parsed.data, refs));
  const artisan = await getAdminArtisan(created.id, locale);
  return ok(artisan, { status: 201, headers: { Location: `/api/admin/artisans/${created.id}` } });
});
