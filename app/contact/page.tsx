import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { anim, LightHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell us what you are building. Start a project or book a free consultation with Novahomin.",
};

export default function ContactPage() {
  return (
    <>
      <LightHero
        id="contact-heading"
        title="Let’s connect"
        text="Have a project in mind? Send us a message, or choose “Consultation” to ask for a call, and our team will get back to you."
      />
      <section className="section section-flush-top" id="consultation" aria-label="Enquiry form">
        <div className="container form-wrap" {...anim("card")}>
          <ContactForm contactEmail={process.env.CONTACT_EMAIL} />
        </div>
      </section>
    </>
  );
}
