"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);
  useEffect(() => { fetch("/api/setup").then((res) => res.json()).then((data) => { if (!data.needsSetup) setClosed(true); }); }, []);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password") }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    router.push("/admin/login");
  }
  return (
    <div className="min-h-screen bg-paper px-4 py-16">
      <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4 p-6">
        <h1 className="font-display text-4xl text-navy">Create the first admin</h1>
        <p className="text-sm text-slate-600">This screen closes after one super admin exists. You will be asked to change the password after signing in.</p>
        {closed ? <p className="font-semibold">Setup is already complete.</p> : <>
          <input name="fullName" required placeholder="Full name" className="field" />
          <input name="email" type="email" required placeholder="Email" className="field" />
          <input name="password" type="password" required placeholder="Password" className="field" />
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
          <button className="btn-orange w-full">Create admin</button>
        </>}
      </form>
    </div>
  );
}
