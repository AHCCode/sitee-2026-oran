import { apiError, handle, ok, requestLocale } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — current session user (401 if none). */
export const GET = handle(async (req) => {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", getDictionary(requestLocale(req)).api.unauthorized);
  return ok(user);
});
