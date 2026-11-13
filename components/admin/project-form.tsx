"use client";

import { useActionState } from "react";
import { saveProjectAction, type FormState } from "@/app/admin/(panel)/actions";
import type { Project } from "@/lib/projects";
import { MediaField } from "./media-field";

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProjectAction, {});
  return (
    <form action={action} className="admin-form admin-wide">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <label>
        <span>Project title *</span>
        <input name="title" defaultValue={project?.title} required maxLength={160} />
      </label>
      <label>
        <span>URL slug (auto from title if empty)</span>
        <input name="slug" defaultValue={project?.slug} maxLength={120} />
      </label>
      <label>
        <span>Client</span>
        <input name="client" defaultValue={project?.client} maxLength={120} />
      </label>
      <label>
        <span>Type (for example Website, Mobile app, SaaS)</span>
        <input name="category" defaultValue={project?.category} maxLength={80} />
      </label>
      <label>
        <span>Short summary</span>
        <textarea name="summary" defaultValue={project?.summary} rows={3} maxLength={300} />
      </label>
      <label>
        <span>Description (separate paragraphs with a blank line)</span>
        <textarea name="description" defaultValue={project?.description} rows={8} maxLength={20000} />
      </label>
      <label>
        <span>Live project link (optional)</span>
        <input name="link" type="url" defaultValue={project?.link} maxLength={500} placeholder="https://" />
      </label>
      <MediaField name="cover" label="Cover image" initial={project?.cover ? [project.cover] : []} />
      <MediaField name="gallery" label="Gallery images" multiple initial={project?.gallery ?? []} />
      <label>
        <span>Display order (lower shows first)</span>
        <input name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={project?.status ?? "draft"}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published (live on the site)</option>
        </select>
      </label>
      <p className="admin-error" role="alert">
        {state.error}
      </p>
      <button type="submit" className="admin-btn" disabled={pending}>
        {pending ? "Saving…" : "Save project"}
      </button>
    </form>
  );
}
