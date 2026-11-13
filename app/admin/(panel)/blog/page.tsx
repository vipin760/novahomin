import Link from "next/link";
import { dbConfigured } from "@/lib/db";
import { listPosts } from "@/lib/posts";
import { deletePostAction } from "../actions";

export default async function BlogAdmin() {
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;
  const posts = await listPosts();
  return (
    <>
      <div className="admin-bar">
        <h1>Blog</h1>
        <Link className="admin-btn" href="/admin/blog/new">New article</Link>
      </div>
      <p className="admin-muted">Published articles appear on the Insights page and the home page. The six built-in articles stay as they are.</p>
      {posts.length === 0 ? <p className="admin-muted">No articles yet.</p> : null}
      <ul className="admin-list">
        {posts.map((post) => (
          <li key={post.id} className="admin-card admin-row">
            <span>
              <Link href={`/admin/blog/${post.id}`}><strong>{post.title}</strong></Link>
              <span className="admin-muted"> · {post.category} · </span>
              <span className="admin-badge" data-live={post.status === "published" || undefined}>{post.status}</span>
            </span>
            <span className="admin-actions">
              {post.status === "published" ? <Link className="admin-link" href={`/insights/${post.slug}`} target="_blank">View</Link> : null}
              <Link className="admin-link" href={`/admin/blog/${post.id}`}>Edit</Link>
              <form action={deletePostAction}>
                <input type="hidden" name="id" value={post.id} />
                <button type="submit" className="admin-link-danger">Delete</button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
