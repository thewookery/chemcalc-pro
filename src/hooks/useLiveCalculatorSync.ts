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
  const lastSyncedJsonRef = useRef<string>('');
  
  // Stable ref to avoid re-triggering effects when caller passes inline arrow functions
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  useEffect(() => {
    onRemoteUpdateRef.current = onRemoteUpdate;
  });

  // 1. Broadcast local changes to peers (debounced, avoids echo)
  useEffect(() => {
    if (!isConnected) return;
    if (isUpdatingFromRemoteRef.current) {
      isUpdatingFromRemoteRef.current = false;
      return;
    }

    try {
      const currentJson = JSON.stringify(values);
      // If no change from what we last synced, don't broadcast
      if (currentJson === lastSyncedJsonRef.current) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        lastSyncedJsonRef.current = currentJson;
        syncCalculatorState(slug, values);
      }, 150);
    } catch {
      // ignore serialization errors
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [slug, values, isConnected, syncCalculatorState]);

  // 2. Listen for remote sync events
  useEffect(() => {
    const handleLiveSync = (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ slug: string; state: T }>;
        if (customEvent.detail?.slug === slug && customEvent.detail?.state) {
          const remoteJson = JSON.stringify(customEvent.detail.state);
          if (remoteJson === lastSyncedJsonRef.current) return; // already in sync

          lastSyncedJsonRef.current = remoteJson;
          isUpdatingFromRemoteRef.current = true;
          onRemoteUpdateRef.current(customEvent.detail.state);
        }
      } catch (err) {
        console.error('Error handling live sync:', err);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('chemcalc-live-sync', handleLiveSync);
    }

    // Check if there was cached state once when slug changes
    try {
      const existing = getCalculatorState(slug);
      if (existing) {
        const existingJson = JSON.stringify(existing);
        if (existingJson !== lastSyncedJsonRef.current) {
          lastSyncedJsonRef.current = existingJson;
          isUpdatingFromRemoteRef.current = true;
          onRemoteUpdateRef.current(existing as T);
        }
      }
    } catch (e) {
      console.error('Error applying cached state:', e);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chemcalc-live-sync', handleLiveSync);
      }
    };
  }, [slug, getCalculatorState]); // Stable dependencies - onRemoteUpdate is now safely inside onRemoteUpdateRef!

  // 3. Support URL Hash Snapshot (#snap=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#snap=')) {
        const encoded = hash.replace('#snap=', '');
        const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
        if (decoded && typeof decoded === 'object') {
          lastSyncedJsonRef.current = JSON.stringify(decoded);
          isUpdatingFromRemoteRef.current = true;
          onRemoteUpdateRef.current(decoded);
        }
      }
    } catch (e) {
      // ignore invalid hash
    }
  }, []);

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
