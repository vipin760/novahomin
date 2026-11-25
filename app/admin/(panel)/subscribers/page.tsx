import { Suspense } from "react";
import { connection } from "next/server";
import { dbConfigured } from "@/lib/db";
import { listSubscribers } from "@/lib/store";
import { removeSubscriber } from "../actions";

export default function SubscribersPage() {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>
      <PageBody />
    </Suspense>
  );
}

async function PageBody() {
  await connection(); // DB-backed and auth-gated: never prerender at build time
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;
  const items = await listSubscribers();
  return (
    <>
      <h1>Subscribers</h1>
      {items.length === 0 ? <p className="admin-muted">No subscribers yet.</p> : null}
      <ul className="admin-list">
        {items.map((item) => (
          <li key={item.id} className="admin-card admin-row">
            <span>
              <a href={`mailto:${item.email}`}>{item.email}</a>
              <span className="admin-muted"> · {new Date(item.createdAt).toISOString().slice(0, 10)}</span>
            </span>
            <form action={removeSubscriber}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="admin-link-danger">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
