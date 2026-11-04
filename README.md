# 📈 TradeVision — Real-Time Market Analyzer (PWA)

**TradeVision** adalah aplikasi Progressive Web App (PWA) berbasis Next.js untuk analisis pasar finansial secara *real-time*. Berfokus pada komoditas Emas (IDR & XAU/USD) dan Kurs USD/IDR, platform ini menyajikan visualisasi chart interaktif dengan 13 indikator teknikal serta **Rule-based AI Engine** internal tanpa ketergantungan API pihak ketiga.

---

## 📸 Fitur Utama

* **📊 Chart Interaktif TradingView**: Menggunakan `lightweight-charts v5` dengan dukungan interaksi mulus di desktop & mobile.
* **🧠 Built-in Rule-Based AI Engine**: Analisis teknikal otomatis berbasis logika skoring tanpa memerlukan *API key* external.
* **⚡ Real-Time Polling & Caching**: Data diperbarui secara berkala setiap 5 detik dengan proteksi rate-limit.
* **🔍 Deteksi Pola & Indikator Lengkap**: Otomatisasi pembacaan pola candlestick dasar serta level *Support & Resistance*.
* **📱 PWA Support**: Dapat diinstal langsung di Android, iOS, maupun Desktop, serta mendukung fitur *offline-ready*.
* **🎨 Dark Mode Optimized**: Tampilan visual profesional dengan kontras tinggi untuk kenyamanan analisis mata.

---

## 🤖 Logika & Arsitektur AI Prediction Engine

Engine AI pada TradeVision beroperasi secara lokal berbasis algoritma statistik dan indikator teknikal murni (*Zero-API Cost*).

```text
   ┌───────────────────────┐
   │ 13 Indikator Teknikal │
   └───────────┬───────────┘
               │
               ▼
 ┌──────────────────────────┐     ADX > 30 ────► Prioritas Indikator Trend (MA, MACD)
 │   Adaptive Weighting     ├────► ADX < 20 ────► Prioritas Indikator Momentum (RSI, Stoch, BB)
 │ (Dynamic ADX Adjustment) │     ADX 20-30 ───► Balanced Weight
 └───────────┬──────────────┘
             │
             ▼
 ┌──────────────────────────┐
 │ Multi-Timeframe Check    │ (Konfirmasi 5-Menit vs 1-Menit)
 └───────────┬──────────────┘
             │
             ▼
 ┌──────────────────────────┐
 │ Target Confidence Score  │ ────► Signal: BELI / JUAL / TUNGGU
 └──────────────────────────┘
```

### 1. Indikator yang Dianalisis (13 Faktor)
* **Trend & Moving Averages**: SMA Cross, EMA Cross, Bollinger Position, Support/Resistance level.
* **Oscillator & Momentum**: RSI, MACD, Stochastic, Momentum, Williams %R, CCI.
* **Volume & Price Action**: Volume Ratio, OBV Trend, Pattern Recognition (Hammer, Engulfing, Doji, Three Soldiers/Crows).

### 2. Penyesuaian Bobot Adaptif (Adaptive Weighting)
AI menyesuaikan bobot indikator berdasarkan kondisi volatilitas pasar via **ADX (Average Directional Index)**:
* **Trending (ADX > 30)**: Memprioritaskan indikator pengikut tren seperti Moving Average, EMA, dan MACD.
* **Sideways (ADX < 20)**: Memprioritaskan indikator osilator seperti RSI, Stochastic, dan Bollinger Bands.
* **Netral (ADX 20-30)**: Menggunakan alokasi bobot seimbang pada seluruh indikator.

### 3. Output Prediksi
* **Direction**: `NAIK`, `TURUN`, atau `NETRAL`
* **Signal**: `BELI`, `JUAL`, atau `TUNGGU`
* **Metrics**: Persentase *Confidence Level*, total skor, dan breakdown detail dari 13 indikator.

---

## 📡 Sumber & Konsumsi Data

| Pasangan Mata Uang / Komoditas | Sumber Data | Mekanisme Data |
| :--- | :--- | :--- |
| **XAU/USD (Emas Global)** | Yahoo Finance API (`query1.finance.yahoo.com`) | Historical & Polling Data |
| **USD/IDR (Kurs)** | Fawaz Ahmed Currency API (`cdn.jsdelivr.net`) | Real-Time Spot Data |
| **Emas IDR (Lokal)** | Kalkulasi XAU/USD × USD/IDR | Derived Real-Time Data |

> **Ketahanan Sistem**: Aplikasi dilengkapi fitur *caching system* 30 detik untuk pencegahan *rate-limiting* API serta mekanisme *fallback simulation* jika server penyedia data mengalami kegagalan/keterlambatan koneksi.

---

## 🛠️ Tech Stack

* **Core Framework**: Next.js 16 (App Router)
* **Language**: TypeScript 5
* **Styling**: Tailwind CSS v4 & shadcn/ui
* **Data Visualization**: `lightweight-charts v5` (by TradingView)
* **Icons**: Lucide React
* **PWA Integration**: Custom Service Worker + Web App Manifest

---

## 🚀 Panduan Jalankan Lokal (Development)

Prasyarat: Dipastikan telah menginstal **Node.js 18+** atau **Bun**.

```bash
# 1. Clone repository
git clone https://github.com/USERNAME/TRADEVISION.git
cd TRADEVISION

# 2. Instal dependensi
bun install
# atau
npm install

# 3. Jalankan server lokal
bun run dev
# atau
npm run dev
```

Buka `http://localhost:3000` pada browser Anda.

---

## 🌐 Deploy ke Vercel

Aplikasi ini dirancang *zero-config*, sehingga tidak memerlukan *Environment Variables* tambahan saat rilis.

1. Push repositori ini ke akun GitHub Anda.
2. Buka dashboard [Vercel](https://vercel.com/new) dan lakukan import repositori.
3. Pilih framework **Next.js**.
4. Klik tombol **Deploy**.

---

## ⚠️ Disclaimer

Aplikasi ini dibuat **hanya untuk tujuan edukasi, eksperimen teknis, dan simulasi analisis semata**, bukan merupakan saran atau rekomendasi investasi finansial (*Financial Advice*). Trading instrumen keuangan membawa risiko finansial tinggi. Penulis tidak bertanggung jawab atas kerugian finansial yang terjadi akibat penggunaan aplikasi ini.

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi **MIT**. Bebas digunakan, dimodifikasi, dan didistribusikan kembali.
