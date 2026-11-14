"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { inr } from "@/lib/utils";

export function ShopGrid({ items, courses }: { items: any[]; courses: any[] }) {
  const [courseId, setCourseId] = useState("all");
  const visible = useMemo(() => courseId === "all" ? items : items.filter((item) => item.course_id === courseId), [courseId, items]);
  return (
    <>
      <div className="mb-10 flex flex-wrap gap-3">
        <button type="button" onClick={() => setCourseId("all")} className={courseId === "all" ? "btn-orange px-4 py-2 text-sm" : "btn-line px-4 py-2 text-sm"}>All batches</button>
        {courses.map((course) => (
          <button key={course.id} type="button" onClick={() => setCourseId(course.id)} className={courseId === course.id ? "btn-orange px-4 py-2 text-sm" : "btn-line px-4 py-2 text-sm"}>{course.name}</button>
        ))}
      </div>
      {visible.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article key={item.id} className="hover-lift overflow-hidden rounded-[12px] bg-white">
              <div className="h-36 bg-plum p-5 text-white" style={item.thumbnail ? { backgroundImage: `linear-gradient(transparent, var(--plum)), url(${item.thumbnail})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <p className="text-sm font-semibold text-orange">{item.category_name}</p>
                <p className="mt-2 font-display text-lg font-semibold">{item.course_name}</p>
              </div>
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold text-plum">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.faculty_name || "AJ Classes faculty"}{item.start_date ? ` · starts ${item.start_date}` : ""}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-2 text-sm">{item.validity_days} days access</p>
                {item.compare_at_paise > item.price_paise ? <p className="mt-3 text-sm text-slate-400 line-through">{inr(item.compare_at_paise)}</p> : null}
                <p className="text-2xl font-bold text-orange">{inr(item.price_paise)}</p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/checkout/batch/${item.id}`} className="btn-orange">Buy Now</Link>
                  <Link href={`/courses/${item.course_slug}`} className="btn-line">Course details</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[12px] bg-white p-6 font-semibold text-ink">No priced batches are on sale in this filter. Publish a batch with a selling price from the admin portal, or <Link className="text-orange" href="/enquiry">enquire</Link> for the next schedule.</p>
      )}
    </>
  );
}
