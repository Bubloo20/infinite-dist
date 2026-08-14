"use client";

import { useMemo } from "react";
import { GlassCard } from "./PortalShell";

export type TrendPoint = { month: string; revenue: number; profit: number };

/**
 * Revenue and profit by month. Hand-drawn SVG rather than a chart library —
 * it's a few dozen lines and keeps the bundle small.
 */
export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const W = 900, H = 260, PAD = { l: 56, r: 16, t: 18, b: 34 };

  const view = useMemo(() => {
    if (points.length < 2) return null;
    const max = Math.max(...points.map((p) => Math.max(p.revenue, p.profit)), 1);
    const min = Math.min(...points.map((p) => Math.min(p.revenue, p.profit)), 0);
    const span = max - min || 1;
    const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
    const x = (i: number) => PAD.l + (i / (points.length - 1)) * iw;
    const y = (v: number) => PAD.t + ih - ((v - min) / span) * ih;
    const line = (key: "revenue" | "profit") => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
    const area = `${line("revenue")} L${x(points.length - 1).toFixed(1)},${(PAD.t + ih).toFixed(1)} L${x(0).toFixed(1)},${(PAD.t + ih).toFixed(1)} Z`;
    const ticks = [min, min + span / 2, max];
    return { x, y, line, area, ticks, ih };
  }, [points]);

  if (!view) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-white/50">Not enough history yet to chart a trend — add jobs across a couple of months.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-white">Revenue &amp; profit over time</h3>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="flex items-center gap-2 text-white/60"><span className="h-2.5 w-2.5 rounded-full bg-[#8b93ff]" /> Revenue</span>
          <span className="flex items-center gap-2 text-white/60"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Profit</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-5 w-full" role="img" aria-label="Revenue and profit by month">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b93ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b93ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {view.ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={view.y(t)} y2={view.y(t)} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <text x={PAD.l - 10} y={view.y(t) + 4} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="12">
              ${Math.round(t).toLocaleString()}
            </text>
          </g>
        ))}

        <path d={view.area} fill="url(#revFill)" />
        <path d={view.line("revenue")} fill="none" stroke="#8b93ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={view.line("profit")} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.month}>
            <circle cx={view.x(i)} cy={view.y(p.revenue)} r="3.5" fill="#8b93ff" />
            <circle cx={view.x(i)} cy={view.y(p.profit)} r="3.5" fill="#34d399" />
            <title>{`${p.month} — revenue $${p.revenue.toFixed(2)}, profit $${p.profit.toFixed(2)}`}</title>
            {(points.length <= 8 || i % Math.ceil(points.length / 8) === 0) && (
              <text x={view.x(i)} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12">{p.month}</text>
            )}
          </g>
        ))}
      </svg>
    </GlassCard>
  );
}
