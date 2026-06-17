"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReadingProgress from "./ReadingProgress";
import AuthButton from "./AuthButton";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "header-scrolled" : "bg-transparent"
      }`}
    >
      {/* Amber accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#F59E0B]/60 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
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

        <nav className="flex items-center gap-1">
          {[
            { label: "Briefings", href: "/briefings" },
            { label: "Research", href: "/essays" },
            { label: "About", href: "/about" },
          ].map(({ label, href }) => (
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
      </div>

      <ReadingProgress />
    </header>
  );
}
