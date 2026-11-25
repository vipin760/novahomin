import { ProjectForm } from "@/components/admin/project-form";

export default function NewProject() {
  return (
    <>
      <h1>New project</h1>
      <ProjectForm />
    </>
  );
}

// Auth-gated and per-request: the guard redirects signed-out visitors, so skip dev-time instant validation.
export const instant = false;
