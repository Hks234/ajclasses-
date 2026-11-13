import { PageHero } from "@/components/page-hero";
import { ReviewForm } from "@/components/widgets";
import { getTestimonials } from "@/lib/content";
import { ready } from "@/lib/db";
import { initials } from "@/lib/utils";

export const metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  await ready();
  const items = await getTestimonials();
  return (
    <>
      <PageHero kicker="Reviews" title="Testimonials" text="Approved reviews are published here. Demonstration cards are labelled." />
      <section className="container-aj grid gap-8 py-12 lg:grid-cols-[1.2fr_.8fr]">
        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="card p-5">
              {item.is_demo ? <p className="mb-2 text-xs font-bold uppercase text-orange">Demonstration — not a genuine review</p> : null}
              <div className="flex items-center gap-3">
                {item.photo_url ? <img src={item.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{initials(item.student_name)}</div>}
                <div><p className="font-bold">{item.student_name}</p><p className="text-xs text-slate-500">{item.course_name} · {item.review_date}</p></div>
              </div>
              {item.rating ? <p className="mt-2 text-orange">{"★".repeat(Number(item.rating))}</p> : null}
              <p className="mt-3 text-sm leading-6">{item.review_text}</p>
            </article>
          ))}
        </div>
        <ReviewForm />
      </section>
    </>
  );
}
