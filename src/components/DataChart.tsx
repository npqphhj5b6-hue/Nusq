"use client";

import type { ChartData } from "@/lib/types";

interface Props {
  data: ChartData;
}

export default function DataChart({ data }: Props) {
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

  // Y axis ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = minVal + (range / tickCount) * i;
    return { y: py(v), label: v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1) };
  });

  // X axis: show ~5 evenly spaced labels
  const xStep = Math.max(1, Math.floor(labels.length / 5));
  const xTicks = labels
    .map((l, i) => ({ i, label: l }))
    .filter(({ i }) => i % xStep === 0 || i === labels.length - 1);

  const uid = `dc-${title.replace(/\s+/g, "")}`;

  return (
    <div className="mt-10 pt-10 border-t border-[#132030]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-[1px] bg-[#F59E0B]" />
        <span className="eyebrow">Data</span>
      </div>
      <p
        className="text-sm font-semibold text-[#F0ECE5] mb-3"
        style={{ fontFamily: "var(--font-barlow)", letterSpacing: "0.02em" }}
      >
        {title}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        aria-label={title}
      >
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(({ y, label }) => (
          <g key={y}>
            <line
              x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="#132030" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={y}
              textAnchor="end" dominantBaseline="middle"
              style={{ fontSize: "11px", fill: "#2A3F55", fontFamily: "var(--font-geist-mono)" }}
            >
              {label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#${uid}-grad)`} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Last point dot */}
        <circle
          cx={px(values.length - 1)}
          cy={py(values[values.length - 1])}
          r="3"
          fill="#F59E0B"
        />

        {/* X axis labels */}
        {xTicks.map(({ i, label }) => (
          <text
            key={i}
            x={px(i)}
            y={PAD.top + chartH + 16}
            textAnchor="middle"
            style={{ fontSize: "10px", fill: "#2A3F55", fontFamily: "var(--font-geist-mono)" }}
          >
            {label}
          </text>
        ))}

        {/* Unit label */}
        <text
          x={PAD.left - 8}
          y={PAD.top - 10}
          textAnchor="end"
          style={{ fontSize: "10px", fill: "#2A3F55", fontFamily: "var(--font-geist-mono)" }}
        >
          {unit}
        </text>
      </svg>
      <p
        className="text-[10px] mt-2"
        style={{ color: "#2A3F55", fontFamily: "var(--font-geist-mono)" }}
      >
        {source}
      </p>
    </div>
  );
}
