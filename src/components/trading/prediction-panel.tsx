"use client";

import { TrendingUp, TrendingDown, Minus, Gauge, Sparkles, Target, Shield, AlertTriangle } from "lucide-react";
import type { Prediction } from "@/lib/market-types";

interface Props {
  pred: Prediction | null;
}

const BADGE: Record<string, string> = {
  "SANGAT BELI": "BELI KUAT",
  "BELI": "BELI",
  "TUNGGU": "KONSOLIDASI",
  "JUAL": "JUAL",
  "SANGAT JUAL": "JUAL KUAT",
};

const ACTION_HINT: Record<string, { icon: any; text: string; color: string }> = {
  "SANGAT BELI": { icon: Target, text: "Peluang entry long kuat", color: "text-emerald-400" },
  "BELI": { icon: TrendingUp, text: "Pertimbangkan posisi long", color: "text-emerald-400" },
  "TUNGGU": { icon: Shield, text: "Tunggu konfirmasi arah", color: "text-amber-400" },
  "JUAL": { icon: TrendingDown, text: "Pertimbangkan posisi short", color: "text-rose-400" },
  "SANGAT JUAL": { icon: AlertTriangle, text: "Peluang entry short kuat", color: "text-rose-400" },
};

export function PredictionPanel({ pred }: Props) {
  if (!pred) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Menunggu data cukup untuk analisis AI...
      </div>
    );
  }

  const dir = pred.dir;
  const dirColor =
    dir === "NAIK" ? "text-emerald-400" :
    dir === "TURUN" ? "text-rose-400" : "text-amber-400";
  const dirBg =
    dir === "NAIK" ? "bg-emerald-500/10 border-emerald-500/30" :
    dir === "TURUN" ? "bg-rose-500/10 border-rose-500/30" :
    "bg-amber-500/10 border-amber-500/30";
  const Icon = dir === "NAIK" ? TrendingUp : dir === "TURUN" ? TrendingDown : Minus;
  const conf = pred.conf;
  const confColor =
    conf > 70 ? "bg-emerald-500" :
    conf > 50 ? "bg-amber-500" :
    conf > 30 ? "bg-orange-500" : "bg-rose-500";

  const action = ACTION_HINT[pred.sig] || ACTION_HINT["TUNGGU"];
  const ActionIcon = action.icon;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <h3 className="text-xs font-bold tracking-wide uppercase text-amber-400">
          AI Prediction
        </h3>
        <span className="ml-auto text-[9px] text-muted-foreground uppercase tracking-wider">
          {pred.trend_strength}
        </span>
      </div>

      <div className={`rounded-lg border ${dirBg} p-3`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className={`flex items-center gap-2 ${dirColor}`}>
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-base font-bold tracking-tight">
                {pred.pred_title}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground italic mt-0.5">
              {pred.pred_desc}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sinyal
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${dirColor} bg-background/50`}>
            {BADGE[pred.sig] ?? pred.sig}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            Keyakinan
          </span>
          <span className="text-sm font-mono font-bold">{conf}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${confColor} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${conf}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">Score: {pred.score > 0 ? "+" : ""}{pred.score}</span>
          <span className={`text-[9px] flex items-center gap-0.5 ${action.color}`}>
            <ActionIcon className="w-2.5 h-2.5" />
            {action.text}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Faktor ({pred.factors.length})
        </div>
        <div className="space-y-1">
          {pred.factors.map((f, i) => {
            const isBull = f.score > 0;
            const isBear = f.score < 0;
            const color = isBull ? "text-emerald-400" : isBear ? "text-rose-400" : "text-muted-foreground";
            const barColor = isBull ? "bg-emerald-500" : isBear ? "bg-rose-500" : "bg-muted-foreground/40";
            const barWidth = Math.min(100, (Math.abs(f.score) / Math.max(1, f.weight)) * 100);
            return (
              <div key={i} className="grid grid-cols-12 gap-1 items-center text-[11px] group">
                <span className="col-span-4 text-muted-foreground truncate" title={f.name}>
                  {f.name}
                </span>
                <span className={`col-span-4 ${color} font-mono truncate`} title={f.value}>
                  {f.value}
                </span>
                <span className="col-span-2 relative h-3 flex items-center">
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </span>
                <span className={`col-span-1 ${color} font-mono text-right font-semibold`}>
                  {f.score > 0 ? "+" : ""}{f.score}
                </span>
                <span className="col-span-1 text-muted-foreground/60 font-mono text-right text-[10px]">
                  {f.weight}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {pred.support !== null && pred.resistance !== null && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="text-[10px]">
            <span className="text-muted-foreground">Support</span>
            <div className="text-emerald-400 font-mono font-bold">
              {pred.support.toFixed(2)}
            </div>
          </div>
          <div className="text-[10px] text-right">
            <span className="text-muted-foreground">Resistance</span>
            <div className="text-rose-400 font-mono font-bold">
              {pred.resistance.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
