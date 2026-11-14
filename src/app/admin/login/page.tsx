import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { LogoMark } from "@/components/brand";
import { getSession } from "@/lib/auth";
import { one, ready } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  await ready();
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin/dashboard");
  const admin = await one("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  return (
    <div className="min-h-screen bg-deep px-4 py-16 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3"><LogoMark /><div><p className="text-2xl font-extrabold">AJ Classes</p><p className="text-sm text-orange">Admin sign in</p></div></div>
        <Suspense><LoginForm portal="admin" /></Suspense>
        {!admin ? <p className="mt-4 text-sm">First time here? <Link className="font-bold text-orange" href="/setup">Create the super admin</Link></p> : null}
      </div>
    </div>
  );
}
