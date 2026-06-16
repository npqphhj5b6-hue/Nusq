import Link from "next/link";
import ReadingProgress from "./ReadingProgress";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="h-[3px] bg-[#1A4731]" />
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="text-[1.35rem] font-semibold tracking-[-0.01em] text-[#1A4731]"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Nusq
          </span>
          <span className="w-px h-4 bg-[#D0D9D4]" />
          <span
            className="text-[1.1rem] font-medium text-[#1A4731]"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            نسق
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/briefings"
            className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
          >
            Briefings
          </Link>
          <Link
            href="/essays"
            className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
          >
            Essays
          </Link>
          <Link
            href="/about"
            className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
      <ReadingProgress />
    </header>
  );
}
