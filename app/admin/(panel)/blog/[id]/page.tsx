import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getPost } from "@/lib/posts";

export default function EditPost(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>
      <PageBody {...props} />
    </Suspense>
  );
}

async function PageBody({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // DB-backed and auth-gated: never prerender at build time
  const post = await getPost((await params).id);
  if (!post) notFound();
  return (
    <>
      <h1>Edit article</h1>
      <PostForm post={post} />
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
