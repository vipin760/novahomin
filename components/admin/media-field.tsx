"use client";

import { useEffect, useRef, useState } from "react";
import { cloudUrl, type Img } from "@/lib/image";

type Item = { id: string; url: string; alt: string; publicId: string; width: number; height: number };
type Props = { name: string; label: string; multiple?: boolean; initial?: Img[] };

const thumb = (url: string) => cloudUrl(url, "c_fill,w_240,h_240,f_auto,q_auto");

/** Image field with a reusable media library: pick an existing image or upload a new one. */
export function MediaField({ name, label, multiple, initial = [] }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Img[]>(initial);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    const response = await fetch("/api/admin/media");
    const data = (await response.json().catch(() => ({}))) as { items?: Item[]; error?: string };
    if (response.ok) setItems(data.items ?? []);
    else setError(data.error ?? "Could not load the library.");
  }

  useEffect(() => {
    const node = dialog.current;
    const close = () => setError("");
    node?.addEventListener("close", close);
    return () => node?.removeEventListener("close", close);
  }, []);

  function open() {
    dialog.current?.showModal();
    void load();
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    for (const file of Array.from(files)) body.append("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body });
    const data = (await response.json().catch(() => ({}))) as { items?: Item[]; error?: string };
    setBusy(false);
    if (response.ok) setItems((current) => [...(data.items ?? []), ...(current ?? [])]);
    else setError(data.error ?? "Upload failed.");
  }

  function pick(item: Item) {
    const img: Img = { url: item.url, alt: item.alt, publicId: item.publicId, width: item.width, height: item.height };
    setSelected((current) => (multiple ? [...current.filter((x) => x.url !== img.url), img] : [img]));
    if (!multiple) dialog.current?.close();
  }

  const remove = (url: string) => setSelected((current) => current.filter((img) => img.url !== url));
  const value = multiple ? JSON.stringify(selected) : selected[0] ? JSON.stringify(selected[0]) : "";

  return (
    <div className="media-field">
      <span className="media-label">{label}</span>
      <input type="hidden" name={name} value={value} />
      <ul className="media-selected">
        {selected.map((img) => (
          <li key={img.url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb(img.url)} alt={img.alt} width={96} height={96} />
            <button type="button" onClick={() => remove(img.url)} aria-label={`Remove ${img.alt || "image"}`}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="admin-btn admin-btn-line" onClick={open}>
        {selected.length ? (multiple ? "Add more images" : "Change image") : multiple ? "Choose images" : "Choose image"}
      </button>

      <dialog ref={dialog} className="media-dialog" aria-label="Media library">
        <div className="media-dialog-head">
          <strong>Media library</strong>
          <label className="admin-btn media-upload">
            {busy ? "Uploading…" : "Upload new"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          </label>
          <button type="button" className="admin-btn admin-btn-line" onClick={() => dialog.current?.close()}>
            Done
          </button>
        </div>
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
        {items === null && !error ? <p className="admin-muted">Loading…</p> : null}
        {items?.length === 0 ? <p className="admin-muted">No images yet. Upload your first one.</p> : null}
        <ul className="media-grid">
          {items?.map((item) => {
            const on = selected.some((img) => img.url === item.url);
            return (
              <li key={item.id}>
                <button type="button" className="media-tile" data-on={on || undefined} onClick={() => pick(item)} aria-pressed={on}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(item.url)} alt={item.alt} width={160} height={160} loading="lazy" />
                  <span>{item.alt || "Untitled"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </dialog>
    </div>
  );
}
