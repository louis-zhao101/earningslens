"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface EarningsMarker {
  time: string;
  beat: boolean | null;
  beforeChange: number | null;
  afterChange: number | null;
}

interface Props {
  candles: Candle[];
  earningsMarkers?: EarningsMarker[];
}

const TIME_FRAMES = ["1M", "3M", "6M", "1YR", "2YR", "5YR", "YTD"] as const;
type TimeFrame = typeof TIME_FRAMES[number];

function getFromDate(tf: TimeFrame): string {
  const now = new Date();
  const d = new Date(now);
  switch (tf) {
    case "1M":  d.setMonth(d.getMonth() - 1); break;
    case "3M":  d.setMonth(d.getMonth() - 3); break;
    case "6M":  d.setMonth(d.getMonth() - 6); break;
    case "1YR": d.setFullYear(d.getFullYear() - 1); break;
    case "2YR": d.setFullYear(d.getFullYear() - 2); break;
    case "5YR": d.setFullYear(d.getFullYear() - 5); break;
    case "YTD": return `${now.getFullYear()}-01-01`;
  }
  return d.toISOString().split("T")[0];
}

function fmtChange(val: number | null): string {
  if (val == null) return "";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Custom earnings reference line label
function EarningsLabel({
  viewBox,
  beat,
  beforeChange,
  afterChange,
}: {
  viewBox?: { x: number; y: number; height: number };
  beat: boolean | null;
  beforeChange: number | null;
  afterChange: number | null;
}) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const color = beat === true ? "#34d399" : beat === false ? "#f87171" : "#a1a1aa";
  const pre = fmtChange(beforeChange);
  const post = fmtChange(afterChange);

  return (
    <g>
      {/* Circle marker */}
      <circle cx={x} cy={y + 12} r={5} fill={color} />
      {/* Price change text above */}
      {pre && (
        <text x={x} y={y - 18} fill="#71717a" fontSize={9} textAnchor="middle">
          {pre}
        </text>
      )}
      {post && (
        <text x={x} y={y - 6} fill={color} fontSize={9} textAnchor="middle">
          {post}
        </text>
      )}
    </g>
  );
}

// Custom tooltip
function ChartTooltip({
  active,
  payload,
  earningsMap,
}: {
  active?: boolean;
  payload?: Array<{ payload: { time: string; close: number } }>;
  earningsMap: Map<string, EarningsMarker>;
}) {
  if (!active || !payload?.length) return null;
  const { time, close } = payload[0].payload;
  const earnings = earningsMap.get(time);

  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-zinc-300">{formatDateFull(time)}</div>
      <div className="text-white">Close: <span className="font-mono">${close.toFixed(2)}</span></div>
      {earnings && (
        <div className="mt-1 border-t border-zinc-700 pt-1 space-y-0.5">
          <div className={earnings.beat === true ? "text-emerald-400" : earnings.beat === false ? "text-red-400" : "text-zinc-400"}>
            Earnings {earnings.beat === true ? "Beat ↑" : earnings.beat === false ? "Miss ↓" : ""}
          </div>
          {earnings.beforeChange != null && (
            <div className="text-zinc-400">Week before: <span className={earnings.beforeChange >= 0 ? "text-emerald-400" : "text-red-400"}>{fmtChange(earnings.beforeChange)}</span></div>
          )}
          {earnings.afterChange != null && (
            <div className="text-zinc-400">Week after: <span className={earnings.afterChange >= 0 ? "text-emerald-400" : "text-red-400"}>{fmtChange(earnings.afterChange)}</span></div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StockChart({ candles, earningsMarkers = [] }: Props) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1YR");

  const filtered = useMemo(() => {
    const from = getFromDate(timeFrame);
    return candles.filter((c) => c.time >= from);
  }, [candles, timeFrame]);

  const earningsMap = useMemo(
    () => new Map(earningsMarkers.map((m) => [m.time, m])),
    [earningsMarkers]
  );

  const visibleEarnings = useMemo(() => {
    if (filtered.length === 0) return [];
    const from = filtered[0].time;
    const to = filtered[filtered.length - 1].time;
    return earningsMarkers.filter((m) => m.time >= from && m.time <= to);
  }, [filtered, earningsMarkers]);

  // Compute Y axis domain with padding for labels
  const prices = filtered.map((c) => c.close);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad = (maxP - minP) * 0.12;
  const yDomain: [number, number] = [minP - pad, maxP + pad];

  // Tick count based on timeframe
  const xTickCount = timeFrame === "1M" ? 8 : timeFrame === "3M" ? 6 : timeFrame === "6M" ? 6 : 8;

  if (candles.length === 0) {
    return (
      <div className="flex h-[380px] items-center justify-center text-sm text-zinc-500">
        No price data available.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex gap-1">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeFrame(tf)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              timeFrame === tf
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={filtered} margin={{ top: 36, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={{ stroke: "#3f3f46" }}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={formatDateShort}
            interval={Math.floor(filtered.length / xTickCount)}
          />
          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={52}
          />
          <Tooltip
            content={<ChartTooltip earningsMap={earningsMap} />}
            cursor={{ stroke: "#52525b", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#34d399"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#34d399" }}
          />
          {visibleEarnings.map((m) => (
            <ReferenceLine
              key={m.time}
              x={m.time}
              stroke={m.beat === true ? "#34d399" : m.beat === false ? "#f87171" : "#71717a"}
              strokeWidth={1}
              strokeDasharray="3 3"
              label={
                <EarningsLabel
                  beat={m.beat}
                  beforeChange={m.beforeChange}
                  afterChange={m.afterChange}
                />
              }
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
