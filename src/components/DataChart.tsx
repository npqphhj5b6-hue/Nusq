"use client";

import type { ChartData } from "@/lib/types";

interface Props {
  data: ChartData;
}

function BarChart({ data }: { data: ChartData }) {
  const { title, labels, values, unit, source } = data;
  const W = 600;
  const H = 260;
  const PAD = { top: 28, right: 20, bottom: 60, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...values, 0);
  const barW = chartW / values.length;
  const barGap = barW * 0.25;
  const barInner = barW - barGap;

  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = (maxVal / tickCount) * i;
    const y = PAD.top + chartH - (v / (maxVal || 1)) * chartH;
    const label = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1);
    return { y, label };
  });

  return (
    <div className="mt-10 pt-10 border-t border-[var(--c-border)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-[1px] bg-[var(--c-amber)]" />
        <span className="eyebrow">Data</span>
      </div>
      <p className="text-sm font-semibold text-[var(--c-text-1)] mb-3"
        style={{ fontFamily: "var(--font-barlow)", letterSpacing: "0.02em" }}>
        {title}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} aria-label={title}>
        {yTicks.map(({ y, label }) => (
          <g key={y}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="var(--c-border)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle"
              style={{ fontSize: "11px", fill: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
              {label}
            </text>
          </g>
        ))}

        {values.map((v, i) => {
          const barH = (v / (maxVal || 1)) * chartH;
          const x = PAD.left + i * barW + barGap / 2;
          const y = PAD.top + chartH - barH;
          const label = labels[i] ?? "";
          const words = label.split(" ");
          return (
            <g key={i}>
              <defs>
                <linearGradient id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <rect x={x} y={y} width={barInner} height={barH} fill={`url(#bar-${i})`} rx="2" />
              {words.map((word, wi) => (
                <text key={wi} x={x + barInner / 2} y={PAD.top + chartH + 14 + wi * 12}
                  textAnchor="middle"
                  style={{ fontSize: "9px", fill: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
                  {word}
                </text>
              ))}
            </g>
          );
        })}

        <text x={PAD.left - 8} y={PAD.top - 10} textAnchor="end"
          style={{ fontSize: "10px", fill: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
          {unit}
        </text>
      </svg>
      <p className="text-[10px] mt-2" style={{ color: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
        {source}
      </p>
    </div>
  );
}

function LineChart({ data }: { data: ChartData }) {
  const { title, labels, values, unit, source } = data;

  const W = 600;
  const H = 260;
  const PAD = { top: 28, right: 20, bottom: 52, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const px = (i: number) => PAD.left + (i / (values.length - 1)) * chartW;
  const py = (v: number) => PAD.top + chartH - ((v - minVal) / range) * chartH;

  const points = values.map((v, i) => `${px(i)},${py(v)}`).join(" ");
  const areaPoints = `${PAD.left},${PAD.top + chartH} ${points} ${PAD.left + chartW},${PAD.top + chartH}`;

  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = minVal + (range / tickCount) * i;
    return { y: py(v), label: v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1) };
  });

  const xStep = Math.max(1, Math.floor(labels.length / 5));
  const xTicks = labels
    .map((l, i) => ({ i, label: l }))
    .filter(({ i }) => i % xStep === 0 || i === labels.length - 1);

  const uid = `dc-${title.replace(/\s+/g, "")}`;

  return (
    <div className="mt-10 pt-10 border-t border-[var(--c-border)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-[1px] bg-[var(--c-amber)]" />
        <span className="eyebrow">Data</span>
      </div>
      <p className="text-sm font-semibold text-[var(--c-text-1)] mb-3"
        style={{ fontFamily: "var(--font-barlow)", letterSpacing: "0.02em" }}>
        {title}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} aria-label={title}>
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map(({ y, label }) => (
          <g key={y}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="var(--c-border)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle"
              style={{ fontSize: "11px", fill: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
              {label}
            </text>
          </g>
        ))}

        <polyline points={points} fill="none" stroke="#F59E0B" strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={px(values.length - 1)} cy={py(values[values.length - 1])} r="3" fill="#F59E0B" />

        {xTicks.map(({ i, label }) => (
          <text key={i} x={px(i)} y={PAD.top + chartH + 16} textAnchor="middle"
            style={{ fontSize: "10px", fill: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
            {label}
          </text>
        ))}

        <text x={PAD.left - 8} y={PAD.top - 10} textAnchor="end"
          style={{ fontSize: "10px", fill: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
          {unit}
        </text>
      </svg>
      <p className="text-[10px] mt-2" style={{ color: "var(--c-text-3)", fontFamily: "var(--font-geist-mono)" }}>
        {source}
      </p>
    </div>
  );
}

export default function DataChart({ data }: Props) {
  if (data.type === "bar") return <BarChart data={data} />;
  return <LineChart data={data} />;
}
