import { Policy } from "@/components/policy";
export const metadata = { title: "Refund Policy" };
export const dynamic = "force-dynamic";
export default function Page() { return <Policy settingKey="refund_html" title="Refund Policy" />; }
