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
      <section className="container-aj grid gap-8 py-12 lg:grid-cols-2">
        <EnquiryForm courses={courses} branches={branches} source="contact" />
        <div className="space-y-4">{branches.map((branch) => <p key={branch.id} className="card p-4"><strong>{branch.name}</strong><br />{branch.address}<br />{branch.phone}</p>)}</div>
      </section>
    </>
  );
}
