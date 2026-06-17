"use client";

import { useTheme } from "./ThemeProvider";

export default function TradingViewChart({ ticker }: { ticker: string }) {
  const { theme } = useTheme();

  const src =
    `https://s.tradingview.com/embed-widget/mini-symbol-overview/` +
    `?symbol=${encodeURIComponent(ticker)}` +
    `&locale=en&dateRange=1M&colorTheme=${theme}&isTransparent=true&autosize=true`;

  return (
    <div className="border border-[var(--c-border)] rounded-xl overflow-hidden h-[220px]">
      <iframe
        key={theme}
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
