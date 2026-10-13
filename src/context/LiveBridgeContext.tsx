"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { DataConnection, Peer } from 'peerjs';
import { generateRandomCode, cleanRoomCode } from '@/lib/roomCode';

export type BridgeRole = 'host' | 'viewer' | null;

export interface BridgeMessage {
  type: 'NAVIGATE' | 'SYNC_CALC' | 'HIGHLIGHT' | 'CHAT_NOTE' | 'SYNC_REQUEST' | 'HEARTBEAT' | 'HEARTBEAT_ACK';
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
  startHosting: (desiredCode?: string) => Promise<string>;
  joinRoom: (code: string) => Promise<boolean>;
  disconnect: () => void;
  broadcast: (type: BridgeMessage['type'], payload: any) => void;
  syncCalculatorState: (slug: string, state: Record<string, any>) => void;
  getCalculatorState: (slug: string) => Record<string, any> | undefined;
}

const LiveBridgeContext = createContext<LiveBridgeContextType | null>(null);

const PEER_PREFIX = 'chemcalc-room-';
const SESSION_KEY = 'chemcalc_live_session_v2';

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  },
  pingInterval: 5000,
};

function normalizePath(rawPath?: string | null): string {
  if (!rawPath) return '/';
  let p = rawPath;
  if (p.startsWith('/chemcalc-pro')) {
    p = p.slice('/chemcalc-pro'.length) || '/';
  }
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  // Enforce trailing slash so Next.js static export never does a hard reload or 308 redirect
  if (!p.endsWith('/')) {
    p = `${p}/`;
  }
  return p;
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

  // Synchronized refs to eliminate stale closures in WebRTC callbacks
  const roleRef = useRef<BridgeRole>(null);
  const roomCodeRef = useRef('');
  const isConnectedRef = useRef(false);
  const userManuallyDisconnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const lastNavigatedPathRef = useRef<string>('');

  // In-memory cache of synced state per calculator slug
  const syncedStateRef = useRef<Record<string, any>>({});

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const isNavigatingFromPeerRef = useRef(false);
  const hasAutoJoinedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

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
    const cleanCurrent = normalizePath(pathname);
    
    // If this navigation was triggered by a peer, don't echo back
    if (isNavigatingFromPeerRef.current) {
      isNavigatingFromPeerRef.current = false;
      lastNavigatedPathRef.current = cleanCurrent;
      return;
    }

    if (cleanCurrent === lastNavigatedPathRef.current) {
      return;
    }

    lastNavigatedPathRef.current = cleanCurrent;
    broadcast('NAVIGATE', { pathname: cleanCurrent });
  }, [pathname, isConnected, broadcast]);

  // Handle incoming message from peer
  const handleIncomingMessage = useCallback(
    (msg: BridgeMessage, conn: DataConnection) => {
      if (msg.type === 'HEARTBEAT') {
        try {
          conn.send({
            type: 'HEARTBEAT_ACK',
            payload: null,
            timestamp: Date.now(),
          });
        } catch {}
        return;
      }

      if (msg.type === 'HEARTBEAT_ACK') {
        return;
      }

      setLastMessage(msg);

      if (msg.type === 'NAVIGATE' && msg.payload?.pathname) {
        const targetPath = normalizePath(msg.payload.pathname);
        const currentPath = normalizePath(pathname);
        if (targetPath !== currentPath && targetPath !== lastNavigatedPathRef.current) {
          isNavigatingFromPeerRef.current = true;
          lastNavigatedPathRef.current = targetPath;
          try {
            router.push(targetPath);
            toast({
              title: "Navigated with Co-Pilot",
              description: `Switched to ${targetPath === '/' ? 'Home' : targetPath.replace(/\//g, '')}`,
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

  // Setup connection lifecycle and listeners
  const setupConnection = useCallback(
    (conn: DataConnection) => {
      conn.on('open', () => {
        if (!connectionsRef.current.some((c) => c.peer === conn.peer)) {
          connectionsRef.current.push(conn);
        }
        const openPeers = connectionsRef.current.filter((c) => c.open).length;
        setPeerCount(openPeers);
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        toast({
          title: "📡 Peer Connected!",
          description: "Live bridge established. Screen & inputs are now syncing.",
        });

        // Request initial state
        try {
          conn.send({
            type: 'SYNC_REQUEST',
            payload: null,
            timestamp: Date.now(),
          });
        } catch {}
      });

      conn.on('data', (data: any) => {
        handleIncomingMessage(data as BridgeMessage, conn);
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter((c) => c.peer !== conn.peer);
        const openPeers = connectionsRef.current.filter((c) => c.open).length;
        setPeerCount(openPeers);

        // If viewer lost connection and did NOT manually disconnect: try auto-reconnecting
        if (openPeers === 0 && roleRef.current === 'viewer' && !userManuallyDisconnectedRef.current) {
          if (reconnectAttemptsRef.current < 4 && roomCodeRef.current) {
            reconnectAttemptsRef.current += 1;
            console.log(`Connection dropped. Reconnecting attempt ${reconnectAttemptsRef.current}...`);
            toast({
              title: "Reconnecting Bridge...",
              description: `Network blip detected. Reconnecting to ${roomCodeRef.current}...`,
            });
            setTimeout(() => {
              if (!userManuallyDisconnectedRef.current && roomCodeRef.current) {
                joinRoom(roomCodeRef.current, true);
              }
            }, 1200);
          } else {
            setIsConnected(false);
            toast({
              title: "Peer Disconnected",
              description: "The live bridge session has ended.",
              variant: "destructive",
            });
          }
        }
      });

      conn.on('error', (err) => {
        console.warn('Peer connection error:', err);
      });
    },
    [handleIncomingMessage, toast]
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    userManuallyDisconnectedRef.current = true;
    reconnectAttemptsRef.current = 0;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
    }

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

  // Host a new session (qc + 3 numbers, e.g. qc482)
  const startHosting = useCallback(async (desiredCode?: string): Promise<string> => {
    disconnect();
    userManuallyDisconnectedRef.current = false;
    setIsConnecting(true);

    const code = desiredCode ? cleanRoomCode(desiredCode) : generateRandomCode();
    const peerId = `${PEER_PREFIX}${code}`;

    const { Peer } = await import('peerjs');
    const peer = new Peer(peerId, PEER_CONFIG);
    peerRef.current = peer;

    return new Promise((resolve, reject) => {
      peer.on('open', () => {
        setRoomCode(code);
        setRole('host');
        setIsConnecting(false);
        setIsConnected(true);

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'host', roomCode: code }));
          } catch {}
        }

        resolve(code);
      });

      peer.on('connection', (conn) => {
        setupConnection(conn);
      });

      // Auto-reconnect signaling broker if temporarily disconnected
      peer.on('disconnected', () => {
        console.log('Host broker disconnected. Reconnecting to signaling broker...');
        if (!peer.destroyed && !userManuallyDisconnectedRef.current) {
          try {
            peer.reconnect();
          } catch {}
        }
      });

      peer.on('error', (err: any) => {
        console.error('Peer host error:', err);
        setIsConnecting(false);
        if (err.type === 'unavailable-id') {
          // Retry with new code if collision
          startHosting().then(resolve).catch(reject);
        } else {
          toast({
            title: "Connection Error",
            description: "Could not create room on broker. Please retry.",
            variant: "destructive",
          });
          reject(err);
        }
      });
    });
  }, [disconnect, setupConnection, toast]);

  // Join an existing session
  const joinRoom = useCallback(
    async (codeToJoin: string, isAutoRetry = false): Promise<boolean> => {
      const cleanCode = cleanRoomCode(codeToJoin);
      if (!cleanCode) return false;

      if (!isAutoRetry) {
        disconnect();
        userManuallyDisconnectedRef.current = false;
        setIsConnecting(true);
      }

      const targetPeerId = `${PEER_PREFIX}${cleanCode}`;

      const { Peer } = await import('peerjs');
      const peer = new Peer(PEER_CONFIG);
      peerRef.current = peer;

      return new Promise((resolve) => {
        peer.on('open', () => {
          const conn = peer.connect(targetPeerId, {
            reliable: true,
            serialization: 'json',
          });
          setupConnection(conn);

          conn.on('open', () => {
            setRoomCode(cleanCode);
            setRole('viewer');

            if (typeof window !== 'undefined') {
              try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'viewer', roomCode: cleanCode }));
              } catch {}
            }

            resolve(true);
          });

          // Timeout fallback if host is not reachable
          setTimeout(() => {
            if (!conn.open) {
              if (!isAutoRetry) {
                setIsConnecting(false);
                toast({
                  title: "Room Not Found",
                  description: `Could not connect to room "${cleanCode}". Make sure the host is currently in the session.`,
                  variant: "destructive",
                });
              }
              resolve(false);
            }
          }, 8000);
        });

        peer.on('disconnected', () => {
          console.log('Viewer broker disconnected. Reconnecting to signaling broker...');
          if (!peer.destroyed && !userManuallyDisconnectedRef.current) {
            try {
              peer.reconnect();
            } catch {}
          }
        });

        peer.on('error', (err) => {
          console.error('Join error:', err);
          if (!isAutoRetry) {
            setIsConnecting(false);
            toast({
              title: "Connection Failed",
              description: "Unable to connect to room. Check code and try again.",
              variant: "destructive",
            });
          }
          resolve(false);
        });
      });
    },
    [disconnect, setupConnection, toast]
  );

  // Restore session from sessionStorage on page load or refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored?.role && stored?.roomCode && !isConnectedRef.current) {
          if (stored.role === 'host') {
            startHosting(stored.roomCode);
          } else if (stored.role === 'viewer') {
            joinRoom(stored.roomCode);
          }
        }
      }
    } catch {}
  }, [startHosting, joinRoom]);

  // Continuous active heartbeat (every 3 seconds) to prevent NAT/carrier timeout drops
  useEffect(() => {
    if (!isConnected) return;
    const heartbeatTimer = setInterval(() => {
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send({
              type: 'HEARTBEAT',
              payload: null,
              timestamp: Date.now(),
            });
          } catch {}
        }
      });
    }, 3000);

    return () => clearInterval(heartbeatTimer);
  }, [isConnected]);

  // Page visibility recovery (e.g. mobile screen off or switching tabs during phone call)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (peerRef.current && peerRef.current.disconnected && !peerRef.current.destroyed) {
          try {
            peerRef.current.reconnect();
          } catch {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
