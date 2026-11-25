"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Notifications } from "@/lib/notifications";
import { logout } from "@/app/admin/actions";
import { Icon, type IconName } from "./icons";

type Item = { href: string; label: string; icon: IconName; exact?: boolean };

const groups: { label: string; items: Item[] }[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", exact: true }] },
  {
    label: "Leads & customers",
    items: [
      { href: "/admin/enquiries", label: "Enquiries", icon: "mail" },
      { href: "/admin/subscribers", label: "Subscribers", icon: "users" },
    ],
  },
  {
    label: "Website content",
    items: [
      { href: "/admin/portfolio", label: "Portfolio / Projects", icon: "folder" },
      { href: "/admin/blog", label: "Blog", icon: "blog" },
      { href: "/admin/media", label: "Media library", icon: "image" },
    ],
  },
  { label: "System", items: [{ href: "/admin/settings", label: "Email & alerts", icon: "settings" }] },
];

const MOBILE = "(max-width: 899px)";
const KEY = "nh_admin_collapsed";

function subscribeMobile(notify: () => void) {
  const query = window.matchMedia(MOBILE);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function subscribeCollapsed(notify: () => void) {
  window.addEventListener(KEY, notify);
  return () => window.removeEventListener(KEY, notify);
}

/** Dark sidebar: collapsible on desktop, off-canvas drawer on small screens. */
export function AdminShell({
  children,
  username,
  role,
  notifications: initialNotifications,
}: {
  children: React.ReactNode;
  username: string;
  role: string;
  notifications: Notifications;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const [live, setLive] = useState<{ source: Notifications; data: Notifications }>({ source: initialNotifications, data: initialNotifications });
  // A fresh server render (navigation, status change) replaces whatever the poll last fetched.
  const notifications = live.source === initialNotifications ? live.data : initialNotifications;
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE).matches, () => false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, () => localStorage.getItem(KEY) === "1", () => false);

  // Navigating closes the drawer (state adjusted during render, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Keep the badge and bell current while the admin stays open on one page.
  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/admin/notifications", { cache: "no-store" });
        if (!response.ok || stopped) return;
        const data = (await response.json()) as Notifications;
        setLive({ source: initialNotifications, data });
      } catch {
        /* offline or signed out: keep what we have */
      }
    };
    const timer = setInterval(poll, 30_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [initialNotifications]);

  // Drawer open: Escape closes it and the page behind cannot scroll.
  useEffect(() => {
    if (!open) return;
    const surface = document.querySelector<HTMLElement>(".admin");
    const previous = surface?.style.overflow ?? "";
    if (surface) surface.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (surface) surface.style.overflow = previous;
    };
  }, [open]);

  const toggle = () => {
    if (mobile) return setOpen((value) => !value);
    localStorage.setItem(KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(KEY));
  };

  const initials = username.slice(0, 2).toUpperCase() || "AD";

  return (
    <div className="admin-layout" data-open={open || undefined} data-collapsed={(!mobile && collapsed) || undefined}>
      <button type="button" className="admin-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />

      <aside className="admin-drawer" id="admin-drawer" aria-label="Admin" inert={mobile && !open}>
        <Link href="/admin" className="admin-brandrow" aria-label="Novahomin admin home">
          <span className="admin-brandlogo">
            <Image src="/logo-nova.png" alt="" width={26} height={26} />
          </span>
          <span className="admin-brandname">Novahomin</span>
        </Link>

        <nav aria-label="Admin sections">
          {groups.map((group) => (
            <div key={group.label} className="admin-navgroup">
              <p className="admin-navlabel">{group.label}</p>
              <ul>
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link href={item.href} aria-current={active ? "page" : undefined} title={item.label}>
                        <Icon name={item.icon} />
                        <span className="admin-navtext">{item.label}</span>
                        {item.href === "/admin/enquiries" && notifications.count > 0 ? (
                          <span className="admin-navbadge" aria-label={`${notifications.count} new`}>
                            {notifications.count > 99 ? "99+" : notifications.count}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-drawer-foot">
          <Link href="/" target="_blank" rel="noopener" title="View site">
            <Icon name="external" />
            <span className="admin-navtext">View site</span>
          </Link>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-iconbtn"
            aria-expanded={mobile ? open : !collapsed}
            aria-controls="admin-drawer"
            aria-label={mobile ? (open ? "Close menu" : "Open menu") : collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggle}
          >
            <Icon name="menu" />
          </button>

          <form action="/admin/enquiries" method="get" role="search" className="admin-search">
            <Icon name="search" size={18} />
            <input
              name="q"
              type="search"
              placeholder="Search enquiries…"
              aria-label="Search enquiries"
              autoComplete="off"
              maxLength={100}
            />
          </form>

          <details className="admin-bell">
            <summary aria-label={notifications.count ? `Notifications, ${notifications.count} new` : "Notifications"}>
              <Icon name="bell" />
              {notifications.count > 0 ? <span className="admin-bell-dot">{notifications.count > 9 ? "9+" : notifications.count}</span> : null}
            </summary>
            <div className="admin-bellmenu">
              <p className="admin-bell-title">
                {notifications.count ? `${notifications.count} new enquir${notifications.count === 1 ? "y" : "ies"}` : "No new enquiries"}
              </p>
              {notifications.items.length > 0 ? (
                <ul>
                  {notifications.items.map((item) => (
                    <li key={item.id}>
                      <Link href="/admin/enquiries?status=new">
                        <span className="admin-bell-icon" aria-hidden="true">
                          <Icon name="mail" size={16} />
                        </span>
                        <span className="admin-bell-text">
                          <strong>{item.name}</strong>
                          <small>{item.service || "New enquiry"}</small>
                        </span>
                        <time>{item.ago}</time>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-bell-empty">You&apos;re all caught up.</p>
              )}
              <Link href="/admin/enquiries" className="admin-bell-all">
                View all enquiries
              </Link>
            </div>
          </details>

          <details className="admin-user">
            <summary aria-label="Account menu">
              <span className="admin-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="admin-usertext">
                <strong>{username.split("@")[0]}</strong>
                <small>{role}</small>
              </span>
              <Icon name="down" size={16} />
            </summary>
            <div className="admin-usermenu">
              <Link href="/" target="_blank" rel="noopener">
                <Icon name="globe" size={18} /> View site
              </Link>
              <Link href="/admin/settings">
                <Icon name="settings" size={18} /> Settings
              </Link>
              <form action={logout}>
                <button type="submit">
                  <Icon name="logout" size={18} /> Sign out
                </button>
              </form>
            </div>
          </details>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
