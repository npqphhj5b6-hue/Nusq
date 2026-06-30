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

function ZapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function BriefcaseIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      {active && <line x1="12" y1="12" x2="12" y2="16" stroke="var(--c-bg)" strokeWidth="1.75"/>}
      {active && <line x1="10" y1="14" x2="14" y2="14" stroke="var(--c-bg)" strokeWidth="1.75"/>}
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"}/>
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"}/>
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} opacity={active ? 0.5 : 1}/>
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} opacity={active ? 0.3 : 1}/>
    </svg>
  );
}

const TABS = [
  { href: "/",          label: "Home",      Icon: HomeIcon },
  { href: "/signals",   label: "Signals",   Icon: ZapIcon },
  { href: "/portfolio", label: "Portfolio", Icon: BriefcaseIcon },
  { href: "/heatmap",   label: "Heatmap",   Icon: GridIcon },
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
