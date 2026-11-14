export function accentLast(title: string) {
  const words = title.trim().split(" ");
  if (words.length < 2) return title;
  return (
    <>
      {words.slice(0, -1).join(" ")} <span className="accent-underline">{words.slice(-1)}</span>
    </>
  );
}

export function Kicker({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={dark ? "kicker-dark" : "kicker"}>{children}</p>;
}
