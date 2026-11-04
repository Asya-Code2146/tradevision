import {
  sma, ema, rsi, macd, bollingerBands, stochastic, adx, atr, williamsR, cci,
  obvTrend, detectPattern, findSupportResistance, lastVal, resampleCandles,
} from './indicators';
import type { Candle, Prediction, Factor } from './market-types';

const PRED_TEMPLATES: Record<string, [string, string]> = {
  'NAIK_SANGAT BELI': ['TREN NAIK KUAT', 'Momentum bullish sangat kuat, mayoritas indikator konvergen'],
  'NAIK_BELI': ['POTENSI NAIK', 'Sinyal bullish terdeteksi dari beberapa indikator'],
  'TURUN_SANGAT JUAL': ['TREN TURUN KUAT', 'Tekanan jual sangat tinggi, mayoritas indikator bearish'],
  'TURUN_JUAL': ['POTENSI TURUN', 'Sinyal bearish terdeteksi dari beberapa indikator'],
  'NETRAL_TUNGGU': ['KONSOLIDASI', 'Market sideway, menunggu konfirmasi arah'],
};

const BADGE: Record<string, string> = {
  'SANGAT BELI': 'BELI KUAT',
  'BELI': 'BELI',
  'TUNGGU': 'KONSOLIDASI',
  'JUAL': 'JUAL',
  'SANGAT JUAL': 'JUAL KUAT',
};

interface WeightsConfig {
  sma: number; ema: number; rsi: number; macd: number; bb: number;
  stoch: number; mom: number; vol: number; pat: number;
  willr: number; cci: number; obv: number; sr: number;
}

function getWeights(adxVal: number | null): WeightsConfig {
  const a = adxVal ?? 20;
  const w: WeightsConfig = {
    sma: 14, ema: 12, rsi: 11, macd: 13, bb: 10,
    stoch: 8, mom: 9, vol: 8, pat: 6, willr: 4, cci: 3, obv: 2, sr: 0,
  };
  if (a > 30) {
    w.macd = 22; w.sma = 18; w.ema = 14; w.rsi = 4; w.stoch = 3; w.bb = 5;
  } else if (a < 20) {
    w.rsi = 18; w.stoch = 14; w.bb = 16; w.macd = 4; w.sma = 5; w.ema = 4;
  } else {
    w.bb = 12; w.rsi = 12; w.macd = 10; w.sma = 10;
  }
  const total = Object.values(w).reduce((s, v) => s + v, 0);
  const result: any = {};
  for (const k of Object.keys(w)) {
    result[k] = Math.round((w[k as keyof WeightsConfig] / total) * 100);
  }
  return result;
}

