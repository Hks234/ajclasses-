import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ready } from "@/lib/db";
import { AdminShell } from "@/components/admin/shell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await ready();
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");
  return <AdminShell name={session.fullName}>{children}</AdminShell>;
}
