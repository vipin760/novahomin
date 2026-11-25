import { after } from "next/server";
import { dbConfigured } from "@/lib/db";
import { sendEnquiryEmails } from "@/lib/mail";
import { addEnquiry } from "@/lib/store";
import { clientIp, emailPattern, limited, originFromHeaders, sameOrigin } from "@/lib/request";
import { siteOrigin } from "@/lib/site";

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (limited(`enquiry:${clientIp(request.headers)}`, 5, 10 * 60_000))
    return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });
  if (body.nh_extra_note) {
    // Honeypot: only bots fill this. Answer "ok" so they do not retry, but leave a trace.
    console.warn("Enquiry ignored: honeypot field was filled.");
    return Response.json({ ok: true });
  }

  const name = text(body.name, 100);
  const email = text(body.email, 254);
  const message = text(body.message, 4000);
  if (!name || !emailPattern.test(email) || message.length < 10)
    return Response.json({ error: "Please complete your name, a valid email and a message of at least 10 characters." }, { status: 400 });

  if (!dbConfigured()) return Response.json({ error: "Messages cannot be received right now. Please email us instead." }, { status: 503 });

  try {
    const saved = await addEnquiry({ name, email, phone: text(body.phone, 40), service: text(body.service, 80), message });
    // Emails go out after the response, so a slow or failing mail server never affects the visitor.
    const origin = (() => {
      try {
        return siteOrigin() ?? originFromHeaders(request.headers);
      } catch {
        return originFromHeaders(request.headers);
      }
    })();
    after(() => sendEnquiryEmails(saved, origin));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }
}
