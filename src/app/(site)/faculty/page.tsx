import { PageHero } from "@/components/page-hero";
import { getFaculty } from "@/lib/content";
import { ready } from "@/lib/db";
import { initials } from "@/lib/utils";

export const metadata = { title: "Faculty" };
export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  await ready();
  const faculty = await getFaculty();
  return (
    <>
      <PageHero kicker="Faculty" title="Learn from Our Expert Faculty" />
      <section className="container-aj grid gap-5 py-12 md:grid-cols-3">
        {faculty.map((person) => (
          <article key={person.id} className="card p-5">
            {person.photo_url ? <img src={person.photo_url} alt={person.full_name} className="h-64 w-full rounded-2xl object-cover" /> : <div className="flex h-64 items-center justify-center rounded-2xl bg-navy text-5xl font-bold text-white">{initials(person.full_name)}</div>}
            <h2 className="mt-4 text-2xl font-extrabold">{person.full_name}</h2>
            <p className="font-semibold text-orange">{person.qualification}</p>
            <p className="text-sm text-slate-500">{person.specialization}{person.experience ? ` · ${person.experience}` : ""}</p>
            <p className="mt-3 text-sm leading-6">{person.biography}</p>
            <p className="mt-2 text-sm font-semibold">Subjects: {person.subjects}</p>
            <div className="mt-3 flex gap-3 text-sm font-bold text-royal">
              {person.instagram ? <a href={person.instagram}>Instagram</a> : null}
              {person.linkedin ? <a href={person.linkedin}>LinkedIn</a> : null}
              {person.youtube ? <a href={person.youtube}>YouTube</a> : null}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
