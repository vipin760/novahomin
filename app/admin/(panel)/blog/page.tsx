import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ConfirmDelete } from "@/components/admin/row-actions";
import { Icon } from "@/components/admin/icons";
import { dbConfigured } from "@/lib/db";
import { listPosts } from "@/lib/posts";
import { deletePostAction } from "../actions";

type Params = { q?: string; status?: string };

const day = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

export default function BlogAdmin(props: { searchParams: Promise<Params> }) {
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

  const all = await listPosts();
  const counts = {
    total: all.length,
    published: all.filter((p) => p.status === "published").length,
    draft: all.filter((p) => p.status === "draft").length,
  };
  const needle = q.toLowerCase();
  const posts = all.filter(
    (p) => (!status || p.status === status) && (!needle || [p.title, p.category, p.summary].some((v) => v.toLowerCase().includes(needle))),
  );
  const tabHref = (value?: string) => `/admin/blog?${new URLSearchParams({ ...(q ? { q } : {}), ...(value ? { status: value } : {}) })}`;

  return (
    <>
      <div className="enq-head">
        <div>
          <h1>Blog</h1>
          <p className="adm-sub">
            {posts.length} {q || status ? `result${posts.length === 1 ? "" : "s"}` : `article${posts.length === 1 ? "" : "s"}`} · published articles
            appear on the Insights and home pages; the six built-in articles stay as they are
          </p>
        </div>
        <div className="prt-tools">
          <form action="/admin/blog" method="get" role="search" className="admin-search enq-search">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <Icon name="search" size={18} />
            <input name="q" type="search" defaultValue={q} placeholder="Search title, category…" aria-label="Search articles" maxLength={100} />
            {q ? (
              <Link href={tabHref(status)} className="enq-clear" aria-label="Clear search">
                ×
              </Link>
            ) : null}
          </form>
          <Link className="admin-btn" href="/admin/blog/new">
            <Icon name="plus" size={16} /> New article
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

      {posts.length === 0 ? (
        <div className="adm-card adm-empty enq-empty">
          <p>{q || status ? "No articles match your filters." : "No articles yet. Write your first one to show it on the Insights page."}</p>
        </div>
      ) : (
        <div className="adm-card enq-card">
          <div className="enq-scroll">
            <table className="enq-table">
              <thead>
                <tr>
                  <th scope="col">Article</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Published</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="enq-th-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td data-label="Article">
                      <div className="enq-contact">
                        <Link href={`/admin/blog/${post.id}`} className="prt-thumb" aria-hidden="true" tabIndex={-1}>
                          {post.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.cover.url} alt="" loading="lazy" />
                          ) : (
                            <Icon name="blog" size={20} />
                          )}
                        </Link>
                        <span className="enq-who">
                          <Link href={`/admin/blog/${post.id}`} className="prt-title">
                            <strong>{post.title}</strong>
                          </Link>
                          {post.summary ? <span className="adm-vs blg-summary">{post.summary}</span> : null}
                        </span>
                      </div>
                    </td>
                    <td data-label="Category">
                      {post.category ? <span className="enq-tag">{post.category}</span> : <span className="adm-vs">None</span>}
                    </td>
                    <td data-label="Status">
                      <span className="admin-badge" data-live={post.status === "published" || undefined}>
                        {post.status}
                      </span>
                    </td>
                    <td data-label="Published" className="enq-when">
                      {post.publishedAt ? (
                        <time dateTime={post.publishedAt}>
                          <strong>{day(post.publishedAt)}</strong>
                        </time>
                      ) : (
                        <span className="adm-vs">—</span>
                      )}
                    </td>
                    <td data-label="Updated" className="enq-when">
                      <time dateTime={post.updatedAt}>
                        <strong>{day(post.updatedAt)}</strong>
                      </time>
                    </td>
                    <td className="enq-actions">
                      {post.status === "published" ? (
                        <Link className="enq-act" href={`/insights/${post.slug}`} target="_blank" aria-label={`View ${post.title} on the site`} title="View on site">
                          <Icon name="external" size={16} />
                        </Link>
                      ) : null}
                      <Link className="enq-act" href={`/admin/blog/${post.id}`} aria-label={`Edit ${post.title}`} title="Edit">
                        <Icon name="pen" size={16} />
                      </Link>
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <ConfirmDelete name={`“${post.title}”`} noun="article" />
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
