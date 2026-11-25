import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CopyButton, ConfirmDelete } from "@/components/admin/row-actions";
import { StatusSelect } from "@/components/admin/status-select";
import { Icon } from "@/components/admin/icons";
import { dbConfigured } from "@/lib/db";
import { ENQUIRY_STATUSES, isStatus } from "@/lib/enquiry-status";
import { listEnquiries, statusCounts } from "@/lib/store";
import { removeEnquiry } from "../actions";

const day = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
const time = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) + " UTC";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export default function EnquiriesPage(props: { searchParams: Promise<{ q?: string; page?: string; status?: string }> }) {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>
      <PageBody {...props} />
    </Suspense>
  );
}

async function PageBody({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; status?: string }> }) {
  await connection(); // DB-backed and auth-gated: never prerender at build time
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;

  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const status = isStatus(params.status) ? params.status : undefined;
  const [{ items, total, page, pages }, counts] = await Promise.all([listEnquiries(q, Number(params.page) || 1, status), statusCounts()]);
  const href = (n: number) =>
    `/admin/enquiries?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`;
  const tabHref = (value?: string) => `/admin/enquiries?${new URLSearchParams({ ...(q ? { q } : {}), ...(value ? { status: value } : {}) })}`;

  return (
    <>
      <div className="enq-head">
        <div>
          <h1>Enquiries</h1>
          <p className="adm-sub">
            {total} {q ? `result${total === 1 ? "" : "s"} for “${q}”` : `enquir${total === 1 ? "y" : "ies"} received`}
          </p>
        </div>
        <form action="/admin/enquiries" method="get" role="search" className="admin-search enq-search">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Icon name="search" size={18} />
          <input name="q" type="search" defaultValue={q} placeholder="Search name, email, service…" aria-label="Search enquiries" maxLength={100} />
          {q ? (
            <Link href="/admin/enquiries" className="enq-clear" aria-label="Clear search">
              ×
            </Link>
          ) : null}
        </form>
      </div>

      <nav className="enq-tabs" aria-label="Filter by status">
        <Link href={tabHref()} aria-current={!status ? "page" : undefined}>
          All <b>{counts.total}</b>
        </Link>
        {ENQUIRY_STATUSES.map((entry) => (
          <Link key={entry.value} href={tabHref(entry.value)} aria-current={status === entry.value ? "page" : undefined} data-status={entry.value}>
            {entry.label} <b>{counts[entry.value]}</b>
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="adm-card adm-empty enq-empty">
          <p>{q ? "No enquiries match your search." : "No enquiries yet. Submissions from the contact form will appear here."}</p>
        </div>
      ) : (
        <div className="adm-card enq-card">
          <div className="enq-scroll">
            <table className="enq-table">
              <thead>
                <tr>
                  <th scope="col">Contact</th>
                  <th scope="col">Service</th>
                  <th scope="col">Message</th>
                  <th scope="col">Status</th>
                  <th scope="col">Received</th>
                  <th scope="col" className="enq-th-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Contact">
                      <div className="enq-contact">
                        <span className="enq-avatar" aria-hidden="true">
                          {initials(item.name)}
                        </span>
                        <span className="enq-who">
                          <strong>{item.name}</strong>
                          <a href={`mailto:${item.email}`}>{item.email}</a>
                          {item.phone ? <a href={`tel:${item.phone.replace(/[^\d+]/g, "")}`}>{item.phone}</a> : null}
                        </span>
                      </div>
                    </td>
                    <td data-label="Service">
                      {item.service ? <span className="enq-tag">{item.service}</span> : <span className="adm-vs">Not specified</span>}
                    </td>
                    <td data-label="Message" className="enq-msg">
                      <details>
                        <summary>
                          <span className="enq-preview">{item.message}</span>
                          <span className="enq-toggle" aria-hidden="true" />
                        </summary>
                        <p>{item.message}</p>
                      </details>
                    </td>
                    <td data-label="Status">
                      <StatusSelect id={item.id} value={item.status} name={item.name} />
                    </td>
                    <td data-label="Received" className="enq-when">
                      <time dateTime={item.createdAt}>
                        <strong>{day(item.createdAt)}</strong>
                        <span>{time(item.createdAt)}</span>
                      </time>
                    </td>
                    <td className="enq-actions">
                      <a
                        className="enq-act"
                        href={`mailto:${item.email}?subject=${encodeURIComponent("Re: your enquiry to Novahomin")}`}
                        aria-label={`Reply to ${item.name}`}
                        title="Reply by email"
                      >
                        <Icon name="reply" size={16} />
                      </a>
                      <CopyButton text={item.email} label={`Copy email of ${item.name}`} />
                      <form action={removeEnquiry}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmDelete name={item.name} />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <nav className="enq-pager" aria-label="Pagination">
              <span className="adm-vs">
                Page {page} of {pages}
              </span>
              <span className="enq-pager-links">
                {page > 1 ? <Link href={href(page - 1)} rel="prev">Previous</Link> : <span aria-disabled="true">Previous</span>}
                {page < pages ? <Link href={href(page + 1)} rel="next">Next</Link> : <span aria-disabled="true">Next</span>}
              </span>
            </nav>
          ) : null}
        </div>
      )}
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
