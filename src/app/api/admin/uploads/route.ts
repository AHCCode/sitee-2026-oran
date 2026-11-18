import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { apiError, handle, ok, requestLocale } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n";
import { sniffImage, UPLOAD_DIR } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/uploads — multipart/form-data with a `file` field.
 * The real type is detected from magic bytes; files get a random name.
 * Returns { url } usable in an artisan's `photos`.
 */
export const POST = handle(async (req) => {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const t = getDictionary(requestLocale(req));

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) return apiError("PAYLOAD_TOO_LARGE", t.api.uploadSize);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError("BAD_REQUEST", t.api.uploadMissing);
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return apiError("BAD_REQUEST", t.api.uploadMissing);
  if (file.size > MAX_UPLOAD_BYTES) return apiError("PAYLOAD_TOO_LARGE", t.api.uploadSize);

  const buffer = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImage(buffer);
  if (!ext) return apiError("UNSUPPORTED_MEDIA_TYPE", t.api.uploadType);

  const name = `${Date.now().toString(36)}-${randomBytes(9).toString("base64url")}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buffer);

  return ok({ url: `/api/uploads/${name}`, size: file.size, type: ext }, { status: 201 });
});
