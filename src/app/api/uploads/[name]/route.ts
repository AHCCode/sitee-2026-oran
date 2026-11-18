import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiError, requestLocale } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { IMAGE_MIME, UPLOAD_DIR, UPLOAD_NAME_RE } from "@/lib/uploads";

type Ctx = { params: Promise<{ name: string }> };

/** GET /api/uploads/:name — serve uploaded artisan photos (strict filename whitelist, no traversal). */
export async function GET(req: Request, { params }: Ctx) {
  const { name } = await params;
  const t = getDictionary(requestLocale(req));
  if (!UPLOAD_NAME_RE.test(name)) return apiError("NOT_FOUND", t.api.notFound);
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    const ext = name.split(".").pop()!;
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": IMAGE_MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return apiError("NOT_FOUND", t.api.notFound);
  }
}
