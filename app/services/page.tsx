import type { Metadata } from "next";
import { CheckBadge, ServiceGlyph } from "@/components/icons";
import { anim, LightHero, SectionHead } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { expertise, processSteps, services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Websites, web applications, Android & iOS apps, SaaS, AI automation, e-commerce, and SEO & GEO.",
};

export default function ServicesPage() {
  return (
    <>
      <LightHero
        id="services-heading"
        title={
          <>
            Engineering for every <br className="br-desktop" />
            stage of growth
          </>
        }
        text="From a first website to a multi-tenant SaaS platform, one team takes your product from idea to launch and keeps improving it after."
      >
        <div className="button-row">
          <ButtonLink href="/contact">Start a project</ButtonLink>
          <ButtonLink href="/pricing" variant="soft">
            View engagement models
          </ButtonLink>
        </div>
      </LightHero>

      <section className="section section-flush-top" aria-label="All services">
        <div className="container">
          <ul className="service-grid">
            {services.map((service) => (
              <li className="service-card" id={service.slug} key={service.slug} {...anim("card")}>
                <span className="icon-tile">
                  <ServiceGlyph name={service.icon} />
                </span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul className="check-list check-list-small">
                  {service.deliverables.map((item) => (
                    <li key={item}>
                      <CheckBadge />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-sand" id="process" aria-labelledby="process-heading">
        <div className="container">
          <SectionHead
            id="process-heading"
            title="Fast decisions, visible progress"
            text="Four stages, each ending with something you can see and test."
          />
          <ol className="step-grid">
            {processSteps.map((step, index) => (
              <li className="step-card" key={step.title} {...anim("card")}>
                <span className="process-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="stack-heading">
        <div className="container">
          <SectionHead
            id="stack-heading"
            title="Flexible technology, chosen per product"
          />
          <dl className="stack-grid">
            {expertise.map((group) => (
              <div className="stack-card" key={group.label} {...anim("card")}>
                <dt>{group.label}</dt>
                <dd>
                  <ul className="chips">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
