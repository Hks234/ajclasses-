import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getCourses, getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";

export const metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await ready();
  const [courses, settings] = await Promise.all([getCourses(), getSettings()]);
  return (
    <>
      <PageHero kicker="CA · CS · CMA" title="Courses" text={settings.courses_intro || "Nine coaching programmes. Fees appear only after a batch is published."} />
      <section className="bg-plum py-12">
        <div className="container-aj grid gap-5 md:grid-cols-3">
        {courses.map((course) => (
          <article key={course.id} className="hover-lift relative rounded-[12px] bg-white p-[30px]">
            {course.badge ? <span className="badge-pop">{course.badge}</span> : null}
            <p className="text-xs font-semibold uppercase tracking-wider text-orange">{course.category_name}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-plum">{course.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.duration ? <span className="chip">{course.duration}</span> : null}
              {course.learning_mode ? <span className="chip">{course.learning_mode}</span> : null}
              {course.start_price ? <span className="chip">From {inr(Number(course.start_price))}</span> : <span className="chip">Enquire for fees</span>}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Link href={`/courses/${course.slug}`} className="btn-orange">Know More</Link>
              <Link href="/shop" className="btn-line">Buy a batch</Link>
            </div>
          </article>
        ))}
        </div>
      </section>
    </>
  );
}
