import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { getProject } from "@/lib/projects";

export default function EditProject(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="adm-skeleton" aria-busy="true" aria-label="Loading" />}>
      <PageBody {...props} />
    </Suspense>
  );
}

async function PageBody({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // DB-backed and auth-gated: never prerender at build time
  const project = await getProject((await params).id);
  if (!project) notFound();
  return (
    <>
      <h1>Edit project</h1>
      <ProjectForm project={project} />
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
