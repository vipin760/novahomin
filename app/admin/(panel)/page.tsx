import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AreaChart, Donut, Sparkline } from "@/components/admin/charts";
import { Icon, type IconName } from "@/components/admin/icons";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { change, getDashboard, parseRange, ranges, type Metric } from "@/lib/dashboard";
import { dbConfigured } from "@/lib/db";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-status";
import { getSmtp } from "@/lib/smtp";

const number = new Intl.NumberFormat("en-GB");

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

function ago(value: string, now: number) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  return "just now";
}

function Delta({ value, previous, days }: { value: number; previous: number; days: number }) {
  const pct = change(value, previous);
  if (pct === null) return <span className="adm-delta" data-trend="new">New</span>;
  const dir = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return (
    <span className="adm-delta" data-trend={dir}>
      {dir === "flat" ? null : <Icon name={dir === "up" ? "arrowUp" : "arrowDown"} size={14} />}
      <span>{Math.abs(pct).toFixed(1)}%</span>
      <span className="adm-vs">vs previous {days} days</span>
    </span>
  );
}

function Kpi({
  label,
  icon,
  tone,
  metric,
  days,
}: {
  label: string;
  icon: IconName;
  tone: "violet" | "blue" | "green" | "amber";
  metric: Metric;
  days: number;
}) {
  return (
    <li className="adm-card adm-kpi" data-tone={tone}>
      <span className="adm-kpi-icon">
        <Icon name={icon} />
      </span>
      <div className="adm-kpi-body">
        <p>{label}</p>
        <strong>{number.format(metric.value)}</strong>
        <Delta value={metric.value} previous={metric.previous} days={days} />
      </div>
      <Sparkline series={metric.series} tone={tone} />
    </li>
  );
}

const actions: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/enquiries", label: "View enquiries", icon: "mail" },
  { href: "/admin/portfolio/new", label: "Add new project", icon: "plus" },
  { href: "/admin/blog/new", label: "Create blog post", icon: "pen" },
  { href: "/admin/media", label: "Open media library", icon: "image" },
];

