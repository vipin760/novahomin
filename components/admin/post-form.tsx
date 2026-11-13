"use client";

import { useActionState } from "react";
import { savePostAction, type FormState } from "@/app/admin/(panel)/actions";
import type { Post } from "@/lib/posts";
import { postCategories } from "@/lib/post-categories";
import { MediaField } from "./media-field";

export function PostForm({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePostAction, {});
  return (
    <form action={action} className="admin-form admin-wide">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <label>
        <span>Title *</span>
        <input name="title" defaultValue={post?.title} required maxLength={160} />
      </label>
      <label>
        <span>URL slug (auto from title if empty)</span>
        <input name="slug" defaultValue={post?.slug} maxLength={120} placeholder="my-article-title" />
      </label>
      <label>
        <span>Category *</span>
        <select name="category" defaultValue={post?.category ?? ""} required>
          <option value="" disabled>
            Choose…
          </option>
          {postCategories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Summary (shown on cards and in search results)</span>
        <textarea name="summary" defaultValue={post?.summary} rows={3} maxLength={300} />
      </label>
      <MediaField name="cover" label="Cover image" initial={post?.cover ? [post.cover] : []} />
      <label>
        <span>Article text (separate paragraphs with a blank line)</span>
        <textarea name="body" defaultValue={post?.body} rows={14} maxLength={60000} />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={post?.status ?? "draft"}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published (live on the site)</option>
        </select>
      </label>
      <p className="admin-error" role="alert">
        {state.error}
      </p>
      <button type="submit" className="admin-btn" disabled={pending}>
        {pending ? "Saving…" : "Save article"}
      </button>
    </form>
  );
}
