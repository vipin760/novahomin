import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { articles, type Article } from "./content";
import { dbConfigured } from "./db";
import { listPublishedPosts } from "./posts";
import { listPublishedProjects, type Project } from "./projects";

/**
 * Public reads are cached (tags "posts" / "projects") and refreshed by the admin on save.
 * If MongoDB is not configured or unreachable they quietly return nothing, so the site keeps working.
 */
export async function getAllArticles(): Promise<Article[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("minutes");
  let dynamic: Article[] = [];
  if (dbConfigured()) {
    try {
      dynamic = (await listPublishedPosts()).map((post) => ({
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        topic: post.category,
        tone: "sand",
        body: post.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
        published: post.publishedAt.slice(0, 10),
        cover: post.cover ? { url: post.cover.url, alt: post.cover.alt } : undefined,
      }));
    } catch {
      dynamic = [];
    }
  }
  const taken = new Set(dynamic.map((article) => article.slug));
  return [...dynamic, ...articles.filter((article) => !taken.has(article.slug))];
}

export async function getPublishedProjects(): Promise<Project[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("minutes");
  if (!dbConfigured()) return [];
  try {
    return await listPublishedProjects();
  } catch {
    return [];
  }
}
