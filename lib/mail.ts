import "server-only";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { getDb, iso } from "./db";
import { limited } from "./request";
import { decrypt, encrypt } from "./secret";
import { getSmtp, settings, smtpTransportOptions } from "./smtp";
import type { Enquiry } from "./store";

const COMPANY = "Novahomin";
const clean = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/* ---------- Google (Gmail OAuth2) ---------- */

export const GOOGLE_SCOPE = "https://mail.google.com/";
export const GOOGLE_CALLBACK_PATH = "/admin/google/callback";

/** An env value that is set to something real (blank and copy-pasted `your_…` placeholders count as unset). */
const real = (value: string | undefined) => (value && !/^your[-_]/i.test(value.trim()) ? value.trim() : undefined);

/** Client credentials and the sending account come from the environment, never the browser. */
export function googleClient() {
  const user = real(process.env.EMAIL_USER);
  const clientId = real(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = real(process.env.GOOGLE_CLIENT_SECRET);
  return user && clientId && clientSecret ? { user, clientId, clientSecret } : null;
}

/**
 * The token saved by the admin "Connect Gmail" flow wins: it was issued for exactly this client and
 * is the most recent deliberate action. GOOGLE_REFRESH_TOKEN is the fallback, e.g. for a fresh deploy.
 */
async function refreshToken(): Promise<{ token: string; source: "env" | "admin" } | null> {
  const row = (await (await settings()).findOne({ _id: "google" })) as { refreshEnc?: string } | null;
  if (row?.refreshEnc) {
    try {
      return { token: decrypt(row.refreshEnc, "google"), source: "admin" };
    } catch {
      /* SESSION_SECRET changed: fall through to the env token */
    }
  }
  const fromEnv = real(process.env.GOOGLE_REFRESH_TOKEN);
  return fromEnv ? { token: fromEnv, source: "env" } : null;
}

export async function googleStatus() {
  const client = googleClient();
  const token = client ? await refreshToken() : null;
  return { configured: Boolean(client), user: client?.user ?? "", connected: Boolean(token), source: token?.source ?? null };
}

export async function saveGoogleToken(token: string) {
  await (await settings()).updateOne({ _id: "google" }, { $set: { refreshEnc: encrypt(token, "google"), connectedAt: new Date() } as never }, { upsert: true });
}

export async function clearGoogleToken() {
  await (await settings()).deleteOne({ _id: "google" });
}

export function googleAuthUrl(redirectUri: string, state: string) {
  const client = googleClient();
  if (!client) throw new Error("Google client is not configured.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline", // required to receive a refresh token
    prompt: "consent", // forces a refresh token even if consent was granted before
    login_hint: client.user,
    state,
  }).toString();
  return url.toString();
}

/** Exchanges the authorisation code for a refresh token. Throws a safe, user-facing message. */
export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const client = googleClient();
  if (!client) throw new Error("Google client is not configured.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await response.json().catch(() => ({}))) as { refresh_token?: string; error?: string };
  if (!response.ok) throw new Error(data.error === "redirect_uri_mismatch" ? "redirect_uri_mismatch" : "exchange_failed");
  if (!data.refresh_token) throw new Error("no_refresh_token");
  return data.refresh_token;
}

/* ---------- Provider selection ---------- */

export type Mailer = { provider: "gmail" | "smtp"; from: string; send: (message: Mail.Options) => Promise<unknown> };

/** Gmail OAuth2 when fully configured, otherwise the SMTP fallback, otherwise null. */
export async function resolveMailer(): Promise<Mailer | null> {
  const client = googleClient();
  const token = client ? await refreshToken() : null;
  if (client && token) {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { type: "OAuth2", user: client.user, clientId: client.clientId, clientSecret: client.clientSecret, refreshToken: token.token },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
    return { provider: "gmail", from: `${COMPANY} <${client.user}>`, send: (m) => transport.sendMail(m) };
  }
  const smtp = await smtpTransportOptions();
  if (!smtp) return null;
  const transport = nodemailer.createTransport(smtp.options);
  return { provider: "smtp", from: smtp.from, send: (m) => transport.sendMail(m) };
}

/* ---------- Logging and delivery ---------- */

export type EmailLog = {
  id: string;
  kind: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  attempts: number;
  error: string;
  createdAt: string;
};

let logIndexed = false;
async function logs() {
  const collection = (await getDb()).collection("emailLogs");
  if (!logIndexed) {
    logIndexed = true;
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }).catch(() => undefined);
  }
  return collection;
}

