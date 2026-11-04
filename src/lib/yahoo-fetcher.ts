import type { Candle, MarketKey } from './market-types';
import { MARKET_META } from './market-types';

const TROY_OZ = 31.1034768;
const CACHE_TTL = 30;
const N_CANDLES = 120;

interface CacheEntry {
  data: any;
  ts: number;
  rate: number | null;
}

const cache: Record<string, CacheEntry> = {};
let rateCache: { value: number; ts: number } | null = null;

function getCache(key: string): CacheEntry | null {
  const e = cache[key];
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL * 1000) return null;
  return e;
}

function setCache(key: string, data: any, rate: number | null) {
  cache[key] = { data, ts: Date.now(), rate };
}

async function fetchJson(url: string, timeout = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUsdIdrRate(): Promise<number> {
  if (rateCache && Date.now() - rateCache.ts < 300000) return rateCache.value;
  try {
    const d = await fetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    if (d && d.usd && d.usd.idr) {
      const r = parseFloat(d.usd.idr);
      rateCache = { value: r, ts: Date.now() };
      return r;
    }
  } catch (e) {
  }
  if (rateCache) return rateCache.value;
  return 15847.50;
}

async function fetchYahooChart(symbol: string): Promise<any | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=false`;
  try {
    const data = await fetchJson(url);
    if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) return null;
    return data.chart.result[0];
  } catch (e) {
    return null;
  }
}

async function fetchUsdIdrHistory(): Promise<any | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1h&range=5d&includePrePost=false`;
  try {
    const data = await fetchJson(url);
    if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) return null;
    return data.chart.result[0];
  } catch (e) {
    return null;
  }
}

interface YahooResult {
  timestamp: number[];
  quote: { open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] };
}

function parseYahooResult(result: any): YahooResult | null {
  if (!result || !result.timestamp || !result.indicators || !result.indicators.quote) return null;
  const ts = result.timestamp;
  const q = result.indicators.quote[0];
  if (!q || !q.open || !q.close) return null;
  const out: YahooResult = {
    timestamp: ts,
    quote: {
      open: q.open, high: q.high || q.open, low: q.low || q.open,
      close: q.close, volume: q.volume || new Array(ts.length).fill(0),
    },
  };
  return out;
}

function yahooResultToCandles(result: YahooResult): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < result.timestamp.length; i++) {
    const o = result.quote.open[i];
    const h = result.quote.high[i];
    const l = result.quote.low[i];
    const c = result.quote.close[i];
    const v = result.quote.volume[i];
    if (o === null || c === null || h === null || l === null) continue;
    out.push({
      time: result.timestamp[i],
      open: o, high: h, low: l, close: c, volume: v || 0,
    });
  }
  return out;
}

function genSimCandles(basePrice: number, vol: number, n: number): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const start = now - (n - 1) * 60;
  let p = basePrice * (1 + (Math.random() - 0.5) * 0.015);
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const t = start + i * 60;
    const drift = ((basePrice - p) / basePrice) * 0.002;
    const noise = (Math.random() - 0.497) * vol;
    const chg = (drift + noise) * p;
    const o = p;
    const cl = o + chg;
    const wu = Math.random() * vol * o * 0.4;
    const wd = Math.random() * vol * o * 0.4;
    const h = Math.max(o, cl) + wu;
    const lo = Math.max(o * 0.9, Math.min(o, cl) - wd);
    const v = Math.floor(Math.random() * 600 + 150 + Math.abs(chg / o) * 8000);
    out.push({
      time: t,
      open: parseFloat(o.toFixed(4)),
      high: parseFloat(h.toFixed(4)),
      low: parseFloat(lo.toFixed(4)),
      close: parseFloat(cl.toFixed(4)),
      volume: v,
    });
    p = cl;
  }
  return out;
}

export async function getMarketSnapshot(market: MarketKey): Promise<{
  candles: Candle[];
  rate: number;
  source: 'live' | 'simulasi';
}> {
  const meta = MARKET_META[market];
  const rate = await fetchUsdIdrRate();

  if (market === 'gold') {
    const cached = getCache('xau_base');
    let xauCandles: Candle[] | null = null;
    if (cached) {
      xauCandles = cached.data;
    } else {
      const r = await fetchYahooChart('GC=F');
      const parsed = r ? parseYahooResult(r) : null;
      if (parsed) {
        xauCandles = yahooResultToCandles(parsed).slice(-N_CANDLES);
        setCache('xau_base', xauCandles, rate);
      }
    }
    if (xauCandles && xauCandles.length >= 30) {
      const f = rate / TROY_OZ;
      const goldCandles: Candle[] = xauCandles.map((c) => ({
        time: c.time,
        open: c.open * f,
        high: c.high * f,
        low: c.low * f,
        close: c.close * f,
        volume: c.volume * 0.01,
      }));
      return { candles: goldCandles, rate, source: 'live' };
    }
    return {
      candles: genSimCandles(2665 * rate / TROY_OZ, meta.vol, N_CANDLES),
      rate, source: 'simulasi',
    };
  }

  if (market === 'usdidr') {
    const cached = getCache('usdidr');
    let candles: Candle[] | null = null;
    if (cached) {
      candles = cached.data;
    } else {
      const r = await fetchUsdIdrHistory();
      const parsed = r ? parseYahooResult(r) : null;
      if (parsed) {
        candles = yahooResultToCandles(parsed).slice(-N_CANDLES);
        setCache('usdidr', candles, rate);
      }
    }
    if (candles && candles.length >= 30) {
      return { candles, rate, source: 'live' };
    }
    return {
      candles: genSimCandles(rate, meta.vol, N_CANDLES),
      rate, source: 'simulasi',
    };
  }

  const cached = getCache('xau_base');
  let candles: Candle[] | null = null;
  if (cached) {
    candles = cached.data;
  } else {
    const r = await fetchYahooChart('GC=F');
    const parsed = r ? parseYahooResult(r) : null;
    if (parsed) {
      candles = yahooResultToCandles(parsed).slice(-N_CANDLES);
      setCache('xau_base', candles, rate);
    }
  }
  if (candles && candles.length >= 30) {
    return { candles, rate, source: 'live' };
  }
  return {
    candles: genSimCandles(2665, meta.vol, N_CANDLES),
    rate, source: 'simulasi',
  };
}
