import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { PWAProvider } from "@/components/pwa/pwa-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeVision - Real-Time Market Analyzer",
  description: "Platform analisis real-time untuk emas, kurs USD/IDR, dan XAU/USD dengan candlestick chart interaktif, indikator teknikal lengkap, dan prediksi AI trading signal.",
  applicationName: "TradeVision",
  keywords: ["trading", "gold", "emas", "XAU/USD", "USD/IDR", "real-time", "candlestick", "AI prediction", "PWA"],
  authors: [{ name: "TradeVision" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TradeVision",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "TradeVision - Real-Time Market Analyzer",
    description: "Platform analisis real-time untuk emas, mata uang, dan prediksi AI trading signal.",
    type: "website",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
