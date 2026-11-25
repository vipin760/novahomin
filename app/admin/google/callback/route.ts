import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { exchangeGoogleCode, GOOGLE_CALLBACK_PATH, saveGoogleToken } from "@/lib/mail";
import { originFromHeaders } from "@/lib/request";

const STATE_COOKIE = "nh_google_state";

function done(result: string) {
  // A meta refresh (not a 302) so the next request is same-site and carries the SameSite=Strict
  // admin session cookie, which the cross-site redirect back from Google would otherwise drop.
  const url = `/admin/settings?google=${result}`;
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${url}"><title>Redirecting…</title><p>Finishing up… <a href="${url}">Continue</a></p>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Google redirects here with ?code=…&state=…. Trust comes from the `state` cookie that only an
 * authenticated admin's /admin/google/start sets; the admin session cookie itself is not sent on
 * this cross-site hop.
 */
export async function GET(request: Request) {
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  jar.delete({ name: STATE_COOKIE, path: "/admin/google" });

  const params = new URL(request.url).searchParams;
  const state = params.get("state") ?? "";
  if (!expected || !same(state, expected)) return done("invalid_state");
  if (params.get("error")) return done("denied");
  const code = params.get("code");
  if (!code) return done("exchange_failed");

  try {
    const token = await exchangeGoogleCode(code, `${originFromHeaders(request.headers)}${GOOGLE_CALLBACK_PATH}`);
    await saveGoogleToken(token);
    return done("connected");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    return done(["redirect_uri_mismatch", "no_refresh_token"].includes(reason) ? reason : "exchange_failed");
  }
}
