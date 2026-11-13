"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { articles } from "@/lib/content";
import { dbConfigured } from "@/lib/db";
import type { Img } from "@/lib/image";
import { deleteProject, projectSlugTaken, saveProject } from "@/lib/projects";
import { getSmtp, saveSmtp, sendTest } from "@/lib/smtp";
import { deleteEnquiry, deleteSubscriber } from "@/lib/store";
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
  revalidatePath("/admin/enquiries");
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

export async function saveSmtpAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const host = str(data, "host", 200);
  const port = Number.parseInt(str(data, "port", 6), 10);
  const from = str(data, "from", 200);
  const notifyTo = str(data, "notifyTo", 500);
  const enabled = data.get("enabled") === "on";
  if (enabled && (!host || !from || !notifyTo)) return { error: "Host, From and Notify-to are required to enable email." };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { error: "Enter a valid port (for example 587 or 465)." };
  if (notifyTo && !notifyTo.split(",").every((address) => emailOk(address.trim())))
    return { error: "Notify-to must be one or more valid email addresses, separated by commas." };

  await saveSmtp(
    { enabled, host, port, secure: data.get("secure") === "on", user: str(data, "user", 200), from, notifyTo },
    String(data.get("password") ?? ""),
  );
  revalidatePath("/admin/settings");
  return { ok: "Settings saved." };
}

export async function testSmtpAction(_: FormState, data: FormData): Promise<FormState> {
  await guard();
  const to = str(data, "to", 200);
  if (!emailOk(to)) return { error: "Enter a valid address to send the test to." };
  try {
    const current = await getSmtp();
    if (!current.host) return { error: "Save your SMTP settings first." };
    await sendTest(to);
    return { ok: `Test email sent to ${to}.` };
  } catch (error) {
    return { error: `Sending failed: ${error instanceof Error ? error.message : "unknown error"}` };
  }
}
