export function LogoMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#1A4BCC" />
      <path d="M16 46V18h11.2c6.4 0 10.3 3.5 10.3 8.8S33.6 35.6 27.2 35.6H23v10.4H16zm7-16.2h3.6c2.8 0 4.4-1.4 4.4-3.6S29.4 22.6 26.6 22.6H23v7.2z" fill="#fff" />
      <path d="M42 46V18h7v28h-7z" fill="#EE8F22" />
    </svg>
  );
}

export function BrandLogo({
  name, line, logoUrl, height = 52, background = "transparent",
}: { name: string; line: string; logoUrl?: string; height?: number; background?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={`${name} logo`} style={{ height, background }} className="w-auto max-w-[220px] object-contain" />;
  }
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-display text-lg font-extrabold tracking-tight text-navy">{name}</span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-orange">{line}</span>
      </span>
    </span>
  );
}
