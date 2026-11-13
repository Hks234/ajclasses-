import { requireAdmin } from "@/lib/auth";
import { refundPayment } from "@/lib/commerce";
import { all, insert, one, ready, run } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";
import { publicIntegrations, writeIntegrations } from "@/lib/secrets";
import { id, now, toCsv } from "@/lib/utils";
import fs from "fs";
import path from "path";
import { storageRoot } from "@/lib/db";
import { savePublicMedia, sniffPdf } from "@/lib/files";

export async function GET(req: Request) {
  await ready();
  const kind = new URL(req.url).searchParams.get("export");
  if (kind === "payments") {
    const auth = await requireAdmin("payments.view");
    if (auth.status !== 200) return bad("You do not have access.", auth.status);
    const rows = await all("SELECT id, user_id, amount_paise, status, provider, razorpay_order_id, razorpay_payment_id, created_at FROM payments ORDER BY created_at DESC");
    const csv = toCsv(rows, [
      { key: "id", label: "Payment ID" },
      { key: "user_id", label: "Student" },
      { key: "amount_paise", label: "Amount paise" },
      { key: "status", label: "Status" },
      { key: "provider", label: "Provider" },
      { key: "razorpay_order_id", label: "Order ID" },
      { key: "razorpay_payment_id", label: "Payment reference" },
      { key: "created_at", label: "Date" },
    ]);
    return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=payments.csv" } });
  }
  if (kind === "enquiries") {
    const auth = await requireAdmin("enquiries.manage");
    if (auth.status !== 200) return bad("You do not have access.", auth.status);
    const rows = await all("SELECT full_name, mobile, email, course_interest, status, message, created_at FROM enquiries ORDER BY created_at DESC");
    const csv = toCsv(rows, [
      { key: "full_name", label: "Name" }, { key: "mobile", label: "Mobile" }, { key: "email", label: "Email" },
      { key: "course_interest", label: "Course" }, { key: "status", label: "Status" }, { key: "message", label: "Message" }, { key: "created_at", label: "Date" },
    ]);
    return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=enquiries.csv" } });
  }
  return bad("Unknown export.");
}

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const body = await req.json().catch(() => ({}));
  if (body.action === "refund") {
    const auth = await requireAdmin("payments.manage");
    if (auth.status !== 200 || !auth.session) return bad("You do not have access.", 403);
    const result = await refundPayment(String(body.paymentId || ""), Math.round(Number(body.amount || 0) * 100), String(body.reason || ""), auth.session.id);
    if ("error" in result && result.error) return bad(result.error);
    return json({ ok: true });
  }
  if (body.action === "followup") {
    const auth = await requireAdmin("enquiries.manage");
    if (auth.status !== 200 || !auth.session) return bad("You do not have access.", 403);
    if (!body.note || !body.enquiryId) return bad("Add a follow-up note.");
    await insert("enquiry_followups", { id: id(), enquiry_id: String(body.enquiryId), note: String(body.note).slice(0, 2000), created_by: auth.session.id, created_at: now() });
    return json({ ok: true });
  }
  if (body.action === "question") {
    const auth = await requireAdmin("tests.manage");
    if (auth.status !== 200) return bad("You do not have access.", 403);
    const test = await one("SELECT id FROM tests WHERE id = ?", [body.testId]);
    if (!test) return bad("Choose a test.");
    const options = Array.isArray(body.options) ? body.options : [];
    if (options.length < 2) return bad("Add at least two options.");
    if (!options.some((option: any) => option.correct)) return bad("Mark the correct option.");
    const questionId = id();
    await insert("test_questions", {
      id: questionId,
      test_id: String(body.testId),
      prompt: String(body.prompt || "").slice(0, 4000),
      explanation: String(body.explanation || ""),
      marks: Math.round(Number(body.marks || 1) * 100),
      negative_marks: Math.round(Number(body.negativeMarks || 0) * 100),
      sort_order: Number(body.sortOrder || 1),
      question_type: "mcq",
    });
    for (let i = 0; i < options.length; i++) {
      await insert("test_options", { id: id(), question_id: questionId, option_text: String(options[i].text || ""), is_correct: options[i].correct ? 1 : 0, sort_order: i + 1 });
    }
    return json({ ok: true, id: questionId });
  }
  if (body.action === "integrations") {
    const auth = await requireAdmin("settings.manage");
    if (auth.status !== 200 || auth.session?.adminRole !== "super_admin") return bad("Only a super admin can change integrations.", 403);
    const next: Record<string, string> = {};
    for (const key of ["razorpayKeyId", "razorpayKeySecret", "razorpayWebhookSecret", "googleClientId", "googleClientSecret", "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "emailFrom"]) {
      if (typeof body[key] === "string" && body[key] && !String(body[key]).includes("••••")) next[key] = body[key];
    }
    writeIntegrations(next);
    return json({ ok: true, status: publicIntegrations() });
  }
  if (body.action === "retry-email") {
    const auth = await requireAdmin("emails.manage");
    if (auth.status !== 200) return bad("You do not have access.", 403);
    await run("UPDATE email_queue SET status = 'pending', last_error = NULL WHERE status IN ('held', 'failed')");
    return json({ ok: true });
  }
  if (body.action === "roles") {
    const auth = await requireAdmin("roles.manage");
    if (auth.status !== 200 || auth.session?.adminRole !== "super_admin") return bad("Only a super admin can change roles.", 403);
    const roleId = String(body.roleId || "");
    if (roleId === "super_admin") return bad("The super admin role stays fully enabled.");
    const role = await one("SELECT id FROM roles WHERE id = ?", [roleId]);
    if (!role) return bad("Role was not found.");
    const ids = Array.isArray(body.permissionIds) ? body.permissionIds.map(String) : [];
    await run("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);
    for (const permissionId of ids) {
      const found = await one("SELECT id FROM permissions WHERE id = ?", [permissionId]);
      if (found) await insert("role_permissions", { role_id: roleId, permission_id: permissionId });
    }
    return json({ ok: true });
  }
  if (body.action === "material") return bad("Use the material upload form.");
  return bad("Unknown action.");
}

export async function PUT(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const auth = await requireAdmin("content.manage");
  if (auth.status !== 200 || !auth.session) return bad("You do not have access.", 403);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return bad("Choose a file.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const pdf = sniffPdf(buffer);
  let storedPath = "";
  let mime = "";
  if (pdf) {
    const materialId = id();
    storedPath = path.join(storageRoot(), "materials", `${materialId}${pdf.ext}`);
    fs.writeFileSync(storedPath, buffer);
    mime = pdf.mime;
    await insert("study_materials", {
      id: materialId,
      course_id: String(form.get("courseId") || "") || null,
      batch_id: String(form.get("batchId") || "") || null,
      subject_id: String(form.get("subjectId") || "") || null,
      chapter_id: String(form.get("chapterId") || "") || null,
      title: String(form.get("title") || file.name).slice(0, 180),
      file_path: storedPath,
      mime,
      size_bytes: buffer.length,
      allow_download: form.get("allowDownload") === "true" ? 1 : 0,
      published: 1,
      created_at: now(),
    });
    return json({ ok: true, id: materialId });
  }
  const saved = await savePublicMedia(buffer, file.name, auth.session.id);
  return json({ ok: true, url: saved.url });
}
