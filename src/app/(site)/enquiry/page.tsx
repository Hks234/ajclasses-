import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/widgets";
import { getBranches, getCourses } from "@/lib/content";
import { ready } from "@/lib/db";

export const metadata = { title: "Enquire Now" };
export const dynamic = "force-dynamic";

export default async function EnquiryPage() {
  await ready();
  const [courses, branches] = await Promise.all([getCourses(), getBranches()]);
  return (
    <>
      <PageHero kicker="Admissions" title="Enquire Now" text="Your details are saved and the institute is notified by email when mail is configured." />
      <section className="container-aj max-w-3xl py-12"><EnquiryForm courses={courses} branches={branches} source="enquiry" /></section>
    </>
  );
}
