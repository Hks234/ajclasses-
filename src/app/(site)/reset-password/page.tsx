import { Suspense } from "react";
import { ResetPageClient } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Choose a new password" };
export default function Page() { return <><PageHero kicker="Account" title="Choose a new password" /><section className="bg-paper py-12"><div className="container-aj max-w-lg"><Suspense><ResetPageClient /></Suspense></div></section></>; }
