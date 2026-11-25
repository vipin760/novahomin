"use client";

import { useActionState } from "react";
import { saveProjectAction, type FormState } from "@/app/admin/(panel)/actions";
import { normalizeCategory, PROJECT_CATEGORIES, PROJECT_PLATFORMS } from "@/lib/project-meta";
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
        <span>Type (used for the portfolio filters)</span>
        <select name="category" defaultValue={project ? normalizeCategory(project.category) : ""}>
          <option value="">Other / not set</option>
          {PROJECT_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.value}
            </option>
          ))}
          {project?.category && !PROJECT_CATEGORIES.some((c) => c.value === normalizeCategory(project.category)) ? (
            <option value={project.category}>{project.category}</option>
          ) : null}
        </select>
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
        <span>Key features (one per line, up to 8; shown as a checklist on the featured project)</span>
        <textarea name="features" defaultValue={project?.features.join("\n")} rows={5} maxLength={1000} placeholder={"Customer Mobile App (Android & iOS)\nAdmin Dashboard\nLive Order Tracking"} />
      </label>
      <fieldset className="admin-checks">
        <legend>Platforms</legend>
        {PROJECT_PLATFORMS.map((platform) => (
          <label key={platform} className="admin-check">
            <input type="checkbox" name="platforms" value={platform} defaultChecked={project?.platforms.includes(platform)} />
            <span>{platform}</span>
          </label>
        ))}
      </fieldset>
      <label className="admin-check">
        <input type="checkbox" name="featured" defaultChecked={project?.featured} />
        <span>Feature this project at the top of the Portfolio page</span>
      </label>
      <label>
        <span>Live project link (optional)</span>
        <input name="link" type="url" defaultValue={project?.link} maxLength={500} placeholder="https://" />
      </label>
      <MediaField name="cover" label="Cover image" initial={project?.cover ? [project.cover] : []} />
      <MediaField name="hero" label="Showcase image (large device mockup for the featured project; optional, defaults to the cover)" initial={project?.hero ? [project.hero] : []} />
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
