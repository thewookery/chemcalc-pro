"use client";

import React, { useState } from 'react';
import { useLiveBridge } from '@/context/LiveBridgeContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, Unlink, Radio, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LiveBridgeStatusBar: React.FC = () => {
  const { isConnected, roomCode, role, peerCount, disconnect } = useLiveBridge();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isConnected) return null;

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?bridge=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link Copied!", description: "Live session URL copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="Live Bridge Status"
      className="sticky top-16 z-40 w-full bg-emerald-600/95 dark:bg-emerald-950/95 text-white backdrop-blur border-b border-emerald-500/30 px-4 py-2 transition-all animate-fadeIn"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
          </span>
          <span className="font-semibold tracking-wide">
            LIVE BRIDGE ACTIVE: <span className="font-mono bg-emerald-700/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">{roomCode}</span>
          </span>
          <span className="hidden md:inline opacity-80">
            • {role === 'host' ? 'Presenting' : 'Connected to Presenter'} ({peerCount} peer{peerCount === 1 ? '' : 's'})
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopyLink}
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-white hover:bg-emerald-700/70 hover:text-white gap-1"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-200" /> : <Share2 className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share Link"}</span>
          </Button>

          <Button
            onClick={disconnect}
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-white hover:bg-rose-700 hover:text-white gap-1"
          >
            <Unlink className="h-3 w-3" />
            <span>End Bridge</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
