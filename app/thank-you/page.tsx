import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { RedirectHome } from "@/components/redirect-home";
import { LightHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Thank you",
  // A post-submission page: nothing to index, and it is not in the sitemap.
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <LightHero
      id="thank-you-heading"
      title="Thank you"
      text="Your message has been sent. We have emailed you a confirmation, and our team will review your requirements and get back to you shortly."
    >
      <div className="button-row">
        <ButtonLink href="/" variant="dark">
          Back to home
        </ButtonLink>
        <ButtonLink href="/portfolio" variant="soft">
          See our work
        </ButtonLink>
      </div>
      <RedirectHome seconds={10} />
    </LightHero>
  );
}
