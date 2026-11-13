import { insert, ready } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";
import { id, now } from "@/lib/utils";
import { z } from "zod";

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const parsed = z.object({
    studentName: z.string().min(3).max(160),
    courseName: z.string().min(2).max(160),
    rating: z.number().min(1).max(5).optional().nullable(),
    reviewText: z.string().min(20).max(1200),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Share your name, course and a review of at least 20 characters.");
  await insert("testimonials", {
    id: id(),
    student_name: parsed.data.studentName.trim(),
    photo_url: "",
    course_name: parsed.data.courseName,
    rating: parsed.data.rating ?? null,
    review_text: parsed.data.reviewText.trim(),
    review_date: now().slice(0, 10),
    status: "pending",
    featured: 0,
    is_demo: 0,
    sort_order: 100,
    created_at: now(),
  });
  return json({ ok: true });
}
