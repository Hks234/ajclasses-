import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getCourses } from "@/lib/content";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";

export const metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await ready();
  const courses = await getCourses();
  return (
    <>
      <PageHero kicker="CA · CS · CMA" title="Courses" text="Nine coaching programmes. Fees appear only after a batch is published." />
      <section className="container-aj grid gap-5 py-12 md:grid-cols-3">
        {courses.map((course) => (
          <article key={course.id} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-orange">{course.category_name}</p>
            <h2 className="mt-2 text-2xl font-extrabold text-navy">{course.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
            <p className="mt-4 font-extrabold text-orange">{course.start_price ? `From ${inr(Number(course.start_price))}` : "Enquire for fees"}</p>
            <Link href={`/courses/${course.slug}`} className="btn-navy mt-4">Explore Course</Link>
          </article>
        ))}
      </section>
    </>
  );
}
