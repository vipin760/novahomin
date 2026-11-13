"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/admin/actions";

const nav = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/media", label: "Media library" },
  { href: "/admin/settings", label: "Email (SMTP)" },
];

/** Side drawer: fixed sidebar on desktop, slide-in drawer on small screens. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="admin-layout" data-open={open || undefined}>
      <header className="admin-topbar">
        <button
          type="button"
          className="admin-burger"
          aria-expanded={open}
          aria-controls="admin-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <strong>Novahomin admin</strong>
      </header>
      <button type="button" className="admin-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />
      <aside className="admin-drawer" id="admin-drawer" aria-label="Admin">
        <p className="admin-brand">Novahomin</p>
        <nav>
          <ul>
            {nav.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="admin-drawer-foot">
          <Link href="/" target="_blank" rel="noopener">
            View site ↗
          </Link>
          <form action={logout}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
