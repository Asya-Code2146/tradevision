import { NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/yahoo-fetcher';
import { predictAI } from '@/lib/ai-prediction';
import { sma, ema, bollingerBands } from '@/lib/indicators';
import { MARKET_META } from '@/lib/market-types';
import type { Snapshot } from '@/lib/market-types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = (url.searchParams.get('market') || 'gold') as keyof typeof MARKET_META;
  if (!MARKET_META[market]) {
    return NextResponse.json({ error: 'Invalid market' }, { status: 400 });
  }

  try {
    const { candles, rate, source } = await getMarketSnapshot(market);
    const meta = MARKET_META[market];

    const close = candles.map((c) => c.close);
    const ma5 = sma(close, 5);
    const ma20 = sma(close, 20);
    const ema12 = ema(close, 12);
    const ema26 = ema(close, 26);
    const { upper, middle, lower } = bollingerBands(close, 20, 2);
    const volMaRaw = sma(candles.map((c) => c.volume), 10);
    const volMa = volMaRaw.map((v) => (v === null ? null : Math.round(v)));

    const lastPrice = close[close.length - 1];
    const firstOpen = candles[0].open;
    const highVal = Math.max(...candles.map((c) => c.high));
    const lowVal = Math.min(...candles.map((c) => c.low));
    const changePct = ((lastPrice - firstOpen) / firstOpen) * 100;

    const prediction = predictAI(candles);

    const snapshot: Snapshot = {
      market,
      label: meta.fullLabel,
      prefix: meta.prefix,
      dec: meta.dec,
      color: meta.color,
      candles,
      ma5, ma20, ema12, ema26,
      bb_upper: upper, bb_middle: middle, bb_lower: lower,
      vol_ma: volMa,
      last_price: lastPrice,
      first_open: firstOpen,
      high: highVal,
      low: lowVal,
      change_pct: changePct,
      source,
      rate,
      prediction: prediction || ({} as any),
      perf: { win: 0, lose: 0 },
      timestamp: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to fetch market data', detail: e.message },
      { status: 500 }
    );
  }
}
