import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { GOOGLE_CALLBACK_PATH, googleAuthUrl, googleClient } from "@/lib/mail";
import { originFromHeaders } from "@/lib/request";

export const STATE_COOKIE = "nh_google_state";

/** Starts the Gmail consent flow. Admin only; a random `state` guards the callback against CSRF. */
export async function GET(request: Request) {
  const origin = originFromHeaders(request.headers);
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", origin));
  if (!googleClient()) return NextResponse.redirect(new URL("/admin/settings?google=missing", origin));

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(googleAuthUrl(`${origin}${GOOGLE_CALLBACK_PATH}`, state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    // Lax so the cookie survives Google's redirect back to us (Strict would drop it).
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/google",
    maxAge: 600,
  });
  return response;
}
