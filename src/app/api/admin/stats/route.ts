import { handle, ok, requestLocale } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — dashboard KPIs, monthly series, country distribution, latest requests. */
export const GET = handle(async (req) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  return ok(await getAdminStats(requestLocale(req)));
});
