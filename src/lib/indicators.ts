export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      sum += values[i];
      if (i === period - 1) {
        prev = sum / period;
        out[i] = prev;
      }
    } else if (prev !== null) {
      prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < values.length; i++) {
    const chg = values[i] - values[i - 1];
    const gain = chg > 0 ? chg : 0;
    const loss = chg < 0 ? -chg : 0;
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out[i] = 100 - 100 / (1 + rs);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      out[i] = 100 - 100 / (1 + rs);
    }
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: (number | null)[] = values.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return (emaFast[i] as number) - (emaSlow[i] as number);
  });
  const validMacd = macdLine.filter((v) => v !== null) as number[];
  const signalLine = ema(validMacd, signal);
  const signalOffset = macdLine.findIndex((v) => v !== null);
  const signalFull: (number | null)[] = new Array(values.length).fill(null);
  signalLine.forEach((v, i) => {
    if (v !== null && i + signalOffset < values.length) {
      signalFull[i + signalOffset] = v;
    }
  });
  const histogram: (number | null)[] = values.map((_, i) => {
    if (macdLine[i] === null || signalFull[i] === null) return null;
    return (macdLine[i] as number) - (signalFull[i] as number);
  });
  return { macdLine, signalLine: signalFull, histogram, emaFast, emaSlow };
}

export function bollingerBands(values: number[], period = 20, nd = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    const m = mid[i] as number;
    for (let j = i - period + 1; j <= i; j++) {
      sum += Math.pow(values[j] - m, 2);
    }
    const sd = Math.sqrt(sum / period);
    upper[i] = m + nd * sd;
    lower[i] = m - nd * sd;
  }
  return { upper, middle: mid, lower };
}

export function stochastic(high: number[], low: number[], close: number[], kPeriod = 14, dPeriod = 3) {
  const k: (number | null)[] = new Array(close.length).fill(null);
  for (let i = kPeriod - 1; i < close.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (high[j] > hh) hh = high[j];
      if (low[j] < ll) ll = low[j];
    }
    const denom = hh - ll;
    k[i] = denom === 0 ? 50 : ((close[i] - ll) / denom) * 100;
  }
  const d = sma(k.map((v) => v ?? 0), dPeriod).map((v, i) => (k[i] === null ? null : v));
  return { k, d };
}

export function adx(high: number[], low: number[], close: number[], period = 14): number | null {
  const n = close.length;
  if (n < period * 2 + 1) return null;
  const tr: number[] = new Array(n).fill(0);
  const plusDM: number[] = new Array(n).fill(0);
  const minusDM: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
    tr[i] = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
  }
  const smoothTR = wilderSmooth(tr, period);
  const smoothPlusDM = wilderSmooth(plusDM, period);
  const smoothMinusDM = wilderSmooth(minusDM, period);
  const plusDI: number[] = new Array(n).fill(0);
  const minusDI: number[] = new Array(n).fill(0);
  const dx: number[] = new Array(n).fill(0);
  for (let i = period; i < n; i++) {
    if (smoothTR[i] > 0) {
      plusDI[i] = (smoothPlusDM[i] / smoothTR[i]) * 100;
      minusDI[i] = (smoothMinusDM[i] / smoothTR[i]) * 100;
      const sum = plusDI[i] + minusDI[i];
      dx[i] = sum === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / sum) * 100;
    }
  }
  let sum = 0;
  let count = 0;
  for (let i = period; i < Math.min(period * 2, n); i++) {
    sum += dx[i];
    count++;
  }
  if (count < period) return null;
  let prevAdx = sum / count;
  for (let i = period * 2; i < n; i++) {
    prevAdx = (prevAdx * (period - 1) + dx[i]) / period;
  }
  return prevAdx;
}

function wilderSmooth(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(0);
  let sum = 0;
  for (let i = 1; i <= period; i++) sum += values[i] || 0;
  out[period] = sum;
  for (let i = period + 1; i < values.length; i++) {
    out[i] = out[i - 1] - out[i - 1] / period + values[i];
  }
  return out;
}

export function atr(high: number[], low: number[], close: number[], period = 14): number | null {
  const n = close.length;
  if (n < period + 1) return null;
  const tr: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
  }
  const sm = sma(tr, period);
  return sm[n - 1];
}

export function williamsR(high: number[], low: number[], close: number[], period = 14): number | null {
  const n = close.length;
  if (n < period) return null;
  let hh = -Infinity;
  let ll = Infinity;
  for (let i = n - period; i < n; i++) {
    if (high[i] > hh) hh = high[i];
    if (low[i] < ll) ll = low[i];
  }
  const denom = hh - ll;
  return denom === 0 ? -50 : ((hh - close[n - 1]) / denom) * -100;
}

