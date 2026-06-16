export default function Footer() {
  return (
    <footer className="border-t border-[#E8E5E0] mt-20">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px] bg-[#1A4731]" />
          <span className="text-sm text-[#737373]">
            Nusq — MENA financial intelligence
          </span>
        </div>
        <span className="text-xs text-[#A8A8A8]">Not investment advice.</span>
      </div>
    </footer>
  );
}
