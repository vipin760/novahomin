import { headers } from "next/headers";
import { Suspense } from "react";
import { connection } from "next/server";
import { NotifyForm } from "@/components/admin/notify-form";
import { CopyButton } from "@/components/admin/row-actions";
import { SmtpForm } from "@/components/admin/smtp-form";
import { dbConfigured } from "@/lib/db";
import { GOOGLE_CALLBACK_PATH, googleStatus, recentEmailLogs, resolveMailer } from "@/lib/mail";
import { originFromHeaders } from "@/lib/request";
import { getSmtp } from "@/lib/smtp";
import { disconnectGoogleAction } from "../actions";

export default function SettingsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>
      <PageBody searchParams={searchParams} />
    </Suspense>
  );
}

const googleMessages: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Gmail connected. Send a test email below to confirm." },
  denied: { ok: false, text: "Google sign-in was cancelled. Nothing was changed." },
  invalid_state: { ok: false, text: "The sign-in session expired or did not match. Please try Connect Gmail again." },
  redirect_uri_mismatch: { ok: false, text: "Google rejected the redirect URI. Add the exact URI shown below to your OAuth client, then retry." },
  no_refresh_token: { ok: false, text: "Google did not return a refresh token. Remove this app at myaccount.google.com/permissions, then connect again." },
  exchange_failed: { ok: false, text: "Could not complete the Google sign-in. Check the client ID and secret, then retry." },
  missing: { ok: false, text: "Set EMAIL_USER, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first." },
};

const when = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) + " UTC";

async function PageBody({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  await connection(); // DB-backed and auth-gated: never prerender at build time
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;

  const flash = googleMessages[(await searchParams).google ?? ""];
  const redirectUri = `${originFromHeaders(await headers())}${GOOGLE_CALLBACK_PATH}`;
  const [smtp, google, mailer, logs] = await Promise.all([getSmtp(), googleStatus(), resolveMailer(), recentEmailLogs()]);

  return (
    <>
      <h1>Email &amp; notifications</h1>
      <p className="admin-muted">
        New enquiries are always saved first. Emails are sent afterwards, so a mail problem never blocks a visitor.{" "}
        {mailer ? (
          <>
            Sending through <strong>{mailer.provider === "gmail" ? "Gmail (OAuth2)" : "SMTP"}</strong>.
          </>
        ) : (
          <strong>No email provider is set up yet.</strong>
        )}
      </p>

      {flash ? (
        <p className={flash.ok ? "admin-ok" : "admin-error"} role="status">
          {flash.text}
        </p>
      ) : null}

      <section className="adm-card adm-panel mail-section" aria-labelledby="mail-notify">
        <h2 id="mail-notify">Who gets notified</h2>
        <NotifyForm enabled={smtp.enabled} ackEnabled={smtp.ackEnabled} recipients={smtp.recipients} />
      </section>

      <section className="adm-card adm-panel mail-section" aria-labelledby="mail-gmail">
        <h2 id="mail-gmail">Gmail (Google OAuth2)</h2>
        {!google.configured ? (
          <p className="admin-muted">
            Add <code>EMAIL_USER</code>, <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to <code>.env</code> and restart the server to enable Gmail.
          </p>
        ) : (
          <>
            <p className="admin-muted">
              Sender: <strong>{google.user}</strong> ·{" "}
              {google.connected ? (
                <span className="admin-badge" data-live>
                  connected{google.source === "env" ? " (token from .env)" : ""}
                </span>
              ) : (
                <span className="admin-badge">not connected</span>
              )}
            </p>
            <div className="mail-uri">
              <span className="admin-muted">Authorized redirect URI (add this to your Google OAuth client):</span>
              <div className="mail-uri-row">
                <code>{redirectUri}</code>
                <CopyButton text={redirectUri} label="Copy redirect URI" />
              </div>
            </div>
            <div className="mail-buttons">
              <a className="admin-btn" href="/admin/google/start">
                {google.connected ? "Reconnect Gmail" : "Connect Gmail"}
              </a>
              {google.source === "admin" ? (
                <form action={disconnectGoogleAction}>
                  <button type="submit" className="admin-btn admin-btn-line">
                    Disconnect
                  </button>
                </form>
              ) : null}
            </div>
          </>
        )}
      </section>

      <section className="adm-card adm-panel mail-section" aria-labelledby="mail-smtp">
        <h2 id="mail-smtp">SMTP (fallback)</h2>
        <p className="admin-muted">Used only when Gmail is not connected.</p>
        <SmtpForm settings={smtp} />
      </section>

      <section className="adm-card adm-panel mail-section" aria-labelledby="mail-log">
        <h2 id="mail-log">Recent emails</h2>
        {logs.length === 0 ? (
          <p className="admin-muted">Nothing sent yet.</p>
        ) : (
          <div className="enq-scroll">
            <table className="enq-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Type</th>
                  <th scope="col">To</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="adm-nowrap">{when(log.createdAt)}</td>
                    <td>{log.kind}</td>
                    <td className="mail-to">{log.to}</td>
                    <td>
                      <span className="admin-badge" data-live={log.status === "sent" || undefined}>
                        {log.status}
                      </span>
                      {log.error ? <small className="admin-error mail-err">{log.error}</small> : null}
                      {log.attempts > 1 ? <small className="admin-muted"> after {log.attempts} tries</small> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
