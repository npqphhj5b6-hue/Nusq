"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import { useTheme } from "./ThemeProvider";

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const isSignin = pathname === "/auth";

  return (
    <header
      className="sticky top-0 z-50 header-glass"
      style={{ padding: "18px 24px", transition: "background 0.4s ease, border-color 0.4s ease" }}
    >
      <div className="flex items-center justify-between max-w-[900px] mx-auto">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            style={{ display: "flex", alignItems: "flex-end", gap: 7, transition: "opacity 0.2s ease" }}
            className="hover:opacity-65"
          >
            <svg
              viewBox="0 0 48 48"
              width={27}
              height={27}
              style={{ marginBottom: 1, flex: "none" }}
              aria-hidden="true"
            >
              <rect x="9" y="9" width="30" height="30" rx="4" fill="none" stroke="var(--c-accent-2)" strokeWidth="5.4" strokeLinejoin="round" />
              <rect x="9" y="9" width="30" height="30" rx="4" fill="none" stroke="var(--c-accent)" strokeWidth="5.4" strokeLinejoin="round" transform="rotate(45 24 24)" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 21,
                letterSpacing: "-0.02em",
                color: "var(--c-text-1)",
              }}
            >
              Nusq
            </span>
          </Link>
          <Link
            href="/how-it-works"
            className="hidden sm:inline-block hover:opacity-70"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: pathname === "/how-it-works" ? "var(--c-text-1)" : "var(--c-text-3)",
              transition: "color 0.2s ease, opacity 0.2s ease",
            }}
          >
            How Nusq Works
          </Link>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="theme-toggle-btn"
            style={{
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              border: "1px solid var(--c-border)",
              color: "var(--c-text-2)",
              background: "var(--c-surface)",
            }}
          >
            <span
              className="theme-icon"
              style={{ transform: isDark ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              {isDark ? "☀" : "☾"}
            </span>
          </button>

          {!isSignin && <AuthButton />}
        </div>
      </div>
    </header>
  );
}
