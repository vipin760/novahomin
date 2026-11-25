import type { Metadata } from "next";
import Link from "next/link";
import { PIcon } from "@/components/portfolio-icons";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { cloudUrl } from "@/lib/image";
import { categoryIcon, normalizeCategory } from "@/lib/project-meta";
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

const platformIcon = (platform: string) => (/ios/i.test(platform) ? "apple" : /android/i.test(platform) ? "android" : "monitor");

export default async function PortfolioPage() {
  const projects = await getPublishedProjects();
  const featured = projects.find((project) => project.featured) ?? projects[0];
  const rest = projects.filter((project) => project !== featured);
  const count = (category: string) => projects.filter((project) => normalizeCategory(project.category) === category).length;
  const stats = [
    { icon: "folder", value: projects.length, label: "Projects delivered" },
    { icon: "mobile", value: count("Mobile App"), label: "Mobile apps" },
    { icon: "code", value: count("Web App"), label: "Web applications" },
    { icon: "layers", value: count("SaaS"), label: "SaaS products" },
  ] as const;
  const showcase = featured ? (featured.hero ?? featured.cover) : null;

  return (
    <div className="pf">
      <section className="pf-hero" aria-labelledby="pf-heading">
        <div className="container pf-hero-grid">
          <div className="pf-hero-main">
            <p className="pf-pill">
              <PIcon name="folder" size={16} /> Our Work
            </p>
            <h1 id="pf-heading">
              Projects We&rsquo;ve <span>Built</span>
            </h1>
            <p className="pf-lead">A showcase of real-world applications, from mobile apps to enterprise web platforms, designed and developed end-to-end.</p>

            {projects.length > 0 ? (
              <ul className="pf-stats">
                {stats
                  .filter((stat) => stat.value > 0)
                  .map((stat) => (
                    <li key={stat.label}>
                      <PIcon name={stat.icon} size={28} />
                      <span>
                        <strong>{stat.value}</strong>
                        <small>{stat.label}</small>
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}

            {featured ? (
              <article className="pf-featured" aria-labelledby="pf-featured-title">
                <div className="pf-featured-head">
                  <span className="pf-app-icon" aria-hidden="true">
                    <PIcon name={categoryIcon(featured.category)} size={30} />
                  </span>
                  <div>
                    <h2 id="pf-featured-title">
                      {featured.title}
                      {featured.category ? <em>{normalizeCategory(featured.category) || featured.category}</em> : null}
                    </h2>
                    {featured.summary ? <p>{featured.summary}</p> : null}
                  </div>
                </div>

                {featured.features.length > 0 ? (
                  <ul className="pf-checks">
                    {featured.features.map((feature) => (
                      <li key={feature}>
                        <span aria-hidden="true">
                          <PIcon name="check" size={14} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="pf-actions">
                  <Link href={`/portfolio/${featured.slug}`} className="pf-btn pf-btn-light">
                    View Case Study <PIcon name="arrow" size={18} />
                  </Link>
                  {featured.link ? (
                    <a href={featured.link} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-ghost">
                      Live {normalizeCategory(featured.category) === "Mobile App" ? "App" : "Site"} <PIcon name="external" size={18} />
                    </a>
                  ) : null}
                </div>

                {featured.platforms.length > 0 ? (
                  <ul className="pf-platforms" aria-label="Available on">
                    {featured.platforms.map((platform) => (
                      <li key={platform}>
                        <PIcon name={platformIcon(platform)} size={22} />
                        {platform}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ) : (
              <p className="pf-lead">Our case studies are being prepared. Please check back soon.</p>
            )}
          </div>

          {showcase ? (
            <div className="pf-showcase">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudUrl(showcase.url, "c_limit,w_1200,f_auto,q_auto")}
                srcSet={[600, 900, 1200].map((w) => `${cloudUrl(showcase.url, `c_limit,w_${w},f_auto,q_auto`)} ${w}w`).join(", ")}
                sizes="(max-width: 1023px) 100vw, 50vw"
                alt={showcase.alt || `${featured?.title} app screens`}
                loading="eager"
                decoding="async"
              />
            </div>
          ) : null}
        </div>
      </section>

      {rest.length > 0 ? (
        <section className="pf-list" aria-labelledby="pf-list-heading">
          <div className="container">
            <h2 id="pf-list-heading" className="sr-only">
              All projects
            </h2>
            <PortfolioGrid
              projects={rest.map((project) => ({
                id: project.id,
                slug: project.slug,
                title: project.title,
                category: project.category,
                summary: project.summary,
                cover: project.cover ? { url: project.cover.url, alt: project.cover.alt } : null,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section className="pf-cta-wrap" aria-labelledby="pf-cta-heading">
        <div className="container">
          <div className="pf-cta">
            <span className="pf-cta-icon" aria-hidden="true">
              <PIcon name="code" size={30} />
            </span>
            <div>
              <h2 id="pf-cta-heading">Have a Project in Mind?</h2>
              <p>Let&rsquo;s build something great together.</p>
            </div>
            <Link href="/contact#consultation" className="pf-btn pf-btn-accent">
              Get a Free Consultation <PIcon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
