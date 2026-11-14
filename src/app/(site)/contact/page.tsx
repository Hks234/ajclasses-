import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/widgets";
import { getBranches, getCourses, getSettings } from "@/lib/content";
import { ready } from "@/lib/db";

export const metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  await ready();
  const [courses, branches, settings] = await Promise.all([getCourses(), getBranches(), getSettings()]);
  return (
    <>
      <PageHero kicker="Contact" title="Talk to AJ Classes" text={settings.email} />
      <section className="bg-paper py-12">
        <div className="container-aj grid gap-8 lg:grid-cols-2">
          <EnquiryForm courses={courses} branches={branches} source="contact" />
          <div className="space-y-4">{branches.map((branch) => (
            <article key={branch.id} className="card p-5">
              <p className="font-display text-lg font-semibold text-plum">{branch.name}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{branch.address}</p>
              <p className="mt-2 text-sm font-semibold">{branch.phone}</p>
              <a className="mt-3 inline-block text-sm font-semibold text-orange" href={`/enquiry?branch=${branch.id}`}>Enquire at this branch</a>
            </article>
          ))}</div>
        </div>
      </section>
    </>
  );
}
