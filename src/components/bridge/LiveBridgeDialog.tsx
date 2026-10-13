"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLiveBridge } from '@/context/LiveBridgeContext';
import { useToast } from '@/hooks/use-toast';
import { Radio, Copy, Check, Users, PhoneCall, Loader2, Unlink, Camera, CameraOff, Video } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { cleanRoomCode } from '@/lib/roomCode';

export const LiveBridgeDialog: React.FC<{ trigger?: React.ReactNode }> = ({ trigger }) => {
  const {
    isConnected,
    isConnecting,
    role,
    roomCode,
    peerCount,
    startHosting,
    joinRoom,
    disconnect,
    localStream,
    remoteStream,
    isSharingCamera,
    startCameraShare,
    stopCameraShare,
    setVideoWindowOpen,
  } = useLiveBridge();
  const { toast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleStartHosting = async () => {
    try {
      await startHosting();
    } catch {
      // Toast handled in context
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) return;
    const cleanCode = cleanRoomCode(inputCode.trim());
    const success = await joinRoom(cleanCode);
    if (success) {
      setIsOpen(false);
    }
  };

  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?bridge=${roomCode}`;
  };

  const copyInviteUrl = async () => {
    const url = getInviteUrl();
    await copyToClipboard(url);
    setCopiedLink(true);
    toast({ title: "Link Copied!", description: "Send this link to your colleague to connect instantly." });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyRoomCode = async () => {
    await copyToClipboard(roomCode);
    setCopiedCode(true);
    toast({ title: "Code Copied!", description: `Room code ${roomCode} copied.` });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant={isConnected ? "default" : "outline"}
            size="sm"
            className={`gap-1.5 text-xs font-medium ${
              isConnected ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isConnected ? "animate-pulse text-white" : "text-primary"}`} />
            <span>{isConnected ? `Bridge: ${roomCode}` : "Live Bridge"}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Co-Pilot Live Bridge</DialogTitle>
              <DialogDescription className="text-xs">
                Real-time interactive screen & batch calculation sync for phone calls and training.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isConnected ? (
          /* Active Session View */
          <div className="space-y-5 py-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span>Live Bridge Connected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Role: <strong className="capitalize">{role}</strong> • {peerCount} Peer(s) connected
              </p>
              <div className="text-2xl font-mono font-bold tracking-wider text-foreground pt-1">
                {roomCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copyInviteUrl} variant="outline" size="sm" className="gap-1.5 text-xs">
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Link Copied" : "Copy Invite Link"}</span>
              </Button>
              <Button onClick={copyRoomCode} variant="outline" size="sm" className="gap-1.5 text-xs">
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? "Code Copied" : "Copy Code"}</span>
              </Button>
            </div>

            {/* Batch Ticket Camera Stream Section */}
            <div className="p-3.5 rounded-xl border bg-muted/40 dark:bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Batch Ticket Camera Feed</h4>
                    <p className="text-[10px] text-muted-foreground">Audio-free stream in a floating resizable window</p>
                  </div>
                </div>
                {remoteStream && (
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full animate-pulse">
                    Colleague Live
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {isSharingCamera ? (
                  <Button
                    onClick={stopCameraShare}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
                  >
                    <CameraOff className="h-3.5 w-3.5" />
                    <span>Stop Sharing Camera</span>
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      const ok = await startCameraShare('environment');
                      if (ok) setIsOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Share Phone / Device Camera</span>
                  </Button>
                )}
                {(remoteStream || localStream) && (
                  <Button
                    onClick={() => {
                      setVideoWindowOpen(true);
                      setIsOpen(false);
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-xs gap-1"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>View Window</span>
                  </Button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              💡 As you type numbers or change calculators, your colleague sees your actions in real time!
            </p>

            <Button
              onClick={() => {
                disconnect();
                toast({ title: "Disconnected", description: "Live session ended." });
              }}
              variant="destructive"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              <Unlink className="h-3.5 w-3.5" />
              <span>End Live Session</span>
            </Button>
          </div>
        ) : (
          /* Connect / Host Tabs */
          <Tabs defaultValue="host" className="w-full pt-2">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="host">Host Session</TabsTrigger>
              <TabsTrigger value="join">Join with Code</TabsTrigger>
            </TabsList>

            {/* Host Tab */}
            <TabsContent value="host" className="space-y-4">
              <div className="p-3.5 rounded-lg bg-muted/60 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Explain & Demonstrate Live:</p>
                <p>Start a session, read the room code over the phone or text the link. When they connect, your calculations will mirror on their device live!</p>
              </div>

              {roomCode && role === 'host' ? (
                <div className="space-y-3">
                  <div className="text-center p-4 border rounded-xl bg-card space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Your Room Code</span>
                    <div className="text-3xl font-mono font-extrabold tracking-widest text-primary">
                      {roomCode}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Waiting for colleague to join...
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={copyInviteUrl} variant="default" size="sm" className="flex-1 gap-1.5 text-xs">
                      {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
                    </Button>
                    <Button onClick={copyRoomCode} variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Copy className="h-3.5 w-3.5" />
                      <span>Code</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleStartHosting}
                  disabled={isConnecting}
                  className="w-full gap-2"
                >
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                  <span>{isConnecting ? "Creating Room..." : "Start Host Session"}</span>
                </Button>
              )}
            </TabsContent>

            {/* Join Tab */}
            <TabsContent value="join" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="room-code-input" className="text-xs font-medium text-foreground">
                  Room Code (e.g. qc482 or just 482)
                </label>
                <Input
                  id="room-code-input"
                  placeholder="e.g. qc482"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="text-center font-mono text-xl tracking-widest lowercase h-12 font-bold"
                  maxLength={10}
                />
              </div>

              <Button
                onClick={handleJoin}
                disabled={isConnecting || !inputCode.trim()}
                className="w-full gap-2"
              >
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                <span>{isConnecting ? "Connecting to Peer..." : "Connect to Session"}</span>
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
