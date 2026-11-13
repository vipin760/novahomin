import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { getProject } from "@/lib/projects";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const project = await getProject((await params).id);
  if (!project) notFound();
  return (
    <>
      <h1>Edit project</h1>
      <ProjectForm project={project} />
    </>
  );
}
