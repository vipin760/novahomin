import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { getDb } from "./db";
import type { Enquiry } from "./store";

export type SmtpSettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  hasPassword: boolean;
  from: string;
  notifyTo: string;
};

type Stored = Omit<SmtpSettings, "hasPassword"> & { passEnc?: string };

/** The SMTP password is stored encrypted (AES-256-GCM) with a key derived from SESSION_SECRET. */
const key = () => createHash("sha256").update(`smtp:${process.env.SESSION_SECRET ?? ""}`).digest();

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64")).join(".");
}

function decrypt(value: string) {
  const [iv, tag, data] = value.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

const settings = async () => (await getDb()).collection<{ _id: string } & Partial<Stored>>("settings");

export async function getSmtp(): Promise<SmtpSettings> {
  const row = await (await settings()).findOne({ _id: "smtp" });
  return {
    enabled: Boolean(row?.enabled),
    host: row?.host ?? "",
    port: row?.port ?? 587,
    secure: Boolean(row?.secure),
    user: row?.user ?? "",
    hasPassword: Boolean(row?.passEnc),
    from: row?.from ?? "",
    notifyTo: row?.notifyTo ?? "",
  };
}

export async function saveSmtp(input: Omit<SmtpSettings, "hasPassword">, password: string) {
  const update: Partial<Stored> = { ...input };
  if (password) update.passEnc = encrypt(password);
  await (await settings()).updateOne({ _id: "smtp" }, { $set: update }, { upsert: true });
}

async function transport() {
  const row = await (await settings()).findOne({ _id: "smtp" });
  if (!row?.host || !row.from) throw new Error("SMTP host and From address are required.");
  return {
    row,
    mailer: nodemailer.createTransport({
      host: row.host,
      port: row.port ?? 587,
      secure: Boolean(row.secure),
      auth: row.user && row.passEnc ? { user: row.user, pass: decrypt(row.passEnc) } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    }),
  };
}

const clean = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/** Sends a test message to `to` and reports the real outcome. */
export async function sendTest(to: string) {
  const { row, mailer } = await transport();
  await mailer.sendMail({
    from: row.from,
    to,
    subject: "Novahomin SMTP test",
    text: "This is a test message from the Novahomin admin. Your SMTP settings work.",
  });
}

/** Notifies the configured recipients of a new enquiry. Never throws: storage must not depend on email. */
export async function notifyEnquiry(enquiry: Enquiry) {
  try {
    const row = await (await settings()).findOne({ _id: "smtp" });
    if (!row?.enabled || !row.notifyTo) return;
    const { mailer } = await transport();
    await mailer.sendMail({
      from: row.from,
      to: row.notifyTo,
      replyTo: enquiry.email,
      subject: clean(`New enquiry from ${enquiry.name}`),
      text: [
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Phone: ${enquiry.phone || "-"}`,
        `Service: ${enquiry.service || "-"}`,
        "",
        enquiry.message,
      ].join("\n"),
    });
  } catch (error) {
    console.error("Enquiry notification email failed:", error instanceof Error ? error.message : error);
  }
}
