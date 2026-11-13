import { dbConfigured } from "@/lib/db";
import { listEnquiries } from "@/lib/store";
import { removeEnquiry } from "../actions";

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";

export default async function EnquiriesPage() {
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;
  const items = await listEnquiries();
  return (
    <>
      <h1>Enquiries</h1>
      {items.length === 0 ? <p className="admin-muted">No enquiries yet.</p> : null}
      <ul className="admin-list">
        {items.map((item) => (
          <li key={item.id} className="admin-card">
            <div className="admin-card-head">
              <strong>{item.name}</strong>
              <span className="admin-muted">{when(item.createdAt)}</span>
            </div>
            <p>
              <a href={`mailto:${item.email}`}>{item.email}</a>
              {item.phone ? ` · ${item.phone}` : ""} · {item.service || "No service chosen"}
            </p>
            <p className="admin-message">{item.message}</p>
            <form action={removeEnquiry}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="admin-link-danger">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
