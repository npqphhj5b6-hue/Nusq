"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReadingProgress from "./ReadingProgress";
import AuthButton from "./AuthButton";

const NAV_LINKS = [
  { label: "Briefings", href: "/briefings" },
  { label: "Research", href: "/essays" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "header-scrolled" : "bg-white border-b border-[var(--c-border)]"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <span className="text-[1.2rem] font-bold tracking-[-0.04em] text-[var(--c-text-1)]">
            nusq
          </span>
          <span className="w-px h-3.5 bg-[var(--c-border-2)]" />
          <span
            className="text-[0.95rem] text-[var(--c-text-3)]"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            نسق
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-[var(--c-surface)]"
            >
              {label}
            </Link>
          ))}
          <div className="ml-2">
            <AuthButton />
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <AuthButton />
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors"
          >
            {mobileOpen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--c-border)] bg-white">
          <nav className="max-w-5xl mx-auto px-6 py-1 flex flex-col">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors py-3.5 border-b border-[var(--c-border)] last:border-b-0"
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
