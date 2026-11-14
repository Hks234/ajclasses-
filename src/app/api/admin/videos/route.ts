import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/content";
import { insert, one, ready, run } from "@/lib/db";
import { storageRoot } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";
import { clientIp, id, now } from "@/lib/utils";
import { detectVideo, diskUsage, enqueueTranscode, maxUploadBytes } from "@/lib/video";

async function admin() {
  const auth = await requireAdmin("videos.manage");
  if (auth.status !== 200 || !auth.session) return null;
  return auth.session;
}

export async function GET(req: Request) {
  await ready();
  const session = await admin();
  if (!session) return bad("You do not have access.", 403);
  const uploadId = new URL(req.url).searchParams.get("uploadId");
  if (!uploadId) return bad("Missing upload.");
  const row = await one<any>("SELECT id, received, total_size, status FROM upload_sessions WHERE id = ? AND admin_id = ?", [uploadId, session.id]);
  if (!row) return bad("Upload was not found.", 404);
  return json(row);
}

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const session = await admin();
  if (!session) return bad("You do not have access.", 403);
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action === "init") {
    const size = Number(body.size || 0);
    if (!size || size < 1) return bad("Choose a video file.");
    if (size > maxUploadBytes()) return bad("This video is larger than the configured upload limit.");
    const disk = diskUsage();
    if (disk.total > 0 && size > Math.max(0, disk.free - 1024 * 1024 * 1024)) return bad("There is not enough free disk space for this upload.");
    const uploadId = id();
    const temp = path.join(storageRoot(), "tmp", `${uploadId}.part`);
    fs.writeFileSync(temp, Buffer.alloc(0));
    await insert("upload_sessions", {
      id: uploadId,
      admin_id: session.id,
      file_name: String(body.fileName || "video").slice(0, 180),
      mime: String(body.mime || ""),
      total_size: size,
      received: 0,
      temp_path: temp,
      status: "uploading",
      meta_json: JSON.stringify({
        title: body.title || "Lesson",
        description: body.description || "",
        chapterId: body.chapterId || "",
        sortOrder: Number(body.sortOrder || 1),
        publish: Boolean(body.publish),
      }),
      created_at: now(),
    });
    return json({ uploadId, received: 0 });
  }
  if (action === "complete") {
    const row = await one<any>("SELECT * FROM upload_sessions WHERE id = ? AND admin_id = ?", [body.uploadId, session.id]);
    if (!row || row.status !== "uploading") return bad("Upload was not found.");
    if (Number(row.received) !== Number(row.total_size)) return bad("The upload is incomplete. Resume it and try again.");
    const handle = fs.openSync(row.temp_path, "r");
    const sample = Buffer.alloc(32);
    fs.readSync(handle, sample, 0, 32, 0);
    fs.closeSync(handle);
    const kind = detectVideo(sample);
    if (!kind) {
      fs.unlinkSync(row.temp_path);
      await run("UPDATE upload_sessions SET status = 'failed' WHERE id = ?", [row.id]);
      return bad("The file is not a recognised video.");
    }
    const meta = JSON.parse(row.meta_json || "{}");
    const chapter = await one("SELECT id FROM chapters WHERE id = ?", [meta.chapterId]);
    if (!chapter) return bad("Choose a chapter before finishing the upload.");
    const lessonId = id();
    const videoId = id();
    const destDir = path.join(storageRoot(), "course-videos", meta.chapterId);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, `${videoId}${kind.ext}`);
    fs.renameSync(row.temp_path, dest);
    const stamp = now();
    await insert("lessons", {
      id: lessonId,
      chapter_id: meta.chapterId,
      title: String(meta.title || "Lesson").slice(0, 180),
      description: meta.description || "",
      sort_order: Number(meta.sortOrder || 1),
      duration_seconds: 0,
      published: meta.publish ? 1 : 0,
      created_at: stamp,
    });
    await insert("video_assets", {
      id: videoId,
      lesson_id: lessonId,
      original_path: dest,
      hls_path: null,
      thumbnail_path: null,
      mime: kind.mime,
      size_bytes: Number(row.total_size),
      duration_seconds: 0,
      width: null,
      height: null,
      status: "uploaded",
      error: null,
      created_at: stamp,
    });
    await run("UPDATE upload_sessions SET status = 'complete' WHERE id = ?", [row.id]);
    await enqueueTranscode(videoId);
    await logActivity(session.id, "video-upload", "lessons", lessonId, { videoId }, clientIp(req));
    return json({ ok: true, lessonId, videoId });
  }
  return bad("Unknown video action.");
}

export async function PUT(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const session = await admin();
  if (!session) return bad("You do not have access.", 403);
  const uploadId = req.headers.get("x-upload-id") || "";
  const offset = Number(req.headers.get("x-offset") || 0);
  const row = await one<any>("SELECT * FROM upload_sessions WHERE id = ? AND admin_id = ?", [uploadId, session.id]);
  if (!row || row.status !== "uploading") return bad("Upload was not found.", 404);
  if (offset !== Number(row.received)) return json({ error: "Resume from the last received byte.", expected: Number(row.received) }, 409);
  const reader = req.body?.getReader();
  if (!reader) return bad("Empty chunk.");
  const parts: Buffer[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    const buf = Buffer.from(next.value);
    parts.push(buf);
    size += buf.length;
    if (Number(row.received) + size > Number(row.total_size)) return bad("Chunk exceeds the declared file size.");
  }
  const handle = fs.openSync(row.temp_path, "r+");
  fs.writeSync(handle, Buffer.concat(parts), 0, size, offset);
  fs.closeSync(handle);
  const received = offset + size;
  await run("UPDATE upload_sessions SET received = ? WHERE id = ?", [received, row.id]);
  return json({ received });
}
