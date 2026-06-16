import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E5E0]">
      <div className="h-[3px] bg-[#1A4731]" />
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-bold text-[#111111] tracking-tight text-lg">
            Nusq
          </span>
          <span
            className="font-bold text-[#111111] text-lg"
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
    </header>
  );
}
