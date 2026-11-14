"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export function BannerSlider({ banners }: { banners: any[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const delay = Number(banners[index]?.duration_ms || 5000);
    const timer = setTimeout(() => setIndex((value) => (value + 1) % banners.length), delay);
    return () => clearTimeout(timer);
  }, [index, banners]);
  if (!banners.length) return null;
  const banner = banners[index];
  const image = banner.image_desktop;
  return (
    <section className="container-aj py-8">
      <a href={banner.href || "/courses"} className="relative block overflow-hidden rounded-[12px] bg-navy shadow-lift">
        <img key={banner.id} src={image} alt={banner.title || "AJ Classes promotion"} className={`h-[240px] w-full object-cover sm:h-[380px] ${banner.animation === "slide" ? "banner-slide" : "banner-fade"}`} />
        <img src={banner.image_mobile || image} alt="" className="hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-deep/80 via-deep/20 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-xl p-6 text-white sm:p-10">
          <p className="font-display text-3xl">{banner.title}</p>
          {banner.description ? <p className="mt-2 text-sm text-white/80">{banner.description}</p> : null}
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          {banners.map((item, itemIndex) => <button key={item.id} aria-label={`Banner ${itemIndex + 1}`} onClick={(event) => { event.preventDefault(); setIndex(itemIndex); }} className={`h-2.5 w-2.5 rounded-full ${itemIndex === index ? "bg-orange" : "bg-white/70"}`} />)}
        </div>
      </a>
    </section>
  );
}

export function EnquiryForm({ courses, branches, source = "website", variant = "full", title, defaultCourse = "", defaultBranch = "" }: { courses: { name: string }[]; branches: any[]; source?: string; variant?: "full" | "hero"; title?: string; defaultCourse?: string; defaultBranch?: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      fullName: form.get("fullName"), mobile: form.get("mobile"), email: form.get("email"), course: form.get("course"), branchId: form.get("branchId"), message: form.get("message"), source, company_website: form.get("company_website"),
    }) });
    const data = await res.json();
    setPending(false);
    setMessage(res.ok ? "Your enquiry has been received. AJ Classes will contact you." : data.error || "Could not submit.");
    if (res.ok) event.currentTarget.reset();
  }
  if (variant === "hero") {
    return (
      <form onSubmit={onSubmit} className="space-y-3">
        {title ? <h5 className="font-display text-[20px] font-semibold leading-[25px] text-purple">{title}</h5> : null}
        <input className="hidden" name="company_website" tabIndex={-1} autoComplete="off" />
        <input name="fullName" required className="field" placeholder="Your Name" />
        <input name="email" type="email" required className="field" placeholder="Your Email" />
        <input name="mobile" required className="field" placeholder="Phone Number" />
        <select name="course" defaultValue={defaultCourse} className="field"><option value="">Select Course</option>{courses.map((course) => <option key={course.name}>{course.name}</option>)}</select>
        {branches[0] ? <input type="hidden" name="branchId" value={defaultBranch || branches[0].id} /> : null}
        <button className="btn-orange w-full" disabled={pending}>{pending ? "Sending…" : "Enquire Now"}</button>
        {message ? <p className="text-xs font-semibold text-purple">{message}</p> : null}
        <p className="text-[11px] leading-4 text-slate-500">By submitting you agree to the <a className="font-semibold text-purple" href="/terms-and-conditions">Terms and Conditions</a> and <a className="font-semibold text-purple" href="/privacy-policy">Privacy Policy</a>.</p>
      </form>
    );
  }
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <input className="hidden" name="company_website" tabIndex={-1} autoComplete="off" />
      <label className="block"><span className="label">Student full name</span><input name="fullName" required className="field" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Mobile number</span><input name="mobile" required className="field" placeholder="10-digit mobile" /></label>
        <label className="block"><span className="label">Email</span><input name="email" type="email" required className="field" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Interested course</span>
          <select name="course" defaultValue={defaultCourse} className="field"><option value="">Select a course</option>{courses.map((course) => <option key={course.name}>{course.name}</option>)}</select>
        </label>
        <label className="block"><span className="label">Preferred branch</span>
          <select name="branchId" defaultValue={defaultBranch} className="field"><option value="">Select a branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
        </label>
      </div>
      <label className="block"><span className="label">Message</span><textarea name="message" rows={4} className="field" /></label>
      <button className="btn-orange" disabled={pending}>{pending ? "Sending…" : "Submit enquiry"}</button>
      {message ? <p className="text-sm font-semibold text-navy">{message}</p> : null}
    </form>
  );
}

export function WhatsAppButton({ phone }: { phone: string }) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return <a href={`https://wa.me/${full}`} className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift" aria-label="WhatsApp"><MessageCircle /></a>;
}

export function ReviewForm() {
  const [message, setMessage] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/testimonials", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      studentName: form.get("studentName"), courseName: form.get("courseName"), reviewText: form.get("reviewText"), rating: form.get("rating") ? Number(form.get("rating")) : null,
    }) });
    const data = await res.json();
    setMessage(res.ok ? "Thank you. Your review will appear after AJ Classes approves it." : data.error);
    if (res.ok) event.currentTarget.reset();
  }
  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-6">
      <h2 className="font-display text-3xl text-navy">Share your experience</h2>
      <input name="studentName" required placeholder="Your name" className="field" />
      <input name="courseName" required placeholder="Course" className="field" />
      <select name="rating" className="field"><option value="">Rating, if you want to give one</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star</option>)}</select>
      <textarea name="reviewText" required minLength={20} rows={4} placeholder="Your review" className="field" />
      <button className="btn-orange">Submit for approval</button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </form>
  );
}

export function Stats({ items }: { items: { label: string; value: string }[] }) {
  const [shown, setShown] = useState(items.map(() => 0));
  useEffect(() => {
    const timer = setInterval(() => {
      setShown((current) => current.map((value, index) => {
        const target = Number(items[index].value);
        if (!Number.isFinite(target)) return 0;
        return value >= target ? target : Math.min(target, value + Math.ceil(target / 24));
      }));
    }, 40);
    return () => clearInterval(timer);
  }, [items]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} className="card p-6">
          <p className="font-display text-4xl font-bold text-orange">{Number.isFinite(Number(item.value)) ? shown[index] : item.value}</p>
          <p className="mt-2 font-semibold text-navy">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
