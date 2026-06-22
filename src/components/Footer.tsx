import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--c-border)] mt-20">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold tracking-[-0.03em] text-[var(--c-text-1)]">nusq</span>
          <span className="text-xs text-[var(--c-text-3)]">MENA financial intelligence</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors">About</Link>
          <span className="text-xs text-[var(--c-text-3)]">Not investment advice.</span>
        </div>
      </div>
    </footer>
  );
}
