import { NextResponse } from "next/server";
import { handle, requestLocale } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n";

/** POST /api/auth/logout — deletes the server-side session and clears the cookie. */
export const POST = handle(async (req) => {
  await destroyCurrentSession();
  const res = NextResponse.json({ data: { message: getDictionary(requestLocale(req)).api.loggedOut } });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res;
});
