"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  type SeriesMarker,
  type UTCTimestamp,
  type ISeriesMarkersPluginApi,
} from "lightweight-charts";
import type { Snapshot } from "@/lib/market-types";

interface Props {
  snapshot: Snapshot | null;
  height?: number;
}

const COLORS = {
  bg: "#0a0e14",
  text: "#8a96a8",
  grid: "#1c232e",
  border: "#1c232e",
  crosshair: "#5a6678",
  bull: "#22c55e",
  bear: "#ef4444",
  ma5: "#eab308",
  ma20: "#06b6d4",
  ema12: "#f97316",
  ema26: "#a855f7",
  volUp: "rgba(34,197,94,0.5)",
  volDown: "rgba(239,68,68,0.5)",
};

export function CandlestickChart({ snapshot, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: COLORS.grid, style: LineStyle.Solid },
        horzLines: { color: COLORS.grid, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: COLORS.crosshair, labelBackgroundColor: "#1c232e", width: 1, style: LineStyle.Dashed },
        horzLine: { color: COLORS.crosshair, labelBackgroundColor: "#1c232e", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: COLORS.border,
        scaleMargins: { top: 0.08, bottom: 0.30 },
      },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.bull,
      downColor: COLORS.bear,
      borderUpColor: COLORS.bull,
      borderDownColor: COLORS.bear,
      wickUpColor: COLORS.bull,
      wickDownColor: COLORS.bear,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    const ma5Series = chart.addSeries(LineSeries, {
      color: COLORS.ma5,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ma20Series = chart.addSeries(LineSeries, {
      color: COLORS.ma20,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ema12Series = chart.addSeries(LineSeries, {
      color: COLORS.ema12,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ema26Series = chart.addSeries(LineSeries, {
      color: COLORS.ema26,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const bbUpper = chart.addSeries(LineSeries, {
      color: "rgba(234, 179, 8, 0.4)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const bbLower = chart.addSeries(LineSeries, {
      color: "rgba(234, 179, 8, 0.4)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ma5SeriesRef.current = ma5Series;
    ma20SeriesRef.current = ma20Series;
    ema12SeriesRef.current = ema12Series;
    ema26SeriesRef.current = ema26Series;
    bbUpperRef.current = bbUpper;
    bbLowerRef.current = bbLower;
    markersRef.current = createSeriesMarkers(candleSeries, []);

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        chart.applyOptions({ width: e.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma5SeriesRef.current = null;
      ma20SeriesRef.current = null;
      ema12SeriesRef.current = null;
      ema26SeriesRef.current = null;
      bbUpperRef.current = null;
      bbLowerRef.current = null;
      markersRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!snapshot || !candleSeriesRef.current) return;

    const candleData: CandlestickData<Time>[] = snapshot.candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volData = snapshot.candles.map((c) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? COLORS.volUp : COLORS.volDown,
    }));

    const toArray = (arr: (number | null)[]): LineData<Time>[] => {
      const out: LineData<Time>[] = [];
      snapshot.candles.forEach((c, i) => {
        const v = arr[i];
        if (v !== null && v !== undefined) out.push({ time: c.time as UTCTimestamp, value: v });
      });
      return out;
    };

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current?.setData(volData);
    ma5SeriesRef.current?.setData(toArray(snapshot.ma5));
    ma20SeriesRef.current?.setData(toArray(snapshot.ma20));
    ema12SeriesRef.current?.setData(toArray(snapshot.ema12));
    ema26SeriesRef.current?.setData(toArray(snapshot.ema26));
    bbUpperRef.current?.setData(toArray(snapshot.bb_upper));
    bbLowerRef.current?.setData(toArray(snapshot.bb_lower));

    if (isFirstLoadRef.current && candleData.length > 0) {
      chartRef.current?.timeScale().fitContent();
      isFirstLoadRef.current = false;
    }

    const lastCandle = snapshot.candles[snapshot.candles.length - 1];
    const pred = snapshot.prediction as any;
    if (pred && pred.pattern && lastCandle && markersRef.current) {
      const isBull = pred.pattern === "hammer" || pred.pattern === "bull_engulf" || pred.pattern === "three_white_soldiers";
      const isBear = pred.pattern === "shooting_star" || pred.pattern === "bear_engulf" || pred.pattern === "three_black_crows";
      if (isBull || isBear) {
        const markers: SeriesMarker<Time>[] = [{
          time: lastCandle.time as UTCTimestamp,
          position: isBull ? "belowBar" : "aboveBar",
          color: isBull ? COLORS.bull : COLORS.bear,
          shape: isBull ? "arrowUp" : "arrowDown",
          text: pred.pattern.replace(/_/g, " "),
        }];
        markersRef.current.setMarkers(markers);
      } else {
        markersRef.current.setMarkers([]);
      }
    } else if (markersRef.current) {
      markersRef.current.setMarkers([]);
    }

    const pred_any = pred as any;
    if (pred_any && (pred_any.support || pred_any.resistance) && candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({
      });
    }
  }, [snapshot]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
