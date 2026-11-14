import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ready } from "@/lib/db";
import { StudentSignOut } from "@/components/student/sign-out";

export const dynamic = "force-dynamic";
const links = [["/student/dashboard", "Overview"], ["/student/my-courses", "My Courses"], ["/student/my-purchases", "My Purchases"], ["/student/my-test-series", "My Test Series"], ["/student/tests", "Online Tests"], ["/student/results", "Results"], ["/student/notes", "Notes"], ["/student/payments", "Payments"], ["/student/notifications", "Notifications"], ["/student/profile", "Profile"], ["/student/support", "Help"]];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await ready();
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login?next=/student/dashboard");
  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-navy text-white">
        <div className="px-5 py-6"><p className="text-xl font-extrabold">AJ Classes</p><p className="text-sm text-orange">{session.fullName}</p>{!session.emailVerified ? <p className="mt-2 text-xs">Verify your email before buying a course.</p> : null}</div>
        <nav className="space-y-1 px-3 pb-6">{links.map(([href, label]) => <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10">{label}</Link>)}</nav>
        <div className="px-5 pb-6"><StudentSignOut /></div>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}
