import "server-only";
import { getDb, iso } from "./db";
import { statusCounts } from "./store";

export const ranges = [7, 30, 90] as const;
export type RangeDays = (typeof ranges)[number];
export const parseRange = (value: string | undefined): RangeDays =>
  ranges.find((days) => String(days) === value) ?? 30;

const DAY = 86_400_000;
const dayStart = (time: number) => Math.floor(time / DAY) * DAY;

export type Point = { date: string; count: number };
export type Metric = { value: number; previous: number; series: Point[] };
export type Activity = { kind: "enquiry" | "subscriber"; label: string; at: string };
export type RecentEnquiry = {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  createdAt: string;
};

/** Percentage change, or null when there is no previous period to compare with. */
export function change(value: number, previous: number) {
  if (previous === 0) return value === 0 ? 0 : null;
  return ((value - previous) / previous) * 100;
}

async function daily(collection: string, from: number, days: number): Promise<Point[]> {
  const rows = await (await getDb())
    .collection(collection)
    .aggregate<{ _id: string; n: number }>([
      { $match: { createdAt: { $gte: new Date(from), $lt: new Date(from + days * DAY) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } },
    ])
    .toArray();
  const byDay = new Map(rows.map((row) => [row._id, row.n]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(from + i * DAY).toISOString().slice(0, 10);
    return { date, count: byDay.get(date) ?? 0 };
  });
}

const count = async (collection: string, from: number, to: number) =>
  (await getDb()).collection(collection).countDocuments({ createdAt: { $gte: new Date(from), $lt: new Date(to) } });

async function uniqueLeads(from: number, to: number) {
  const rows = await (await getDb())
    .collection("enquiries")
    .aggregate<{ n: number }>([
      { $match: { createdAt: { $gte: new Date(from), $lt: new Date(to) } } },
      { $group: { _id: { $toLower: "$email" } } },
      { $count: "n" },
    ])
    .toArray();
  return rows[0]?.n ?? 0;
}

/** Must be called at request time (after `await connection()`), as it reads the clock. */
export async function getDashboard(days: RangeDays) {
  const db = await getDb();
  const now = Date.now();
  const start = dayStart(now) - (days - 1) * DAY;
  const end = start + days * DAY;
  const prevStart = start - days * DAY;

  const [enquirySeries, prevEnquiries, subscriberSeries, prevSubscribers, unique, prevUnique, services, recent, recentSubs, totals, leadStatus] =
    await Promise.all([
      daily("enquiries", start, days),
      count("enquiries", prevStart, start),
      daily("subscribers", start, days),
      count("subscribers", prevStart, start),
      uniqueLeads(start, end),
      uniqueLeads(prevStart, start),
      db
        .collection("enquiries")
        .aggregate<{ _id: string; n: number }>([
          { $match: { createdAt: { $gte: new Date(start), $lt: new Date(end) } } },
          { $group: { _id: { $ifNull: ["$service", ""] }, n: { $sum: 1 } } },
          { $sort: { n: -1 } },
        ])
        .toArray(),
      db.collection("enquiries").find().sort({ createdAt: -1 }).limit(5).toArray(),
      db.collection("subscribers").find().sort({ createdAt: -1 }).limit(4).toArray(),
      Promise.all([db.collection("enquiries").estimatedDocumentCount(), db.collection("subscribers").estimatedDocumentCount()]),
      statusCounts(),
    ]);

  const sum = (series: Point[]) => series.reduce((total, point) => total + point.count, 0);

  const enquiries: Metric = { value: sum(enquirySeries), previous: prevEnquiries, series: enquirySeries };
  const subscribers: Metric = { value: sum(subscriberSeries), previous: prevSubscribers, series: subscriberSeries };

  const recentEnquiries: RecentEnquiry[] = recent.map((row) => ({
    id: row._id.toString(),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    service: String(row.service ?? ""),
    message: String(row.message ?? ""),
    createdAt: iso(row.createdAt),
  }));

  const activity: Activity[] = [
    ...recentEnquiries.map((row) => ({ kind: "enquiry" as const, label: `New enquiry from ${row.name}`, at: row.createdAt })),
    ...recentSubs.map((row) => ({ kind: "subscriber" as const, label: `${String(row.email ?? "")} subscribed`, at: iso(row.createdAt) })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return {
    now,
    days,
    enquiries,
    subscribers,
    unique: { value: unique, previous: prevUnique, series: enquirySeries },
    services: services.map((row) => ({ name: row._id || "Not specified", count: row.n })),
    recentEnquiries,
    activity,
    leadStatus,
    totalEnquiries: totals[0],
    totalSubscribers: totals[1],
  };
}
