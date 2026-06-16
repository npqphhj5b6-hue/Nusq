"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReadingProgress from "./ReadingProgress";

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
        scrolled
          ? "bg-[#070D1A]/90 backdrop-blur-xl border-b border-[#1A2B40]/80"
          : "bg-transparent"
      }`}
    >
      {/* Gold top bar */}
      <div className="h-[2px] bg-gradient-to-r from-[#C9A967] via-[#E8C97A] to-[#C9A967]" />

      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span
            className="text-[1.35rem] font-semibold tracking-[-0.01em] text-[#C9A967] transition-opacity duration-200 group-hover:opacity-80"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Nusq
          </span>
          <span className="w-px h-4 bg-[#C9A967]/30" />
          <span
            className="text-[1.1rem] font-medium text-[#C9A967] transition-opacity duration-200 group-hover:opacity-80"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            نسق
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {[
            { label: "Briefings", href: "/briefings" },
            { label: "Essays", href: "/essays" },
            { label: "About", href: "/about" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-[#7A8FA6] hover:text-[#EDE8DF] transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <ReadingProgress />
    </header>
  );
}
