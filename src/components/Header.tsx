import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E2DC]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-[#1C1C1C] tracking-tight text-lg">
            nusq
          </span>
          <span
            className="text-[#737373] text-base"
            style={{ fontFamily: "serif" }}
          >
            نسق
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/briefings"
            className="text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors"
          >
            Briefings
          </Link>
          <Link
            href="/essays"
            className="text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors"
          >
            Essays
          </Link>
          <Link
            href="/about"
            className="text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
