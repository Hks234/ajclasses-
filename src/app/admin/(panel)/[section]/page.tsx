import { AdminSection } from "@/components/admin/section";
import { getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { publicIntegrations } from "@/lib/secrets";

export const dynamic = "force-dynamic";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  await ready();
  const { section } = await params;
  const settings = await getSettings();
  return <AdminSection section={section} settings={settings} integrationStatus={publicIntegrations()} />;
}
