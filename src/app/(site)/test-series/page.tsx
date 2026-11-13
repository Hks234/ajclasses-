import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getTestSeries } from "@/lib/content";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";

export const metadata = { title: "Test Series" };
export const dynamic = "force-dynamic";

export default async function TestSeriesPage() {
  await ready();
  const series = await getTestSeries();
  return (
    <>
      <PageHero kicker="Practice" title="Test Series" text="Published test series for CA, CS and CMA. Scores are calculated on the server." />
      <section className="container-aj grid gap-5 py-12 md:grid-cols-3">
        {series.length ? series.map((item) => (
          <article key={item.id} className="card p-5">
            <p className="text-xs font-bold uppercase text-orange">{item.course_name || item.subject}</p>
            <h2 className="mt-2 text-2xl font-extrabold text-navy">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <p className="mt-4 text-xl font-extrabold text-orange">{inr(item.price_paise)}</p>
            <Link href={`/test-series/${item.slug}`} className="btn-navy mt-4">View series</Link>
          </article>
        )) : <p className="text-slate-600">No test series has been published yet.</p>}
      </section>
    </>
  );
}
