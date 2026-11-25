import "server-only";
import { dbConfigured } from "./db";
import { latestNewEnquiries, newEnquiryCount } from "./store";

export type NotificationItem = { id: string; name: string; service: string; ago: string };
export type Notifications = { count: number; items: NotificationItem[] };

function ago(value: string, now: number) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const)
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  return "just now";
}

/** New (unhandled) enquiry count plus the latest few, for the sidebar badge and the bell. Never throws. */
export async function getNotifications(): Promise<Notifications> {
  if (!dbConfigured()) return { count: 0, items: [] };
  try {
    const [count, latest] = await Promise.all([newEnquiryCount(), latestNewEnquiries(5)]);
    const now = Date.now();
    return { count, items: latest.map((row) => ({ id: row.id, name: row.name, service: row.service, ago: ago(row.createdAt, now) })) };
  } catch {
    return { count: 0, items: [] };
  }
}
