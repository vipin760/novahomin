import { isAdmin } from "@/lib/auth";
import { cloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { dbConfigured } from "@/lib/db";
import { addMedia, listMedia } from "@/lib/media";
import { sameOrigin } from "@/lib/request";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!dbConfigured()) return Response.json({ error: "MongoDB is not configured." }, { status: 503 });
  return Response.json({ items: await listMedia(), uploads: cloudinaryConfigured() });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!dbConfigured()) return Response.json({ error: "MongoDB is not configured." }, { status: 503 });
  if (!cloudinaryConfigured()) return Response.json({ error: "Cloudinary is not configured." }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const files = (form?.getAll("file") ?? []).filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) return Response.json({ error: "No file received." }, { status: 400 });

  const items = [];
  for (const file of files.slice(0, 10)) {
    if (!allowed.has(file.type)) return Response.json({ error: `${file.name}: use JPG, PNG, WebP, GIF or AVIF.` }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: `${file.name} is larger than 8 MB.` }, { status: 400 });
    try {
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120);
      items.push(await addMedia(await uploadImage(file), alt));
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 502 });
    }
  }
  return Response.json({ items });
}
