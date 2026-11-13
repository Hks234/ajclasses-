import { RegisterForm } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Register" };
export default function Page() {
  return <><PageHero kicker="Students" title="Create your account" /><section className="container-aj max-w-lg py-12"><RegisterForm /></section></>;
}
