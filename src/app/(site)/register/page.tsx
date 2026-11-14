import { RegisterForm } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Register" };
export default function Page() {
  return <><PageHero kicker="Students" title="Create your account" /><section className="bg-paper py-12"><div className="container-aj max-w-lg"><RegisterForm /></div></section></>;
}
