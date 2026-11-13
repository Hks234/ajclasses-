import { Suspense } from "react";
import { VerifyPageClient } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Verify email" };
export default function Page() { return <><PageHero kicker="Account" title="Verify email" /><section className="container-aj max-w-lg py-12"><Suspense><VerifyPageClient /></Suspense></section></>; }
