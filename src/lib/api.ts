import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import type { Locale } from "./constants";
import { getDictionary } from "./i18n";
import { zodToFieldErrors } from "./validation";

/**
 * Uniform JSON envelope for every API route.
 *   success → { data, meta? }
 *   error   → { error: { code, message, fields? } }
 */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

export type FieldErrors = Record<string, string[]>;

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit }) {
  const body: Record<string, unknown> = { data };
  if (init?.meta) body.meta = init.meta;
  return NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  extra?: { fields?: FieldErrors; headers?: HeadersInit },
) {
  const error: Record<string, unknown> = { code, message };
  if (extra?.fields) error.fields = extra.fields;
  return NextResponse.json({ error }, { status: STATUS_BY_CODE[code], headers: extra?.headers });
}

/** Detect the language to use for API messages (cookie → Accept-Language → fr). */
export function requestLocale(req: Request): Locale {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)afm_locale=(fr|en)/);
  if (m) return m[1] as Locale;
  const al = req.headers.get("accept-language") ?? "";
  return al.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function validationError(locale: Locale, fields: FieldErrors) {
  return apiError("VALIDATION_ERROR", getDictionary(locale).api.validation, { fields });
}

/** Safely parse a JSON body; returns undefined if malformed. */
export async function readJson(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

/** Wrap a route handler with a uniform error boundary. */
export function handle<A extends unknown[]>(fn: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    const locale = requestLocale(req);
    const dict = getDictionary(locale);
    try {
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return validationError(locale, zodToFieldErrors(err, locale));
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") return apiError("NOT_FOUND", dict.api.notFound);
        if (err.code === "P2002") return apiError("CONFLICT", dict.api.conflict);
        if (err.code === "P2003") return apiError("BAD_REQUEST", dict.api.badRequest);
      }
      console.error("[api] unhandled error", err);
      return apiError("INTERNAL_ERROR", dict.api.internal);
    }
  };
}
