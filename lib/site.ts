/** Supply the confirmed production origin at build time; never invent a canonical domain. */
export function siteOrigin() {
  const value = process.env.SITE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("SITE_URL must be an HTTP(S) origin.");
  return url.origin;
}

/** WhatsApp business number in international format, digits only (no "+"). */
export const WHATSAPP_NUMBER = "918139886630";
export const WHATSAPP_MESSAGE = "Hi Novahomin, I'd like to talk about a project.";

export function whatsappLink(message: string = WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
