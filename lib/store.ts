import "server-only";
import { getDb, iso, toId } from "./db";

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  createdAt: string;
};
export type Subscriber = { id: string; email: string; createdAt: string };

let indexed = false;
async function subscribers() {
  const collection = (await getDb()).collection("subscribers");
  if (!indexed) {
    await collection.createIndex({ emailKey: 1 }, { unique: true });
    indexed = true;
  }
  return collection;
}

export async function addEnquiry(input: Omit<Enquiry, "id" | "createdAt">) {
  const createdAt = new Date();
  const result = await (await getDb()).collection("enquiries").insertOne({ ...input, createdAt });
  return { id: result.insertedId.toString(), createdAt: createdAt.toISOString(), ...input } satisfies Enquiry;
}

/** Returns false when the address is already subscribed (case-insensitive). */
export async function addSubscriber(email: string) {
  const result = await (await subscribers()).updateOne(
    { emailKey: email.toLowerCase() },
    { $setOnInsert: { email, emailKey: email.toLowerCase(), createdAt: new Date() } },
    { upsert: true },
  );
  return result.upsertedCount === 1;
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const rows = await (await getDb()).collection("enquiries").find().sort({ createdAt: -1 }).limit(500).toArray();
  return rows.map((row) => ({
    id: row._id.toString(),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    service: String(row.service ?? ""),
    message: String(row.message ?? ""),
    createdAt: iso(row.createdAt),
  }));
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const rows = await (await subscribers()).find().sort({ createdAt: -1 }).limit(2000).toArray();
  return rows.map((row) => ({ id: row._id.toString(), email: String(row.email ?? ""), createdAt: iso(row.createdAt) }));
}

export async function deleteEnquiry(id: string) {
  const _id = toId(id);
  if (_id) await (await getDb()).collection("enquiries").deleteOne({ _id });
}

export async function deleteSubscriber(id: string) {
  const _id = toId(id);
  if (_id) await (await subscribers()).deleteOne({ _id });
}

export async function countAll() {
  const db = await getDb();
  const [enquiries, subs, posts, projects, media] = await Promise.all(
    ["enquiries", "subscribers", "posts", "projects", "media"].map((name) => db.collection(name).countDocuments()),
  );
  return { enquiries, subscribers: subs, posts, projects, media };
}
