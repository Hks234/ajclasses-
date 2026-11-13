import { cache } from "react";
import { all, one } from "./db";
import { withinSchedule } from "./utils";

export const getSettings = cache(async () => {
  const rows = await all<any>("SELECT setting_key, setting_value FROM website_settings");
  const map: Record<string, string> = {};
  for (const row of rows) map[row.setting_key] = row.setting_value || "";
  return map;
});

export const getBranding = cache(async () => {
  const s = await getSettings();
  return {
    name: s.institute_name || "AJ Classes",
    line: s.brand_line || "Aditya Jhawar Education",
    tagline: s.tagline || "Learn Today. Lead Tomorrow.",
    email: s.email || "info@ajclasses.com",
    phone: s.phone || "",
    logoUrl: s.logo_url || "",
    logoDark: s.logo_dark_url || "",
    logoLight: s.logo_light_url || "",
    favicon: s.favicon_url || "",
    logoHeight: Number(s.logo_height || 52),
    logoBg: s.logo_bg || "transparent",
    instagram: s.instagram || "",
    facebook: s.facebook || "",
    youtube: s.youtube || "",
    linkedin: s.linkedin || "",
    whatsapp: s.support_whatsapp || "",
    footer: s.footer_about || "",
  };
});

export async function getBranches() {
  return all<any>("SELECT * FROM branches WHERE enabled = 1 ORDER BY sort_order, name");
}

export async function getCourses() {
  return all<any>(
    `SELECT c.*, cat.name AS category_name,
      (SELECT MIN(price_paise) FROM batches b WHERE b.course_id = c.id AND b.deleted_at IS NULL AND b.status = 'published' AND b.price_paise > 0) AS start_price,
      (SELECT MIN(compare_at_paise) FROM batches b WHERE b.course_id = c.id AND b.deleted_at IS NULL AND b.status = 'published' AND b.compare_at_paise > b.price_paise) AS compare_price,
      (SELECT COUNT(*) FROM batches b WHERE b.course_id = c.id AND b.deleted_at IS NULL AND b.status = 'published') AS batch_count
     FROM courses c JOIN course_categories cat ON cat.id = c.category_id
     WHERE c.deleted_at IS NULL AND c.status = 'published' ORDER BY c.sort_order, c.name`,
  );
}

export async function getCourse(slug: string) {
  return one<any>(
    `SELECT c.*, cat.name AS category_name FROM courses c
     JOIN course_categories cat ON cat.id = c.category_id
     WHERE c.slug = ? AND c.deleted_at IS NULL`,
    [slug],
  );
}

export async function getBatches(courseId: string) {
  return all<any>(
    `SELECT b.*, f.full_name AS faculty_name FROM batches b
     LEFT JOIN faculties f ON f.id = b.faculty_id
     WHERE b.course_id = ? AND b.deleted_at IS NULL AND b.status = 'published'
     ORDER BY b.start_date, b.name`,
    [courseId],
  );
}

export async function getFaculty() {
  return all<any>("SELECT * FROM faculties WHERE published = 1 ORDER BY sort_order, full_name");
}

export async function getAchievements() {
  const rows = await all<any>("SELECT * FROM achievements WHERE enabled = 1 ORDER BY featured DESC, sort_order, event_date DESC");
  const images = await all<any>("SELECT * FROM achievement_images ORDER BY sort_order");
  return rows.map((row) => ({ ...row, images: images.filter((img) => img.achievement_id === row.id) }));
}

export async function getTestimonials() {
  return all<any>("SELECT * FROM testimonials WHERE status = 'approved' ORDER BY featured DESC, sort_order, created_at DESC");
}

export async function getSection(key: string) {
  return one<any>("SELECT * FROM homepage_sections WHERE section_key = ? AND enabled = 1", [key]);
}

export async function getBanners(placement?: string) {
  const rows = await all<any>("SELECT * FROM promotional_banners WHERE enabled = 1 ORDER BY sort_order, created_at");
  return rows.filter((row) => withinSchedule(row.start_at, row.end_at) && (!placement || row.placement === placement));
}

export async function getAnnouncements(kind: string, audience = "public") {
  const rows = await all<any>("SELECT * FROM announcements WHERE enabled = 1 AND kind = ? AND (audience = ? OR audience = 'public') ORDER BY sort_order, created_at DESC", [kind, audience]);
  return rows.filter((row) => withinSchedule(row.start_at, row.end_at));
}

export async function getTestSeries() {
  return all<any>(
    `SELECT t.*, c.name AS course_name FROM test_series t
     LEFT JOIN courses c ON c.id = t.course_id
     WHERE t.deleted_at IS NULL AND t.status = 'published' ORDER BY t.created_at DESC`,
  );
}

export async function logActivity(adminId: string, action: string, entity: string, entityId: string, metadata: unknown, ip = "") {
  const { id, now } = await import("./utils");
  const { insert } = await import("./db");
  await insert("admin_activity_logs", {
    id: id(),
    admin_id: adminId,
    action,
    entity,
    entity_id: entityId,
    metadata: JSON.stringify(metadata ?? {}),
    ip,
    created_at: now(),
  });
}
