"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { articles } from "@/lib/content";
import { dbConfigured } from "@/lib/db";
import type { Img } from "@/lib/image";
import { deleteProject, projectSlugTaken, saveProject } from "@/lib/projects";
import { clearGoogleToken, sendTest } from "@/lib/mail";
import { MAX_RECIPIENTS, saveNotify, saveSmtp } from "@/lib/smtp";
import { isStatus } from "@/lib/enquiry-status";
import { deleteEnquiry, deleteSubscriber, setEnquiryStatus } from "@/lib/store";
import { PROJECT_PLATFORMS } from "@/lib/project-meta";
import { slugify } from "@/lib/slug";
import { postCategories } from "@/lib/post-categories";
import { deletePost, savePost, slugTaken } from "@/lib/posts";

export type FormState = { error?: string; ok?: string };

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
  if (!dbConfigured()) throw new Error("MongoDB is not configured.");
}

const str = (data: FormData, name: string, max: number) => String(data.get(name) ?? "").trim().slice(0, max);

/** Only images from this project's Cloudinary account are accepted. */
function parseImg(value: string): Img | null {
  try {
    const img = JSON.parse(value) as Img;
    return img && typeof img.url === "string" && img.url.startsWith("https://res.cloudinary.com/")
      ? { url: img.url, alt: String(img.alt ?? "").slice(0, 300), publicId: img.publicId }
      : null;
  } catch {
    return null;
  }
}

const parseImgs = (value: string) => {
  try {
    return (JSON.parse(value) as unknown[]).map((item) => parseImg(JSON.stringify(item))).filter((x): x is Img => Boolean(x));
  } catch {
    return [];
  }
};

export async function removeEnquiry(formData: FormData) {
  await guard();
  await deleteEnquiry(String(formData.get("id") ?? ""));
  revalidatePath("/admin", "layout"); // refreshes the sidebar badge and bell too
}

export async function setEnquiryStatusAction(formData: FormData) {
  await guard();
  const status = formData.get("status");
  if (!isStatus(status)) return;
  await setEnquiryStatus(String(formData.get("id") ?? ""), status);
  revalidatePath("/admin", "layout");
}

export async function removeSubscriber(formData: FormData) {
  await guard();
  await deleteSubscriber(String(formData.get("id") ?? ""));
  revalidatePath("/admin/subscribers");
}

export async function savePostAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const id = str(data, "id", 40) || undefined;
  const title = str(data, "title", 160);
  const slug = slugify(str(data, "slug", 120) || title);
  const category = str(data, "category", 60);
  const summary = str(data, "summary", 300);
  const body = String(data.get("body") ?? "").trim().slice(0, 60000);
  const status = data.get("status") === "published" ? "published" : "draft";

  if (!title || !slug) return { error: "A title is required." };
  if (!postCategories.includes(category as (typeof postCategories)[number])) return { error: "Choose a category." };
  if (status === "published" && (summary.length < 20 || body.length < 40))
    return { error: "Add a summary (20+ characters) and article text before publishing." };
  if (articles.some((article) => article.slug === slug) || (await slugTaken(slug, id)))
    return { error: "That URL slug is already used. Change the slug." };

  await savePost({ title, slug, category, summary, body, cover: parseImg(str(data, "cover", 2000)), status }, id);
  updateTag("posts");
  redirect("/admin/blog");
}

export async function deletePostAction(formData: FormData) {
  await guard();
  await deletePost(String(formData.get("id") ?? ""));
  updateTag("posts");
  revalidatePath("/admin/blog");
}

export async function saveProjectAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const id = str(data, "id", 40) || undefined;
  const title = str(data, "title", 160);
  const slug = slugify(str(data, "slug", 120) || title);
  const link = str(data, "link", 500);
  const status = data.get("status") === "published" ? "published" : "draft";
  if (!title || !slug) return { error: "A title is required." };
  if (link && !/^https?:\/\//i.test(link)) return { error: "The project link must start with http:// or https://." };
  if (await projectSlugTaken(slug, id)) return { error: "That URL slug is already used. Change the slug." };
  const cover = parseImg(str(data, "cover", 2000));
  if (status === "published" && !cover) return { error: "Choose a cover image before publishing." };
  const features = String(data.get("features") ?? "")
    .split("\n")
    .map((line) => line.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 8);
  const platforms = PROJECT_PLATFORMS.filter((platform) => data.getAll("platforms").includes(platform));

  await saveProject(
    {
      title,
      slug,
      client: str(data, "client", 120),
      category: str(data, "category", 80),
      summary: str(data, "summary", 300),
      description: String(data.get("description") ?? "").trim().slice(0, 20000),
      link,
      cover,
      hero: parseImg(str(data, "hero", 2000)),
      features,
      platforms,
      featured: data.get("featured") === "on",
      gallery: parseImgs(String(data.get("gallery") ?? "[]")).slice(0, 24),
      status,
      sortOrder: Number.parseInt(String(data.get("sortOrder") ?? "0"), 10) || 0,
    },
    id,
  );
  updateTag("projects");
  redirect("/admin/portfolio");
}

export async function deleteProjectAction(formData: FormData) {
  await guard();
  await deleteProject(String(formData.get("id") ?? ""));
  updateTag("projects");
  revalidatePath("/admin/portfolio");
}

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export async function saveNotifyAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const enabled = data.get("enabled") === "on";
  const ackEnabled = data.get("ackEnabled") === "on";
  const entered = data.getAll("recipient").map((value) => String(value).trim().slice(0, 254)).filter(Boolean);
  const recipients = [...new Map(entered.map((address) => [address.toLowerCase(), address])).values()];
  const bad = recipients.find((address) => !emailOk(address));
  if (bad) return { error: `“${bad}” is not a valid email address.` };
  if (recipients.length > MAX_RECIPIENTS) return { error: `You can add up to ${MAX_RECIPIENTS} recipients.` };
  if (enabled && recipients.length === 0) return { error: "Add at least one recipient to turn on admin notifications." };

  await saveNotify({ enabled, ackEnabled, recipients });
  revalidatePath("/admin/settings");
  return { ok: "Notification settings saved." };
}

export async function saveSmtpAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const host = str(data, "host", 200);
  const port = Number.parseInt(str(data, "port", 6), 10);
  const from = str(data, "from", 200);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { error: "Enter a valid port (for example 587 or 465)." };
  if (host && !from) return { error: "A From address is required with an SMTP host." };

  await saveSmtp({ host, port, secure: data.get("secure") === "on", user: str(data, "user", 200), from }, String(data.get("password") ?? ""));
  revalidatePath("/admin/settings");
  return { ok: "SMTP settings saved." };
}

export async function testSmtpAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const to = str(data, "to", 200);
  if (!emailOk(to)) return { error: "Enter a valid address to send the test to." };
  try {
    const provider = await sendTest(to);
    return { ok: `Test email sent to ${to} via ${provider === "gmail" ? "Gmail" : "SMTP"}.` };
  } catch (error) {
    return { error: `Sending failed: ${error instanceof Error ? error.message : "unknown error"}` };
  }
}

export async function disconnectGoogleAction() {
  await guard();
  await clearGoogleToken();
  revalidatePath("/admin/settings");
}
