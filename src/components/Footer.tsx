export default function Footer() {
  return (
    <footer className="border-t border-[#132030] mt-24">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-[1px] bg-[#F59E0B]" />
          <span className="text-sm text-[#4E6880]">
            Nusq — MENA financial intelligence
          </span>
        </div>
        <span className="text-xs text-[#2A3F55]">Not investment advice.</span>
      </div>
    </footer>
  );
}
