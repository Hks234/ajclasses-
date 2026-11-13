import Link from "next/link";
import { BrandLogo } from "./brand";

export function Footer({ branding, courses, branches }: { branding: any; courses: any[]; branches: any[] }) {
  const socials = [
    ["Instagram", branding.instagram],
    ["Facebook", branding.facebook],
    ["YouTube", branding.youtube],
    ["LinkedIn", branding.linkedin],
  ].filter((item) => item[1]);
  return (
    <footer className="bg-deep text-white">
      <div className="container-aj grid gap-10 py-16 md:grid-cols-4">
        <div>
          <div className="rounded-2xl bg-white px-4 py-3 inline-block"><BrandLogo name={branding.name} line={branding.line} logoUrl={branding.logoLight || branding.logoUrl} height={48} /></div>
          <p className="mt-4 text-sm leading-6 text-white/75">{branding.footer}</p>
          <p className="mt-4 text-sm font-semibold text-orange">{branding.tagline}</p>
        </div>
        <div>
          <p className="font-bold">Courses</p>
          <div className="mt-3 space-y-2 text-sm text-white/75">
            {courses.slice(0, 9).map((course) => <Link key={course.id} className="block hover:text-orange" href={`/courses/${course.slug}`}>{course.name}</Link>)}
          </div>
        </div>
        <div>
          <p className="font-bold">Quick links</p>
          <div className="mt-3 space-y-2 text-sm text-white/75">
            {[["/about", "About"], ["/faculty", "Faculty"], ["/test-series", "Test Series"], ["/branches", "Branches"], ["/contact", "Contact"], ["/login", "Student login"], ["/privacy-policy", "Privacy policy"], ["/terms-and-conditions", "Terms"], ["/refund-policy", "Refund policy"]].map(([href, label]) => <Link key={href} href={href} className="block hover:text-orange">{label}</Link>)}
          </div>
        </div>
        <div>
          <p className="font-bold">Branches</p>
          <div className="mt-3 space-y-4 text-sm text-white/75">
            {branches.map((branch) => <p key={branch.id}><span className="block font-semibold text-white">{branch.name}</span>{branch.address}<a className="mt-1 block text-orange" href={`tel:+91${branch.phone}`}>{branch.phone}</a></p>)}
            <a className="block text-orange" href={`mailto:${branding.email}`}>{branding.email}</a>
            {socials.map(([label, href]) => <a key={label} href={href} className="block hover:text-orange">{label}</a>)}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} AJ Classes · Aditya Jhawar Education</div>
    </footer>
  );
}
