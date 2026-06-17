export default function Footer() {
  return (
    <footer className="border-t border-[var(--c-border)] mt-24">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-[1px] bg-[var(--c-amber)]" />
          <span className="text-sm text-[var(--c-text-2)]">
            Nusq — MENA financial intelligence
          </span>
        </div>
        <span className="text-xs text-[var(--c-text-3)]">Not investment advice.</span>
      </div>
    </footer>
  );
}
