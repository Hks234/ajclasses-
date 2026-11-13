import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { getBanners, getBatches, getCourse, getFaculty } from "@/lib/content";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";
import { BannerSlider } from "@/components/widgets";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await ready();
  const { slug } = await params;
  const course = await getCourse(slug);
  return { title: course?.seo_title || course?.name || "Course", description: course?.seo_description || course?.description };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await ready();
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course || course.status !== "published") notFound();
  const [batches, banners, faculty] = await Promise.all([getBatches(course.id), getBanners("course"), getFaculty()]);
  const teacher = faculty.find((person) => person.id === course.faculty_id);
  const highlights = String(course.highlights || "").split("\n").filter(Boolean);
  return (
    <>
      <PageHero kicker={course.category_name} title={course.name} text={course.description} />
      {course.banner ? <img src={course.banner} alt="" className="h-72 w-full object-cover" /> : null}
      <BannerSlider banners={banners} />
      <section className="container-aj grid gap-8 py-12 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <h2 className="font-display text-3xl text-navy">Highlights</h2>
          <ul className="mt-4 space-y-2">{highlights.map((item) => <li key={item} className="rounded-2xl bg-paper px-4 py-3 text-sm font-semibold">{item}</li>)}</ul>
          <h2 className="mt-10 font-display text-3xl text-navy">Batches</h2>
          <div className="mt-4 space-y-4">
            {batches.length ? batches.map((batch) => (
              <article key={batch.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold">{batch.name}</h3>
                    <p className="text-sm text-slate-500">{batch.start_date || "Start date to be announced"}{batch.end_date ? ` to ${batch.end_date}` : ""} · {batch.validity_days} days access</p>
                    <p className="mt-2 text-sm">{batch.description}</p>
                  </div>
                  <div className="text-right">
                    {batch.compare_at_paise > batch.price_paise ? <p className="text-sm text-slate-400 line-through">{inr(batch.compare_at_paise)}</p> : null}
                    <p className="text-2xl font-extrabold text-orange">{inr(batch.price_paise)}</p>
                    <Link href={`/checkout/batch/${batch.id}`} className="btn-orange mt-3">Buy Now</Link>
                  </div>
                </div>
              </article>
            )) : <p className="rounded-2xl bg-cream p-4 text-sm font-semibold">No published batch yet. Enquire and the institute will share the next schedule.</p>}
          </div>
        </div>
        <aside className="card h-fit p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-orange">Faculty</p>
          <p className="mt-2 text-xl font-extrabold">{teacher?.full_name || "AJ Classes faculty"}</p>
          <p className="text-sm text-slate-600">{teacher?.qualification}</p>
          <Link href="/enquiry" className="btn-navy mt-5 w-full">Enquire Now</Link>
        </aside>
      </section>
    </>
  );
}
