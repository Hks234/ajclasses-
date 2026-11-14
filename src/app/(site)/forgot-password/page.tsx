import { ForgotForm } from "@/components/auth-forms";
import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Forgot password" };
export default function Page() { return <><PageHero kicker="Account" title="Reset password" /><section className="bg-paper py-12"><div className="container-aj max-w-lg"><ForgotForm /></div></section></>; }
