import { isAdmin } from "@/lib/auth";
import { removeMedia, setMediaAlt } from "@/lib/media";
import { sameOrigin } from "@/lib/request";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { alt?: unknown } | null;
  await setMediaAlt((await params).id, typeof body?.alt === "string" ? body.alt : "");
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  await removeMedia((await params).id);
  return Response.json({ ok: true });
}
