import "server-only";
import { getDb, iso, toId } from "./db";
import type { Img } from "./image";

export type Project = {
  id: string;
  slug: string;
  title: string;
  client: string;
  category: string;
  summary: string;
  description: string;
  link: string;
  cover: Img | null;
  /** Large showcase image for the featured spot (falls back to the cover). */
  hero: Img | null;
  gallery: Img[];
  features: string[];
  platforms: string[];
  featured: boolean;
  status: "draft" | "published";
  sortOrder: number;
  createdAt: string;
};

export type ProjectInput = Omit<Project, "id" | "createdAt">;

let indexed = false;
const collection = async () => {
  const c = (await getDb()).collection("projects");
  if (!indexed) {
    await c.createIndex({ slug: 1 }, { unique: true });
    indexed = true;
  }
  return c;
};

const plain = (row: Record<string, unknown> & { _id: { toString(): string } }): Project => ({
  id: row._id.toString(),
  slug: String(row.slug ?? ""),
  title: String(row.title ?? ""),
  client: String(row.client ?? ""),
  category: String(row.category ?? ""),
  summary: String(row.summary ?? ""),
  description: String(row.description ?? ""),
  link: String(row.link ?? ""),
  cover: (row.cover as Img | null) ?? null,
  hero: (row.hero as Img | null) ?? null,
  gallery: Array.isArray(row.gallery) ? (row.gallery as Img[]) : [],
  features: Array.isArray(row.features) ? row.features.map(String) : [],
  platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
  featured: Boolean(row.featured),
  status: row.status === "published" ? "published" : "draft",
  sortOrder: Number(row.sortOrder ?? 0),
  createdAt: iso(row.createdAt),
});

export async function listProjects(): Promise<Project[]> {
  return (await (await collection()).find().sort({ sortOrder: 1, createdAt: -1 }).toArray()).map(plain);
}

export async function listPublishedProjects(): Promise<Project[]> {
  return (
    await (await collection()).find({ status: "published" }).sort({ sortOrder: 1, createdAt: -1 }).toArray()
  ).map(plain);
}

export async function getProject(id: string): Promise<Project | null> {
  const _id = toId(id);
  const row = _id ? await (await collection()).findOne({ _id }) : null;
  return row ? plain(row) : null;
}

export async function projectSlugTaken(slug: string, exceptId?: string) {
  const row = await (await collection()).findOne({ slug });
  return Boolean(row && row._id.toString() !== exceptId);
}

export async function saveProject(input: ProjectInput, id?: string) {
  const projects = await collection();
  if (id) {
    const _id = toId(id);
    if (_id) await projects.updateOne({ _id }, { $set: { ...input, updatedAt: new Date() } });
    return;
  }
  await projects.insertOne({ ...input, createdAt: new Date(), updatedAt: new Date() });
}

export async function deleteProject(id: string) {
  const _id = toId(id);
  if (_id) await (await collection()).deleteOne({ _id });
}

export async function projectExists(slug: string) {
  return Boolean(await (await collection()).findOne({ slug, status: "published" }, { projection: { _id: 1 } }));
}
