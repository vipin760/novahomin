import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { isAdmin } from "@/lib/auth";

async function Guard({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="admin-muted admin-loading">Loading…</p>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
