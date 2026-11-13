import Link from "next/link";
import { dbConfigured } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { deleteProjectAction } from "../actions";

export default async function PortfolioAdmin() {
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;
  const projects = await listProjects();
  return (
    <>
      <div className="admin-bar">
        <h1>Portfolio</h1>
        <Link className="admin-btn" href="/admin/portfolio/new">New project</Link>
      </div>
      <p className="admin-muted">Published projects appear on the Portfolio page and the home page.</p>
      {projects.length === 0 ? <p className="admin-muted">No projects yet.</p> : null}
      <ul className="admin-list">
        {projects.map((project) => (
          <li key={project.id} className="admin-card admin-row">
            <span>
              <Link href={`/admin/portfolio/${project.id}`}><strong>{project.title}</strong></Link>
              <span className="admin-muted"> · {project.category || "No type"} · </span>
              <span className="admin-badge" data-live={project.status === "published" || undefined}>{project.status}</span>
            </span>
            <span className="admin-actions">
              {project.status === "published" ? <Link className="admin-link" href={`/portfolio/${project.slug}`} target="_blank">View</Link> : null}
              <Link className="admin-link" href={`/admin/portfolio/${project.id}`}>Edit</Link>
              <form action={deleteProjectAction}>
                <input type="hidden" name="id" value={project.id} />
                <button type="submit" className="admin-link-danger">Delete</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
