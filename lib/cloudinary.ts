import "server-only";
import { createHash } from "node:crypto";

export const cloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const sign = (params: Record<string, string>) =>
  createHash("sha1")
    .update(
      Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&") + process.env.CLOUDINARY_API_SECRET,
    )
    .digest("hex");

export type Uploaded = { publicId: string; url: string; width: number; height: number; format: string; bytes: number };

/** Signed upload with the REST API (no SDK): the API secret never leaves the server. */
export async function uploadImage(file: File): Promise<Uploaded> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { folder: "novahomin", timestamp };
  const body = new FormData();
  body.set("file", file);
  body.set("api_key", process.env.CLOUDINARY_API_KEY!);
  body.set("timestamp", timestamp);
  body.set("folder", params.folder);
  body.set("signature", sign(params));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body });
  const result = (await response.json().catch(() => ({}))) as {
    public_id?: string;
    secure_url?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    error?: { message?: string };
  };
  if (!response.ok || !result.public_id || !result.secure_url)
    throw new Error(result.error?.message ?? "Cloudinary upload failed.");
  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width ?? 0,
    height: result.height ?? 0,
    format: result.format ?? "",
    bytes: result.bytes ?? 0,
  };
}

export async function destroyImage(publicId: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = new FormData();
  body.set("public_id", publicId);
  body.set("api_key", process.env.CLOUDINARY_API_KEY!);
  body.set("timestamp", timestamp);
  body.set("signature", sign({ public_id: publicId, timestamp }));
  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body }).catch(() => undefined);
}
