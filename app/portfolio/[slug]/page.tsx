import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CloudImage } from "@/components/cloud-image";
import { getPublishedProjects } from "@/lib/public-content";
import { siteOrigin } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

const find = async (slug: string) => (await getPublishedProjects()).find((project) => project.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await find((await params).slug);
  if (!project) return {};
  const description = project.summary || `${project.title}, a project by Novahomin.`;
  return {
    title: project.title,
    description,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: { type: "article", title: project.title, description },
    twitter: { card: "summary", title: project.title, description },
  };
}

async function Project({ params }: Props) {
  const project = await find((await params).slug);
  if (!project) notFound();
  const origin = siteOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: project.title,
        description: project.summary || undefined,
        creator: { "@type": "Organization", name: "Novahomin" },
        ...(project.cover ? { image: project.cover.url } : {}),
        ...(origin ? { url: `${origin}/portfolio/${project.slug}` } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Portfolio", ...(origin ? { item: `${origin}/portfolio` } : {}) },
          { "@type": "ListItem", position: 2, name: project.title },
        ],
      },
    ],
  };
  return (
    <article className="article" aria-labelledby="project-heading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="container narrow article-head">
        <p className="insight-topic">{project.category || "Project"}</p>
        <h1 id="project-heading">{project.title}</h1>
        {project.summary ? <p className="hero-text">{project.summary}</p> : null}
        {project.client ? <p className="article-meta">Client: {project.client}</p> : null}
      </header>
      <div className="container narrow">
        {project.cover ? (
          <CloudImage src={project.cover.url} alt={project.cover.alt || project.title} ratio="16 / 9" sizes="(max-width: 900px) 100vw, 830px" priority />
        ) : null}
        {project.description ? (
          <div className="prose prose-dark">
            {project.description.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        {project.gallery.length > 0 ? (
          <ul className="project-gallery">
            {project.gallery.map((image) => (
              <li key={image.url}>
                <CloudImage src={image.url} alt={image.alt || project.title} ratio="4 / 3" sizes="(max-width: 767px) 100vw, 415px" />
              </li>
            ))}
          </ul>
        ) : null}
        {project.link ? (
          <p>
            <a className="back-link" href={project.link} target="_blank" rel="noopener noreferrer">
              Visit live project ↗
            </a>
          </p>
        ) : null}
        <Link className="back-link" href="/portfolio">
          ← All projects
        </Link>
      </div>
    </article>
  );
}

export default function ProjectPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <Project params={params} />
    </Suspense>
  );
}
