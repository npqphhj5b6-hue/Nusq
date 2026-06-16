"use client";

export default function TradingViewChart({ ticker }: { ticker: string }) {
  const src =
    `https://s.tradingview.com/embed-widget/mini-symbol-overview/` +
    `?symbol=${encodeURIComponent(ticker)}` +
    `&locale=en&dateRange=1M&colorTheme=light&isTransparent=true&autosize=true`;

  return (
    <div className="border border-[#E8E5E0] rounded-xl overflow-hidden h-[220px]">
      <iframe
        src={src}
        title={ticker}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
      />
    </div>
  );
}
