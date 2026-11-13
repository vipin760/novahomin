import type { Metadata } from "next";
import { TargetIcon } from "@/components/icons";
import { anim, LightHero } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { plans } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Engagement models that grow with your product: fixed scope, phased builds or a monthly retainer.",
};

export default function PricingPage() {
  return (
    <>
      <LightHero
        id="pricing-heading"
        title={
          <>
            Plans that grow <br className="br-desktop" />
            with your product
          </>
        }
        text="Simple, transparent engagement models. Start with a scoping call and a clear quote, then scale up when you are ready."
      />
      <section className="section section-flush-top" aria-label="Engagement models">
        <div className="container">
          <ul className="plan-grid">
            {plans.map((plan) => (
              <li className="plan" key={plan.name} {...anim("card")}>
                <h2 className="plan-name">{plan.name}</h2>
                <p className="plan-price">{plan.price}</p>
                <p className="plan-note">{plan.priceNote}</p>
                <ButtonLink href="/contact" variant={plan.name === "Launch" ? "soft" : "dark"} block>
                  Get a quote
                </ButtonLink>
                <p className="plan-intro">{plan.intro}</p>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <TargetIcon />
                      {feature}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