export function predictAI(candles: Candle[]): Prediction | null {
  if (!candles || candles.length < 35) return null;

  const close = candles.map((c) => c.close);
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const open = candles.map((c) => c.open);
  const volume = candles.map((c) => c.volume);

  const s5Arr = sma(close, 5);
  const s20Arr = sma(close, 20);
  const ema12Arr = ema(close, 12);
  const ema26Arr = ema(close, 26);
  const rsiArr = rsi(close, 14);
  const { macdLine, signalLine, histogram } = macd(close);
  const { upper: bbU, middle: bbM, lower: bbL } = bollingerBands(close, 20, 2);
  const { k: stochK, d: stochD } = stochastic(high, low, close, 14, 3);
  const adxVal = adx(high, low, close, 14);
  const atrVal = atr(high, low, close, 14);
  const willrVal = williamsR(high, low, close, 14);
  const cciVal = cci(high, low, close, 20);
  const obvT = obvTrend(close, volume, 10);
  const pat = detectPattern(open, high, low, close);
  const sr = findSupportResistance(close, high, low, 30);

  const s5 = lastVal(s5Arr);
  const s20 = lastVal(s20Arr);
  const e12 = lastVal(ema12Arr);
  const e26 = lastVal(ema26Arr);
  const rv = lastVal(rsiArr);
  const mv = lastVal(macdLine);
  const slv = lastVal(signalLine);
  const hist = lastVal(histogram);
  const bbUV = lastVal(bbU);
  const bbMV = lastVal(bbM);
  const bbLV = lastVal(bbL);
  const stkV = lastVal(stochK);
  const stkdV = lastVal(stochD);
  const lastClose = close[close.length - 1];
  const mom = ((lastClose - close[close.length - 6]) / close[close.length - 6]) * 100;

  const rvol = volume.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const pvol = volume.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
  const vr = pvol > 0 ? rvol / pvol : 1;
  const pu = lastClose > close[close.length - 2];

  let bp = 0.5;
  if (bbUV !== null && bbLV !== null && bbUV - bbLV > 0) {
    bp = Math.max(0, Math.min(1, (lastClose - bbLV) / (bbUV - bbLV)));
  }

  const candles5 = resampleCandles(
    candles.slice(-30).map((c) => ({ open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume })),
    5
  );
  let mtf = 0;
  if (candles5.length >= 6) {
    const c5Close = candles5.map((c) => c.close);
    const m5 = lastVal(sma(c5Close, 3));
    const m10 = lastVal(sma(c5Close, 5));
    if (m5 !== null && m10 !== null) mtf = m5 > m10 ? 1 : -1;
  }

  const W = getWeights(adxVal);
  let score = 0;
  const factors: Factor[] = [];

  let sc: number;
  if (s5 !== null && s20 !== null) {
    if (s5 > s20 * 1.0008) sc = W.sma;
    else if (s5 > s20) sc = Math.floor(W.sma / 2);
    else if (s5 < s20 * 0.9992) sc = -W.sma;
    else sc = -Math.floor(W.sma / 2);
  } else sc = 0;
  score += sc;
  factors.push({ name: 'SMA Cross', value: sc > 0 ? 'Bull' : sc < 0 ? 'Bear' : 'Netral', score: sc, weight: W.sma });

  if (e12 !== null && e26 !== null) {
    if (e12 > e26 * 1.0008) sc = W.ema;
    else if (e12 > e26) sc = Math.floor(W.ema / 2);
    else if (e12 < e26 * 0.9992) sc = -W.ema;
    else sc = -Math.floor(W.ema / 2);
  } else sc = 0;
  score += sc;
  factors.push({ name: 'EMA Cross', value: sc > 0 ? 'Bull' : sc < 0 ? 'Bear' : 'Netral', score: sc, weight: W.ema });

  if (rv !== null) {
    if (rv < 25) sc = W.rsi;
    else if (rv < 35) sc = Math.floor(W.rsi * 0.5);
    else if (rv > 75) sc = -W.rsi;
    else if (rv > 65) sc = -Math.floor(W.rsi * 0.5);
    else sc = 0;
  } else sc = 0;
  score += sc;
  const rl = rv !== null && rv < 30 ? 'Oversold' : rv !== null && rv > 70 ? 'Overbought' : 'Netral';
  factors.push({
    name: 'RSI(14)',
    value: rv !== null ? `${rv.toFixed(1)} ${rl}` : '-',
    score: sc,
    weight: W.rsi,
  });

  if (mv !== null && slv !== null) {
    const d = mv - slv;
    if (d > 0 && mv > 0) sc = W.macd;
    else if (d > 0) sc = Math.floor(W.macd * 0.45);
    else if (d < 0 && mv < 0) sc = -W.macd;
    else sc = -Math.floor(W.macd * 0.45);
  } else sc = 0;
  score += sc;
  factors.push({
    name: 'MACD',
    value: hist !== null ? `${hist >= 0 ? '+' : ''}${hist.toFixed(2)}` : '-',
    score: sc,
    weight: W.macd,
  });

  if (bp < 0.05) sc = W.bb;
  else if (bp < 0.2) sc = Math.floor(W.bb * 0.5);
  else if (bp > 0.95) sc = -W.bb;
  else if (bp > 0.8) sc = -Math.floor(W.bb * 0.5);
  else sc = 0;
  score += sc;
  factors.push({ name: 'BB Pos', value: `${Math.round(bp * 100)}%`, score: sc, weight: W.bb });

  if (stkV !== null) {
    if (stkV < 20) sc = W.stoch;
    else if (stkV < 30) sc = Math.floor(W.stoch * 0.5);
    else if (stkV > 80) sc = -W.stoch;
    else if (stkV > 70) sc = -Math.floor(W.stoch * 0.5);
    else sc = 0;
  } else sc = 0;
  score += sc;
  factors.push({
    name: 'Stoch',
    value: stkV !== null && stkdV !== null ? `${Math.round(stkV)}/${Math.round(stkdV)}` : '-',
    score: sc,
    weight: W.stoch,
  });

  if (mom > 0.4) sc = W.mom;
  else if (mom > 0.1) sc = Math.floor(W.mom * 0.5);
  else if (mom < -0.4) sc = -W.mom;
  else if (mom < -0.1) sc = -Math.floor(W.mom * 0.5);
  else sc = 0;
  score += sc;
  factors.push({ name: 'Momentum', value: `${mom >= 0 ? '+' : ''}${mom.toFixed(3)}%`, score: sc, weight: W.mom });

  const vu = vr > 1.1;
  if (vu && pu) sc = W.vol;
  else if (vu && !pu) sc = -W.vol;
  else if (!vu && pu) sc = Math.floor(W.vol * 0.3);
  else sc = -Math.floor(W.vol * 0.3);
  score += sc;
  factors.push({ name: 'Volume', value: `${vr.toFixed(1)}x`, score: sc, weight: W.vol });

  if (willrVal !== null) {
    if (willrVal < -80) sc = W.willr;
    else if (willrVal < -70) sc = Math.floor(W.willr * 0.5);
    else if (willrVal > -20) sc = -W.willr;
    else if (willrVal > -30) sc = -Math.floor(W.willr * 0.5);
    else sc = 0;
  } else sc = 0;
  score += sc;
  factors.push({
    name: 'Williams %R',
    value: willrVal !== null ? willrVal.toFixed(1) : '-',
    score: sc,
    weight: W.willr,
  });

  if (cciVal !== null) {
    if (cciVal < -100) sc = W.cci;
    else if (cciVal < -50) sc = Math.floor(W.cci * 0.5);
    else if (cciVal > 100) sc = -W.cci;
    else if (cciVal > 50) sc = -Math.floor(W.cci * 0.5);
    else sc = 0;
  } else sc = 0;
  score += sc;
  factors.push({
    name: 'CCI(20)',
    value: cciVal !== null ? `${cciVal.toFixed(0)}` : '-',
    score: sc,
    weight: W.cci,
  });

  if (obvT > 0.05) sc = W.obv;
  else if (obvT > 0.01) sc = Math.floor(W.obv * 0.5);
  else if (obvT < -0.05) sc = -W.obv;
  else if (obvT < -0.01) sc = -Math.floor(W.obv * 0.5);
  else sc = 0;
  score += sc;
  factors.push({
    name: 'OBV Trend',
    value: obvT > 0.01 ? 'Accum' : obvT < -0.01 ? 'Distrib' : 'Flat',
    score: sc,
    weight: W.obv,
  });

  let sp = 0;
  let pl = '-';
  const pm: Record<string, [number, string]> = {
    hammer: [1, 'Hammer'],
    shooting_star: [-1, 'Shoot Star'],
    bull_engulf: [1, 'Bull Engulf'],
    bear_engulf: [-1, 'Bear Engulf'],
    doji: [0, 'Doji'],
    three_white_soldiers: [1, '3 Soldiers'],
    three_black_crows: [-1, '3 Crows'],
  };
  if (pat && pat in pm) {
    sp = pm[pat][0];
    pl = pm[pat][1];
  }
  sp = Math.round((sp * W.pat) / 5);
  score += sp;
  factors.push({ name: 'Pattern', value: pl, score: sp, weight: W.pat });

  if (sr.support !== null && lastClose > sr.support && lastClose < sr.support * 1.005) {
    sc = Math.floor(W.sma * 0.5);
    score += sc;
    factors.push({ name: 'Near Support', value: 'Bounce?', score: sc, weight: W.sma });
  } else if (sr.resistance !== null && lastClose < sr.resistance && lastClose > sr.resistance * 0.995) {
    sc = -Math.floor(W.sma * 0.5);
    score += sc;
    factors.push({ name: 'Near Resist', value: 'Reversal?', score: sc, weight: W.sma });
  }

  score = Math.max(-100, Math.min(100, Math.round(score)));
  let rc = Math.min(97, Math.abs(score));
  if ((score > 0 && mtf > 0) || (score < 0 && mtf < 0)) rc = Math.min(97, rc + 5);
  else if (mtf !== 0 && ((score > 0 && mtf < 0) || (score < 0 && mtf > 0))) rc = Math.max(12, rc - 8);

  const activeFactors = factors.filter((f) => f.score !== 0);
  const agree = factors.filter((f) => (score > 0 && f.score > 0) || (score < 0 && f.score < 0));
  if (activeFactors.length > 0) {
    const agr = agree.length / activeFactors.length;
    if (agr > 0.7) rc = Math.min(97, rc + 3);
    else if (agr < 0.4) rc = Math.max(12, rc - 4);
  }

  const conf = Math.max(12, Math.min(97, Math.round(rc)));

  let dir: Prediction['dir'];
  let sig: Prediction['sig'];
  if (score > 35) { dir = 'NAIK'; sig = 'SANGAT BELI'; }
  else if (score > 12) { dir = 'NAIK'; sig = 'BELI'; }
  else if (score < -35) { dir = 'TURUN'; sig = 'SANGAT JUAL'; }
  else if (score < -12) { dir = 'TURUN'; sig = 'JUAL'; }
  else { dir = 'NETRAL'; sig = 'TUNGGU'; }

  const [pt, pdesc] = PRED_TEMPLATES[`${dir}_${sig}`] || [dir, sig];

  let trendStrength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK';
  if (adxVal !== null && adxVal > 35) trendStrength = 'STRONG';
  else if (adxVal !== null && adxVal > 22) trendStrength = 'MODERATE';

  return {
    dir,
    sig,
    score,
    conf,
    factors,
    pred_title: pt,
    pred_desc: pdesc,
    weights: W as any,
    rsi: rv,
    macd: mv,
    sigl: slv,
    sma5: s5,
    sma20: s20,
    mom,
    bb_pos: bp,
    stk: stkV,
    stkd: stkdV,
    mtf,
    pattern: pat,
    adx: adxVal,
    ema12: e12,
    ema26: e26,
    atr: atrVal,
    willr: willrVal,
    cci: cciVal,
    obv_trend: obvT,
    support: sr.support,
    resistance: sr.resistance,
    trend_strength: trendStrength,
  };
}
