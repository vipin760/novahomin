import Link from "next/link";
import { ProjectCard } from "@/components/project-card";
import { Eyebrow } from "@/components/ui";
import { getPublishedProjects } from "@/lib/public-content";

/** Home: latest published projects. Renders nothing until at least one project is published. */
export async function PortfolioSection() {
  const projects = (await getPublishedProjects()).slice(0, 3);
  if (projects.length === 0) return null;
  return (
    <section className="section insights portfolio-home" aria-labelledby="portfolio-heading">
      <div className="container">
        <header className="insights-head">
          <div>
            <Eyebrow plain>Portfolio</Eyebrow>
            <h2 id="portfolio-heading">Selected work</h2>
            <p>Products we have designed and engineered with our clients.</p>
          </div>
          <Link className="insights-all" href="/portfolio">
            All projects <span aria-hidden="true">→</span>
          </Link>
        </header>
        <ul className="insights-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      </div>
    </section>
  );
}
