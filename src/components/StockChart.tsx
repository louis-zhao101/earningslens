"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  type IChartApi,
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
}

interface Props {
  candles: Candle[];
  earningsMarkers?: EarningsMarker[];
}

export default function StockChart({ candles, earningsMarkers = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

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
      height: 340,
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
      createSeriesMarkers(
        series,
        earningsMarkers
          .filter((m) => candles.some((c) => c.time === m.time))
          .map((m) => ({
            time: m.time as Time,
            position: "aboveBar" as const,
            color: m.beat === true ? "#34d399" : m.beat === false ? "#f87171" : "#a1a1aa",
            shape: "circle" as const,
            text: "E",
            size: 1,
          }))
      );
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

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
    };
  }, [candles, earningsMarkers]);

  if (candles.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center text-sm text-zinc-500">
        No price data available.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
