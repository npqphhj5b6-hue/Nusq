import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--c-border)", marginTop: "5rem" }}>
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold tracking-[-0.03em]" style={{ color: "var(--c-text-1)" }}>nusq</span>
          <span className="text-xs" style={{ color: "var(--c-text-3)" }}>MENA financial intelligence</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-xs transition-colors" style={{ color: "var(--c-text-3)" }}>About</Link>
          <Link href="/briefings" className="text-xs transition-colors" style={{ color: "var(--c-text-3)" }}>Briefings</Link>
          <span className="text-xs" style={{ color: "var(--c-text-3)" }}>Not investment advice.</span>
        </div>
      </div>
    </footer>
  );
}
