import { PostForm } from "@/components/admin/post-form";

export default function NewPost() {
  return (
    <>
      <h1>New article</h1>
      <PostForm />
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
