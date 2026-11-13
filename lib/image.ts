/** Cloudinary delivery transforms: inserts them after /upload/ (no-op for other URLs). */
export function cloudUrl(url: string, transform: string) {
  return url.includes("/image/upload/") ? url.replace("/image/upload/", `/image/upload/${transform}/`) : url;
}

export type Img = { url: string; alt: string; publicId?: string; width?: number; height?: number };
