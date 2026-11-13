import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { Eyebrow } from "@/components/ui";
import { getPublishedProjects } from "@/lib/public-content";

const title = "Portfolio | Novahomin";
const description = "Selected websites, web applications, mobile apps and software products designed and engineered by Novahomin.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/portfolio" },
  openGraph: { type: "website", title, description, url: "/portfolio" },
  twitter: { card: "summary", title, description },
};

export default async function PortfolioPage() {
  const projects = await getPublishedProjects();
  return (
    <div className="insights insights-page">
      <header className="container insights-hero">
        <Eyebrow plain>Portfolio</Eyebrow>
        <h1>Work we are proud of.</h1>
        <p>Selected products we have designed and engineered with our clients.</p>
      </header>
      <section className="section insights-list" aria-labelledby="projects-heading">
        <div className="container">
          <h2 id="projects-heading" className="sr-only">
            Projects
          </h2>
          {projects.length === 0 ? (
            <p className="insight-summary">Our case studies are being prepared. Please check back soon.</p>
          ) : (
            <ul className="insights-grid">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
