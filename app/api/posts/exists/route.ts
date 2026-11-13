import { dbConfigured } from "@/lib/db";
import { postExists } from "@/lib/posts";
import { projectExists } from "@/lib/projects";

/** Used by proxy.ts to tell a real admin-written page from a missing one (so unknown URLs get a real 404). */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("slug") ?? "";
  if (!dbConfigured() || !slug) return Response.json({ exists: false });
  try {
    return Response.json({ exists: params.get("type") === "project" ? await projectExists(slug) : await postExists(slug) });
  } catch {
    return Response.json({ exists: false });
  }
}
