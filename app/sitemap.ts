import type { MetadataRoute } from "next";
import { getAllArticles, getPublishedProjects } from "@/lib/public-content";
import { serveCategories } from "@/lib/serve";
import { siteOrigin } from "@/lib/site";

const pages = ["", "/about", "/services", "/pricing", "/insights", "/portfolio", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  if (!origin) return [];
  const [articles, projects] = await Promise.all([getAllArticles(), getPublishedProjects()]);
  return [
    ...pages.map((path) => ({ url: `${origin}${path}`, priority: path ? 0.8 : 1 })),
    ...serveCategories.map((c) => ({ url: `${origin}/services/${c.slug}`, priority: 0.7 })),
    ...projects.map((project) => ({ url: `${origin}/portfolio/${project.slug}`, priority: 0.6 })),
    ...articles.map((article) => ({ url: `${origin}/insights/${article.slug}`, priority: 0.6 })),
  ];
}
