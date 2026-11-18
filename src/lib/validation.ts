import { z, type ZodError, type ZodIssue } from "zod";
import {
  ARTISAN_STATUSES,
  MAX_PHOTOS,
  MAX_SERVICES,
  QUOTE_STATUSES,
  type Locale,
} from "./constants";
import { getDictionary } from "./i18n";
import { fmt } from "./text";

/**
 * Shared (client + server) validation schemas.
 * Custom messages are keys prefixed with "v:" and resolved to the current
 * locale by `zodToFieldErrors`, so the very same schema produces localised
 * field-level errors in the browser and in the 422 API responses.
 */

const requiredText = (min: number, max: number) =>
  z
    .string({ required_error: "v:required", invalid_type_error: "v:invalid" })
    .trim()
    .min(1, "v:required")
    .min(min)
    .max(max);

const optionalText = (max: number) =>
  z
    .string({ invalid_type_error: "v:invalid" })
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const phoneSchema = z
  .string({ required_error: "v:required", invalid_type_error: "v:invalid" })
  .trim()
  .min(1, "v:required")
  .max(25)
  .refine((v) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15, "v:phone");

export const emailSchema = z
  .string({ required_error: "v:required", invalid_type_error: "v:invalid" })
  .trim()
  .min(1, "v:required")
  .max(160)
  .email("v:email")
  .transform((v) => v.toLowerCase());

const idSchema = z.coerce
  .number({ invalid_type_error: "v:select", required_error: "v:select" })
  .int("v:select")
  .positive("v:select");

/* ---------------------------------- Quotes --------------------------------- */

export const quoteCreateSchema = z.object({
  artisanId: z.string({ required_error: "v:required" }).trim().min(1, "v:required").max(64),
  clientName: requiredText(2, 100),
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  subject: requiredText(5, 120),
  description: requiredText(20, 3000),
  budget: optionalText(60),
  consent: z.literal(true, { errorMap: () => ({ message: "v:consent" }) }),
});
export type QuoteCreateInput = z.input<typeof quoteCreateSchema>;

export const quoteUpdateSchema = z
  .object({
    status: z.enum(QUOTE_STATUSES, { errorMap: () => ({ message: "v:select" }) }).optional(),
    internalNotes: z.string({ invalid_type_error: "v:invalid" }).max(5000).optional(),
    forwardedToArtisan: z.boolean({ invalid_type_error: "v:invalid" }).optional(),
  })
  .strict()
  .refine((o) => o.status !== undefined || o.internalNotes !== undefined || o.forwardedToArtisan !== undefined, {
    message: "v:emptyUpdate",
  });
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;

/* --------------------------------- Artisans -------------------------------- */

export function isAllowedPhotoUrl(url: string): boolean {
  return /^\/api\/uploads\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp|gif)$/.test(url) || /^\/images\/[\w\-/]+\.(jpe?g|png|webp|gif|svg)$/.test(url) || /^https:\/\/[^\s"'<>]+$/.test(url);
}

export const artisanSchema = z.object({
  fullName: requiredText(3, 100),
  businessName: optionalText(120),
  categoryId: idSchema,
  countryId: idSchema,
  cityId: idSchema,
  phone: phoneSchema,
  email: emailSchema,
  website: z
    .string({ invalid_type_error: "v:invalid" })
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v), "v:url")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  bio: requiredText(30, 2000),
  yearsExperience: z.coerce
    .number({ invalid_type_error: "v:invalid" })
    .int("v:invalid")
    .min(0)
    .max(70),
  services: z
    .array(z.string({ invalid_type_error: "v:invalid" }).trim().min(2).max(80), {
      required_error: "v:required",
      invalid_type_error: "v:invalid",
    })
    .min(1)
    .max(MAX_SERVICES),
  photos: z
    .array(
      z.object({
        url: z.string().trim().max(500).refine(isAllowedPhotoUrl, "v:photo"),
        caption: optionalText(120),
      }),
      { invalid_type_error: "v:invalid" },
    )
    .max(MAX_PHOTOS)
    .default([]),
  featured: z.boolean({ invalid_type_error: "v:invalid" }).default(false),
  status: z.enum(ARTISAN_STATUSES, { errorMap: () => ({ message: "v:select" }) }),
});
export type ArtisanInput = z.input<typeof artisanSchema>;
export type ArtisanData = z.output<typeof artisanSchema>;

export const artisanPatchSchema = z
  .object({
    status: z.enum(ARTISAN_STATUSES, { errorMap: () => ({ message: "v:select" }) }).optional(),
    featured: z.boolean({ invalid_type_error: "v:invalid" }).optional(),
  })
  .strict()
  .refine((o) => o.status !== undefined || o.featured !== undefined, { message: "v:emptyUpdate" });

/* ----------------------------------- Auth ---------------------------------- */

export const loginSchema = z.object({
  identifier: requiredText(1, 160),
  password: z.string({ required_error: "v:required" }).min(1, "v:required").max(200),
});

/* ------------------------------ Error mapping ------------------------------ */

function issueMessage(issue: ZodIssue, locale: Locale): string {
  const v = getDictionary(locale).validation;
  if (issue.message.startsWith("v:")) {
    const key = issue.message.slice(2) as keyof typeof v;
    return v[key] ?? v.invalid;
  }
  switch (issue.code) {
    case "invalid_type":
      return issue.received === "undefined" || issue.received === "null" ? v.required : v.invalid;
    case "too_small":
      if (issue.type === "string") return fmt(v.min, { min: Number(issue.minimum) });
      if (issue.type === "array") return fmt(v.minItems, { min: Number(issue.minimum) });
      return fmt(v.minValue, { min: Number(issue.minimum) });
    case "too_big":
      if (issue.type === "string") return fmt(v.max, { max: Number(issue.maximum) });
      if (issue.type === "array") return fmt(v.maxItems, { max: Number(issue.maximum) });
      return fmt(v.maxValue, { max: Number(issue.maximum) });
    case "invalid_string":
      if (issue.validation === "email") return v.email;
      if (issue.validation === "url") return v.url;
      return v.invalid;
    case "invalid_enum_value":
    case "invalid_literal":
      return v.select;
    default:
      return v.invalid;
  }
}

/** Convert a ZodError into `{ field: [message] }` (first error per top-level field). */
export function zodToFieldErrors(error: ZodError, locale: Locale): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!out[key]) out[key] = [issueMessage(issue, locale)];
  }
  return out;
}
