import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const SESSION_COOKIE = "nh_admin";
export const SESSION_SECONDS = 60 * 60 * 8;

/** Admin login needs USER_NAME, USER_PASS and SESSION_SECRET (16+ characters) in .env. */
export const authConfigured = () =>
  Boolean(process.env.USER_NAME && process.env.USER_PASS && (process.env.SESSION_SECRET?.length ?? 0) >= 16);

const digest = (value: string) => createHash("sha256").update(value).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function checkCredentials(username: string, password: string) {
  if (!authConfigured()) return false;
  // Both comparisons always run so timing does not reveal which field was wrong.
  const userOk = safeEqual(username, process.env.USER_NAME!);
  const passOk = safeEqual(password, process.env.USER_PASS!);
  return userOk && passOk;
}

const sign = (payload: string) => createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("base64url");

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verify(token: string | undefined) {
  if (!token || !authConfigured()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    return Number(JSON.parse(Buffer.from(payload, "base64url").toString()).exp) > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin() {
  // Expiry compares against the current time, which Cache Components forbids during
  // prerender/prefetch. Opting into request time first keeps this check dynamic-only.
  await connection();
  return verify((await cookies()).get(SESSION_COOKIE)?.value);
}
