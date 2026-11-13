export function PageHero({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <section className="bg-deep text-white">
      <div className="container-aj py-14">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange">{kicker}</p>
        <h1 className="mt-2 font-display text-5xl">{title}</h1>
        {text ? <p className="mt-4 max-w-2xl text-white/75">{text}</p> : null}
      </div>
    </section>
  );
}