export async function recentEmailLogs(limit = 8): Promise<EmailLog[]> {
  const rows = await (await logs()).find().sort({ createdAt: -1 }).limit(limit).toArray();
  return rows.map((row) => ({
    id: row._id.toString(),
    kind: String(row.kind ?? ""),
    to: String(row.to ?? ""),
    subject: String(row.subject ?? ""),
    status: row.status === "sent" ? "sent" : "failed",
    attempts: Number(row.attempts ?? 1),
    error: String(row.error ?? ""),
    createdAt: iso(row.createdAt),
  }));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Up to 3 attempts with backoff; every outcome is logged. Never throws. */
async function deliver(mailer: Mailer, kind: string, message: Mail.Options) {
  const waits = [0, 1500, 4000];
  let error = "";
  let attempts = 0;
  for (const wait of waits) {
    if (wait) await sleep(wait);
    attempts += 1;
    try {
      await mailer.send(message);
      error = "";
      break;
    } catch (caught) {
      error = caught instanceof Error ? caught.message.slice(0, 300) : "Unknown error";
      if (/invalid_grant/i.test(error)) {
        error = "Google rejected the refresh token (expired or revoked). Use Reconnect Gmail in Email & alerts.";
        break; // retrying cannot fix a revoked token
      }
    }
  }
  try {
    await (await logs()).insertOne({
      kind,
      to: String(Array.isArray(message.to) ? message.to.join(", ") : message.to ?? ""),
      subject: String(message.subject ?? ""),
      status: error ? "failed" : "sent",
      attempts,
      error,
      createdAt: new Date(),
    });
  } catch {
    /* logging must never break delivery */
  }
  if (error) console.error(`Email (${kind}) failed after ${attempts} attempts:`, error);
  return !error;
}

/* ---------- Templates ---------- */

const shell = (title: string, body: string) =>
  `<!doctype html><html><body style="margin:0;background:#f5f6fa;font-family:Arial,Helvetica,sans-serif;color:#12131f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e8eaf1;border-radius:12px">
<tr><td style="padding:20px 28px;border-bottom:1px solid #e8eaf1;font-weight:700;font-size:18px;color:#6d28d9">${COMPANY}</td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>${body}</td></tr>
</table></td></tr></table></body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 16px 6px 0;color:#6b7085;font-size:14px;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;font-size:14px">${value}</td></tr>`;

function adminMessage(enquiry: Enquiry, adminUrl: string) {
  const when = new Date(enquiry.createdAt).toUTCString();
  const html = shell(
    "New enquiry received",
    `<table role="presentation" cellpadding="0" cellspacing="0">
${row("Name", esc(enquiry.name))}
${row("Email", `<a href="mailto:${esc(enquiry.email)}">${esc(enquiry.email)}</a>`)}
${row("Phone", esc(enquiry.phone || "-"))}
${row("Service", esc(enquiry.service || "-"))}
${row("Received", esc(when))}
</table>
<p style="margin:20px 0 6px;color:#6b7085;font-size:14px">Project description</p>
<p style="margin:0;padding:14px;background:#f5f6fa;border-radius:8px;font-size:14px;line-height:1.55;white-space:pre-wrap">${esc(enquiry.message)}</p>
<p style="margin:24px 0 0"><a href="${esc(adminUrl)}" style="display:inline-block;padding:12px 20px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">View in admin panel</a></p>`,
  );
  const text = [
    "New enquiry received",
    "",
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone || "-"}`,
    `Service: ${enquiry.service || "-"}`,
    `Received: ${when}`,
    "",
    enquiry.message,
    "",
    `View in admin panel: ${adminUrl}`,
  ].join("\n");
  return { html, text };
}

function customerMessage(enquiry: Enquiry) {
  const first = esc(enquiry.name.split(/\s+/)[0] || "there");
  const html = shell(
    `Thank you, ${first}`,
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Thank you for contacting ${COMPANY}. We have successfully received your enquiry${
      enquiry.service ? ` about <strong>${esc(enquiry.service)}</strong>` : ""
    }.</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Our team will review your requirements and get back to you shortly.</p>
<p style="margin:0;color:#6b7085;font-size:13px">This is an automated confirmation. You can reply to this email if you want to add anything.</p>`,
  );
  const text = [
    `Hi ${enquiry.name.split(/\s+/)[0] || "there"},`,
    "",
    `Thank you for contacting ${COMPANY}. We have successfully received your enquiry${enquiry.service ? ` about ${enquiry.service}` : ""}.`,
    "Our team will review your requirements and get back to you shortly.",
    "",
    "This is an automated confirmation. You can reply to this email if you want to add anything.",
  ].join("\n");
  return { html, text };
}

/* ---------- Public API ---------- */

/**
 * Sends the admin notification (to every configured recipient) and the visitor acknowledgement.
 * Meant to run after the response (`after()`): enquiry storage never depends on email delivery.
 */
export async function sendEnquiryEmails(enquiry: Enquiry, origin: string) {
  try {
    const [prefs, mailer] = await Promise.all([getSmtp(), resolveMailer()]);
    if (!mailer) return;

    const jobs: Promise<unknown>[] = [];
    const adminUrl = `${origin}/admin/enquiries?${new URLSearchParams({ q: enquiry.email })}`;

    if (prefs.enabled && prefs.recipients.length > 0) {
      const { html, text } = adminMessage(enquiry, adminUrl);
      jobs.push(
        deliver(mailer, "admin", {
          from: mailer.from,
          to: prefs.recipients,
          replyTo: enquiry.email,
          subject: clean(`New enquiry from ${enquiry.name}${enquiry.service ? ` – ${enquiry.service}` : ""}`),
          html,
          text,
        }),
      );
    }

    // One acknowledgement per address per hour, so the form cannot be used to mail-bomb a third party.
    if (prefs.ackEnabled && !limited(`ack:${enquiry.email.toLowerCase()}`, 1, 60 * 60_000)) {
      const { html, text } = customerMessage(enquiry);
      jobs.push(
        deliver(mailer, "customer", {
          from: mailer.from,
          to: enquiry.email,
          replyTo: prefs.recipients[0],
          subject: `We've received your enquiry – ${COMPANY}`,
          html,
          text,
        }),
      );
    }
    await Promise.all(jobs);
  } catch (error) {
    console.error("Enquiry emails failed:", error instanceof Error ? error.message : error);
  }
}

/** Sends a test message through whichever provider is active and reports the real outcome. */
export async function sendTest(to: string) {
  const mailer = await resolveMailer();
  if (!mailer) throw new Error("No email provider is set up. Connect Gmail or save SMTP settings first.");
  await mailer.send({
    from: mailer.from,
    to,
    subject: `${COMPANY} email test`,
    text: `This is a test message from the ${COMPANY} admin, sent through ${mailer.provider === "gmail" ? "Gmail (OAuth2)" : "SMTP"}. Your settings work.`,
  });
  return mailer.provider;
}
