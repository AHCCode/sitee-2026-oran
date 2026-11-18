import { apiError, handle, ok, readJson, requestLocale, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getAdminQuote, updateQuote } from "@/lib/services/quotes";
import { quoteUpdateSchema, zodToFieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/quotes/:id — full request with status history. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const quote = await getAdminQuote((await params).id, locale);
  if (!quote) return apiError("NOT_FOUND", getDictionary(locale).api.notFound);
  return ok(quote);
});

/** PATCH /api/admin/quotes/:id — { status?, internalNotes?, forwardedToArtisan? } (history is recorded). */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const locale = requestLocale(req);
  const t = getDictionary(locale);
  const { id } = await params;

  const body = await readJson(req);
  if (!body || typeof body !== "object") return apiError("BAD_REQUEST", t.api.badRequest);
  const parsed = quoteUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(locale, zodToFieldErrors(parsed.error, locale));

  const found = await updateQuote(id, parsed.data, auth.user.id);
  if (!found) return apiError("NOT_FOUND", t.api.notFound);
  return ok(await getAdminQuote(id, locale));
});
