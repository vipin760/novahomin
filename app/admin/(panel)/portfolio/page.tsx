import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ConfirmDelete } from "@/components/admin/row-actions";
import { Icon } from "@/components/admin/icons";
import { dbConfigured } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { deleteProjectAction } from "../actions";

type Params = { q?: string; status?: string };

const day = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

export default function PortfolioAdmin(props: { searchParams: Promise<Params> }) {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>
      <PageBody {...props} />
    </Suspense>
  );
}

async function PageBody({ searchParams }: { searchParams: Promise<Params> }) {
  await connection(); // DB-backed and auth-gated: never prerender at build time
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;

  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100).trim();
  const status = params.status === "published" || params.status === "draft" ? params.status : undefined;

  const all = await listProjects();
  const counts = {
    total: all.length,
    published: all.filter((p) => p.status === "published").length,
    draft: all.filter((p) => p.status === "draft").length,
  };
  const needle = q.toLowerCase();
  const projects = all.filter(
    (p) =>
      (!status || p.status === status) &&
      (!needle || [p.title, p.client, p.category, p.summary, ...p.platforms].some((v) => v.toLowerCase().includes(needle))),
  );
  const tabHref = (value?: string) => `/admin/portfolio?${new URLSearchParams({ ...(q ? { q } : {}), ...(value ? { status: value } : {}) })}`;

  return (
    <>
      <div className="enq-head">
        <div>
          <h1>Portfolio</h1>
          <p className="adm-sub">
            {projects.length} {q || status ? `result${projects.length === 1 ? "" : "s"}` : `project${projects.length === 1 ? "" : "s"}`} · published
            projects appear on the Portfolio and home pages
          </p>
        </div>
        <div className="prt-tools">
          <form action="/admin/portfolio" method="get" role="search" className="admin-search enq-search">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <Icon name="search" size={18} />
            <input name="q" type="search" defaultValue={q} placeholder="Search title, client, type…" aria-label="Search projects" maxLength={100} />
            {q ? (
              <Link href={tabHref(status)} className="enq-clear" aria-label="Clear search">
                ×
              </Link>
            ) : null}
          </form>
          <Link className="admin-btn" href="/admin/portfolio/new">
            <Icon name="plus" size={16} /> New project
          </Link>
        </div>
      </div>

      <nav className="enq-tabs" aria-label="Filter by status">
        <Link href={tabHref()} aria-current={!status ? "page" : undefined}>
          All <b>{counts.total}</b>
        </Link>
        <Link href={tabHref("published")} aria-current={status === "published" ? "page" : undefined}>
          Published <b>{counts.published}</b>
        </Link>
        <Link href={tabHref("draft")} aria-current={status === "draft" ? "page" : undefined}>
          Draft <b>{counts.draft}</b>
        </Link>
      </nav>

      {projects.length === 0 ? (
        <div className="adm-card adm-empty enq-empty">
          <p>{q || status ? "No projects match your filters." : "No projects yet. Create your first one to show it on the site."}</p>
        </div>
      ) : (
        <div className="adm-card enq-card">
          <div className="enq-scroll">
            <table className="enq-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Type</th>
                  <th scope="col">Platforms</th>
                  <th scope="col">Status</th>
                  <th scope="col">Order</th>
                  <th scope="col">Added</th>
                  <th scope="col" className="enq-th-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td data-label="Project">
                      <div className="enq-contact">
                        <Link href={`/admin/portfolio/${project.id}`} className="prt-thumb" aria-hidden="true" tabIndex={-1}>
                          {project.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.cover.url} alt="" loading="lazy" />
                          ) : (
                            <Icon name="image" size={20} />
                          )}
                        </Link>
                        <span className="enq-who">
                          <Link href={`/admin/portfolio/${project.id}`} className="prt-title">
                            <strong>{project.title}</strong>
                            {project.featured ? <span className="prt-star">Featured</span> : null}
                          </Link>
                          <span className="adm-vs">{project.client || "No client"}</span>
                        </span>
                      </div>
                    </td>
                    <td data-label="Type">
                      {project.category ? <span className="enq-tag">{project.category}</span> : <span className="adm-vs">No type</span>}
                    </td>
                    <td data-label="Platforms">
                      {project.platforms.length ? (
                        <span className="prt-tags">
                          {project.platforms.map((platform) => (
                            <span key={platform} className="enq-tag">
                              {platform}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="adm-vs">—</span>
                      )}
                    </td>
                    <td data-label="Status">
                      <span className="admin-badge" data-live={project.status === "published" || undefined}>
                        {project.status}
                      </span>
                    </td>
                    <td data-label="Order" className="adm-vs">
                      {project.sortOrder}
                    </td>
                    <td data-label="Added" className="enq-when">
                      <time dateTime={project.createdAt}>
                        <strong>{day(project.createdAt)}</strong>
                      </time>
                    </td>
                    <td className="enq-actions">
                      {project.status === "published" ? (
                        <Link className="enq-act" href={`/portfolio/${project.slug}`} target="_blank" aria-label={`View ${project.title} on the site`} title="View on site">
                          <Icon name="external" size={16} />
                        </Link>
                      ) : null}
                      <Link className="enq-act" href={`/admin/portfolio/${project.id}`} aria-label={`Edit ${project.title}`} title="Edit">
                        <Icon name="pen" size={16} />
                      </Link>
                      <form action={deleteProjectAction}>
                        <input type="hidden" name="id" value={project.id} />
                        <ConfirmDelete name={`“${project.title}”`} noun="project" />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
