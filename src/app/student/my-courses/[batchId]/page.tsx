import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { one, ready } from "@/lib/db";
import { batchCurriculum, hasBatchAccess } from "@/lib/student";

export const dynamic = "force-dynamic";

export default async function BatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  await ready();
  const session = await getSession();
  if (!session) return null;
  const { batchId } = await params;
  const access = await hasBatchAccess(session.id, batchId);
  if (!access) notFound();
  const batch = await one<any>(
    `SELECT b.name AS batch_name, c.name AS course_name FROM batches b JOIN courses c ON c.id = b.course_id WHERE b.id = ?`,
    [batchId],
  );
  const { subjects, chapters, lessons } = await batchCurriculum(batchId);
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange">{batch?.course_name}</p>
      <h1 className="font-display text-4xl text-navy">{batch?.batch_name}</h1>
      <div className="mt-8 space-y-6">
        {subjects.map((subject) => (
          <section key={subject.id} className="card p-5">
            <h2 className="text-xl font-extrabold text-navy">{subject.name}</h2>
            {chapters.filter((chapter) => chapter.subject_id === subject.id).map((chapter) => (
              <div key={chapter.id} className="mt-4">
                <h3 className="font-bold">{chapter.name}</h3>
                <ul className="mt-2 space-y-2">
                  {lessons.filter((lesson) => lesson.chapter_id === chapter.id && lesson.published).map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/student/my-courses/${batchId}/${lesson.id}`} className="text-royal font-semibold">{lesson.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
        {!subjects.length ? <p className="card p-6">Lectures will appear here after the institute publishes subjects and chapters.</p> : null}
      </div>
    </div>
  );
}
