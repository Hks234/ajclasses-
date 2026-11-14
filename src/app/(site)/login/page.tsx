import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
import { getSession } from "@/lib/auth";
import { ready } from "@/lib/db";

export const metadata = { title: "Student Login" };
export const dynamic = "force-dynamic";

export default async function Page() {
  await ready();
  const session = await getSession();
  if (session?.role === "student") redirect("/student/dashboard");
  if (session?.role === "admin") redirect("/admin/dashboard");
  return <><PageHero kicker="Students" title="Student Login" /><section className="container-aj max-w-lg py-12"><Suspense><LoginForm /></Suspense></section></>;
}
