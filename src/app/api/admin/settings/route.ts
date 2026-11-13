import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/content";
import { insert, one, ready, run } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";
import { clientIp, now } from "@/lib/utils";

const keys = new Set([
  "institute_name", "brand_line", "tagline", "email", "phone", "instagram", "facebook", "youtube", "linkedin",
  "logo_url", "logo_dark_url", "logo_light_url", "favicon_url", "logo_height", "logo_bg", "completion_threshold",
  "lock_completed_lessons", "support_whatsapp", "seo_title", "seo_description", "footer_about", "about_html",
  "privacy_html", "terms_html", "refund_html", "stat_students", "stat_courses", "stat_faculty", "stat_years",
]);

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const auth = await requireAdmin("settings.manage");
  const home = await requireAdmin("homepage.manage");
  const brand = await requireAdmin("branding.manage");
  const session = auth.session || home.session || brand.session;
  if (!session) return bad("You do not have access.", 403);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Nothing to save.");
  for (const [key, value] of Object.entries(body)) {
    if (!keys.has(key)) continue;
    const allowed = key.startsWith("logo") || key === "favicon_url" ? brand.status === 200 || session.adminRole === "super_admin"
      : key.startsWith("stat_") ? home.status === 200 || session.adminRole === "super_admin"
      : auth.status === 200 || session.adminRole === "super_admin";
    if (!allowed) continue;
    const existing = await one("SELECT setting_key FROM website_settings WHERE setting_key = ?", [key]);
    if (existing) await run("UPDATE website_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ?", [String(value ?? ""), now(), key]);
    else await insert("website_settings", { setting_key: key, setting_value: String(value ?? ""), updated_at: now() });
  }
  await logActivity(session.id, "settings", "website_settings", "settings", Object.keys(body), clientIp(req));
  return json({ ok: true });
}
