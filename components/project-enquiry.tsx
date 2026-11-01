"use client";

import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";
import { ArrowIcon } from "./icons";

const focusable = "a[href], button:not([disabled]), input, select, textarea";

/**
 * No enquiry endpoint has been confirmed, so nothing is submitted to a server.
 * With CONTACT_EMAIL configured the enquiry opens in the visitor's email client;
 * otherwise it is saved as a brief the visitor can share.
 *
 * Desktop and the static fallback show the form inline. In the compact cinematic
 * story the contact beat shows a call to action, and the form slides in from the
 * right as a modal sheet.
 */
export function ProjectEnquiry({ contactEmail }: { contactEmail?: string }) {
  const form = useRef<HTMLFormElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const hydrated = useHydrated();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const panel = sheet.current!;
    const trigger = opener.current;
    panel.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
    // Manual focus cycling: identical in every browser (WebKit skips buttons on Tab).
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return setOpen(false);
      if (event.key !== "Tab") return;
      event.preventDefault();
      const items = [...panel.querySelectorAll<HTMLElement>(focusable)];
      const index = items.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      items[(index + step + items.length) % items.length]?.focus();
    };
    const onFocus = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node))
        panel.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
    };
    document.addEventListener("focusin", onFocus);
    // Leaving the compact layout closes the sheet; the form is inline there.
    const compact = matchMedia("(max-width: 1023.98px)");
    const onChange = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    compact.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      compact.removeEventListener("change", onChange);
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  function brief() {
    const data = new FormData(form.current!);
    return `NOVAHOMIN — PROJECT ENQUIRY\n\nName: ${data.get("name")}\nEmail: ${data.get("email")}\nService: ${data.get("service")}\n\nProject\n${data.get("project")}\n`;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Project enquiry")}&body=${encodeURIComponent(brief())}`;
      setMessage("Your email app should open with the enquiry ready to send.");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([brief()], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "novahomin-project-enquiry.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Your brief has been saved to your device.");
  }

  return (
    <>
      <div className="enquiry-cta" data-story="11" data-from="right" data-zone="lower">
        <button
          ref={opener}
          type="button"
          className="button button-primary"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          hidden={!hydrated}
        >
          {contactEmail ? "Send an enquiry" : "Write your project brief"} <ArrowIcon />
        </button>
        <p className="enquiry-note">Four short fields. Nothing is stored by this website.</p>
      </div>
      <div
        className="enquiry panel"
        ref={sheet}
        data-open={open || undefined}
        {...(open
          ? { role: "dialog", "aria-modal": true, "aria-labelledby": "enquiry-title" }
          : {})}
      >
        <div className="enquiry-sheet-head">
          <p id="enquiry-title" className="eyebrow">
            Project enquiry
          </p>
          <button
            type="button"
            className="enquiry-close"
            aria-label="Close project enquiry"
            onClick={() => setOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <noscript>
          <p className="enquiry-note">
            {contactEmail ? (
              <>
                Email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </>
            ) : (
              "The enquiry form needs JavaScript."
            )}
          </p>
        </noscript>
        <form ref={form} onSubmit={submit} hidden={!hydrated}>
          <div className="field-row">
            <label>
              <span>Name</span>
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
          </div>
          <label>
            <span>Service</span>
            <select name="service" defaultValue={services[0].title}>
              {services.map((service) => (
                <option key={service.title}>{service.title}</option>
              ))}
              <option>Not sure yet</option>
            </select>
          </label>
          <label>
            <span>Project</span>
            <textarea
              name="project"
              required
              minLength={10}
              maxLength={4000}
              rows={4}
              placeholder="What are you building, and for whom?"
            />
          </label>
          <button type="submit" className="button button-primary">
            {contactEmail ? "Send enquiry" : "Save project brief"} <ArrowIcon />
          </button>
          <p className="enquiry-note" role="status">
            {message ||
              (contactEmail
                ? "Opens your email app. Nothing is stored by this website."
                : "Saved to your device. Nothing is sent or stored by this website.")}
          </p>
        </form>
      </div>
    </>
  );
}
