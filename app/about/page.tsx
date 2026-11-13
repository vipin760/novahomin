import type { Metadata } from "next";
import { ServiceGlyph } from "@/components/icons";
import { anim, DarkHero, RobotArt, SectionHead } from "@/components/ui";
import { disciplines } from "@/lib/content";

export const metadata: Metadata = {
  title: "Company",
  description:
    "Novahomin is a software and AI engineering team: strategy, design, engineering and AI under one roof.",
};

export default function AboutPage() {
  return (
    <>
      <DarkHero
        id="about-heading"
        art="side"
        title={
          <>
            Built to help ambitious <br className="br-desktop" />
            teams ship faster
          </>
        }
        text="We design and engineer digital products for companies that want to move faster, with strategy, design, engineering and AI under one roof."
        actions={[
          { href: "/contact", label: "Start a project" },
          { href: "/services", label: "Explore services" },
        ]}
      />

      <section className="section" aria-labelledby="scale-heading">
        <div className="container narrow">
          <h2 id="scale-heading" className="center-title" {...anim("text")}>
            Built for complexity. Ready for scale.
          </h2>
          <div className="about-visual" {...anim("card")}>
            <RobotArt className="about-robot" />
          </div>
          <div className="prose" {...anim("text")}>
            <p>
              Novahomin brings product strategy, interface design, engineering and AI into one
              team. Engineers join the first conversation, so scope and estimates reflect how the
              product will actually be built.
            </p>
            <p>
              We work in short sprints with working software at the end of each one. Performance,
              accessibility and search visibility are part of the definition of done, which means
              your product launches fast, stays fast, and keeps being found as it grows.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-sand" id="disciplines" aria-labelledby="team-heading">
        <div className="container">
          <SectionHead id="team-heading" title="One team, every discipline" />
          <ul className="team-grid">
            {disciplines.map((item) => (
              <li className="team-card" key={item.title} {...anim("card")}>
                <div className="team-thumb" aria-hidden="true">
                  <div className="team-tile" data-tone={item.tone}>
                    <ServiceGlyph name={item.icon} />
                  </div>
                  <span className="team-overlay" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
