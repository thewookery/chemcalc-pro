"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useLiveBridge } from '@/context/LiveBridgeContext';

export function useLiveCalculatorSync<T extends Record<string, any>>(
  slug: string,
  values: T,
  onRemoteUpdate: (incoming: T) => void
) {
  const { isConnected, syncCalculatorState, getCalculatorState } = useLiveBridge();
  const isUpdatingFromRemoteRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Broadcast local changes to peers (debounced)
  useEffect(() => {
    if (!isConnected) return;
    if (isUpdatingFromRemoteRef.current) {
      isUpdatingFromRemoteRef.current = false;
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      syncCalculatorState(slug, values);
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [slug, values, isConnected, syncCalculatorState]);

  // 2. Listen for remote sync events
  useEffect(() => {
    const handleLiveSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ slug: string; state: T }>;
      if (customEvent.detail?.slug === slug && customEvent.detail?.state) {
        isUpdatingFromRemoteRef.current = true;
        onRemoteUpdate(customEvent.detail.state);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('chemcalc-live-sync', handleLiveSync);
    }

    // Check if there was cached state
    const existing = getCalculatorState(slug);
    if (existing) {
      isUpdatingFromRemoteRef.current = true;
      onRemoteUpdate(existing as T);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chemcalc-live-sync', handleLiveSync);
      }
    };
  }, [slug, onRemoteUpdate, getCalculatorState]);

  // 3. Support URL Hash Snapshot (#snap=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#snap=')) {
        const encoded = hash.replace('#snap=', '');
        const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
        if (decoded && typeof decoded === 'object') {
          isUpdatingFromRemoteRef.current = true;
          onRemoteUpdate(decoded);
        }
      }
    } catch (e) {
      // ignore invalid hash
    }
  }, [onRemoteUpdate]);

  // 4. Generate Shareable Snapshot URL
  const getSnapshotUrl = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    try {
      const serialized = btoa(encodeURIComponent(JSON.stringify(values)));
      const base = window.location.href.split('#')[0];
      return `${base}#snap=${serialized}`;
    } catch {
      return window.location.href;
    }
  }, [values]);

  return {
    isLiveConnected: isConnected,
    getSnapshotUrl,
  };
}
