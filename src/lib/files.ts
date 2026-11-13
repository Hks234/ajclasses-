import fs from "fs";
import path from "path";
import { insert, storageRoot } from "./db";
import { id, now } from "./utils";

type SniffedFile = {
  ext: string;
  mime: string;
  svg?: string;
};

export function sniffImage(buffer: Buffer): SniffedFile | null {
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return { ext: ".png", mime: "image/png" };
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: ".jpg", mime: "image/jpeg" };
  if (buffer.length > 6 && buffer.subarray(0, 3).toString() === "GIF") return { ext: ".gif", mime: "image/gif" };
  if (buffer.length > 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return { ext: ".webp", mime: "image/webp" };
  if (buffer.length > 4 && buffer.subarray(0, 4).toString() === "\x00\x00\x01\x00") return { ext: ".ico", mime: "image/x-icon" };
  const text = buffer.subarray(0, 400).toString("utf8").trim().toLowerCase();
  if (text.startsWith("<svg") || text.startsWith("<?xml")) {
    const raw = buffer.toString("utf8");
    if (/<script|onload=|javascript:|foreignobject/i.test(raw)) return null;
    return { ext: ".svg", mime: "image/svg+xml", svg: raw };
  }
  return null;
}

export function sniffPdf(buffer: Buffer): SniffedFile | null {
  if (buffer.subarray(0, 4).toString() === "%PDF") return { ext: ".pdf", mime: "application/pdf" };
  return null;
}

export async function savePublicMedia(buffer: Buffer, originalName: string, createdBy: string, alt = "") {
  const kind = sniffImage(buffer) || sniffPdf(buffer);
  if (!kind) throw new Error("Upload a PNG, JPG, WEBP, GIF, SVG or PDF.");
  if (buffer.length > 12 * 1024 * 1024) throw new Error("File is larger than 12 MB.");
  const mediaId = id();
  const filename = `${mediaId}${kind.ext}`;
  const full = path.join(storageRoot(), "media", filename);
  fs.writeFileSync(full, kind.ext === ".svg" && typeof kind.svg === "string" ? kind.svg : buffer);
  await insert("media_assets", {
    id: mediaId,
    filename,
    original_name: originalName.slice(0, 180),
    mime: kind.mime,
    size_bytes: buffer.length,
    path: full,
    alt,
    folder: "library",
    is_public: 1,
    created_by: createdBy,
    created_at: now(),
  });
  return { id: mediaId, url: `/api/media/public/${mediaId}`, mime: kind.mime, size: buffer.length };
}
