type LogoProps = {
  className?: string;
  withWordmark?: boolean;
};

export default function Logo({ className = "", withWordmark = true }: LogoProps) {
  return (
    <a href="#home" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 via-accent-indigo to-accent-cyan shadow-glow">
        <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden>
          <path
            d="M20 32c0-5 3.5-8 7-8 4 0 6 4 9 8 3 4 5 8 9 8 3.5 0 6-3 6-8s-2.5-8-6-8c-4 0-6 4-9 8-3 4-5 8-9 8-3.5 0-7-3-7-8z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">
            Infinite
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">
            Distribution
          </span>
        </span>
      )}
    </a>
  );
}
