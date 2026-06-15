"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "light" | "dark" | "blue";

const variantClass: Record<Variant, string> = {
  light: "pill-light",
  dark: "pill-dark",
  blue: "pill-blue",
};

const dotClass: Record<Variant, string> = {
  light: "arrow-dot",
  dark: "arrow-dot !bg-white !text-ink",
  blue: "arrow-dot !bg-white !text-electric",
};

export default function ArrowPill({
  children,
  href = "#",
  variant = "light",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
}) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  const inner = (
    <>
      <span>{children}</span>
      <span className={dotClass[variant]}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );

  if (isInternal) {
    return (
      <Link href={href} className={`${variantClass[variant]} ${className}`}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={href} className={`${variantClass[variant]} ${className}`} target="_blank" rel="noreferrer">
      {inner}
    </a>
  );
}
