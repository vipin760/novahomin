import Link from "next/link";
import { CheckBadge, ServiceGlyph } from "@/components/icons";
import { ConsoleMockup, PillarDemo } from "@/components/mockups";
import { EngineeringArt } from "@/components/engineering-art";
import { engineeringPrinciples } from "@/lib/engineering";
import { IntroArt } from "@/components/intro-art";
import { ServeSection } from "@/components/serve-section";
import { StickyStack } from "@/components/sticky-stack";
import { PortfolioSection } from "@/components/portfolio-section";
import { InsightsSection } from "@/components/insights-section";
import { WhySection } from "@/components/why-section";
import {
  anim,
  DarkHero,
  Eyebrow,
  SectionHead,
} from "@/components/ui";
import {
  articles,
  pillars,
  processSteps,
} from "@/lib/content";

export default function Home() {
  return (
    <>
      <DarkHero
        id="hero-heading"
        title={
          <>
            Build your digital products <br className="br-desktop" />
            with confidence.
          </>
        }
        text="Websites, apps, SaaS platforms and AI automation, designed and engineered by one focused team. Strategy to launch, under one roof."
        actions={[
          { href: "/contact", label: "Start a project" },
          { href: "/contact#consultation", label: "Book consultation" },
        ]}
      />

      <ServeSection />

      <section
        className="section section-tight"
        aria-labelledby="intro-heading"
      >
        <div className="container">
          <div className="intro-head">
            <div className="intro-copy">
            <Eyebrow plain>Why teams choose Novahomin</Eyebrow>
            <h2
              id="intro-heading"
              className="statement-heading"
             
            >
              Ship with confidence. Web, mobile and AI development for
              ambitious teams.
            </h2>
            <p className="intro-lead">
              Novahomin is a web and software development company. We bring
              strategy, design, engineering and AI under one roof, so your
              website, app or SaaS platform launches faster, ranks better and
              keeps growing with your business.
            </p>
            <ul className="intro-points">
              <li>Strategy to launch, one team</li>
              <li>SEO &amp; Core Web Vitals built in</li>
              <li>Clean code you own</li>
            </ul>
            </div>
            <div className="intro-visual">
              <IntroArt />
            </div>
          </div>
          <ul className="pillar-grid">
            {pillars.map((pillar) => (
              <li className="pillar" key={pillar.title} {...anim("card")}>
                <div className="pillar-desp">
                  <span className="pillar-icon">
                    <ServiceGlyph name={pillar.icon} />
                  </span>
                  <div className="pillar-gap" aria-hidden="true">
                    <div>
                      <div className="pillar-space" />
                    </div>
                  </div>
                  <div>
                    <h3>
                      <Link className="pillar-link" href={pillar.href}>
                        {pillar.title}
                      </Link>
                    </h3>
                    <p>{pillar.text}</p>
                    <span className="pillar-more" aria-hidden="true">
                      Learn more →
                    </span>
                  </div>
                </div>
                <div className="pillar-demo" aria-hidden="true">
                  <div>
                    <PillarDemo kind={pillar.icon} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="section section-flush-top engineering"
        aria-labelledby="engineering-heading"
      >
        <div className="container">
          <div className="section-head">
            <Eyebrow plain {...anim("text")}>
              How we engineer
            </Eyebrow>
            <h2 id="engineering-heading" {...anim("text")}>
              Built with purpose. <br className="br-desktop" />
              Engineered for growth.
            </h2>
            <p className="lead" {...anim("text")}>
              We combine thoughtful engineering, modern architecture, and
              practical innovation to build reliable digital products that
              solve real business challenges and evolve with your ambitions.
            </p>
            <Link className="engineering-cta" href="/services#process">
              Explore Our Approach <span aria-hidden="true">→</span>
            </Link>
          </div>
          <StickyStack>
            {engineeringPrinciples.map((principle) => (
              <article className="feature-split" key={principle.number}>
                <div className="feature-copy">
                  <Eyebrow plain>
                    {principle.number} · {principle.label}
                  </Eyebrow>
                  <h3>{principle.headline}</h3>
                  <p>{principle.description}</p>
                  <ul className="check-list">
                    {principle.points.map((point) => (
                      <li key={point}>
                        <CheckBadge />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="feature-visual" data-tone="violet">
                  <EngineeringArt focus={principle.focus} />
                </div>
              </article>
            ))}
          </StickyStack>
        </div>
      </section>

      <section
        className="section section-dark"
        aria-labelledby="process-heading"
      >
        <div className="container">
          <SectionHead
            id="process-heading"
            title={
              <>
                See how we take products <br className="br-desktop" />
                from idea to launch.
              </>
            }
          />
          <div className="console-frame" {...anim("card")}>
            <ConsoleMockup />
          </div>
          <ol className="process-row">
            {processSteps.map((step, index) => (
              <li key={step.title} {...anim("text")}>
                <span className="process-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <WhySection />

      <PortfolioSection />

      <InsightsSection />
    </>
  );
}
