export default function Footer() {
  return (
    <footer className="border-t border-[#1A2B40] mt-24">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-[1px] bg-[#C9A967]" />
          <span className="text-sm text-[#7A8FA6]">
            Nusq — MENA financial intelligence
          </span>
        </div>
        <span className="text-xs text-[#3A4F66]">Not investment advice.</span>
      </div>
    </footer>
  );
}
