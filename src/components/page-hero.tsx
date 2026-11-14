import { accentLast } from "./heading";

export function PageHero({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <section className="page-hero">
      <div className="container-aj relative z-10 py-16">
        <p className="kicker">{kicker}</p>
        <h1 className="mt-4 max-w-3xl font-display text-[40px] font-bold leading-[50px] tracking-[-0.02em] sm:text-[48px] sm:leading-[60px]">{accentLast(title)}</h1>
        {text ? <p className="mt-4 max-w-2xl text-[16px] leading-6 text-white/80">{text}</p> : null}
      </div>
    </section>
  );
}
