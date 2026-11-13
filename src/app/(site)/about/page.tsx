import { PageHero } from "@/components/page-hero";
import { getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { sanitizeHtml } from "@/lib/utils";

export const metadata = { title: "About Us" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  await ready();
  const settings = await getSettings();
  return (
    <>
      <PageHero kicker={settings.tagline || "AJ Classes"} title="About AJ Classes" text="Aditya Jhawar Education" />
      <article className="container-aj prose-aj py-12 text-lg leading-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.about_html || "") }} />
    </>
  );
}
