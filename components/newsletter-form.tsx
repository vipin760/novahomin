"use client";

import { useState } from "react";

type Status = { kind: "idle" | "error" | "ok"; text: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Posts to /api/newsletter; the message shown always reflects the server's real answer. */
export function NewsletterForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    if (!emailPattern.test(email)) {
      setStatus({ kind: "error", text: "Please enter a valid email address." });
      return;
    }
    setSending(true);
    setStatus({ kind: "idle", text: "" });
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nh_extra_note: data.get("nh_extra_note") }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (response.ok) {
        form.reset();
        setStatus({ kind: "ok", text: result.message ?? "Thanks, you are subscribed." });
      } else {
        setStatus({ kind: "error", text: result.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setStatus({ kind: "error", text: "Could not reach the server. Please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="newsletter" onSubmit={submit} noValidate>
      <div className="newsletter-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Email address"
          required
          maxLength={254}
          aria-describedby="newsletter-status"
          aria-invalid={status.kind === "error" || undefined}
        />
        <input name="nh_extra_note" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
        <button type="submit" className="newsletter-submit" disabled={sending}>
          {sending ? "Subscribing…" : "Subscribe"} <span aria-hidden="true">→</span>
        </button>
      </div>
      {/* Consent line hidden for now:
          By subscribing you agree to receive occasional emails from Novahomin. Unsubscribe at any time. */}
      <p className="newsletter-status" id="newsletter-status" data-kind={status.kind} role="status">
        {status.text}
      </p>
    </form>
  );
}
