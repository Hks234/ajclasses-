import { PageHero } from "./page-hero";
import { getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { sanitizeHtml } from "@/lib/utils";

export async function Policy({ settingKey, title }: { settingKey: string; title: string }) {
  await ready();
  const settings = await getSettings();
  return (
    <>
      <PageHero kicker="AJ Classes" title={title} />
      <section className="bg-paper py-12"><article className="container-aj max-w-3xl leading-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings[settingKey] || "") }} /></section>
    </>
  );
}
