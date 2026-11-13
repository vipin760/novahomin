import { MediaManager } from "@/components/admin/media-manager";

export default function MediaPage() {
  return (
    <>
      <h1>Media library</h1>
      <p className="admin-muted">Upload once, reuse anywhere: choose these images from the Blog and Portfolio forms.</p>
      <MediaManager />
    </>
  );
}
