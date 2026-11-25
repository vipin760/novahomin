import { isAdmin } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

/** Polled by the admin shell so the sidebar badge and bell stay current. Admin only. */
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  return Response.json(await getNotifications(), { headers: { "cache-control": "no-store" } });
}
