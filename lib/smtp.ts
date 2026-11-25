import "server-only";
import { getDb } from "./db";
import { decrypt, encrypt } from "./secret";

/** Notification preferences (provider-independent) plus the optional SMTP fallback connection. */
export type SmtpSettings = {
  /** Email the configured recipients when an enquiry arrives. */
  enabled: boolean;
  /** Send the visitor an acknowledgement email. */
  ackEnabled: boolean;
  recipients: string[];
  host: string;
  port: number;
  secure: boolean;
  user: string;
  hasPassword: boolean;
  from: string;
};

export type SmtpConnection = Pick<SmtpSettings, "host" | "port" | "secure" | "user" | "from">;

type Stored = Partial<Omit<SmtpSettings, "hasPassword" | "recipients">> & { passEnc?: string; notifyTo?: string };

export const MAX_RECIPIENTS = 20;

export const parseRecipients = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;\n]/)
    .map((address) => address.trim())
    .filter(Boolean);

export const settings = async () => (await getDb()).collection<{ _id: string } & Stored>("settings");

export async function getSmtp(): Promise<SmtpSettings> {
  const row = await (await settings()).findOne({ _id: "smtp" });
  return {
    enabled: Boolean(row?.enabled),
    // On by default: visitors get a confirmation as soon as a mail provider works. Admin
    // notifications stay off until at least one recipient is saved.
    ackEnabled: row?.ackEnabled ?? true,
    recipients: parseRecipients(row?.notifyTo),
    host: row?.host ?? "",
    port: row?.port ?? 587,
    secure: Boolean(row?.secure),
    user: row?.user ?? "",
    hasPassword: Boolean(row?.passEnc),
    from: row?.from ?? "",
  };
}

export async function saveSmtp(input: SmtpConnection, password: string) {
  const update: Stored = { ...input };
  if (password) update.passEnc = encrypt(password);
  await (await settings()).updateOne({ _id: "smtp" }, { $set: update }, { upsert: true });
}

export async function saveNotify(input: { enabled: boolean; ackEnabled: boolean; recipients: string[] }) {
  await (await settings()).updateOne(
    { _id: "smtp" },
    { $set: { enabled: input.enabled, ackEnabled: input.ackEnabled, notifyTo: input.recipients.join(", ") } },
    { upsert: true },
  );
}

/** Connection options for the SMTP fallback, or null when it is not configured. */
export async function smtpTransportOptions() {
  const row = await (await settings()).findOne({ _id: "smtp" });
  if (!row?.host || !row.from) return null;
  return {
    from: row.from,
    options: {
      host: row.host,
      port: row.port ?? 587,
      secure: Boolean(row.secure),
      auth: row.user && row.passEnc ? { user: row.user, pass: decrypt(row.passEnc) } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    },
  };
}
