"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Download, Check, X, RefreshCw } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

const SW_PATH = "/sw.js";
const SW_CACHE = "tradevision-v1";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showUpdateBar, setShowUpdateBar] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const standalone = checkStandalone();

    const setupSW = async () => {
      if (!("serviceWorker" in navigator)) {
        if (standalone) setIsInstalled(true);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
        swRegRef.current = reg;
        if (standalone) setIsInstalled(true);
        if (reg.waiting) setShowUpdateBar(true);
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowUpdateBar(true);
            }
          });
        });
      } catch {
        if (standalone) setIsInstalled(true);
      }
    };
    setupSW();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      if (!checkStandalone()) setShowBanner(true);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setInstallEvent(null);
    } catch {}
    setInstalling(false);
  }, [installEvent]);

  const applyUpdate = useCallback(() => {
    const reg = swRegRef.current;
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    if ("caches" in window) {
      caches.keys().then((keys) =>
        keys.forEach((k) => { if (k !== SW_CACHE) caches.delete(k); })
      );
    }
    setTimeout(() => window.location.reload(), 500);
  }, []);

  return (
    <>
      {children}

      {showUpdateBar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/40 bg-amber-950/95 backdrop-blur-md shadow-2xl">
            <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-100">Versi baru tersedia</p>
              <p className="text-[10px] text-amber-300/80">Refresh untuk update terbaru</p>
            </div>
            <button
              onClick={applyUpdate}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {showBanner && !isInstalled && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/40 bg-card/95 backdrop-blur-md shadow-2xl">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Pasang TradeVision</p>
              <p className="text-[10px] text-muted-foreground">Akses cepat, offline-ready</p>
            </div>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black transition-colors"
            >
              {installing ? "..." : "Pasang"}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {isInstalled && (
        <div className="fixed top-2 right-2 z-40 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-sm">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">
              App Installed
            </span>
          </div>
        </div>
      )}
    </>
  );
}
