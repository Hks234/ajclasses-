import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/widgets";
import { getBranches, getCourses } from "@/lib/content";
import { ready } from "@/lib/db";

export const metadata = { title: "Enquire Now" };
export const dynamic = "force-dynamic";

export default async function EnquiryPage({ searchParams }: { searchParams: Promise<{ course?: string; branch?: string }> }) {
  await ready();
  const query = await searchParams;
  const [courses, branches] = await Promise.all([getCourses(), getBranches()]);
  const matchedCourse = courses.find((course) => course.slug === query.course || course.name === query.course || course.id === query.course);
  return (
    <>
      <PageHero kicker="Admissions" title="Enquire Now" text="Your details are saved and the institute is notified by email when mail is configured." />
      <section className="bg-paper py-12"><div className="container-aj max-w-3xl"><EnquiryForm courses={courses} branches={branches} source="enquiry" defaultCourse={matchedCourse?.name || query.course || ""} defaultBranch={query.branch || ""} /></div></section>
    </>
  );
}
