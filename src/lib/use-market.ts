"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { MarketKey, Snapshot } from "./market-types";

const POLL_INTERVAL = 5000;

export function useMarketSnapshot(market: MarketKey) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchSnapshot = useCallback(async (m: MarketKey, silent = false) => {
    if (!silent) setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/snapshot?market=${m}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Snapshot = await res.json();
      if (!mountedRef.current) return;
      setSnapshot(data);
      setError(null);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      if (!mountedRef.current) return;
      setError(e.message || "Gagal memuat data");
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const doFetch = async () => {
      await fetchSnapshot(market);
      if (cancelled) return;
    };
    doFetch();
    const id = setInterval(() => {
      if (!cancelled) fetchSnapshot(market, true);
    }, POLL_INTERVAL);
    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [market, fetchSnapshot]);

  return { snapshot, error, loading, refresh: () => fetchSnapshot(market, true) };
}

export function useAllSnapshots(markets: MarketKey[]) {
  const [snapshots, setSnapshots] = useState<Record<MarketKey, Snapshot | null>>(
    () => Object.fromEntries(markets.map((m) => [m, null])) as any
  );
  const [errors, setErrors] = useState<Record<MarketKey, string | null>>(
    () => Object.fromEntries(markets.map((m) => [m, null])) as any
  );
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchOne = useCallback(async (m: MarketKey) => {
    try {
      const res = await fetch(`/api/snapshot?market=${m}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Snapshot = await res.json();
      if (!mountedRef.current) return;
      setSnapshots((prev) => ({ ...prev, [m]: data }));
      setErrors((prev) => ({ ...prev, [m]: null }));
    } catch (e: any) {
      if (!mountedRef.current) return;
      setErrors((prev) => ({ ...prev, [m]: e.message || "Gagal memuat" }));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const initialFetch = async () => {
      await Promise.all(markets.map((m) => fetchOne(m)));
      if (!cancelled && mountedRef.current) setLoading(false);
    };
    initialFetch();
    const id = setInterval(() => {
      if (!cancelled) markets.forEach((m) => fetchOne(m));
    }, POLL_INTERVAL);
    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [markets, fetchOne]);

  return { snapshots, errors, loading };
}
