import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { insert, one, run } from "./db";
import { authSecret } from "./secrets";
import { hmac, id, now, safeEqual } from "./utils";
import { storageRoot } from "./db";

export function ffmpegBin() {
  return process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
}

export function ffprobeBin() {
  return process.env.FFPROBE_PATH || ffprobeStatic?.path || "ffprobe";
}

export function maxUploadBytes() {
  return Number(process.env.VIDEO_MAX_UPLOAD_SIZE || 5 * 1024 * 1024 * 1024);
}

export function diskUsage(target = storageRoot()) {
  try {
    const stats = fs.statfsSync(target);
    const total = Number(stats.blocks) * Number(stats.bsize);
    const free = Number(stats.bavail) * Number(stats.bsize);
    return { total, free, used: Math.max(0, total - free), path: target };
  } catch {
    return { total: 0, free: 0, used: 0, path: target };
  }
}

export function detectVideo(buffer: Buffer) {
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString() === "ftyp") return { ext: ".mp4", mime: "video/mp4" };
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return { ext: ".mkv", mime: "video/webm" };
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF") return { ext: ".avi", mime: "video/avi" };
  return null;
}

export function signPlayback(userId: string, lessonId: string) {
  const exp = Date.now() + 2 * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ userId, lessonId, exp })).toString("base64url");
  const sig = hmac(body, authSecret());
  return `${body}.${sig}`;
}

export function readPlayback(token: string) {
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(hmac(body, authSecret()), sig)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { userId: string; lessonId: string; exp: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function canWatch(userId: string, lessonId: string) {
  const user = await one<any>("SELECT role, status FROM users WHERE id = ?", [userId]);
  if (!user || user.status !== "active") return false;
  const lesson = await lessonContext(lessonId);
  if (!lesson) return false;
  if (user.role === "admin") return true;
  if (!lesson.published) return false;
  const enrollment = await one<any>("SELECT * FROM enrollments WHERE user_id = ? AND batch_id = ? AND status = 'active'", [userId, lesson.batch_id]);
  if (!enrollment) return false;
  if (enrollment.expires_at && enrollment.expires_at < now()) return false;
  return true;
}

export async function lessonContext(lessonId: string) {
  return one<any>(
    `SELECT l.*, v.id AS video_id, v.original_path, v.hls_path, v.thumbnail_path, v.status AS video_status, v.duration_seconds AS video_duration,
            c.name AS chapter_name, s.name AS subject_name, s.batch_id, b.name AS batch_name, b.course_id
     FROM lessons l
     LEFT JOIN video_assets v ON v.lesson_id = l.id
     JOIN chapters c ON c.id = l.chapter_id
     JOIN subjects s ON s.id = c.subject_id
     JOIN batches b ON b.id = s.batch_id
     WHERE l.id = ?`,
    [lessonId],
  );
}

export function inside(root: string, target: string) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(target);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

function runProcess(bin: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ bin, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(stderr) : reject(new Error(stderr.slice(-800) || `${bin} exited ${code}`))));
  });
}

export async function probe(file: string) {
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ ffprobeBin(), ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => { stdout += c.toString(); });
    child.stderr.on("data", (c) => { stderr += c.toString(); });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(stdout) : reject(new Error(stderr || "ffprobe failed"))));
  });
  const json = JSON.parse(output || "{}");
  const stream = json.streams?.[0] || {};
  return {
    width: Number(stream.width || 0),
    height: Number(stream.height || 0),
    duration: Math.round(Number(json.format?.duration || 0)),
  };
}

export async function transcodeVideo(videoId: string) {
  const video = await one<any>("SELECT * FROM video_assets WHERE id = ?", [videoId]);
  if (!video) return;
  await run("UPDATE video_assets SET status = 'processing', error = NULL WHERE id = ?", [videoId]);
  try {
    const meta = await probe(video.original_path);
    const hlsDir = path.join(/*turbopackIgnore: true*/ storageRoot(), "hls", videoId);
    fs.mkdirSync(hlsDir, { recursive: true });
    const heights = [360, 480, 720, 1080].filter((h) => meta.height >= h);
    const renditions = heights.length ? heights : [Math.max(144, meta.height || 360)];
    const master: string[] = ["#EXTM3U"];
    for (const height of renditions) {
      const name = `${height}.m3u8`;
      await runProcess(ffmpegBin(), [
        "-y", "-i", video.original_path,
        "-vf", `scale=-2:${height}`,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac", "-ac", "2", "-b:a", "128k",
        "-hls_time", "6", "-hls_playlist_type", "vod",
        "-hls_segment_filename", path.join(hlsDir, `${height}_%03d.ts`),
        path.join(hlsDir, name),
      ]);
      const bandwidth = height >= 1080 ? 4500000 : height >= 720 ? 2500000 : height >= 480 ? 1200000 : 700000;
      master.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${Math.round(height * 16 / 9)}x${height}`);
      master.push(name);
    }
    fs.writeFileSync(path.join(hlsDir, "master.m3u8"), master.join("\n"));
    const thumb = path.join(hlsDir, "thumb.jpg");
    await runProcess(ffmpegBin(), ["-y", "-ss", "3", "-i", video.original_path, "-frames:v", "1", "-vf", "scale=640:-2", thumb]).catch(() => undefined);
    await run(
      "UPDATE video_assets SET status = 'ready', hls_path = ?, thumbnail_path = ?, duration_seconds = ?, width = ?, height = ?, error = NULL WHERE id = ?",
      [path.join(hlsDir, "master.m3u8"), fs.existsSync(thumb) ? thumb : null, meta.duration, meta.width, meta.height, videoId],
    );
    await run("UPDATE lessons SET duration_seconds = ? WHERE id = ?", [meta.duration, video.lesson_id]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcoding failed";
    const fallback = /not recognized|ENOENT|ffprobe failed|spawn/i.test(message) ? "ready_progressive" : "failed";
    await run("UPDATE video_assets SET status = ?, error = ? WHERE id = ?", [fallback, message.slice(0, 800), videoId]);
  }
}

export async function enqueueTranscode(videoId: string) {
  await insert("jobs", {
    id: id(),
    type: "transcode",
    payload: JSON.stringify({ videoId }),
    status: "pending",
    attempts: 0,
    last_error: null,
    run_at: now(),
    created_at: now(),
    updated_at: now(),
  });
}

export function folderSize(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += folderSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}