export default function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading dashboard" />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await connection();
  const days = parseRange((await searchParams).range);
  const raw = (process.env.USER_NAME ?? "there").split("@")[0];
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  const header = (
    <div className="adm-head">
      <div>
        <h1>Welcome back, {name}</h1>
        <p className="adm-sub">Here&apos;s what&apos;s happening with your website.</p>
      </div>
      <nav className="adm-range" aria-label="Date range">
        {ranges.map((r) => (
          <Link key={r} href={r === 30 ? "/admin" : `/admin?range=${r}`} aria-current={r === days ? "true" : undefined} scroll={false}>
            {r === 7 ? "7 days" : r === 30 ? "30 days" : "90 days"}
          </Link>
        ))}
      </nav>
    </div>
  );

  if (!dbConfigured())
    return (
      <>
        {header}
        <p className="admin-error">MongoDB is not configured. Set MONGODB_URI in .env.</p>
      </>
    );

  let data: Awaited<ReturnType<typeof getDashboard>>;
  let smtpOn = false;
  try {
    [data, smtpOn] = await Promise.all([getDashboard(days), getSmtp().then((s) => s.enabled)]);
  } catch (error) {
    return (
      <>
        {header}
        <p className="admin-error" role="alert">
          Could not reach MongoDB{error instanceof Error ? `: ${error.message}` : "."} Check that the database is running and MONGODB_URI is correct.
        </p>
      </>
    );
  }

  const now = data.now;
  const empty = data.totalEnquiries === 0;

  return (
    <>
      {header}

      <ul className="adm-kpis">
        <Kpi label="Enquiries / leads" icon="mail" tone="violet" metric={data.enquiries} days={days} />
        <Kpi label="Unique leads" icon="user" tone="blue" metric={data.unique} days={days} />
        <Kpi label="Subscribers" icon="users" tone="green" metric={data.subscribers} days={days} />
        <li className="adm-card adm-kpi adm-kpi-setup" data-tone="amber">
          <span className="adm-kpi-icon">
            <Icon name="chart" />
          </span>
          <div className="adm-kpi-body">
            <p>Visitors &amp; page views</p>
            <strong className="adm-setup-title">Not connected</strong>
            <span className="adm-vs">Connect Google Analytics 4 to see real traffic.</span>
          </div>
        </li>
      </ul>

      <div className="adm-grid">
        <div className="adm-main-col">
          <div className="adm-split">
            <section className="adm-card adm-panel" aria-labelledby="adm-trend">
              <header>
                <h2 id="adm-trend">Enquiry trend</h2>
                <span className="adm-pill">Last {days} days</span>
              </header>
              <AreaChart series={data.enquiries.series} label={`Enquiries per day over the last ${days} days`} />
            </section>

            <section className="adm-card adm-panel" aria-labelledby="adm-service">
              <header>
                <h2 id="adm-service">Enquiries by service</h2>
              </header>
              {data.enquiries.value === 0 ? (
                <p className="adm-empty">No enquiries in this period.</p>
              ) : (
                <Donut items={data.services} total={data.enquiries.value} caption="Enquiries" />
              )}
            </section>
          </div>

          <section className="adm-card adm-panel" aria-labelledby="adm-recent">
            <header>
              <h2 id="adm-recent">Recent enquiries</h2>
              <Link href="/admin/enquiries" className="adm-link">
                View all <Icon name="chevron" size={14} />
              </Link>
            </header>
            {data.recentEnquiries.length === 0 ? (
              <div className="adm-empty">
                <p>{empty ? "No enquiries yet. Submissions from the contact form will appear here." : "No recent enquiries."}</p>
              </div>
            ) : (
              <div className="adm-tablewrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col" className="adm-hide-sm">Service</th>
                      <th scope="col" className="adm-hide-md">Message</th>
                      <th scope="col">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEnquiries.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                          <a href={`mailto:${row.email}`}>{row.email}</a>
                        </td>
                        <td className="adm-hide-sm">{row.service || "—"}</td>
                        <td className="adm-hide-md adm-clip">{row.message}</td>
                        <td className="adm-nowrap">{dateTime(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="adm-side-col">
          <section className="adm-card adm-panel" aria-labelledby="adm-leads">
            <header>
              <h2 id="adm-leads">Lead status</h2>
              <Link href="/admin/enquiries" className="adm-link">
                Manage <Icon name="chevron" size={14} />
              </Link>
            </header>
            <ul className="adm-leads">
              {ENQUIRY_STATUSES.map((entry) => {
                const value = data.leadStatus[entry.value];
                const pct = data.leadStatus.total ? Math.round((value / data.leadStatus.total) * 100) : 0;
                return (
                  <li key={entry.value} data-status={entry.value}>
                    <Link href={`/admin/enquiries?status=${entry.value}`}>
                      <span className="adm-leads-label">{entry.label}</span>
                      <strong>{value}</strong>
                      <span className="adm-leads-bar" aria-hidden="true">
                        <span style={{ width: `${pct}%` }} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="adm-card adm-panel" aria-labelledby="adm-activity">
            <header>
              <h2 id="adm-activity">Recent activity</h2>
            </header>
            {data.activity.length === 0 ? (
              <p className="adm-empty">Nothing yet.</p>
            ) : (
              <ul className="adm-activity">
                {data.activity.map((item, i) => (
                  <li key={i}>
                    <span className="adm-activity-icon" data-kind={item.kind}>
                      <Icon name={item.kind === "enquiry" ? "mail" : "users"} size={16} />
                    </span>
                    <span className="adm-activity-text">{item.label}</span>
                    <time dateTime={item.at}>{ago(item.at, now)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="adm-card adm-panel" aria-labelledby="adm-actions">
            <header>
              <h2 id="adm-actions">Quick actions</h2>
            </header>
            <ul className="adm-actions">
              {actions.map((action) => (
                <li key={action.href}>
                  <Link href={action.href}>
                    <Icon name={action.icon} size={18} />
                    <span>{action.label}</span>
                    <Icon name="chevron" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="adm-card adm-panel" aria-labelledby="adm-health">
            <header>
              <h2 id="adm-health">System status</h2>
            </header>
            <ul className="adm-health">
              <li data-ok>MongoDB connected</li>
              <li data-ok={cloudinaryConfigured() ? "" : undefined}>Cloudinary {cloudinaryConfigured() ? "configured" : "not configured"}</li>
              <li data-ok={smtpOn ? "" : undefined}>
                Email notifications {smtpOn ? "on" : "off"} <Link href="/admin/settings">Settings</Link>
              </li>
              <li>Google Analytics not connected</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
