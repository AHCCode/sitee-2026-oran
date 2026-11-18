import { NextResponse } from "next/server";
import { apiError, handle, readJson, requestLocale, validationError } from "@/lib/api";
import { createSession, sessionCookieOptions, verifyCredentials } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema, zodToFieldErrors } from "@/lib/validation";

/**
 * POST /api/auth/login — { identifier (email or username), password }
 * Sets an HTTP-only session cookie. Invalid credentials → generic 401 message.
 */
export const POST = handle(async (req) => {
  const locale = requestLocale(req);
  const t = getDictionary(locale);
  const ip = clientIp(req);

  const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return apiError("TOO_MANY_REQUESTS", t.api.tooManyRequests, { headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const body = await readJson(req);
  const parsed = loginSchema.safeParse(body ?? {});
  if (!parsed.success) return validationError(locale, zodToFieldErrors(parsed.error, locale));

  const user = await verifyCredentials(parsed.data.identifier, parsed.data.password);
  if (!user) return apiError("UNAUTHORIZED", t.api.invalidCredentials);

  resetRateLimit(`login:${ip}`);
  const { token, expiresAt } = await createSession(user.id, { userAgent: req.headers.get("user-agent"), ip });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const res = NextResponse.json(
    {
      data: {
        user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
        expiresAt,
      },
    },
    { status: 200 },
  );
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
