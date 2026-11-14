import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { all, one, ready } from "@/lib/db";
import { TestRunner } from "@/components/student/forms";

export const dynamic = "force-dynamic";

export default async function TestPage({ params, searchParams }: { params: Promise<{ testId: string }>; searchParams: Promise<{ attempt?: string }> }) {
  await ready();
  const session = await getSession();
  if (!session) return null;
  const { testId } = await params;
  const query = await searchParams;
  const test = await one<any>("SELECT * FROM tests WHERE id = ? AND published = 1", [testId]);
  if (!test) notFound();
  const access = await one("SELECT id FROM enrollments WHERE user_id = ? AND test_series_id = ? AND status = 'active'", [session.id, test.series_id]);
  if (!access) notFound();
  const attemptId = query.attempt || "";
  const attempt = attemptId ? await one<any>("SELECT * FROM test_attempts WHERE id = ? AND user_id = ?", [attemptId, session.id]) : null;
  const questions = await all<any>("SELECT id, prompt, marks, sort_order FROM test_questions WHERE test_id = ? ORDER BY sort_order", [testId]);
  const options = questions.length
    ? await all<any>(
      `SELECT id, question_id, option_text, sort_order FROM test_options WHERE question_id IN (${questions.map(() => "?").join(",")}) ORDER BY sort_order`,
      questions.map((row) => row.id),
    )
    : [];
  const paper = questions.map((question) => ({ ...question, options: options.filter((option) => option.question_id === question.id) }));
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">{test.title}</h1>
      <p className="mt-2 text-slate-600">{test.duration_minutes} minutes. {test.instructions}</p>
      <div className="mt-6">
        {attempt && attempt.status === "in_progress" ? <TestRunner testId={testId} attemptId={attempt.id} questions={paper} /> : <p className="card p-6">Start this test from the Online Tests page.</p>}
      </div>
    </div>
  );
}
