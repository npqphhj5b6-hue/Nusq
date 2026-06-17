"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReadingProgress from "./ReadingProgress";
import AuthButton from "./AuthButton";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Briefings", href: "/briefings" },
  { label: "Research", href: "/essays" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "header-scrolled" : "bg-transparent"
      }`}
    >
      {/* Amber accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#F59E0B]/60 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <span
            className="text-[1.3rem] font-bold tracking-[-0.02em] text-[var(--c-amber)] transition-opacity duration-200 group-hover:opacity-80"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            NUSQ
          </span>
          <span className="w-px h-4 bg-[#F59E0B]/25" />
          <span
            className="text-[1.05rem] font-medium text-[var(--c-amber)]/80 transition-opacity duration-200 group-hover:opacity-60"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            نسق
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors duration-200 px-3 py-1.5 cursor-pointer"
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
          <div className="ml-1">
            <AuthButton />
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <AuthButton />
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors ml-1"
          >
            {mobileOpen ? (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 2l11 11M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M1.5 3.5h12M1.5 7.5h12M1.5 11.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--c-border)] bg-[var(--c-bg)]">
          <nav className="max-w-5xl mx-auto px-6 py-2 flex flex-col">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-semibold tracking-[0.08em] uppercase text-[var(--c-text-2)] hover:text-[var(--c-amber)] transition-colors duration-200 py-3.5 border-b border-[var(--c-border)] last:border-b-0"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <ReadingProgress />
    </header>
  );
}
