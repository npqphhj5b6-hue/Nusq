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
          ? "bg-[#040C1A]/92 backdrop-blur-xl border-b border-[#132030]/80"
          : "bg-transparent"
      }`}
    >
      {/* Amber accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#F59E0B]/60 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <span
            className="text-[1.3rem] font-bold tracking-[-0.02em] text-[#F59E0B] transition-opacity duration-200 group-hover:opacity-80"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            NUSQ
          </span>
          <span className="w-px h-4 bg-[#F59E0B]/25" />
          <span
            className="text-[1.05rem] font-medium text-[#F59E0B]/80 transition-opacity duration-200 group-hover:opacity-60"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            نسق
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {[
            { label: "Briefings", href: "/briefings" },
            { label: "Essays", href: "/essays" },
            { label: "About", href: "/about" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-semibold tracking-[0.08em] uppercase text-[#4E6880] hover:text-[#F0ECE5] transition-colors duration-200 px-3 py-1.5 cursor-pointer"
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
