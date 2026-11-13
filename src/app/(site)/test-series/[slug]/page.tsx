import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { one, ready } from "@/lib/db";
import { inr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  await ready();
  const { slug } = await params;
  const series = await one<any>("SELECT * FROM test_series WHERE slug = ? AND deleted_at IS NULL AND status = 'published'", [slug]);
  if (!series) notFound();
  return (
    <>
      <PageHero kicker={series.subject || "Test series"} title={series.title} text={series.description} />
      <section className="container-aj max-w-3xl py-12">
        <p className="text-3xl font-extrabold text-orange">{inr(series.price_paise)}</p>
        <p className="mt-2 text-sm text-slate-500">{series.validity_days} days of access</p>
        <div className="card mt-6 p-5 text-sm leading-7">{series.instructions || "Instructions will be shown before each test."}</div>
        <Link href={`/checkout/test_series/${series.id}`} className="btn-orange mt-6">Buy test series</Link>
      </section>
    </>
  );
}
