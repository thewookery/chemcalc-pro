"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useLiveBridge } from '@/context/LiveBridgeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  X,
  Aperture,
  ChevronDown,
  ChevronUp,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Video,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type WindowSize = 'compact' | 'expanded' | 'fullscreen';

export const LiveBridgeCameraWindow: React.FC = () => {
  const {
    isConnected,
    localStream,
    remoteStream,
    isSharingCamera,
    isVideoWindowOpen,
    cameraFacingMode,
    startCameraShare,
    stopCameraShare,
    switchCameraFacing,
    setVideoWindowOpen,
  } = useLiveBridge();

  const { toast } = useToast();

  const [isMinimized, setIsMinimized] = useState(false);
  const [windowSize, setWindowSize] = useState<WindowSize>('compact');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [isTrackMuted, setIsTrackMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const prevRemoteStreamRef = useRef<MediaStream | null>(null);

  const activeStream = remoteStream || localStream;

  // Whenever isVideoWindowOpen is explicitly set to true from external buttons, un-minimize
  useEffect(() => {
    if (isVideoWindowOpen) {
      setIsMinimized(false);
    }
  }, [isVideoWindowOpen]);

  // When a new remote stream arrives from a colleague, auto-open and un-minimize the window
  useEffect(() => {
    if (remoteStream && !prevRemoteStreamRef.current) {
      setIsMinimized(false);
      setVideoWindowOpen(true);
    }
    prevRemoteStreamRef.current = remoteStream;
  }, [remoteStream, setVideoWindowOpen]);

  // Continuously bind activeStream to the video element without unmounting
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (activeStream) {
      if (video.srcObject !== activeStream) {
        video.srcObject = activeStream;
      }
      video.play().catch((err) => {
        console.warn('Video auto-play interrupted:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [activeStream, isMinimized, windowSize]);

  // Keep playback resilient against background pausing or mobile sleep
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStream) return;

    const handleLoadedMetadata = () => {
      video.play().catch(() => {});
    };

    const handlePause = () => {
      if (activeStream && !video.ended) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('pause', handlePause);
    };
  }, [activeStream]);

  // Track mute / unmute events on mobile devices (e.g. app switching or lock screen)
  useEffect(() => {
    if (!remoteStream) {
      setIsTrackMuted(false);
      return;
    }

    const videoTrack = remoteStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleMute = () => setIsTrackMuted(true);
    const handleUnmute = () => setIsTrackMuted(false);

    videoTrack.addEventListener('mute', handleMute);
    videoTrack.addEventListener('unmute', handleUnmute);

    return () => {
      videoTrack.removeEventListener('mute', handleMute);
      videoTrack.removeEventListener('unmute', handleUnmute);
    };
  }, [remoteStream]);

  // Secondary Picture-In-Picture for self preview if both remote & local streams exist
  useEffect(() => {
    if (pipVideoRef.current && remoteStream && localStream) {
      pipVideoRef.current.srcObject = localStream;
      pipVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, localStream]);

  // Do not render anything if Live Bridge is not connected, or if no camera is active and window was closed
  if (!isConnected || (!activeStream && !isVideoWindowOpen)) {
    return null;
  }

  // Capture high-resolution photo / freeze frame from live video
  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedPhotoUrl(dataUrl);
        setPhotoZoom(1);
        toast({
          title: "📸 Batch Ticket Captured!",
          description: "Frozen frame ready to inspect and zoom.",
        });
      }
    } catch (e) {
      console.error('Failed to capture snapshot:', e);
    }
  };

  // Download snapshot to device
  const handleDownloadSnapshot = () => {
    if (!capturedPhotoUrl) return;
    const a = document.createElement('a');
    a.href = capturedPhotoUrl;
    a.download = `batch-ticket-snapshot-${Date.now()}.jpg`;
    a.click();
  };

  // Size styling classes
  const sizeClasses = {
    compact: 'w-[92vw] sm:w-[360px] h-[270px]',
    expanded: 'w-[94vw] sm:w-[520px] h-[400px]',
    fullscreen: 'fixed inset-3 sm:inset-6 z-50 w-auto h-auto',
  }[windowSize];

  return (
    <>
      {/* 1. Collapsed Floating Pill State (Keeps stream alive in background when minimized) */}
      {isMinimized && (
        <aside
          aria-label="Batch Ticket Camera Pill"
          className="fixed bottom-4 right-4 z-50 animate-fadeIn flex items-center gap-1.5"
        >
          <Button
            onClick={() => {
              setIsMinimized(false);
              setVideoWindowOpen(true);
            }}
            className="shadow-2xl bg-slate-900/95 text-white hover:bg-slate-800 border border-emerald-500/50 rounded-full px-4 py-2.5 h-auto flex items-center gap-2.5 backdrop-blur group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Camera className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold">
              {remoteStream ? "Batch Ticket Feed (Live)" : "Camera Sharing Active"}
            </span>
            <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-white transition-transform" />
          </Button>

          {/* Quick stop button if user is sharing and wants to turn off hardware */}
          {isSharingCamera && (
            <Button
              onClick={() => {
                stopCameraShare();
                toast({ title: "Camera Stopped", description: "Camera sharing ended." });
              }}
              variant="destructive"
              size="icon"
              className="h-9 w-9 rounded-full shadow-lg border border-rose-500/40"
              title="Stop camera sharing"
            >
              <CameraOff className="h-4 w-4" />
            </Button>
          )}
        </aside>
      )}

      {/* 2. Floating Video Window (Always kept mounted in DOM so WebRTC stream sink never drops) */}
      <aside
        aria-label="Batch Ticket Camera"
        className={`fixed bottom-4 right-4 z-50 flex flex-col bg-slate-950/95 text-white border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-200 ${sizeClasses} ${
          isMinimized ? 'hidden pointer-events-none' : ''
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 select-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-tight text-slate-200">
              {remoteStream ? "Batch Ticket (Colleague Live)" : "Your Camera Feed"}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-400 font-mono">
              LIVE
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle window size */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (windowSize === 'compact') setWindowSize('expanded');
                else if (windowSize === 'expanded') setWindowSize('fullscreen');
                else setWindowSize('compact');
              }}
              title="Resize window"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {windowSize === 'fullscreen' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>

            {/* Minimize window to floating pill */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsMinimized(true);
                if (isSharingCamera) {
                  toast({
                    title: "Camera Still Live",
                    description: "Your camera is still sharing with your colleague. Tap the floating pill to reopen preview.",
                  });
                }
              }}
              title="Minimize to floating pill"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>

            {/* Close / Hide Window (Minimizes without terminating stream so it never turns black) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsMinimized(true);
                if (isSharingCamera) {
                  toast({
                    title: "Preview Minimized",
                    description: "Camera is still streaming to your colleague! Tap the green pill to view preview.",
                  });
                }
              }}
              title="Hide window"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {/* Main video element: Always present in DOM so WebRTC stream does not drop or freeze */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${activeStream ? '' : 'hidden'}`}
          />

          {/* Placeholder if no stream is currently flowing */}
          {!activeStream && (
            <div className="text-center p-6 space-y-3 text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <CameraOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">No Active Camera Stream</p>
                <p className="text-[11px] text-slate-400">Waiting for colleague to share camera...</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVideoWindowOpen(false)}
                className="text-xs border-slate-700 text-slate-300 hover:text-white"
              >
                Close Window
              </Button>
            </div>
          )}

          {/* Mobile pause / track mute overlay */}
          {isTrackMuted && activeStream && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-400 border-t-transparent mb-2" />
              <p className="text-xs font-semibold text-slate-200">Stream Temporarily Paused</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Colleague may have switched apps or locked their screen. Resuming automatically when they return...
              </p>
            </div>
          )}

          {/* Picture-in-picture for self preview when watching remote stream */}
          {remoteStream && localStream && (
            <div className="absolute top-2 right-2 w-24 h-16 bg-black rounded-lg border border-slate-700 overflow-hidden shadow-lg z-10">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0.5 left-1 text-[9px] font-mono text-slate-300 bg-black/60 px-1 rounded">
                You
              </span>
            </div>
          )}
        </div>

        {/* Bottom Quick-Action Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-slate-800/80 gap-2">
          {/* Freeze Frame / Snap Photo Button */}
          <Button
            size="sm"
            onClick={handleCaptureSnapshot}
            className="h-8 px-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-white gap-1.5 border border-slate-700"
            title="Freeze frame to read numbers and fine print clearly"
          >
            <Aperture className="h-3.5 w-3.5 text-emerald-400" />
            <span>Snap Photo</span>
          </Button>

          <div className="flex items-center gap-1.5">
            {/* Flip Camera (if sharing camera on mobile phone) */}
            {isSharingCamera && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCameraFacing}
                className="h-8 px-2.5 text-xs border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 gap-1"
                title={`Switch camera (currently: ${cameraFacingMode === 'environment' ? 'Back Camera' : 'Front Camera'})`}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flip</span>
              </Button>
            )}

            {/* Explicit Stop / Share Camera Controls */}
            {isSharingCamera ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  stopCameraShare();
                  toast({ title: "Camera Stopped", description: "Stopped sharing camera feed." });
                }}
                className="h-8 px-2.5 text-xs gap-1 shadow-sm"
              >
                <CameraOff className="h-3.5 w-3.5" />
                <span>Stop Camera</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => startCameraShare('environment')}
                className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Share Camera</span>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* 3. Snapshot / Freeze-Frame Modal (for inspecting handwritten batch tickets) */}
      {capturedPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          {/* Modal Header */}
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2">
              <Aperture className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold">Batch Ticket Frozen Photo</h3>
                <p className="text-[11px] text-slate-400">Zoom in to read handwritten weights, lot numbers, or chemical tickets</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhotoZoom((z) => Math.min(z + 0.3, 3))}
                className="h-8 w-8 p-0 border-slate-700 text-slate-200 hover:bg-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhotoZoom((z) => Math.max(z - 0.3, 0.7))}
                className="h-8 w-8 p-0 border-slate-700 text-slate-200 hover:bg-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhotoZoom(1)}
                className="h-8 w-8 p-0 border-slate-700 text-slate-200 hover:bg-slate-800"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadSnapshot}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save Photo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCapturedPhotoUrl(null)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Zoomable Image Container */}
          <div className="relative w-full max-w-4xl max-h-[80vh] flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-auto flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedPhotoUrl}
              alt="Batch Ticket Snapshot"
              style={{ transform: `scale(${photoZoom})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-[75vh] object-contain transition-transform duration-150 cursor-grab active:cursor-grabbing rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
