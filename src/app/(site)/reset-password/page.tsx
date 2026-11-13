import { Suspense } from "react";
import { ResetPageClient } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Choose a new password" };
export default function Page() { return <><PageHero kicker="Account" title="Choose a new password" /><section className="container-aj max-w-lg py-12"><Suspense><ResetPageClient /></Suspense></section></>; }
