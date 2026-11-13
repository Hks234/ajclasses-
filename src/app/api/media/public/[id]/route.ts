import fs from "fs";
import { one, ready } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ready();
  const { id } = await ctx.params;
  const media = await one<any>("SELECT * FROM media_assets WHERE id = ? AND is_public = 1", [id]);
  if (!media || !fs.existsSync(media.path)) return new Response("Not found", { status: 404 });
  const file = fs.readFileSync(media.path);
  return new Response(file, {
    headers: {
      "content-type": media.mime || "application/octet-stream",
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
