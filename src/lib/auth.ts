import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SESSION_COOKIE, type Role } from "./constants";
import { apiError, requestLocale } from "./api";
import { getDictionary } from "./i18n";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: Role;
};

const TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 12) || 12;

/** Hash used to keep timing constant when the user doesn't exist (computed once, lazily). */
let dummyHash: string | null = null;
function getDummyHash(): string {
  return (dummyHash ??= bcrypt.hashSync(randomBytes(16).toString("hex"), 12));
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify credentials. Always performs a bcrypt comparison (even for unknown
 * users) so response time doesn't reveal which accounts exist.
 */
export async function verifyCredentials(identifier: string, password: string) {
  const id = identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id }, { username: id }] },
  });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
  return valid && user ? user : null;
}

export async function createSession(userId: string, meta: { userAgent?: string | null; ip?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000);
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ip: meta.ip?.slice(0, 64) ?? null,
    },
  });
  // Opportunistic clean-up of expired sessions.
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

async function sessionFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token || token.length > 200) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const { user } = session;
  return { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role as Role };
}

/** Current user from the session cookie (server components / route handlers). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return sessionFromToken(store.get(SESSION_COOKIE)?.value);
}

/** Delete the session row matching the current cookie (effective invalidation). */
export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/**
 * Guard for /api/admin/* handlers.
 * 401 → no/invalid/expired session · 403 → authenticated but not ADMIN.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ user: SessionUser; error?: undefined } | { user?: undefined; error: Response }> {
  const t = getDictionary(requestLocale(req));
  const user = await getCurrentUser();
  if (!user) return { error: apiError("UNAUTHORIZED", t.api.unauthorized, { headers: { "WWW-Authenticate": "Cookie" } }) };
  if (user.role !== "ADMIN") return { error: apiError("FORBIDDEN", t.api.forbidden) };
  return { user };
}
