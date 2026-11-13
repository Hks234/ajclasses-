import { Policy } from "@/components/policy";
export const metadata = { title: "Privacy Policy" };
export const dynamic = "force-dynamic";
export default function Page() { return <Policy settingKey="privacy_html" title="Privacy Policy" />; }
