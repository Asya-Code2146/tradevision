"use client";

import { useEffect, useState } from "react";
import { Activity, Radio, Wifi } from "lucide-react";
import type { MarketKey, Snapshot } from "@/lib/market-types";
import { MARKET_LABELS, MARKET_FULL_LABELS } from "@/lib/market-types";

interface Props {
  markets: MarketKey[];
  active: MarketKey;
  onChange: (m: MarketKey) => void;
  snapshots: Record<MarketKey, Snapshot | null>;
}

function formatPrice(v: number, prefix: string, dec: number): string {
  const s = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const swapped = s.replace(/,/g, "X").replace(/\./g, ",").replace(/X/g, ".");
  return prefix + swapped;
}

function PriceTicker({ snapshot }: { snapshot: Snapshot | null }) {
  if (!snapshot) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-muted-foreground text-xs">Loading...</span>
      </div>
    );
  }
  const priceUp = snapshot.change_pct >= 0;
  const priceColor = priceUp ? "text-emerald-400" : "text-rose-400";
  const prefix = snapshot.prefix;
  const dec = snapshot.dec;
  const flashClass = priceUp ? "flash-up" : "flash-down";

  return (
    <div
      key={snapshot.last_price}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${flashClass}`}
    >
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {MARKET_LABELS[snapshot.market]}
      </span>
      <span className={`text-sm font-mono font-semibold ${priceColor}`}>
        {formatPrice(snapshot.last_price, prefix, dec)}
      </span>
      <span className={`text-[10px] font-mono ${priceUp ? "text-emerald-400" : "text-rose-400"}`}>
        {priceUp ? "+" : ""}{snapshot.change_pct.toFixed(2)}%
      </span>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="text-[10px] font-mono text-muted-foreground">{time}</div>;
}

export function MarketHeader({ markets, active, onChange, snapshots }: Props) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Activity className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">TradeVision</span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Real-Time Market Analyzer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(() => {
            const snap = snapshots[active];
            const isLive = snap?.source === "live";
            return (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-background/50">
                {isLive ? <Radio className="w-3 h-3 text-emerald-400 blink" /> : <Wifi className="w-3 h-3 text-amber-400" />}
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isLive ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {isLive ? "Live" : "Simulasi"}
                </span>
              </div>
            );
          })()}
          <LiveClock />
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <nav className="flex items-center">
          {markets.map((m) => {
            const isActive = m === active;
            const snap = snapshots[m];
            const color = snap?.color ?? "#eab308";
            return (
              <button
                key={m}
                onClick={() => onChange(m)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  isActive ? "border-current" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { color } : undefined}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold">{MARKET_LABELS[m]}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">{MARKET_FULL_LABELS[m]}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-1">
          {markets.map((m) => (
            <PriceTicker key={m} snapshot={snapshots[m]} />
          ))}
        </div>
      </div>
    </header>
  );
}
