/** Supply the confirmed production origin at build time; never invent a canonical domain. */
export function siteOrigin() {
  const value = process.env.SITE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("SITE_URL must be an HTTP(S) origin.");
  return url.origin;
}
