import { apiError, handle, ok, readJson, requestLocale, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import {
  buildSearchText,
  checkArtisanReferences,
  deleteArtisan,
  getAdminArtisan,
  patchArtisan,
  updateArtisan,
} from "@/lib/services/artisans";
import { artisanPatchSchema, artisanSchema, zodToFieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/artisans/:id — full record (any status). */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const artisan = await getAdminArtisan((await params).id, locale);
  if (!artisan) return apiError("NOT_FOUND", getDictionary(locale).api.notFound);
  return ok(artisan);
});

/** PUT /api/admin/artisans/:id — full update (replaces services & photos). */
export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const t = getDictionary(locale);
  const { id } = await params;

  const body = await readJson(req);
  if (!body || typeof body !== "object") return apiError("BAD_REQUEST", t.api.badRequest);
  const parsed = artisanSchema.safeParse(body);
  if (!parsed.success) return validationError(locale, zodToFieldErrors(parsed.error, locale));

  const { errors, refs } = await checkArtisanReferences(parsed.data, locale);
  if (errors || !refs) return validationError(locale, errors ?? {});

  const updated = await updateArtisan(id, parsed.data, buildSearchText(parsed.data, refs));
  if (!updated) return apiError("NOT_FOUND", t.api.notFound);
  return ok(await getAdminArtisan(id, locale));
});

/** PATCH /api/admin/artisans/:id — quick status (publish/unpublish/archive) or featured toggle. */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const t = getDictionary(locale);
  const body = await readJson(req);
  const parsed = artisanPatchSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(locale, zodToFieldErrors(parsed.error, locale));
  const updated = await patchArtisan((await params).id, parsed.data);
  if (!updated) return apiError("NOT_FOUND", t.api.notFound);
  return ok(updated);
});

/** DELETE /api/admin/artisans/:id */
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const t = getDictionary(requestLocale(req));
  const { id } = await params;
  const deleted = await deleteArtisan(id);
  if (!deleted) return apiError("NOT_FOUND", t.api.notFound);
  return ok({ id, deleted: true });
});
