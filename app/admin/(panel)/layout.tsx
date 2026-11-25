import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { isAdmin } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

// Auth-gated: the guard redirects per request, so this segment is never prerenderable.
// Opt out of dev-time instant-navigation validation (it trips on the NEXT_REDIRECT).
export const instant = false;

async function Guard({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const notifications = await getNotifications();
  return (
    <AdminShell username={process.env.USER_NAME ?? "admin"} role="Super Admin" notifications={notifications}>
      <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>{children}</Suspense>
    </AdminShell>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="admin-muted admin-loading">Loading…</p>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
