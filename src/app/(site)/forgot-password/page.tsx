import { ForgotForm } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Forgot password" };
export default function Page() { return <><PageHero kicker="Account" title="Reset password" /><section className="container-aj max-w-lg py-12"><ForgotForm /></section></>; }
