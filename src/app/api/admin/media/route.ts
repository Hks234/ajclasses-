import { requireAdmin } from "@/lib/auth";
import { ready } from "@/lib/db";
import { savePublicMedia } from "@/lib/files";
import { bad, json, originBlock } from "@/lib/http";

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();

  let auth = await requireAdmin("media.manage");
  if (auth.status !== 200 || !auth.session) {
    auth = await requireAdmin("branding.manage");
  }
  if (auth.status !== 200 || !auth.session) {
    auth = await requireAdmin("content.manage");
  }
  if (auth.status !== 200 || !auth.session) {
    return bad(
      auth.status === 401 ? "Sign in required." : "You do not have access.",
      auth.status
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return bad("Choose a file.");

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const saved = await savePublicMedia(
      buffer,
      file.name,
      auth.session.id,
      String(form.get("alt") || "")
    );
    return json(saved);
  } catch (error) {
    return bad(error instanceof Error ? error.message : "Upload failed.");
  }
}
