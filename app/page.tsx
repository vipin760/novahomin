import type { CSSProperties } from "react";
import { Header } from "@/components/header";
import { ArrowIcon, BrandMark, ServiceGlyph } from "@/components/icons";
import { ProjectEnquiry } from "@/components/project-enquiry";
import { RobotStage } from "@/components/robot-stage";
import { ScrollDirector } from "@/components/scroll-director";
import {
  differentiators,
  expertise,
  processSteps,
  services,
  visibility,
} from "@/lib/content";

/** Orbital placement around the robot on desktop: [top, outward offset]. */
const orbit = {
  left: [
    ["42%", "0px"],
    ["58%", "34px"],
    ["74%", "6px"],
  ],
  right: [
    ["17%", "4px"],
    ["35%", "34px"],
    ["53%", "34px"],
    ["71%", "4px"],
  ],
};
const placements = services.map(
  (service, index) =>
    orbit[service.side][
      services.slice(0, index).filter((other) => other.side === service.side)
        .length
    ],
);

function Eyebrow({ index, children }: { index: string; children: string }) {
  return (
    <p className="eyebrow">
      <span className="index">{index}</span>
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <RobotStage />
      <ScrollDirector />
      <main id="main">
        <section id="top" className="section hero" aria-labelledby="hero-heading">
          <div className="split shell">
            <div className="col-left hero-copy">
              <p className="eyebrow">
                <i className="status" aria-hidden="true" />
                Software &amp; AI engineering
              </p>
              <h1 id="hero-heading">
                Engineering <span className="gradient-text">intelligent</span>{" "}
                digital products.
              </h1>
            </div>
            <div className="col-right hero-aside">
              <p className="lead">
                Websites, apps, SaaS platforms and AI automation, designed and
                engineered by one focused team.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">
                  Start a project <ArrowIcon />
                </a>
                <a className="button button-ghost" href="#services">
                  Explore services
                </a>
              </div>
            </div>
          </div>
          <a className="scroll-cue" href="#about">
            <span className="mono">Scroll</span>
            <i aria-hidden="true" />
          </a>
        </section>

        <section id="about" className="section" aria-labelledby="about-heading">
          <div className="split shell">
            <div className="col-left" data-reveal="left">
              <Eyebrow index="01">About</Eyebrow>
              <h2 id="about-heading">
                A technology partner for ambitious teams.
              </h2>
            </div>
            <div className="col-right" data-reveal="right">
              <p className="lead">
                Novahomin designs and engineers digital products for companies
                that want to move faster. Strategy, design, engineering and AI
                under one roof.
              </p>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="section services"
          aria-labelledby="services-heading"
        >
          <div className="scene-sticky">
            <div className="shell services-layout">
              <div className="section-head" data-reveal="left">
                <Eyebrow index="02">Services</Eyebrow>
                <h2 id="services-heading">What we build.</h2>
              </div>
              <ul className="service-list">
                {services.map((service, index) => {
                  const [top, offset] = placements[index];
                  return (
                    <li
                      key={service.title}
                      className="service-panel panel"
                      data-panel=""
                      data-side={service.side}
                      style={{ "--top": top, "--offset": offset } as CSSProperties}
                    >
                      <span className="service-icon">
                        <ServiceGlyph name={service.icon} />
                      </span>
                      <span>
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="expertise"
          className="section"
          aria-labelledby="expertise-heading"
        >
          <div className="split shell">
            <div className="col-left" data-reveal="left">
              <Eyebrow index="03">Expertise</Eyebrow>
              <h2 id="expertise-heading">Engineering depth across the stack.</h2>
              <p className="lead">
                Proven technology, chosen for each product rather than habit.
              </p>
            </div>
            <div className="col-right">
              <dl className="stack">
                {expertise.map((group) => (
                  <div className="stack-group panel" key={group.label} data-reveal="right">
                    <dt className="mono">{group.label}</dt>
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
          </div>
        </section>

        <section
          id="process"
          className="section process"
          aria-labelledby="process-heading"
          data-active="0"
        >
          <div className="scene-sticky">
            <div className="split shell">
              <div className="col-left">
                <div className="section-head" data-reveal="left">
                  <Eyebrow index="04">Process</Eyebrow>
                  <h2 id="process-heading">How we work.</h2>
                </div>
                <ol className="steps">
                  {processSteps.slice(0, 2).map((step, index) => (
                    <li key={step.title} className="step" data-step="" data-side="left" data-index={index}>
                      <span className="step-number mono">0{index + 1}</span>
                      <span>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="col-right">
                <ol className="steps" start={3}>
                  {processSteps.slice(2).map((step, index) => (
                    <li key={step.title} className="step" data-step="" data-side="right" data-index={index + 2}>
                      <span className="step-number mono">0{index + 3}</span>
                      <span>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section
          id="visibility"
          className="section visibility"
          aria-labelledby="visibility-heading"
        >
          <div className="split shell">
            <div className="col-right" data-reveal="right">
              <Eyebrow index="05">SEO &amp; GEO</Eyebrow>
              <h2 id="visibility-heading">Visible in search. Cited by AI.</h2>
              <p className="lead">
                We optimise for search rankings and for generative engines such
                as ChatGPT, Gemini and Perplexity.
              </p>
            </div>
            <ul className="col-left feature-list">
              {visibility.map((item, index) => (
                <li key={item.title} data-reveal="left">
                  <span className="mono">0{index + 1}</span>
                  <span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="why" className="section" aria-labelledby="why-heading">
          <div className="split shell">
            <div className="col-left" data-reveal="left">
              <Eyebrow index="06">Why Novahomin</Eyebrow>
              <h2 id="why-heading">What sets us apart.</h2>
            </div>
            <ul className="col-right why-grid">
              {differentiators.map((item) => (
                <li key={item.title} className="panel" data-reveal="right">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="section contact" aria-labelledby="contact-heading">
          <div className="split shell">
            <div className="col-left" data-reveal="left">
              <Eyebrow index="07">Contact</Eyebrow>
              <h2 id="contact-heading">Have a project in mind?</h2>
              <p className="lead">
                Tell us what you are building. A clear brief is the fastest way
                to a clear plan.
              </p>
            </div>
            <div className="col-right">
              <ProjectEnquiry contactEmail={process.env.CONTACT_EMAIL} />
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <a className="wordmark" href="#top" aria-label="Novahomin home">
            <BrandMark />
            <span>NOVAHOMIN</span>
          </a>
          <span className="copyright">© 2026 Novahomin</span>
          <a className="back-top" href="#top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </footer>
    </>
  );
}
