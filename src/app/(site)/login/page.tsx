import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Student Login" };
export default function Page() {
  return <><PageHero kicker="Students" title="Student Login" /><section className="container-aj max-w-lg py-12"><Suspense><LoginForm /></Suspense></section></>;
}
