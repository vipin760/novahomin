"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  authConfigured,
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@/lib/auth";
import { clientIp, limited } from "@/lib/request";

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) return { error: "Admin login is not configured on this server." };
  if (limited(`login:${clientIp(await headers())}`, 5, 15 * 60_000))
    return { error: "Too many attempts. Please wait 15 minutes and try again." };

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!checkCredentials(username, password)) return { error: "Incorrect username or password." };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    // "/" (not "/admin") so the admin APIs under /api/admin (media library uploads) receive it too.
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete({ name: SESSION_COOKIE, path: "/" });
  jar.delete({ name: SESSION_COOKIE, path: "/admin" }); // sessions issued before the path change
  redirect("/admin/login");
}
