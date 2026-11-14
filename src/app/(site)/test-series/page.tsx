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
      <section className="bg-plum py-12"><div className="container-aj grid gap-5 md:grid-cols-3">
        {series.length ? series.map((item) => (
          <article key={item.id} className="card p-5">
            <p className="text-xs font-bold uppercase text-orange">{item.course_name || item.subject}</p>
            <h2 className="mt-2 text-2xl font-extrabold text-navy">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <p className="mt-4 text-xl font-extrabold text-orange">{item.price_paise > 0 ? inr(item.price_paise) : "Enquire for fees"}</p>
            <Link href={`/test-series/${item.slug}`} className="btn-navy mt-4">View series</Link>
            {item.price_paise > 0 ? <Link href={`/checkout/test_series/${item.id}`} className="btn-orange mt-3">Buy now</Link> : null}
          </article>
        )) : <p className="text-white/80">No test series has been published yet.</p>}
      </div></section>
    </>
  );
}
