import "server-only";
import { getDb, iso, toId } from "./db";
import type { Img } from "./image";
export { postCategories } from "./post-categories";

export type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  cover: Img | null;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

export type PostInput = Omit<Post, "id" | "createdAt" | "updatedAt" | "publishedAt">;

let indexed = false;
const collection = async () => {
  const c = (await getDb()).collection("posts");
  if (!indexed) {
    await c.createIndex({ slug: 1 }, { unique: true });
    indexed = true;
  }
  return c;
};

const plain = (row: Record<string, unknown> & { _id: { toString(): string } }): Post => ({
  id: row._id.toString(),
  slug: String(row.slug ?? ""),
  title: String(row.title ?? ""),
  category: String(row.category ?? ""),
  summary: String(row.summary ?? ""),
  body: String(row.body ?? ""),
  cover: (row.cover as Img | null) ?? null,
  status: row.status === "published" ? "published" : "draft",
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
  publishedAt: iso(row.publishedAt),
});

export async function listPosts(): Promise<Post[]> {
  return (await (await collection()).find().sort({ createdAt: -1 }).toArray()).map(plain);
}

export async function listPublishedPosts(): Promise<Post[]> {
  return (await (await collection()).find({ status: "published" }).sort({ publishedAt: -1 }).toArray()).map(plain);
}

export async function getPost(id: string): Promise<Post | null> {
  const _id = toId(id);
  const row = _id ? await (await collection()).findOne({ _id }) : null;
  return row ? plain(row) : null;
}

export async function slugTaken(slug: string, exceptId?: string) {
  const row = await (await collection()).findOne({ slug });
  return Boolean(row && row._id.toString() !== exceptId);
}

export async function postExists(slug: string) {
  return Boolean(await (await collection()).findOne({ slug, status: "published" }, { projection: { _id: 1 } }));
}

export async function savePost(input: PostInput, id?: string) {
  const posts = await collection();
  const now = new Date();
  if (id) {
    const _id = toId(id);
    if (!_id) return;
    const existing = await posts.findOne({ _id });
    const publishedAt =
      input.status === "published" ? ((existing?.publishedAt as Date | undefined) ?? now) : (existing?.publishedAt ?? null);
    await posts.updateOne({ _id }, { $set: { ...input, updatedAt: now, publishedAt } });
    return;
  }
  await posts.insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === "published" ? now : null,
  });
}

export async function deletePost(id: string) {
  const _id = toId(id);
  if (_id) await (await collection()).deleteOne({ _id });
}
