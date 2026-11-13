"use client";

import { useActionState } from "react";
import { saveSmtpAction, testSmtpAction, type FormState } from "@/app/admin/(panel)/actions";
import type { SmtpSettings } from "@/lib/smtp";

export function SmtpForm({ settings }: { settings: SmtpSettings }) {
  const [saved, save, saving] = useActionState<FormState, FormData>(saveSmtpAction, {});
  const [tested, test, testing] = useActionState<FormState, FormData>(testSmtpAction, {});
  return (
    <>
      <form action={save} className="admin-form admin-wide">
        <label className="admin-check">
          <input type="checkbox" name="enabled" defaultChecked={settings.enabled} />
          <span>Email me when a new enquiry arrives</span>
        </label>
        <label>
          <span>SMTP host</span>
          <input name="host" defaultValue={settings.host} placeholder="smtp.example.com" maxLength={200} />
        </label>
        <div className="admin-two">
          <label>
            <span>Port</span>
            <input name="port" type="number" defaultValue={settings.port} min={1} max={65535} />
          </label>
          <label className="admin-check">
            <input type="checkbox" name="secure" defaultChecked={settings.secure} />
            <span>Use SSL/TLS (usually port 465)</span>
          </label>
        </div>
        <label>
          <span>Username</span>
          <input name="user" defaultValue={settings.user} autoComplete="off" maxLength={200} />
        </label>
        <label>
          <span>Password {settings.hasPassword ? "(saved — leave blank to keep it)" : ""}</span>
          <input name="password" type="password" autoComplete="new-password" maxLength={500} />
        </label>
        <label>
          <span>From address</span>
          <input name="from" defaultValue={settings.from} placeholder='Novahomin <hello@example.com>' maxLength={200} />
        </label>
        <label>
          <span>Send enquiry notifications to (comma-separated)</span>
          <input name="notifyTo" defaultValue={settings.notifyTo} placeholder="you@example.com" maxLength={500} />
        </label>
        <p className={saved.error ? "admin-error" : "admin-ok"} role="status">
          {saved.error ?? saved.ok}
        </p>
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <form action={test} className="admin-form admin-wide admin-test">
        <h2>Send a test email</h2>
        <label>
          <span>Send to</span>
          <input name="to" type="email" placeholder="you@example.com" required />
        </label>
        <p className={tested.error ? "admin-error" : "admin-ok"} role="status">
          {tested.error ?? tested.ok}
        </p>
        <button type="submit" className="admin-btn admin-btn-line" disabled={testing}>
          {testing ? "Sending…" : "Send test"}
        </button>
      </form>
    </>
  );
}
