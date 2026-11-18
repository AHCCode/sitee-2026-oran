import { apiError, handle, ok, readJson, requestLocale, validationError } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createQuote } from "@/lib/services/quotes";
import { quoteCreateSchema, zodToFieldErrors } from "@/lib/validation";

/**
 * POST /api/quotes — submit a quote request.
 * 201 { data: { reference, confirmationUrl, ... } } · 422 with field-level errors · 429 when abused.
 */
export const POST = handle(async (req) => {
  const locale = requestLocale(req);
  const t = getDictionary(locale);

  const limit = rateLimit(`quote:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return apiError("TOO_MANY_REQUESTS", t.api.tooManyRequests, { headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const body = await readJson(req);
  if (!body || typeof body !== "object" || Array.isArray(body)) return apiError("BAD_REQUEST", t.api.badRequest);

  // Honeypot: bots fill hidden fields, humans don't.
  const hp = (body as Record<string, unknown>).fax_number;
  if (typeof hp === "string" && hp.trim() !== "") return apiError("BAD_REQUEST", t.api.spam);

  const parsed = quoteCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(locale, zodToFieldErrors(parsed.error, locale));

  const quote = await createQuote(parsed.data, locale);
  if (!quote) return validationError(locale, { artisanId: [t.validation.artisanUnavailable] });

  const confirmationUrl = `/quotes/${quote.reference}?t=${encodeURIComponent(quote.publicToken)}`;
  return ok(
    {
      reference: quote.reference,
      token: quote.publicToken,
      confirmationUrl,
      status: quote.status,
      createdAt: quote.createdAt,
      artisanId: quote.artisanId,
      artisanName: quote.artisanName,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      subject: quote.subject,
      description: quote.description,
      budget: quote.budget,
    },
    { status: 201, headers: { Location: confirmationUrl } },
  );
});
