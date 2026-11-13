"use client";

import { useCallback, useEffect, useState } from "react";
import { cloudUrl } from "@/lib/image";

type Item = { id: string; url: string; alt: string; width: number; height: number; format: string; bytes: number };

/** Full media library page: upload (multiple), rename alt text, copy URL, delete. */
export function MediaManager() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [uploads, setUploads] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/media");
    const data = (await response.json().catch(() => ({}))) as { items?: Item[]; uploads?: boolean; error?: string };
    if (response.ok) {
      setItems(data.items ?? []);
      setUploads(data.uploads !== false);
      setError("");
    } else setError(data.error ?? "Could not load the library.");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    for (const file of Array.from(files)) body.append("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) setError(data.error ?? "Upload failed.");
    await load();
  }

  async function saveAlt(id: string, alt: string) {
    await fetch(`/api/admin/media/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt }) });
  }

  async function remove(id: string) {
    if (!confirm("Delete this image? Pages that use it will show a broken image.")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    await load();
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Copy failed. Select the URL manually.");
    }
  }

  return (
    <>
      <div className="admin-bar">
        <p className="admin-muted">{items ? `${items.length} images` : ""}</p>
        <label className="admin-btn media-upload" aria-disabled={busy || !uploads}>
          {busy ? "Uploading…" : "Upload images"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden disabled={busy || !uploads} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      {!uploads ? <p className="admin-error">Cloudinary is not configured. Add the CLOUDINARY_* values to .env.</p> : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {items === null && !error ? <p className="admin-muted">Loading…</p> : null}
      {items?.length === 0 ? <p className="admin-muted">No images yet.</p> : null}
      <ul className="media-library">
        {items?.map((item) => (
          <li key={item.id} className="admin-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cloudUrl(item.url, "c_fill,w_480,h_320,f_auto,q_auto")} alt={item.alt} width={480} height={320} loading="lazy" />
            <label className="media-alt">
              <span>Alt text</span>
              <input defaultValue={item.alt} maxLength={300} onBlur={(e) => e.target.value !== item.alt && void saveAlt(item.id, e.target.value)} />
            </label>
            <p className="admin-muted">
              {item.width}×{item.height} · {item.format.toUpperCase()} · {Math.round(item.bytes / 1024)} KB
            </p>
            <div className="media-actions">
              <button type="button" className="admin-link" onClick={() => void copy(item.url)}>
                {copied === item.url ? "Copied" : "Copy URL"}
              </button>
              <button type="button" className="admin-link-danger" onClick={() => void remove(item.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
