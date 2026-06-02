"use client";
import { useEffect, useRef, useState } from "react";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";

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
const DEFAULT_TF: TimeFrame = "1YR";

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

function applyTimeFrame(chart: IChartApi, candles: Candle[], tf: TimeFrame) {
  if (candles.length === 0) return;
  const fromDate = getFromDate(tf);
  const toDate = candles[candles.length - 1].time;
  const fromCandle = candles.find((c) => c.time >= fromDate);
  chart.timeScale().setVisibleRange({
    from: (fromCandle?.time ?? fromDate) as Time,
    to: toDate as Time,
  });
}

function fmtChange(val: number | null): string {
  if (val == null) return "";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

function markerText(m: EarningsMarker): string {
  const pre = fmtChange(m.beforeChange);
  const post = fmtChange(m.afterChange);
  if (pre && post) return `${pre} → ${post}`;
  if (post) return post;
  if (pre) return pre;
  return "";
}

export default function StockChart({ candles, earningsMarkers = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(DEFAULT_TF);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#a1a1aa",
        fontFamily: "monospace",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#3f3f46" },
      timeScale: { borderColor: "#3f3f46", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 380,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    series.setData(data);

    if (earningsMarkers.length > 0) {
      const sortedTimes = candles.map((c) => c.time).sort();
      const resolved = earningsMarkers
        .map((m) => {
          let time = m.time;
          if (!sortedTimes.includes(time)) {
            const nearest = sortedTimes.findLast((t) => t <= time) ?? sortedTimes[0];
            if (!nearest) return null;
            time = nearest;
          }
          return { time, beat: m.beat, text: markerText(m) };
        })
        .filter((m): m is { time: string; beat: boolean | null; text: string } => m !== null);

      createSeriesMarkers(
        series,
        resolved.map((m) => ({
          time: m.time as Time,
          position: "aboveBar" as const,
          color: m.beat === true ? "#34d399" : m.beat === false ? "#f87171" : "#a1a1aa",
          shape: "circle" as const,
          text: m.text,
          size: 1,
        }))
      );
    }

    chartRef.current = chart;
    seriesRef.current = series;

    applyTimeFrame(chart, candles, timeFrame);

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, earningsMarkers]);

  useEffect(() => {
    if (chartRef.current) {
      applyTimeFrame(chartRef.current, candles, timeFrame);
    }
  }, [timeFrame, candles]);

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
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
