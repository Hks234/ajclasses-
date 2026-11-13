import fs from "fs";
import { getSession } from "@/lib/auth";
import { all, insert, one, ready, run } from "@/lib/db";
import { getSettings } from "@/lib/content";
import { bad, json, originBlock } from "@/lib/http";
import { id, normalizeMobile, now, num, validMobile } from "@/lib/utils";
import { inside } from "@/lib/video";
import { storageRoot } from "@/lib/db";

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const session = await getSession();
  if (!session || session.role !== "student") return bad("Sign in required.", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "progress") {
    const lessonId = String(body.lessonId || "");
    const enrollment = await one<any>(
      `SELECT e.id FROM enrollments e
       JOIN batches b ON b.id = e.batch_id
       JOIN subjects s ON s.batch_id = b.id
       JOIN chapters c ON c.subject_id = s.id
       JOIN lessons l ON l.chapter_id = c.id
       WHERE e.user_id = ? AND e.status = 'active' AND l.id = ?`,
      [session.id, lessonId],
    );
    if (!enrollment) return bad("You do not have access to this lesson.", 403);
    const settings = await getSettings();
    const threshold = Number(settings.completion_threshold || 90);
    const duration = Math.max(1, Number(body.duration || 0));
    const position = Math.max(0, Math.round(Number(body.position || 0)));
    const watched = Math.max(0, Math.round(Number(body.watched || 0)));
    const percent = Math.min(100, Math.round((watched / duration) * 100));
    const completed = percent >= threshold ? 1 : 0;
    const existing = await one<any>("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?", [session.id, lessonId]);
    if (!existing) {
      await insert("lesson_progress", { id: id(), user_id: session.id, lesson_id: lessonId, position_seconds: position, watched_seconds: watched, percent, completed, updated_at: now() });
    } else {
      await run("UPDATE lesson_progress SET position_seconds = ?, watched_seconds = ?, percent = ?, completed = CASE WHEN completed = 1 THEN 1 ELSE ? END, updated_at = ? WHERE id = ?", [position, Math.max(num(existing.watched_seconds), watched), Math.max(num(existing.percent), percent), completed, now(), existing.id]);
    }
    return json({ ok: true, percent, completed: Boolean(completed || existing?.completed) });
  }

  if (body.action === "profile") {
    const name = String(body.fullName || "").trim();
    const mobile = normalizeMobile(String(body.mobile || ""));
    if (name.length < 3) return bad("Enter your full name.");
    if (mobile && !validMobile(mobile)) return bad("Enter a valid mobile number.");
    await run("UPDATE users SET full_name = ?, mobile = ?, updated_at = ? WHERE id = ?", [name, mobile || null, now(), session.id]);
    await run("UPDATE student_profiles SET city = ?, preferred_course = ? WHERE user_id = ?", [String(body.city || ""), String(body.course || ""), session.id]);
    return json({ ok: true });
  }

  if (body.action === "read-notifications") {
    await run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", [now(), session.id]);
    return json({ ok: true });
  }

  if (body.action === "start-test") {
    const test = await one<any>("SELECT t.*, ts.id AS series_id FROM tests t JOIN test_series ts ON ts.id = t.series_id WHERE t.id = ? AND t.published = 1", [body.testId]);
    if (!test) return bad("This test is not published.");
    const access = await one("SELECT id FROM enrollments WHERE user_id = ? AND test_series_id = ? AND status = 'active'", [session.id, test.series_id]);
    if (!access) return bad("Purchase this test series before attempting it.", 403);
    const existing = await one<any>("SELECT * FROM test_attempts WHERE test_id = ? AND user_id = ? AND status = 'in_progress'", [test.id, session.id]);
    if (existing) return json({ attemptId: existing.id });
    const attemptId = id();
    await insert("test_attempts", { id: attemptId, test_id: test.id, user_id: session.id, started_at: now(), submitted_at: null, score: 0, max_score: 0, status: "in_progress" });
    return json({ attemptId });
  }

  if (body.action === "save-answer") {
    const attempt = await one<any>("SELECT * FROM test_attempts WHERE id = ? AND user_id = ? AND status = 'in_progress'", [body.attemptId, session.id]);
    if (!attempt) return bad("Attempt was not found.");
    const option = body.optionId ? await one<any>("SELECT * FROM test_options WHERE id = ? AND question_id = ?", [body.optionId, body.questionId]) : null;
    const current = await one<any>("SELECT * FROM test_answers WHERE attempt_id = ? AND question_id = ?", [attempt.id, body.questionId]);
    if (!current) {
      await insert("test_answers", { id: id(), attempt_id: attempt.id, question_id: String(body.questionId), option_id: option?.id || null, marked_for_review: body.review ? 1 : 0, is_correct: null, awarded: null });
    } else {
      await run("UPDATE test_answers SET option_id = ?, marked_for_review = ? WHERE id = ?", [option?.id || current.option_id, body.review ? 1 : 0, current.id]);
    }
    return json({ ok: true });
  }

  if (body.action === "submit-test") {
    const attempt = await one<any>("SELECT * FROM test_attempts WHERE id = ? AND user_id = ? AND status = 'in_progress'", [body.attemptId, session.id]);
    if (!attempt) return bad("Attempt was not found.");
    const questions = await all<any>("SELECT * FROM test_questions WHERE test_id = ?", [attempt.test_id]);
    let score = 0;
    let max = 0;
    for (const question of questions) {
      max += Number(question.marks || 0);
      const answer = await one<any>("SELECT * FROM test_answers WHERE attempt_id = ? AND question_id = ?", [attempt.id, question.id]);
      let awarded = 0;
      let correct = 0;
      if (answer?.option_id) {
        const option = await one<any>("SELECT is_correct FROM test_options WHERE id = ?", [answer.option_id]);
        if (option?.is_correct) { awarded = Number(question.marks || 0); correct = 1; }
        else awarded = -Number(question.negative_marks || 0);
      }
      score += awarded;
      if (answer) await run("UPDATE test_answers SET is_correct = ?, awarded = ? WHERE id = ?", [correct, awarded, answer.id]);
    }
    await run("UPDATE test_attempts SET status = 'submitted', submitted_at = ?, score = ?, max_score = ? WHERE id = ?", [now(), score, max, attempt.id]);
    await insert("notifications", { id: id(), user_id: session.id, title: "Test submitted", body: "Your objective test has been evaluated.", href: `/student/results/${attempt.id}`, read_at: null, created_at: now() });
    return json({ ok: true, score, max });
  }

  return bad("Unknown action.");
}

