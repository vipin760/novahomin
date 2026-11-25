"use client";

import Link from "next/link";
import { useState } from "react";
import { CloudImage } from "@/components/cloud-image";
import { PIcon } from "@/components/portfolio-icons";
import { categoryIcon, normalizeCategory, PROJECT_CATEGORIES } from "@/lib/project-meta";

export type GridProject = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover: { url: string; alt: string } | null;
};

/** Filter chips + project cards. Filtering is instant and client-side; every card is a normal link. */
export function PortfolioGrid({ projects }: { projects: GridProject[] }) {
  const [active, setActive] = useState("all");
  const present = new Set(projects.map((project) => normalizeCategory(project.category)));
  const chips = PROJECT_CATEGORIES.filter((category) => present.has(category.value));
  const shown = active === "all" ? projects : projects.filter((project) => normalizeCategory(project.category) === active);

  return (
    <>
      {chips.length > 1 ? (
        <div className="pf-filters" role="group" aria-label="Filter projects by type">
          <button type="button" aria-pressed={active === "all"} onClick={() => setActive("all")}>
            All Projects
          </button>
          {chips.map((chip) => (
            <button key={chip.value} type="button" aria-pressed={active === chip.value} onClick={() => setActive(chip.value)}>
              <PIcon name={chip.icon} size={18} />
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="pf-grid" aria-live="polite">
        {shown.map((project) => (
          <li key={project.id}>
            <Link href={`/portfolio/${project.slug}`} className="pf-card">
              <span className="pf-card-media">
                {project.cover ? (
                  <CloudImage src={project.cover.url} alt={project.cover.alt || project.title} ratio="16 / 10" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" />
                ) : (
                  <span className="pf-card-empty" aria-hidden="true" />
                )}
              </span>
              <span className="pf-card-body">
                <span className="pf-card-title">
                  <PIcon name={categoryIcon(project.category)} size={20} />
                  <strong>{project.title}</strong>
                  {project.category ? <em>{normalizeCategory(project.category) || project.category}</em> : null}
                </span>
                {project.summary ? <span className="pf-card-text">{project.summary}</span> : null}
                <span className="pf-card-go" aria-hidden="true">
                  <PIcon name="arrow" size={18} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 ? <p className="pf-none">No projects in this category yet.</p> : null}
    </>
  );
}
