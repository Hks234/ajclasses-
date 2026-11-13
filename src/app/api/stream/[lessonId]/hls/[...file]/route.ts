import fs from "fs";
import path from "path";
import { ready } from "@/lib/db";
import { storageRoot } from "@/lib/db";
import { canWatch, inside, lessonContext, readPlayback } from "@/lib/video";

export async function GET(req: Request, ctx: { params: Promise<{ lessonId: string; file: string[] }> }) {
  await ready();
  const { lessonId, file } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") || "";
  const playback = readPlayback(token);
  if (!playback || playback.lessonId !== lessonId) return new Response("Unauthorised", { status: 401 });
  if (!(await canWatch(playback.userId, lessonId))) return new Response("Enrolment required", { status: 403 });
  const lesson = await lessonContext(lessonId);
  if (!lesson?.video_id) return new Response("Not found", { status: 404 });
  const root = path.join(storageRoot(), "hls", lesson.video_id);
  const target = path.join(root, ...file);
  if (!inside(root, target) || !fs.existsSync(target)) return new Response("Not found", { status: 404 });
  let body = fs.readFileSync(target);
  const name = file[file.length - 1];
  if (name.endsWith(".m3u8")) {
    const text = body.toString("utf8").split("\n").map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      return `${trimmed}?token=${encodeURIComponent(token)}`;
    }).join("\n");
    body = Buffer.from(text);
  }
  const type = name.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : name.endsWith(".ts") ? "video/mp2t" : "application/octet-stream";
  return new Response(body, { headers: { "content-type": type, "cache-control": "private, no-store" } });
}
