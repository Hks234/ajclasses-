import { getSettings } from "@/lib/content";
import { insert, ready } from "@/lib/db";
import { queueTemplate } from "@/lib/email";
import { bad, json, originBlock } from "@/lib/http";
import { clientIp, id, normalizeMobile, now, validMobile } from "@/lib/utils";
import { z } from "zod";

const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const ip = clientIp(req) || "local";
  const recent = (hits.get(ip) || []).filter((time) => Date.now() - time < 3600000);
  if (recent.length >= 6) return bad("Please wait before sending another enquiry.", 429);
  const body = await req.json().catch(() => null);
  if (body?.company_website) return json({ ok: true });
  const parsed = z.object({
    fullName: z.string().min(3).max(160),
    mobile: z.string().min(10),
    email: z.string().email(),
    course: z.string().max(160).optional().default(""),
    branchId: z.string().max(36).optional().default(""),
    message: z.string().max(2000).optional().default(""),
    source: z.string().max(40).optional().default("website"),
  }).safeParse(body);
  if (!parsed.success) return bad("Enter your name, mobile number and email.");
  if (!validMobile(parsed.data.mobile)) return bad("Enter a valid 10-digit Indian mobile number.");
  const enquiryId = id();
  await insert("enquiries", {
    id: enquiryId,
    full_name: parsed.data.fullName.trim(),
    mobile: normalizeMobile(parsed.data.mobile),
    email: parsed.data.email.toLowerCase(),
    course_interest: parsed.data.course,
    branch_id: parsed.data.branchId || null,
    message: parsed.data.message,
    status: "new",
    assigned_to: null,
    source: parsed.data.source || "website",
    created_at: now(),
  });
  recent.push(Date.now());
  hits.set(ip, recent);
  const settings = await getSettings();
  await queueTemplate("enquiry_notice", settings.email || "info@ajclasses.com", {
    student_name: parsed.data.fullName,
    mobile: normalizeMobile(parsed.data.mobile),
    email: parsed.data.email,
    course_name: parsed.data.course || "Not specified",
    message: parsed.data.message || "",
  });
  return json({ ok: true, id: enquiryId });
}
