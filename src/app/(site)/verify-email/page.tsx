import { Suspense } from "react";
import { VerifyPageClient } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Verify email" };
export default function Page() { return <><PageHero kicker="Account" title="Verify email" /><section className="bg-paper py-12"><div className="container-aj max-w-lg"><Suspense><VerifyPageClient /></Suspense></div></section></>; }
