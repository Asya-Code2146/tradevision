# TradeVision — Real-Time Market Analyzer (PWA)

Platform analisis trading real-time untuk **Emas (IDR/gram)**, **Kurs USD/IDR**, dan **XAU/USD**. Candlestick chart interaktif ala TradingView, 13 indikator teknikal, dan **AI prediction engine built-in** (no API key needed).

## Fitur

- Candlestick chart interaktif (lightweight-charts v5 by TradingView)
- Overlay: MA5, MA20, EMA12, EMA26, Bollinger Bands
- Volume histogram + Volume MA10
- Pattern detection otomatis (Hammer, Engulfing, Doji, Three Soldiers/Crows)
- AI Prediction engine — 13 indikator dengan weighted scoring adaptif
- Support & Resistance otomatis
- 3 market sekaligus: Emas IDR, USD/IDR, XAU/USD
- Real-time polling 5 detik
- PWA: installable, offline-ready, auto-update
- Dark theme profesional
- Responsive (desktop & mobile)

## AI Prediction

AI engine custom (no API key, no external service). Pakai pendekatan:

1. **13 indikator teknikal** dihitung real-time: SMA Cross, EMA Cross, RSI, MACD, Bollinger Position, Stochastic, Momentum, Volume Ratio, Williams %R, CCI, OBV Trend, Pattern, Support/Resistance
2. **Bobot adaptif** berdasarkan ADX:
   - ADX > 30 (tren kuat): percaya MA, MACD, EMA
   - ADX < 20 (sideways): percaya RSI, Stoch, BB
   - ADX sedang: bobot balanced
3. **Multi-timeframe confirmation**: cek tren 5-menit vs 1-menit
4. **Agreement ratio**: indikator konvergen → confidence naik
5. **Output**: direction (NAIK/TURUN/NETRAL), signal (BELI/JUAL/TUNGGU), confidence %, score, 13 faktor detail

## Data Source

- **XAU/USD** & **USD/IDR historical**: Yahoo Finance (`query1.finance.yahoo.com`)
- **Kurs USD/IDR real-time**: currency-api Fawaz Ahmed (`cdn.jsdelivr.net`)
- Cache 30 detik untuk menghindari rate-limit
- Fallback ke simulasi kalau fetch gagal

## Deploy ke GitHub + Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: TradeVision PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 2. Deploy ke Vercel

1. Buka https://vercel.com/new
2. Import repository GitHub Anda
3. Framework Preset: **Next.js** (auto-detected)
4. Klik **Deploy**
5. Tunggu 1-2 menit, selesai!

Tidak perlu set environment variable apapun. Semua dependencies ada di `package.json`.

### 3. Test PWA

Setelah deploy, buka URL Vercel Anda di Chrome/Edge:
- Buka di Android → akan muncul banner "Pasang TradeVision"
- Buka di desktop → klik icon install di address bar
- Setelah install: badge "App Installed" muncul di pojok kanan atas

## Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint     # check code quality
bun run build    # production build
```

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Chart**: lightweight-charts v5 (TradingView)
- **Icons**: lucide-react
- **PWA**: manifest.json + service worker + custom install prompt

## License

MIT — bebas pakai untuk keperluan apapun.

## Disclaimer

Konten untuk tujuan edukasi & analisis, bukan saran investasi. Trading memiliki risiko kerugian.
