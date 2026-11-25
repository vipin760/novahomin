import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

async function Gate() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="admin-login">
      <aside className="admin-login-brand" aria-hidden="true">
        <span className="admin-login-orb admin-login-orb-a" />
        <span className="admin-login-orb admin-login-orb-b" />

        <div className="admin-login-lockup">
          <span className="admin-login-logo">
            <Image src="/logo-nova.png" alt="" width={28} height={28} priority />
          </span>
          <span className="admin-login-kicker">Novahomin</span>
        </div>

        <div className="admin-login-hero">
          <p className="admin-login-tagline">Turn every enquiry into a client.</p>
          <ol className="admin-login-flow">
            {["New", "Contacted", "Qualified", "Proposal", "Won"].map((stage, i) => (
              <li key={stage} style={{ "--i": i } as React.CSSProperties}>
                <span className="admin-login-dot" />
                {stage}
              </li>
            ))}
          </ol>
          <ul className="admin-login-points">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
              <span><b>Instant alerts</b> Every enquiry lands in your inbox and dashboard.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></svg>
              <span><b>Know what works</b> Traffic and lead sources in one view.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
              <span><b>Locked down</b> Rate-limited sign-in and signed sessions.</span>
            </li>
          </ul>
        </div>

        <p className="admin-login-foot">Private workspace · Authorised access only</p>
      </aside>

      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-card">
          <span className="admin-login-logo admin-login-logo-sm" aria-hidden="true">
            <Image src="/logo-nova.png" alt="" width={30} height={30} priority />
          </span>
          <h1 id="admin-login-title">Welcome back</h1>
          <p className="admin-muted">Sign in to manage enquiries, subscribers and content.</p>
          <Suspense fallback={<div className="admin-login-skeleton" aria-hidden="true" />}>
            <Gate />
          </Suspense>
          <p className="admin-login-secure">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z" /></svg>
            Encrypted connection · Session expires after 8 hours
          </p>
        </div>
      </section>
    </main>
  );
}
