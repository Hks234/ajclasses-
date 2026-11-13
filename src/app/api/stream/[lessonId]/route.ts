import fs from "fs";
import path from "path";
import { ready } from "@/lib/db";
import { canWatch, inside, lessonContext, readPlayback } from "@/lib/video";
import { storageRoot } from "@/lib/db";

export async function GET(req: Request, ctx: { params: Promise<{ lessonId: string }> }) {
  await ready();
  const { lessonId } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") || "";
  const playback = readPlayback(token);
  if (!playback || playback.lessonId !== lessonId) return new Response("Unauthorised", { status: 401 });
  if (!(await canWatch(playback.userId, lessonId))) return new Response("Enrolment required", { status: 403 });
  const lesson = await lessonContext(lessonId);
  const file = lesson?.original_path;
  if (!file || !fs.existsSync(file) || !inside(path.join(storageRoot(), "course-videos"), file)) return new Response("Video missing", { status: 404 });
  const stat = fs.statSync(file);
  const range = req.headers.get("range");
  const type = lesson.mime || "video/mp4";
  if (!range) {
    const stream = fs.createReadStream(file);
    return new Response(stream as unknown as ReadableStream, { headers: { "content-type": type, "content-length": String(stat.size), "accept-ranges": "bytes", "cache-control": "private, no-store" } });
  }
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  const start = match ? Number(match[1]) : 0;
  const end = match && match[2] ? Number(match[2]) : stat.size - 1;
  const stream = fs.createReadStream(file, { start, end });
  return new Response(stream as unknown as ReadableStream, {
    status: 206,
    headers: {
      "content-type": type,
      "content-length": String(end - start + 1),
      "content-range": `bytes ${start}-${end}/${stat.size}`,
      "accept-ranges": "bytes",
      "cache-control": "private, no-store",
    },
  });
}
