export type MarketKey = 'gold' | 'usdidr' | 'xauusd';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Factor {
  name: string;
  value: string;
  score: number;
  weight: number;
}

export type SignalDir = 'NAIK' | 'TURUN' | 'NETRAL';
export type SignalType = 'SANGAT BELI' | 'BELI' | 'TUNGGU' | 'JUAL' | 'SANGAT JUAL';

export interface Prediction {
  dir: SignalDir;
  sig: SignalType;
  score: number;
  conf: number;
  factors: Factor[];
  pred_title: string;
  pred_desc: string;
  weights: Record<string, number>;
  rsi: number | null;
  macd: number | null;
  sigl: number | null;
  sma5: number | null;
  sma20: number | null;
  mom: number;
  bb_pos: number;
  stk: number | null;
  stkd: number | null;
  mtf: number;
  pattern: string | null;
  adx: number | null;
  ema12: number | null;
  ema26: number | null;
  atr: number | null;
  willr: number | null;
  cci: number | null;
  obv_trend: number;
  support: number | null;
  resistance: number | null;
  trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
}

export interface Snapshot {
  market: MarketKey;
  label: string;
  prefix: string;
  dec: number;
  color: string;
  candles: Candle[];
  ma5: (number | null)[];
  ma20: (number | null)[];
  ema12: (number | null)[];
  ema26: (number | null)[];
  bb_upper: (number | null)[];
  bb_middle: (number | null)[];
  bb_lower: (number | null)[];
  vol_ma: (number | null)[];
  last_price: number;
  first_open: number;
  high: number;
  low: number;
  change_pct: number;
  source: 'live' | 'simulasi';
  rate: number | null;
  prediction: Prediction;
  perf: { win: number; lose: number };
  timestamp: number;
}

export const MARKET_LABELS: Record<MarketKey, string> = {
  gold: 'Emas IDR',
  usdidr: 'USD/IDR',
  xauusd: 'XAU/USD',
};

export const MARKET_FULL_LABELS: Record<MarketKey, string> = {
  gold: 'Emas (IDR/gram)',
  usdidr: 'Kurs USD/IDR',
  xauusd: 'Emas (XAU/USD)',
};

export const MARKET_META: Record<MarketKey, {
  label: string;
  fullLabel: string;
  symbol: string;
  type: 'direct' | 'derived';
  prefix: string;
  dec: number;
  color: string;
  vol: number;
}> = {
  gold: {
    label: 'Emas IDR',
    fullLabel: 'Emas (IDR/gram)',
    symbol: 'GC=F',
    type: 'derived',
    prefix: 'Rp ',
    dec: 0,
    color: '#eab308',
    vol: 0.00028,
  },
  usdidr: {
    label: 'USD/IDR',
    fullLabel: 'Kurs USD/IDR',
    symbol: 'USDIDR=X',
    type: 'direct',
    prefix: 'Rp ',
    dec: 2,
    color: '#06b6d4',
    vol: 0.00008,
  },
  xauusd: {
    label: 'XAU/USD',
    fullLabel: 'Emas (XAU/USD)',
    symbol: 'GC=F',
    type: 'direct',
    prefix: '$',
    dec: 2,
    color: '#f97316',
    vol: 0.00035,
  },
};
