import "server-only";
import { getDb, iso, toId } from "./db";
import { isStatus, type EnquiryStatus } from "./enquiry-status";

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: EnquiryStatus;
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

let enquiryIndexed = false;
async function enquiries() {
  const collection = (await getDb()).collection("enquiries");
  if (!enquiryIndexed) {
    enquiryIndexed = true;
    await collection.createIndex({ status: 1, createdAt: -1 }).catch(() => undefined);
  }
  return collection;
}

/** Matches enquiries nobody has handled yet, including older rows that have no status field. */
const UNHANDLED = { status: { $nin: ["contacted", "accepted", "rejected"] } };

export async function addEnquiry(input: Omit<Enquiry, "id" | "createdAt" | "status">) {
  const createdAt = new Date();
  const result = await (await enquiries()).insertOne({ ...input, status: "new", createdAt });
  return { id: result.insertedId.toString(), createdAt: createdAt.toISOString(), status: "new", ...input } satisfies Enquiry;
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  const _id = toId(id);
  if (!_id || !isStatus(status)) return;
  await (await enquiries()).updateOne({ _id }, { $set: { status, statusUpdatedAt: new Date() } });
}

export type StatusCounts = Record<EnquiryStatus, number> & { total: number };

export async function statusCounts(): Promise<StatusCounts> {
  const collection = await enquiries();
  const [total, contacted, accepted, rejected] = await Promise.all([
    collection.estimatedDocumentCount(),
    ...(["contacted", "accepted", "rejected"] as const).map((status) => collection.countDocuments({ status })),
  ]);
  return { total, contacted, accepted, rejected, new: Math.max(0, total - contacted - accepted - rejected) };
}

export async function newEnquiryCount() {
  return (await enquiries()).countDocuments(UNHANDLED);
}

export async function latestNewEnquiries(limit = 5) {
  const rows = await (await enquiries()).find(UNHANDLED).sort({ createdAt: -1 }).limit(limit).toArray();
  return rows.map((row) => ({
    id: row._id.toString(),
    name: String(row.name ?? ""),
    service: String(row.service ?? ""),
    createdAt: iso(row.createdAt),
  }));
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

export const ENQUIRY_PAGE_SIZE = 20;

/** Server-side paging: one page of matches plus the total count. */
export async function listEnquiries(query = "", page = 1, status?: EnquiryStatus): Promise<{ items: Enquiry[]; total: number; page: number; pages: number }> {
  const term = query.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const search = term
    ? { $or: ["name", "email", "phone", "service", "message"].map((field) => ({ [field]: { $regex: term, $options: "i" } })) }
    : {};
  const filter = status ? { $and: [search, status === "new" ? UNHANDLED : { status }] } : search;
  const collection = await enquiries();
  const total = await collection.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const rows = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((current - 1) * ENQUIRY_PAGE_SIZE)
    .limit(ENQUIRY_PAGE_SIZE)
    .toArray();
  const items = rows.map((row) => ({
    id: row._id.toString(),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    service: String(row.service ?? ""),
    message: String(row.message ?? ""),
    status: isStatus(row.status) ? row.status : "new",
    createdAt: iso(row.createdAt),
  })) satisfies Enquiry[];
  return { items, total, page: current, pages };
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
