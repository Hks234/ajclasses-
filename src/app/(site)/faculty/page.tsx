import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getFaculty, getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { initials } from "@/lib/utils";

export const metadata = { title: "Faculty" };
export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  await ready();
  const [faculty, settings] = await Promise.all([getFaculty(), getSettings()]);
  return (
    <>
      <PageHero kicker={settings.faculty_section_kicker || "Faculty"} title={settings.faculty_page_title || "Industry Leaders Helping You Find The Way"} />
      <section className="bg-plum py-12">
        <div className="container-aj grid gap-5 md:grid-cols-3">
          {faculty.map((person) => (
            <article key={person.id} className="faculty-card">
              {person.photo_url ? <img src={person.photo_url} alt={person.full_name} /> : <div className="faculty-fallback flex items-center justify-center bg-purple font-display text-5xl font-bold text-white">{initials(person.full_name)}</div>}
              <div className="faculty-meta">
                <h2 className="font-display text-lg font-semibold">{person.full_name}</h2>
                <p className="text-sm text-orange">{person.qualification}</p>
                <p className="mt-1 text-xs text-white/70">{person.specialization}{person.experience ? ` · ${person.experience}` : ""}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="container-aj mt-8 grid gap-5 md:grid-cols-2">
          {faculty.map((person) => (
            <article key={`${person.id}-bio`} className="rounded-[12px] bg-white p-5 text-ink">
              <h3 className="font-display text-xl font-semibold text-plum">{person.full_name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{person.biography}</p>
              <p className="mt-2 text-sm font-semibold">Subjects: {person.subjects}</p>
              <div className="mt-3 flex gap-3 text-sm font-bold text-purple">
                {person.instagram ? <a href={person.instagram}>Instagram</a> : null}
                {person.linkedin ? <a href={person.linkedin}>LinkedIn</a> : null}
                {person.youtube ? <a href={person.youtube}>YouTube</a> : null}
                <Link href="/enquiry">Enquire</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