export function cci(high: number[], low: number[], close: number[], period = 20): number | null {
  const n = close.length;
  if (n < period) return null;
  const tp: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) tp[i] = (high[i] + low[i] + close[i]) / 3;
  let sum = 0;
  for (let i = n - period; i < n; i++) sum += tp[i];
  const mean = sum / period;
  let devSum = 0;
  for (let i = n - period; i < n; i++) devSum += Math.abs(tp[i] - mean);
  const meanDev = devSum / period;
  if (meanDev === 0) return 0;
  return (tp[n - 1] - mean) / (0.015 * meanDev);
}

export function obvTrend(close: number[], volume: number[], period = 10): number {
  const n = close.length;
  if (n < period + 1) return 0;
  const obv: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    if (close[i] > close[i - 1]) obv[i] = obv[i - 1] + volume[i];
    else if (close[i] < close[i - 1]) obv[i] = obv[i - 1] - volume[i];
    else obv[i] = obv[i - 1];
  }
  const recent = obv.slice(n - period);
  const slope = (recent[recent.length - 1] - recent[0]) / period;
  const avgVol = volume.slice(n - period).reduce((a, b) => a + b, 0) / period;
  return avgVol === 0 ? 0 : slope / avgVol;
}

export function detectPattern(open: number[], high: number[], low: number[], close: number[]): string | null {
  const n = close.length;
  if (n < 2) return null;
  const o1 = open[n - 2], c1 = close[n - 2];
  const o2 = open[n - 1], c2 = close[n - 1];
  const h2 = high[n - 1], l2 = low[n - 1];
  const body = Math.abs(c2 - o2);
  const range = h2 - l2;
  if (range < 1e-10) return null;
  const br = body / range;
  const us = h2 - Math.max(o2, c2);
  const ls = Math.min(o2, c2) - l2;
  if (o1 > c1 && c2 > o2 && o2 <= c1 && c2 >= o1) return 'bull_engulf';
  if (o1 < c1 && c2 < o2 && o2 >= c1 && c2 <= o1) return 'bear_engulf';
  if (br < 0.1) return 'doji';
  if (ls > body * 2 && us < body * 0.5) return 'hammer';
  if (us > body * 2 && ls < body * 0.5) return 'shooting_star';
  if (n >= 3) {
    const o3 = open[n - 3], c3 = close[n - 3];
    if (c3 < c2 && c2 < c1 && c1 > o1 && c2 > o2) return 'three_white_soldiers';
    if (c3 > c2 && c2 > c1 && c1 < o1 && c2 < o2) return 'three_black_crows';
  }
  return null;
}

export function findSupportResistance(close: number[], high: number[], low: number[], lookback = 20) {
  const n = close.length;
  if (n < lookback) return { support: null, resistance: null };
  const slice = close.slice(n - lookback);
  const highSlice = high.slice(n - lookback);
  const lowSlice = low.slice(n - lookback);
  const lastPrice = close[n - 1];
  let support: number | null = null;
  let resistance: number | null = null;
  let minDistSup = Infinity;
  let minDistRes = Infinity;
  for (let i = 1; i < highSlice.length - 1; i++) {
    if (highSlice[i] > highSlice[i - 1] && highSlice[i] > highSlice[i + 1]) {
      if (highSlice[i] > lastPrice) {
        const dist = highSlice[i] - lastPrice;
        if (dist < minDistRes) {
          minDistRes = dist;
          resistance = highSlice[i];
        }
      }
    }
    if (lowSlice[i] < lowSlice[i - 1] && lowSlice[i] < lowSlice[i + 1]) {
      if (lowSlice[i] < lastPrice) {
        const dist = lastPrice - lowSlice[i];
        if (dist < minDistSup) {
          minDistSup = dist;
          support = lowSlice[i];
        }
      }
    }
  }
  return { support, resistance };
}

export function lastVal(arr: (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && !Number.isNaN(arr[i] as number)) return arr[i];
  }
  return null;
}

export function resampleCandles(candles: { open: number; high: number; low: number; close: number; volume: number }[], factor: number) {
  const out: { open: number; high: number; low: number; close: number; volume: number }[] = [];
  for (let i = 0; i < candles.length; i += factor) {
    const chunk = candles.slice(i, i + factor);
    if (chunk.length === 0) continue;
    out.push({
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, c) => s + c.volume, 0),
    });
  }
  return out;
}
