"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "./brand";

const links = [
  ["/", "Home"],
  ["/about", "About Us"],
  ["/courses", "Courses"],
  ["/test-series", "Test Series"],
  ["/faculty", "Faculty"],
  ["/achievements", "Achievements"],
  ["/testimonials", "Testimonials"],
  ["/contact", "Contact"],
];

export function Header({ branding, bar }: { branding: any; bar: any }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40">
      {bar ? (
        <a href={bar.href || "/enquiry"} className="block px-4 py-2 text-center text-sm font-semibold" style={{ background: bar.bg_color || "#102A56", color: bar.text_color || "#fff" }}>
          {bar.message}
        </a>
      ) : null}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container-aj flex h-[78px] items-center justify-between gap-4">
          <Link href="/" aria-label="AJ Classes home"><BrandLogo name={branding.name} line={branding.line} logoUrl={branding.logoUrl} height={branding.logoHeight} background={branding.logoBg} /></Link>
          <nav className="hidden items-center gap-5 xl:flex">
            {links.map(([href, label]) => <Link key={href} href={href} className="nav-link">{label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="text-sm font-bold text-navy">Student Login</Link>
            <Link href="/enquiry" className="btn-orange">Enquire Now</Link>
          </div>
          <button className="rounded-full border border-slate-200 p-2 xl:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open ? (
          <div className="space-y-2 border-t border-slate-100 px-4 py-4 xl:hidden">
            {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold text-navy">{label}</Link>)}
            <Link href="/login" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold">Student Login</Link>
            <Link href="/enquiry" onClick={() => setOpen(false)} className="btn-orange w-full">Enquire Now</Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
