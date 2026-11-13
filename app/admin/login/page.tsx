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
    <main className="admin-shell admin-narrow">
      <h1>Admin sign in</h1>
      <p className="admin-muted">Novahomin enquiries and subscribers.</p>
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </main>
  );
}
