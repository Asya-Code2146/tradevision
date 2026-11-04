"use client";

import { ArrowUp, ArrowDown, Clock, Activity } from "lucide-react";
import type { Snapshot } from "@/lib/market-types";

interface Props {
  snapshot: Snapshot | null;
}

function fmt(v: number, prefix: string, dec: number): string {
  const s = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const swapped = s.replace(/,/g, "X").replace(/\./g, ",").replace(/X/g, ".");
  return prefix + swapped;
}

export function MarketInfo({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs px-2">
        <Activity className="w-3 h-3 animate-pulse" /> Loading market data...
      </div>
    );
  }
  const isUp = snapshot.change_pct >= 0;
  const color = isUp ? "text-emerald-400" : "text-rose-400";
  const Icon = isUp ? ArrowUp : ArrowDown;
  const prefix = snapshot.prefix;
  const dec = snapshot.dec;

  const lastCandle = snapshot.candles[snapshot.candles.length - 1];
  const open = lastCandle?.open ?? snapshot.first_open;
  const high = lastCandle?.high ?? snapshot.high;
  const low = lastCandle?.low ?? snapshot.low;
  const close = lastCandle?.close ?? snapshot.last_price;

  return (
    <div className="flex items-center gap-3 flex-wrap px-3 py-1.5 text-[11px] font-mono border-b border-border/30">
      <div className="flex items-center gap-1.5">
        <span className={`flex items-center gap-0.5 font-bold text-base ${color}`}>
          {fmt(snapshot.last_price, prefix, dec)}
        </span>
        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${color} bg-background/50`}>
          <Icon className="w-3 h-3" />
          {isUp ? "+" : ""}{snapshot.change_pct.toFixed(2)}%
        </span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-3">
        <span><span className="text-muted-foreground">O</span> {fmt(open, prefix, dec)}</span>
        <span><span className="text-muted-foreground">H</span> <span className="text-emerald-400">{fmt(high, prefix, dec)}</span></span>
        <span><span className="text-muted-foreground">L</span> <span className="text-rose-400">{fmt(low, prefix, dec)}</span></span>
        <span><span className="text-muted-foreground">C</span> {fmt(close, prefix, dec)}</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>Range: {fmt(snapshot.high - snapshot.low, prefix, dec)}</span>
      </div>
      {snapshot.rate !== null && (
        <>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>USD/IDR: {snapshot.rate.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
