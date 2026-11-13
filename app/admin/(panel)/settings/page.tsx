import { SmtpForm } from "@/components/admin/smtp-form";
import { dbConfigured } from "@/lib/db";
import { getSmtp } from "@/lib/smtp";

export default async function SettingsPage() {
  if (!dbConfigured()) return <p className="admin-error">MongoDB is not configured.</p>;
  return (
    <>
      <h1>Email (SMTP)</h1>
      <p className="admin-muted">New enquiries are always saved. If enabled, a notification email is also sent to the addresses below.</p>
      <SmtpForm settings={await getSmtp()} />
    </>
  );
}
