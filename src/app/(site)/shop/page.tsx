import { PageHero } from "@/components/page-hero";
import { ShopGrid } from "@/components/shop-grid";
import { getCourses, getSettings, getShopItems } from "@/lib/content";
import { ready } from "@/lib/db";

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  await ready();
  const [items, courses, settings] = await Promise.all([getShopItems(), getCourses(), getSettings()]);
  return (
    <>
      <PageHero kicker="Shop" title={settings.shop_title || "Buy a published batch"} text={settings.shop_subtitle || "Published batches with fees can be purchased here. Access opens in the student portal after payment."} />
      <section className="bg-plum py-12">
        <div className="container-aj">
          <ShopGrid items={items} courses={courses} />
        </div>
      </section>
    </>
  );
}
