"use client";

import { useRef, useState } from "react";
import { services } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";
import { ArrowIcon } from "./icons";

/**
 * No enquiry endpoint has been confirmed, so nothing is submitted to a server.
 * With CONTACT_EMAIL configured the enquiry opens in the visitor's email client;
 * otherwise it is saved as a brief the visitor can share.
 */
export function ProjectEnquiry({ contactEmail }: { contactEmail?: string }) {
  const form = useRef<HTMLFormElement>(null);
  const hydrated = useHydrated();
  const [message, setMessage] = useState("");

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
    <div className="enquiry panel">
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
  );
}
