"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.75" fill="none"/>
    </svg>
  );
}

function BookOpenIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

const TABS = [
  { href: "/",             label: "Briefings",      Icon: HomeIcon },
  { href: "/how-it-works", label: "How Nusq Works", Icon: BookOpenIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav-glass"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-150"
              style={{ color: active ? "var(--c-accent)" : "var(--c-text-3)" }}
            >
              <span className="relative">
                {active && (
                  <span
                    className="absolute inset-0 rounded-full scale-150 blur-md opacity-30"
                    style={{ background: "var(--c-accent)" }}
                  />
                )}
                <Icon active={active} />
              </span>
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: active ? "var(--c-accent)" : "var(--c-text-3)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
