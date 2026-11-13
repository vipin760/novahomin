import "server-only";
import { getDb, iso, toId } from "./db";
import { destroyImage, type Uploaded } from "./cloudinary";

export type MediaItem = {
  id: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  alt: string;
  createdAt: string;
};

const collection = async () => (await getDb()).collection("media");

const plain = (row: Record<string, unknown> & { _id: { toString(): string } }): MediaItem => ({
  id: row._id.toString(),
  publicId: String(row.publicId ?? ""),
  url: String(row.url ?? ""),
  width: Number(row.width ?? 0),
  height: Number(row.height ?? 0),
  format: String(row.format ?? ""),
  bytes: Number(row.bytes ?? 0),
  alt: String(row.alt ?? ""),
  createdAt: iso(row.createdAt),
});

export async function listMedia(): Promise<MediaItem[]> {
  return (await (await collection()).find().sort({ createdAt: -1 }).limit(500).toArray()).map(plain);
}

export async function addMedia(upload: Uploaded, alt = ""): Promise<MediaItem> {
  const doc = { ...upload, alt, createdAt: new Date() };
  const result = await (await collection()).insertOne(doc);
  return plain({ _id: result.insertedId, ...doc });
}

export async function setMediaAlt(id: string, alt: string) {
  const _id = toId(id);
  if (_id) await (await collection()).updateOne({ _id }, { $set: { alt: alt.slice(0, 300) } });
}

export async function removeMedia(id: string) {
  const _id = toId(id);
  if (!_id) return;
  const media = await collection();
  const row = await media.findOne({ _id });
  if (!row) return;
  await destroyImage(String(row.publicId));
  await media.deleteOne({ _id });
}
