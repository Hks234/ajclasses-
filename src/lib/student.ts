import { all, one } from "./db";
import { now } from "./utils";

export async function studentBatches(userId: string) {
  return all<any>(
    `SELECT e.id AS enrollment_id, e.expires_at, e.created_at AS enrolled_at, b.id AS batch_id, b.name AS batch_name, b.slug,
            c.id AS course_id, c.name AS course_name, c.thumbnail, c.slug AS course_slug
     FROM enrollments e
     JOIN batches b ON b.id = e.batch_id
     JOIN courses c ON c.id = b.course_id
     WHERE e.user_id = ? AND e.status = 'active' AND e.batch_id IS NOT NULL
     ORDER BY e.created_at DESC`,
    [userId],
  );
}

export async function studentSeries(userId: string) {
  return all<any>(
    `SELECT e.id AS enrollment_id, e.expires_at, t.id AS series_id, t.title, t.slug, t.subject, t.thumbnail, t.test_count
     FROM enrollments e
     JOIN test_series t ON t.id = e.test_series_id
     WHERE e.user_id = ? AND e.status = 'active' AND e.test_series_id IS NOT NULL
     ORDER BY e.created_at DESC`,
    [userId],
  );
}

export async function hasBatchAccess(userId: string, batchId: string) {
  const row = await one<any>(
    "SELECT * FROM enrollments WHERE user_id = ? AND batch_id = ? AND status = 'active'",
    [userId, batchId],
  );
  if (!row) return null;
  if (row.expires_at && row.expires_at < now()) return null;
  return row;
}

export async function batchCurriculum(batchId: string) {
  const subjects = await all<any>("SELECT * FROM subjects WHERE batch_id = ? ORDER BY sort_order, name", [batchId]);
  const chapters = await all<any>(
    `SELECT ch.* FROM chapters ch JOIN subjects s ON s.id = ch.subject_id WHERE s.batch_id = ? ORDER BY ch.sort_order, ch.name`,
    [batchId],
  );
  const lessons = await all<any>(
    `SELECT l.id, l.title, l.chapter_id, l.duration_seconds, l.published, l.sort_order,
            v.status AS video_status, v.thumbnail_path
     FROM lessons l
     JOIN chapters ch ON ch.id = l.chapter_id
     JOIN subjects s ON s.id = ch.subject_id
     LEFT JOIN video_assets v ON v.lesson_id = l.id
     WHERE s.batch_id = ?
     ORDER BY l.sort_order, l.title`,
    [batchId],
  );
  return { subjects, chapters, lessons };
}

export async function studentPurchases(userId: string) {
  const purchases = await all<any>(
    "SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  const items = await all<any>(
    `SELECT i.* FROM purchase_items i JOIN purchases p ON p.id = i.purchase_id WHERE p.user_id = ?`,
    [userId],
  );
  return purchases.map((row) => ({ ...row, items: items.filter((item) => item.purchase_id === row.id) }));
}

export async function studentPayments(userId: string) {
  return all<any>("SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

export async function studentNotes(userId: string) {
  return all<any>(
    `SELECT m.* FROM study_materials m
     WHERE m.published = 1 AND (
       m.batch_id IN (SELECT batch_id FROM enrollments WHERE user_id = ? AND status = 'active' AND batch_id IS NOT NULL)
       OR m.course_id IN (
         SELECT b.course_id FROM enrollments e JOIN batches b ON b.id = e.batch_id
         WHERE e.user_id = ? AND e.status = 'active' AND e.batch_id IS NOT NULL
       )
     )
     ORDER BY m.created_at DESC`,
    [userId, userId],
  );
}

export async function studentTests(userId: string) {
  return all<any>(
    `SELECT t.*, ts.title AS series_title
     FROM tests t
     JOIN test_series ts ON ts.id = t.series_id
     JOIN enrollments e ON e.test_series_id = ts.id AND e.user_id = ? AND e.status = 'active'
     WHERE t.published = 1
     ORDER BY t.created_at DESC`,
    [userId],
  );
}

export async function studentAttempts(userId: string) {
  return all<any>(
    `SELECT a.*, t.title AS test_title
     FROM test_attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.user_id = ?
     ORDER BY a.started_at DESC`,
    [userId],
  );
}

export async function studentNotifications(userId: string) {
  return all<any>("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId]);
}

export async function studentProfile(userId: string) {
  return one<any>(
    `SELECT u.full_name, u.email, u.mobile, u.email_verified, p.city, p.preferred_course, p.bio
     FROM users u LEFT JOIN student_profiles p ON p.user_id = u.id WHERE u.id = ?`,
    [userId],
  );
}
