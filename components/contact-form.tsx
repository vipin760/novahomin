"use client";

import { useRef, useState } from "react";
import { services } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";
import { ButtonLayers } from "./button";

/**
 * No enquiry endpoint has been confirmed, so nothing is submitted to a server.
 * With CONTACT_EMAIL configured the enquiry opens in the visitor's email client;
 * otherwise it is saved as a text brief on the visitor's device.
 */
export function ContactForm({ contactEmail }: { contactEmail?: string }) {
  const form = useRef<HTMLFormElement>(null);
  const hydrated = useHydrated();
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text: string }>({ kind: "idle", text: "" });
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form.current!));
    setSending(true);
    setStatus({ kind: "idle", text: "" });
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.ok) {
        form.current!.reset();
        setStatus({ kind: "ok", text: "Thank you. Your message has been sent and our team will be in touch." });
      } else {
        setStatus({ kind: "error", text: result.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setStatus({ kind: "error", text: "Could not reach the server. Please check your connection and try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="form-card">
      <noscript>
        <p className="form-note">
          {contactEmail ? (
            <>
              Email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </>
          ) : (
            "The enquiry form needs JavaScript."
          )}
        </p>
      </noscript>
      <form ref={form} onSubmit={submit} hidden={!hydrated} className="contact-form">
        <label>
          <span>Full name *</span>
          <input name="name" autoComplete="name" required maxLength={100} placeholder="Please enter your full name" />
        </label>
        <label>
          <span>Email address *</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="Enter your email address"
          />
        </label>
        <label>
          <span>Phone number</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Enter your phone number" />
        </label>
        <label>
          <span>Service</span>
          <select name="service" defaultValue="Not sure yet">
            {services.map((service) => (
              <option key={service.slug}>{service.title}</option>
            ))}
            <option>Consultation</option>
            <option>Not sure yet</option>
          </select>
        </label>
        <label>
          <span>Message *</span>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="Tell us about your project..."
          />
        </label>
        <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
        <button type="submit" className="button button-block" data-variant="dark" disabled={sending}>
          <ButtonLayers>{sending ? "Sending…" : "Send message"}</ButtonLayers>
        </button>
        <p className="form-note" role="status" data-kind={status.kind}>
          {status.text || "We use your details only to reply to your enquiry."}
        </p>
      </form>
    </div>
  );
}