export async function GET(req: Request) {
  await ready();
  const session = await getSession();
  if (!session) return bad("Sign in required.", 401);
  const materialId = new URL(req.url).searchParams.get("material");
  if (!materialId) return bad("Missing file.");
  const material = await one<any>("SELECT * FROM study_materials WHERE id = ? AND published = 1", [materialId]);
  if (!material || !fs.existsSync(material.file_path)) return new Response("Not found", { status: 404 });
  if (session.role !== "admin") {
    const access = await one(
      `SELECT e.id FROM enrollments e WHERE e.user_id = ? AND e.status = 'active' AND (
        (e.batch_id IS NOT NULL AND e.batch_id = ?) OR
        (e.batch_id IS NOT NULL AND e.batch_id IN (SELECT id FROM batches WHERE course_id = ?))
      )`,
      [session.id, material.batch_id, material.course_id],
    );
    if (!access) return new Response("Enrolment required", { status: 403 });
  }
  if (!inside(storageRoot(), material.file_path)) return new Response("Not found", { status: 404 });
  const file = fs.readFileSync(material.file_path);
  const download = material.allow_download ? `attachment; filename="${material.title.replace(/"/g, "")}.pdf"` : "inline";
  return new Response(file, { headers: { "content-type": material.mime || "application/pdf", "content-disposition": download, "cache-control": "private, no-store" } });
}
