"use client";

import { useState, useCallback } from "react";
import { MarketHeader } from "@/components/trading/market-header";
import { CandlestickChart } from "@/components/trading/candlestick-chart";
import { PredictionPanel } from "@/components/trading/prediction-panel";
import { IndicatorsPanel } from "@/components/trading/indicators-panel";
import { MarketInfo } from "@/components/trading/market-info";
import { useAllSnapshots } from "@/lib/use-market";
import type { MarketKey } from "@/lib/market-types";

const MARKETS: MarketKey[] = ["gold", "usdidr", "xauusd"];

function getInitialMarket(): MarketKey {
  if (typeof window === "undefined") return "gold";
  const url = new URL(window.location.href);
  const m = url.searchParams.get("m") as MarketKey;
  return m && MARKETS.includes(m) ? m : "gold";
}

export default function Home() {
  const [activeMarket, setActiveMarket] = useState<MarketKey>(getInitialMarket);
  const { snapshots, loading } = useAllSnapshots(MARKETS);

  const handleMarketChange = useCallback((m: MarketKey) => {
    setActiveMarket(m);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("m", m);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const activeSnapshot = snapshots[activeMarket];
  const pred = (activeSnapshot?.prediction as any) ?? null;

  return (
    <main className="min-h-screen flex flex-col bg-background bg-grid">
      <MarketHeader
        markets={MARKETS}
        active={activeMarket}
        onChange={handleMarketChange}
        snapshots={snapshots}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 overflow-hidden">
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden flex flex-col">
            <MarketInfo snapshot={activeSnapshot} />

            <div className="flex items-center gap-2 px-3 py-1 border-t border-border/50 text-[10px] flex-wrap">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">1m</span>
                <span className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground cursor-pointer">5m</span>
                <span className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground cursor-pointer">15m</span>
                <span className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground cursor-pointer">1H</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> MA5
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> MA20
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> EMA12
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> EMA26
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-amber-400 border-dashed" /> BB(20,2)
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded font-mono ${
                  activeSnapshot ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                }`}>
                  {activeSnapshot ? "●" : "○"} {activeSnapshot ? "Streaming" : "Loading..."}
                </span>
              </div>
            </div>

            <div className="flex-1 relative min-h-[400px]">
              {loading && !activeSnapshot ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span>Memuat data market...</span>
                  </div>
                </div>
              ) : (
                <CandlestickChart snapshot={activeSnapshot} height={520} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-1.5 mt-1 rounded-md border border-border bg-card text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>TradeVision v1.0</span>
              <span>•</span>
              <span>Data: {activeSnapshot?.source === "live" ? "Yahoo Finance + currency-api" : "Simulasi"}</span>
              {activeSnapshot && (
                <>
                  <span>•</span>
                  <span>Candles: {activeSnapshot.candles.length}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">
                ◉ Live polling 5s
              </span>
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-[380px] flex flex-col gap-2 shrink-0 max-h-[calc(100vh-120px)]">
          <div className="rounded-lg border border-border bg-card p-3 flex-shrink-0">
            <PredictionPanel pred={pred} />
          </div>

          <div className="rounded-lg border border-border bg-card p-3 flex-1 min-h-0 overflow-y-auto">
            <IndicatorsPanel pred={pred} snapshot={activeSnapshot} />
          </div>
        </aside>
      </div>

      <footer className="border-t border-border bg-card/50 px-3 py-1.5 text-[10px] text-muted-foreground flex items-center justify-between mt-auto">
        <span>
          ⚠ Konten untuk tujuan edukasi & analisis, bukan saran investasi.
        </span>
        <span className="font-mono hidden sm:inline">
          TradeVision © {new Date().getFullYear()}
        </span>
      </footer>
    </main>
  );
}
