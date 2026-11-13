import Link from "next/link";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { dbConfigured } from "@/lib/db";
import { getSmtp } from "@/lib/smtp";
import { countAll } from "@/lib/store";

export default async function Dashboard() {
  const db = dbConfigured();
  let counts: Awaited<ReturnType<typeof countAll>> | null = null;
  let smtpOn = false;
  let dbError = "";
  if (db) {
    try {
      counts = await countAll();
      smtpOn = (await getSmtp()).enabled;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Could not reach MongoDB.";
    }
  }
  const stats: [string, number | string, string][] = [
    ["Enquiries", counts?.enquiries ?? "–", "/admin/enquiries"],
    ["Subscribers", counts?.subscribers ?? "–", "/admin/subscribers"],
    ["Blog posts", counts?.posts ?? "–", "/admin/blog"],
    ["Projects", counts?.projects ?? "–", "/admin/portfolio"],
    ["Images", counts?.media ?? "–", "/admin/media"],
  ];
  return (
    <>
      <h1>Dashboard</h1>
      <ul className="admin-status">
        <li data-ok={db && !dbError ? "" : undefined}>MongoDB: {!db ? "not configured (set MONGODB_URI)" : dbError ? `error – ${dbError}` : "connected"}</li>
        <li data-ok={cloudinaryConfigured() ? "" : undefined}>Cloudinary: {cloudinaryConfigured() ? "configured" : "not configured (set CLOUDINARY_*)"}</li>
        <li data-ok={smtpOn ? "" : undefined}>Email notifications: {smtpOn ? "on" : "off"} (<Link href="/admin/settings">settings</Link>)</li>
      </ul>
      <ul className="admin-stats">
        {stats.map(([label, value, href]) => (
          <li key={label} className="admin-card">
            <Link href={href}>
              <strong>{value}</strong>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
