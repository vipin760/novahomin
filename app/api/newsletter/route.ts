import { dbConfigured } from "@/lib/db";
import { addSubscriber } from "@/lib/store";
import { clientIp, emailPattern, limited, sameOrigin } from "@/lib/request";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (limited(`newsletter:${clientIp(request.headers)}`, 5, 10 * 60_000))
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { email?: unknown; nh_extra_note?: unknown } | null;
  if (body?.nh_extra_note) return Response.json({ ok: true }); // honeypot: bots only
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !emailPattern.test(email))
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });

  if (!dbConfigured()) return Response.json({ error: "Sign-up is not available right now." }, { status: 503 });

  try {
    const added = await addSubscriber(email);
    return Response.json(
      { ok: true, message: added ? "Thanks, you are subscribed." : "This email is already subscribed." },
      { status: 200 },
    );
  } catch {
    return Response.json({ error: "Could not save your subscription. Please try again." }, { status: 500 });
  }
}
