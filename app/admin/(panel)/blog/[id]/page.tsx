import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getPost } from "@/lib/posts";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const post = await getPost((await params).id);
  if (!post) notFound();
  return (
    <>
      <h1>Edit article</h1>
      <PostForm post={post} />
    </>
  );
}
