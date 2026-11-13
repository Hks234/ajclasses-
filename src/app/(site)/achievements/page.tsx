import { PageHero } from "@/components/page-hero";
import { getAchievements } from "@/lib/content";
import { ready } from "@/lib/db";

export const metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  await ready();
  const items = await getAchievements();
  return (
    <>
      <PageHero kicker="Results" title="Achievements" text="Only achievements added by AJ Classes are shown." />
      <section className="container-aj grid gap-5 py-12 md:grid-cols-3">
        {items.length ? items.map((item) => (
          <article key={item.id} className="card p-5">
            {item.image_url ? <img src={item.image_url} alt="" className="mb-4 h-48 w-full rounded-2xl object-cover" /> : null}
            <p className="text-xs font-bold uppercase text-orange">{item.category} {item.event_date ? `· ${String(item.event_date).slice(0, 10)}` : ""}</p>
            <h2 className="mt-2 text-xl font-extrabold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">{item.images?.map((image: any) => <img key={image.id} src={image.image_url} alt="" className="h-20 w-full rounded-xl object-cover" />)}</div>
          </article>
        )) : <p>No achievements have been published yet.</p>}
      </section>
    </>
  );
}
