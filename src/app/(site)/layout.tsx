import { ready } from "@/lib/db";
import { getAnnouncements, getBranding, getBranches, getCourses } from "@/lib/content";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/widgets";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  await ready();
  const [branding, courses, branches, bars] = await Promise.all([getBranding(), getCourses(), getBranches(), getAnnouncements("bar")]);
  return (
    <>
      <Header branding={branding} bar={bars[0]} />
      <main>{children}</main>
      <Footer branding={branding} courses={courses} branches={branches} />
      <WhatsAppButton phone={branding.whatsapp} />
    </>
  );
}
