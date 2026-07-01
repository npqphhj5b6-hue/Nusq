"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import { useTheme } from "./ThemeProvider";

const NAV_LINKS = [
  { label: "Signals", href: "/signals" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Heatmap", href: "/heatmap" },
  { label: "Briefings", href: "/briefings" },
  { label: "Glossary", href: "/glossary" },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 header-glass transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <Image
            src={theme === "dark" ? "/logo-wordmark-white.png" : "/logo-wordmark-dark.png"}
            alt="Nusq"
            width={90}
            height={40}
            priority
            className="h-5 w-auto"
          />
          <span className="w-px h-3.5" style={{ backgroundColor: "var(--c-border-2)" }} />
          <span className="text-sm" style={{ fontFamily: "var(--font-arabic)", color: "var(--c-text-3)" }}>
            نسق
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={label}
                href={href}
                className="text-sm px-3.5 py-1.5 rounded-xl transition-all duration-150 font-medium"
                style={{
                  color: active ? "var(--c-text-1)" : "var(--c-text-2)",
                  background: active ? "var(--c-surface-2)" : "transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150"
            style={{
              color: "var(--c-text-2)",
              background: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
