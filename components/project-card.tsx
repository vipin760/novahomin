import Link from "next/link";
import { CloudImage } from "@/components/cloud-image";
import type { Project } from "@/lib/projects";

/** Portfolio card: image, type label, title, short summary; the whole card is one link. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <li>
      <article className="project">
        {project.cover ? <CloudImage src={project.cover.url} alt={project.cover.alt || project.title} ratio="4 / 3" /> : null}
        <p className="insight-topic">{project.category || "Project"}</p>
        <h3>
          <Link className="insight-link project-link" href={`/portfolio/${project.slug}`}>
            <span>{project.title}</span>
          </Link>
        </h3>
        {project.summary ? <p className="insight-summary">{project.summary}</p> : null}
        <p className="insight-meta">
          <span>{project.client}</span>
          <span className="insight-arrow" aria-hidden="true">→</span>
        </p>
      </article>
    </li>
  );
}
