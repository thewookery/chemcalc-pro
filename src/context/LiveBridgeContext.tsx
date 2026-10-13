"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { DataConnection, Peer } from 'peerjs';

export type BridgeRole = 'host' | 'viewer' | null;

export interface BridgeMessage {
  type: 'NAVIGATE' | 'SYNC_CALC' | 'HIGHLIGHT' | 'CHAT_NOTE' | 'SYNC_REQUEST';
  payload: any;
  timestamp: number;
}

interface LiveBridgeContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isHost: boolean;
  role: BridgeRole;
  roomCode: string;
  peerCount: number;
  lastMessage: BridgeMessage | null;
  startHosting: () => Promise<string>;
  joinRoom: (code: string) => Promise<boolean>;
  disconnect: () => void;
  broadcast: (type: BridgeMessage['type'], payload: any) => void;
  syncCalculatorState: (slug: string, state: Record<string, any>) => void;
  getCalculatorState: (slug: string) => Record<string, any> | undefined;
}

const LiveBridgeContext = createContext<LiveBridgeContextType | null>(null);

const PEER_PREFIX = 'chemcalc-room-';

function generateRandomCode(): string {
  const letters = ['LAB', 'QC', 'BATCH', 'CHEM', 'MIX'];
  const prefix = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

function normalizePath(rawPath?: string | null): string {
  if (!rawPath) return '/';
  let p = rawPath;
  if (p.startsWith('/chemcalc-pro')) {
    p = p.slice('/chemcalc-pro'.length) || '/';
  }
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p.startsWith('/') ? p : `/${p}`;
}

export const LiveBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [role, setRole] = useState<BridgeRole>(null);
  const [roomCode, setRoomCode] = useState('');
  const [peerCount, setPeerCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<BridgeMessage | null>(null);

  // In-memory cache of synced state per calculator slug
  const syncedStateRef = useRef<Record<string, any>>({});

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const isNavigatingFromPeerRef = useRef(false);
  const hasAutoJoinedRef = useRef(false);

  // Broadcast to all active connections
  const broadcast = useCallback((type: BridgeMessage['type'], payload: any) => {
    const message: BridgeMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (err) {
          console.error('Failed to send peer message:', err);
        }
      }
    });
  }, []);

  // Broadcast route navigation to peers whenever pathname changes
  useEffect(() => {
    if (!isConnected) return;
    if (isNavigatingFromPeerRef.current) {
      isNavigatingFromPeerRef.current = false;
      return;
    }
    const cleanCurrent = normalizePath(pathname);
    broadcast('NAVIGATE', { pathname: cleanCurrent });
  }, [pathname, isConnected, broadcast]);

  // Handle incoming message from peer
  const handleIncomingMessage = useCallback(
    (msg: BridgeMessage, conn: DataConnection) => {
      setLastMessage(msg);

      if (msg.type === 'NAVIGATE' && msg.payload?.pathname) {
        const targetPath = normalizePath(msg.payload.pathname);
        const currentPath = normalizePath(pathname);
        if (targetPath !== currentPath) {
          isNavigatingFromPeerRef.current = true;
          try {
            router.push(targetPath);
            toast({
              title: "Navigated with Co-Pilot",
              description: `Switched to ${targetPath === '/' ? 'Home' : targetPath.slice(1)}`,
            });
          } catch (err) {
            console.error('Failed to navigate via peer message:', err);
          }
        }
      } else if (msg.type === 'SYNC_CALC' && msg.payload?.slug) {
        const { slug, state } = msg.payload;
        syncedStateRef.current[slug] = state;
        // Dispatch window event so listening calculator updates immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('chemcalc-live-sync', {
              detail: { slug, state },
            })
          );
        }
      } else if (msg.type === 'SYNC_REQUEST') {
        // Send our current calculator state to the newcomer
        Object.entries(syncedStateRef.current).forEach(([slug, state]) => {
          try {
            conn.send({
              type: 'SYNC_CALC',
              payload: { slug, state },
              timestamp: Date.now(),
            });
          } catch {}
        });
      }
    },
    [pathname, router, toast]
  );

  // Set up connection event listeners
  const setupConnection = useCallback(
    (conn: DataConnection) => {
      conn.on('open', () => {
        if (!connectionsRef.current.some((c) => c.peer === conn.peer)) {
          connectionsRef.current.push(conn);
        }
        setPeerCount(connectionsRef.current.filter((c) => c.open).length);
        setIsConnected(true);
        setIsConnecting(false);

        toast({
          title: "📡 Peer Connected!",
          description: "Live bridge established. Screen & inputs are now syncing.",
        });

        // Request initial state
        conn.send({
          type: 'SYNC_REQUEST',
          payload: null,
          timestamp: Date.now(),
        });
      });

      conn.on('data', (data: any) => {
        handleIncomingMessage(data as BridgeMessage, conn);
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter((c) => c.peer !== conn.peer);
        setPeerCount(connectionsRef.current.filter((c) => c.open).length);
        if (connectionsRef.current.length === 0 && role === 'viewer') {
          setIsConnected(false);
          toast({
            title: "Peer Disconnected",
            description: "The live bridge session has ended.",
            variant: "destructive",
          });
        }
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
      });
    },
    [handleIncomingMessage, role, toast]
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    connectionsRef.current.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    connectionsRef.current = [];

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {}
      peerRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setRole(null);
    setRoomCode('');
    setPeerCount(0);
  }, []);

  // Host a new session
  const startHosting = useCallback(async (): Promise<string> => {
    disconnect();
    setIsConnecting(true);

    const code = generateRandomCode();
    const peerId = `${PEER_PREFIX}${code.toLowerCase()}`;

    // Dynamically import PeerJS on client
    const { Peer } = await import('peerjs');
    const peer = new Peer(peerId);
    peerRef.current = peer;

    return new Promise((resolve, reject) => {
      peer.on('open', () => {
        setRoomCode(code);
        setRole('host');
        setIsConnecting(false);
        setIsConnected(true);
        resolve(code);
      });

      peer.on('connection', (conn) => {
        setupConnection(conn);
      });

      peer.on('error', (err: any) => {
        console.error('Peer error:', err);
        setIsConnecting(false);
        if (err.type === 'unavailable-id') {
          // Retry with new code if collision
          startHosting().then(resolve).catch(reject);
        } else {
          toast({
            title: "Connection Error",
            description: "Could not create room on public broker. Please retry.",
            variant: "destructive",
          });
          reject(err);
        }
      });
    });
  }, [disconnect, setupConnection, toast]);

  // Join an existing session
  const joinRoom = useCallback(
    async (codeToJoin: string): Promise<boolean> => {
      const cleanCode = codeToJoin.trim().toUpperCase();
      if (!cleanCode) return false;

      disconnect();
      setIsConnecting(true);

      const targetPeerId = `${PEER_PREFIX}${cleanCode.toLowerCase()}`;

      // Dynamically import PeerJS
      const { Peer } = await import('peerjs');
      const peer = new Peer(); // Random joiner ID
      peerRef.current = peer;

      return new Promise((resolve) => {
        peer.on('open', () => {
          const conn = peer.connect(targetPeerId, { reliable: true });
          setupConnection(conn);

          conn.on('open', () => {
            setRoomCode(cleanCode);
            setRole('viewer');
            resolve(true);
          });

          // Timeout fallback if host is not reachable
          setTimeout(() => {
            if (!conn.open) {
              setIsConnecting(false);
              toast({
                title: "Room Not Found",
                description: `Could not connect to room "${cleanCode}". Make sure the host is currently in the session.`,
                variant: "destructive",
              });
              resolve(false);
            }
          }, 7000);
        });

        peer.on('error', (err) => {
          console.error('Join error:', err);
          setIsConnecting(false);
          toast({
            title: "Connection Failed",
            description: "Unable to connect to room. Check code and try again.",
            variant: "destructive",
          });
          resolve(false);
        });
      });
    },
    [disconnect, setupConnection, toast]
  );

  // Sync calculator state helper
  const syncCalculatorState = useCallback(
    (slug: string, state: Record<string, any>) => {
      syncedStateRef.current[slug] = state;
      if (isConnected) {
        broadcast('SYNC_CALC', { slug, state });
      }
    },
    [isConnected, broadcast]
  );

  const getCalculatorState = useCallback((slug: string) => {
    return syncedStateRef.current[slug];
  }, []);

  // Auto-join from URL parameter ?bridge=XYZ or ?room=XYZ
  useEffect(() => {
    if (typeof window === 'undefined' || hasAutoJoinedRef.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('bridge') || urlParams.get('room');
    if (roomParam && !isConnected && !isConnecting) {
      hasAutoJoinedRef.current = true;
      joinRoom(roomParam);
    }
  }, [isConnected, isConnecting, joinRoom]);

  return (
    <LiveBridgeContext.Provider
      value={{
        isConnected,
        isConnecting,
        isHost: role === 'host',
        role,
        roomCode,
        peerCount,
        lastMessage,
        startHosting,
        joinRoom,
        disconnect,
        broadcast,
        syncCalculatorState,
        getCalculatorState,
      }}
    >
      {children}
    </LiveBridgeContext.Provider>
  );
};

export const useLiveBridge = () => {
  const context = useContext(LiveBridgeContext);
  if (!context) {
    throw new Error('useLiveBridge must be used within a LiveBridgeProvider');
  }
  return context;
};
