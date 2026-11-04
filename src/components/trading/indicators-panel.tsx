"use client";

import { Activity, BarChart3, Layers, Zap, TrendingUp } from "lucide-react";
import type { Prediction, Snapshot } from "@/lib/market-types";

interface Props {
  pred: Prediction | null;
  snapshot: Snapshot | null;
}

function MetricCard({
  label,
  value,
  sub,
  color = "text-foreground",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2.5">
      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function IndicatorsPanel({ pred, snapshot }: Props) {
  if (!pred || !snapshot) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Indikator belum tersedia...
      </div>
    );
  }

  const rsi = pred.rsi;
  const rsiColor =
    rsi !== null && rsi < 30 ? "text-emerald-400" :
    rsi !== null && rsi > 70 ? "text-rose-400" : "text-cyan-400";

  const macdHist = (pred.macd ?? 0) - (pred.sigl ?? 0);
  const macdColor = macdHist > 0 ? "text-emerald-400" : "text-rose-400";

  const smaTrend = pred.sma5 !== null && pred.sma20 !== null && pred.sma5 > pred.sma20;
  const smaLabel = smaTrend ? "Bullish" : "Bearish";
  const smaColor = smaTrend ? "text-emerald-400" : "text-rose-400";

  const bbPos = pred.bb_pos;
  const bbColor =
    bbPos < 0.1 ? "text-emerald-400" :
    bbPos > 0.9 ? "text-rose-400" : "text-amber-400";

  const adx = pred.adx;
  const adxColor =
    adx !== null && adx > 25 ? "text-emerald-400" :
    adx !== null && adx < 20 ? "text-rose-400" : "text-muted-foreground";

  const stkK = pred.stk;
  const stkD = pred.stkd;
  const stkColor =
    stkK !== null && stkK < 20 ? "text-emerald-400" :
    stkK !== null && stkK > 80 ? "text-rose-400" : "text-cyan-400";

  const mom = pred.mom;
  const momColor = mom > 0.1 ? "text-emerald-400" : mom < -0.1 ? "text-rose-400" : "text-muted-foreground";

  const willr = pred.willr;
  const willrColor =
    willr !== null && willr < -80 ? "text-emerald-400" :
    willr !== null && willr > -20 ? "text-rose-400" : "text-cyan-400";

  const cci = pred.cci;
  const cciColor =
    cci !== null && cci < -100 ? "text-emerald-400" :
    cci !== null && cci > 100 ? "text-rose-400" : "text-amber-400";

  const obv = pred.obv_trend;
  const obvColor = obv > 0.01 ? "text-emerald-400" : obv < -0.01 ? "text-rose-400" : "text-muted-foreground";

  const atr = pred.atr;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <h3 className="text-xs font-bold tracking-wide uppercase text-cyan-400">
          Indikator Teknikal
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="RSI (14)"
          value={rsi !== null ? rsi.toFixed(1) : "-"}
          sub={rsi !== null && rsi < 30 ? "Oversold" : rsi !== null && rsi > 70 ? "Overbought" : "Netral"}
          color={rsiColor}
          icon={<Activity className="w-2.5 h-2.5" />}
        />
        <MetricCard
          label="MACD Hist"
          value={(macdHist >= 0 ? "+" : "") + macdHist.toFixed(2)}
          sub={macdHist > 0 ? "Bullish" : "Bearish"}
          color={macdColor}
          icon={<BarChart3 className="w-2.5 h-2.5" />}
        />
        <MetricCard
          label="MA5 vs MA20"
          value={smaLabel}
          sub={`5: ${pred.sma5 !== null ? pred.sma5.toFixed(2) : "-"} / 20: ${pred.sma20 !== null ? pred.sma20.toFixed(2) : "-"}`}
          color={smaColor}
          icon={<TrendingUp className="w-2.5 h-2.5" />}
        />
        <MetricCard
          label="BB Position"
          value={`${(bbPos * 100).toFixed(0)}%`}
          sub={bbPos < 0.1 ? "Oversold" : bbPos > 0.9 ? "Overbought" : "Middle"}
          color={bbColor}
          icon={<Layers className="w-2.5 h-2.5" />}
        />
        <MetricCard
          label="Stoch K/D"
          value={stkK !== null && stkD !== null ? `${stkK.toFixed(0)}/${stkD.toFixed(0)}` : "-"}
          sub={stkK !== null && stkK < 20 ? "Oversold" : stkK !== null && stkK > 80 ? "Overbought" : "Netral"}
          color={stkColor}
          icon={<Activity className="w-2.5 h-2.5" />}
        />
        <MetricCard
          label="ADX (Tren)"
          value={adx !== null ? adx.toFixed(1) : "-"}
          sub={adx !== null && adx > 25 ? "Tren Kuat" : adx !== null && adx < 20 ? "Lemah" : "Sedang"}
          color={adxColor}
          icon={<Zap className="w-2.5 h-2.5" />}
        />
        <MetricCard
          label="Williams %R"
          value={willr !== null ? willr.toFixed(1) : "-"}
          sub={willr !== null && willr < -80 ? "Oversold" : willr !== null && willr > -20 ? "Overbought" : "Netral"}
          color={willrColor}
        />
        <MetricCard
          label="CCI (20)"
          value={cci !== null ? cci.toFixed(0) : "-"}
          sub={cci !== null && cci < -100 ? "Oversold" : cci !== null && cci > 100 ? "Overbought" : "Netral"}
          color={cciColor}
        />
        <MetricCard
          label="Momentum"
          value={`${mom >= 0 ? "+" : ""}${mom.toFixed(3)}%`}
          sub="6-bar"
          color={momColor}
        />
        <MetricCard
          label="OBV Trend"
          value={obv > 0.01 ? "Akumulasi" : obv < -0.01 ? "Distribusi" : "Flat"}
          sub={obv.toFixed(3)}
          color={obvColor}
        />
        {atr !== null && (
          <MetricCard
            label="ATR (Volatilitas)"
            value={atr.toFixed(2)}
            sub="14-bar"
            color="text-amber-400"
          />
        )}
        {pred.pattern && (
          <MetricCard
            label="Pattern"
            value={pred.pattern.replace(/_/g, " ")}
            sub="Detected"
            color="text-amber-400"
          />
        )}
      </div>
    </div>
  );
}
