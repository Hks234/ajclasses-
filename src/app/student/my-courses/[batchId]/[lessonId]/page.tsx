import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ready } from "@/lib/db";
import { canWatch, lessonContext, signPlayback } from "@/lib/video";
import { LessonPlayer } from "@/components/student/player";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ batchId: string; lessonId: string }> }) {
  await ready();
  const session = await getSession();
  if (!session) return null;
  const { lessonId } = await params;
  if (!(await canWatch(session.id, lessonId))) notFound();
  const lesson = await lessonContext(lessonId);
  if (!lesson) notFound();
  const token = signPlayback(session.id, lessonId);
  const readyHls = Boolean(lesson.hls_path && (lesson.video_status === "ready" || lesson.video_status === "ready_progressive"));
  const src = readyHls && lesson.hls_path
    ? `/api/stream/${lessonId}/hls/master.m3u8?token=${encodeURIComponent(token)}`
    : `/api/stream/${lessonId}?token=${encodeURIComponent(token)}`;
  return (
    <div>
      <p className="text-sm font-semibold text-orange">{lesson.subject_name} · {lesson.chapter_name}</p>
      <h1 className="font-display text-4xl text-navy">{lesson.title}</h1>
      <div className="mt-6">
        {lesson.video_id ? <LessonPlayer src={src} hls={Boolean(lesson.hls_path && lesson.video_status === "ready")} /> : <p className="card p-6">This lesson does not have a video yet.</p>}
      </div>
      {lesson.description ? <p className="mt-4 max-w-3xl text-slate-600">{lesson.description}</p> : null}
    </div>
  );
}
