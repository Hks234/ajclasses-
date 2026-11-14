import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { all, one, ready } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await ready();
  const session = await getSession();
  if (!session) return null;
  const { attemptId } = await params;
  const attempt = await one<any>(
    `SELECT a.*, t.title, t.allow_review FROM test_attempts a JOIN tests t ON t.id = a.test_id WHERE a.id = ? AND a.user_id = ?`,
    [attemptId, session.id],
  );
  if (!attempt) notFound();
  const answers = attempt.allow_review && attempt.status === "submitted"
    ? await all<any>(
      `SELECT q.prompt, o.option_text, a.is_correct, a.awarded
       FROM test_answers a
       JOIN test_questions q ON q.id = a.question_id
       LEFT JOIN test_options o ON o.id = a.option_id
       WHERE a.attempt_id = ?`,
      [attemptId],
    )
    : [];
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">{attempt.title}</h1>
      <p className="mt-3 text-lg font-semibold">{attempt.status === "submitted" ? `Score ${Number(attempt.score || 0) / 100} / ${Number(attempt.max_score || 0) / 100}` : "This attempt is still in progress."}</p>
      <div className="mt-6 space-y-3">
        {answers.map((row, index) => (
          <article key={index} className="card p-5">
            <p className="font-bold">{row.prompt}</p>
            <p className="text-sm">{row.option_text || "Not answered"} · {row.is_correct ? "Correct" : "Incorrect"} · {Number(row.awarded || 0) / 100} marks</p>
          </article>
        ))}
      </div>
    </div>
  );
}
