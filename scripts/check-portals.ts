import { ready, all, one } from "../src/lib/db";

async function main() {
  await ready();
  const tables = await all("SHOW TABLES");
  console.log("tables", tables.length);
  const users = await one<{ c: number }>("SELECT COUNT(*) AS c FROM users");
  const admins = await one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
  const students = await one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role = 'student'");
  console.log("users", users?.c, "admins", admins?.c, "students", students?.c);
  await all("SELECT full_name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC LIMIT 5");
  await one("SELECT COALESCE(SUM(amount_paise),0) AS c FROM payments WHERE status = 'paid'");
  await all("SELECT id, amount_paise, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5");
  await all("SELECT e.id FROM enrollments e JOIN batches b ON b.id = e.batch_id JOIN courses c ON c.id = b.course_id WHERE e.status = 'active' LIMIT 1");
  console.log("dashboard queries ok");
}

main().catch((error) => {
  console.error("FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
