import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, MapPin, Phone } from "lucide-react";
import { getAchievements, getAnnouncements, getBanners, getBranches, getCourses, getFaculty, getSection, getSettings, getTestimonials } from "@/lib/content";
import { ready } from "@/lib/db";
import { BannerSlider, EnquiryForm, Stats } from "@/components/widgets";
import { initials, inr, telLink, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

const icons = ["01", "02", "03", "04", "05", "06", "07", "08"];

export default async function HomePage() {
  await ready();
  const [hero, why, courses, faculty, achievements, testimonials, settings, branches, topBanners, midBanners, updates] = await Promise.all([
    getSection("hero"), getSection("why"), getCourses(), getFaculty(), getAchievements(), getTestimonials(), getSettings(), getBranches(), getBanners("home_top"), getBanners("home_mid"), getAnnouncements("update"),
  ]);
  const ctas = hero?.extra_json ? JSON.parse(hero.extra_json).ctas || [] : [];
  const features = why?.extra_json ? JSON.parse(why.extra_json) : [];
  const stats = [
    { label: "Total Students", value: settings.stat_students },
    { label: "Courses Offered", value: settings.stat_courses },
    { label: "Expert Faculty", value: settings.stat_faculty },
    { label: "Years of Experience", value: settings.stat_years },
  ].filter((item) => item.value && Number(item.value) > 0);
  return (
    <div>
      <section className="hero-grid relative overflow-hidden bg-deep text-white">
        <div className="container-aj grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-orange">{settings.tagline || "Learn Today. Lead Tomorrow."}</p>
            <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">{hero?.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">{hero?.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {(ctas.length ? ctas : [{ label: "Explore Our Courses", href: "/courses" }]).map((cta: any, index: number) => (
                <Link key={cta.href} href={cta.href} className={index === 0 ? "btn-orange" : "btn-ghost"}>{cta.label}</Link>
              ))}
            </div>
          </div>
          <div className="relative">
            {hero?.image_url ? <img src={hero.image_url} alt="AJ Classes" className="h-[460px] w-full rounded-[2rem] object-cover" /> : (
              <div className="floaty rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="rounded-[1.5rem] bg-navy p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-orange">Aditya Jhawar Education</p>
                  <p className="mt-3 font-display text-4xl">CA · CS · CMA</p>
                  <p className="mt-3 text-sm text-white/70">Surat classrooms and an online student portal for purchased batches.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {["CA Foundation", "CA Intermediate", "CS Executive", "CMA Final"].map((item) => <div key={item} className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-navy">{item}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <BannerSlider banners={topBanners} />
      <section className="bg-paper py-16">
        <div className="container-aj">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-orange">Programmes</p><h2 className="font-display text-4xl text-navy">Courses</h2></div>
            <Link href="/courses" className="btn-line">View all</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article key={course.id} className="card overflow-hidden">
                <div className="flex h-36 items-end bg-navy p-5 text-white" style={course.thumbnail ? { backgroundImage: `linear-gradient(transparent, #081B38), url(${course.thumbnail})`, backgroundSize: "cover" } : undefined}>
                  <p className="text-sm font-semibold text-orange">{course.category_name}</p>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-extrabold text-navy">{course.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
                  <p className="mt-4 text-sm font-semibold">{Number(course.batch_count) ? `${course.batch_count} published batch${Number(course.batch_count) === 1 ? "" : "es"}` : "Batches announced by the institute"}</p>
                  <p className="mt-1 text-lg font-extrabold text-orange">{course.start_price ? `From ${inr(Number(course.start_price))}` : "Enquire for fees"}</p>
                  <Link href={`/courses/${course.slug}`} className="btn-navy mt-4">Explore Course <ArrowRight size={16} /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <BannerSlider banners={midBanners} />
      {why ? (
        <section className="py-16">
          <div className="container-aj">
            <h2 className="font-display text-4xl text-navy">{why.title}</h2>
            <p className="mt-2 text-slate-600">{why.subtitle}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature: any, index: number) => (
                <article key={feature.title} className="card p-5">
                  <p className="text-sm font-extrabold text-orange">{icons[index]}</p>
                  <h3 className="mt-3 text-lg font-extrabold text-navy">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="bg-navy py-16 text-white">
        <div className="container-aj">
          <h2 className="font-display text-4xl">Achievements</h2>
          {achievements.length ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {achievements.slice(0, 6).map((item) => (
                <article key={item.id} className="rounded-3xl bg-white/10 p-5">
                  {item.image_url ? <img src={item.image_url} alt="" className="mb-4 h-40 w-full rounded-2xl object-cover" /> : null}
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/75">{item.description}</p>
                </article>
              ))}
            </div>
          ) : <p className="mt-4 max-w-2xl text-white/75">Achievements will appear here when AJ Classes publishes them from the admin dashboard.</p>}
        </div>
      </section>
      <section className="py-16">
        <div className="container-aj">
          <h2 className="font-display text-4xl text-navy">Learn from Our Expert Faculty</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {faculty.map((person) => (
              <article key={person.id} className="card p-5">
                {person.photo_url ? <img src={person.photo_url} alt={person.full_name} className="h-56 w-full rounded-2xl object-cover" /> : <div className="flex h-56 items-center justify-center rounded-2xl bg-cream text-4xl font-extrabold text-navy">{initials(person.full_name)}</div>}
                <h3 className="mt-4 text-xl font-extrabold">{person.full_name}</h3>
                <p className="text-sm font-semibold text-orange">{person.qualification}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{person.biography}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-paper py-16">
        <div className="container-aj">
          <div className="mb-6 flex items-end justify-between"><h2 className="font-display text-4xl text-navy">Student voices</h2><Link href="/testimonials" className="font-bold text-orange">All testimonials</Link></div>
          {testimonials.some((item) => item.is_demo) ? <p className="mb-4 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-navy">Demonstration cards are shown until genuine student reviews are approved. They are not verified reviews.</p> : null}
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.slice(0, 6).map((item) => (
              <article key={item.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-bold text-white">{initials(item.student_name)}</div>
                  <div><p className="font-bold">{item.student_name}</p><p className="text-xs text-slate-500">{item.course_name}</p></div>
                </div>
                {item.rating ? <p className="mt-3 text-orange">{"★".repeat(Number(item.rating))}</p> : null}
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.review_text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {stats.length ? <section className="py-16"><div className="container-aj"><Stats items={stats} /></div></section> : null}
      <section className="py-8">
        <div className="container-aj grid gap-4 md:grid-cols-2">
          {updates.map((item) => <article key={item.id} className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-orange">Update</p><p className="mt-2 font-semibold text-navy">{item.message}</p>{item.href ? <Link href={item.href} className="mt-3 inline-block font-bold text-orange">Read more</Link> : null}</article>)}
        </div>
      </section>
      <section className="bg-cream py-16">
        <div className="container-aj grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl text-navy">Enquire Now</h2>
            <p className="mt-3 text-slate-600">Tell us the course and branch you prefer. The enquiry is saved for the AJ Classes team.</p>
            <div className="mt-6"><EnquiryForm courses={courses} branches={branches} /></div>
          </div>
          <div className="space-y-4">
            {branches.map((branch) => (
              <article key={branch.id} className="card p-5">
                <p className="flex items-center gap-2 font-extrabold text-navy"><MapPin size={16} className="text-orange" />{branch.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{branch.address}</p>
                <div className="mt-3 flex gap-3 text-sm font-bold">
                  <a className="text-navy" href={telLink(branch.phone)}><Phone size={14} className="inline" /> Call</a>
                  <a className="text-orange" href={waLink(branch.whatsapp || branch.phone, "Hello AJ Classes")}>WhatsApp</a>
                  <Link href={`/enquiry?branch=${branch.id}`}>Enquire</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <div className="hidden"><BookOpen /><GraduationCap /></div>
    </div>
  );
}
