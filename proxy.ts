import { NextResponse, type NextRequest } from "next/server";
import { articles } from "@/lib/content";

const known = new Set(articles.map((article) => article.slug));

/**
 * Unknown article / project slugs: with Cache Components the page shell streams before
 * notFound() runs, so the response would be a 200. Rewriting to an unmatched path here,
 * before rendering, serves the not-found page with a real 404. Built-in articles pass
 * straight through; anything else is checked against what is published in the admin.
 */
export async function proxy(request: NextRequest) {
  const [, section, rawSlug] = request.nextUrl.pathname.split("/");
  if (!rawSlug) return NextResponse.next();
  const slug = decodeURIComponent(rawSlug);
  if (section === "insights" && known.has(slug)) return NextResponse.next();

  const check = new URL("/api/posts/exists", request.url);
  check.searchParams.set("slug", slug);
  if (section === "portfolio") check.searchParams.set("type", "project");
  const exists = await fetch(check, { cache: "no-store" })
    .then((response) => response.json() as Promise<{ exists?: boolean }>)
    .then((data) => Boolean(data.exists))
    .catch(() => false);
  return exists ? NextResponse.next() : NextResponse.rewrite(new URL("/__not-found", request.url));
}

export const config = {
  matcher: ["/insights/:slug", "/portfolio/:slug"],
};
