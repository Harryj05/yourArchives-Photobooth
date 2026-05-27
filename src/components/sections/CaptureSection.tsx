"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STRIP_THEMES, DEFAULT_THEME_ID, type ThemeId, getTheme } from "@/lib/themes";
import { PHOTO_FILTERS, DEFAULT_FILTER_ID, type FilterId, getFilter } from "@/lib/filters";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileCapture, { type PhotoboothState } from "@/components/sections/MobileCapture";

interface CaptureSectionProps {
  layout: 3 | 4;
  onComplete: (data?: { reveal?: boolean; photos?: string[]; layout?: 3 | 4; filter?: FilterId; sessionId?: number; theme?: ThemeId }) => void;
}

export default function CaptureSection({ layout, onComplete }: CaptureSectionProps) {
  const [phase, setPhase] = useState<"prepare" | "capturing" | "completed" | "archiving">("prepare");
  const [currentShot, setCurrentShot] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setUploadError] = useState<string | null>(null);
  const [, setUploadPhotos] = useState<string[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  /**
   * Per-user preferred countdown duration in seconds. 3 by default; restored
   * from localStorage on mount (see useEffect below) and persisted back on
   * every change.
   */
  const [countdownSeconds, setCountdownSeconds] = useState<3 | 5 | 10>(3);
  const [filterId, setFilterId] = useState<FilterId>(DEFAULT_FILTER_ID);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [activeLayout, setActiveLayout] = useState<3 | 4>(layout);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const uploadInFlightRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Declared early so handleCaptureComplete can use it.
  const isMobile = useIsMobile(768);

  const totalShots = activeLayout;

  // Extracted so it can also be called from the "Try Again" button in the error UI.
  const setupCamera = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);
    setPhase("prepare");
    // Stop any previously-acquired stream before re-requesting — necessary
    // when switching between front/rear cameras on mobile.
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    try {
      const mediaStream = await navigator.mediaDevices
        .getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        .catch(async (e: unknown) => {
          console.warn(
            "Retrying with simple constraints:",
            e instanceof DOMException ? e.message : e,
          );
          return navigator.mediaDevices.getUserMedia({ video: true });
        });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setTimeout(() => setPhase("capturing"), 800);
        };
      } else {
        setTimeout(() => setPhase("capturing"), 1500);
      }
    } catch (err: unknown) {
      console.error("Camera access failed:", err);
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setPermissionDenied(denied);
      setError(
        denied
          ? "Camera permission was denied."
          : "Could not connect to the camera.",
      );
    }
  }, [facingMode]);

  // 1. Camera setup on mount.
  useEffect(() => {
    setupCamera();
  }, [setupCamera]);

  // Restore the user's preferred countdown duration. Guarded against
  // bad values (e.g. an older version stored "4") so the picker can never
  // start in an invalid state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("photobooth_countdown");
      const parsed = raw === null ? null : Number(raw);
      if (parsed === 3 || parsed === 5 || parsed === 10) {
        setCountdownSeconds(parsed);
      }
    } catch { /* storage unavailable — keep default */ }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem("photobooth_countdown", String(countdownSeconds));
    } catch { /* storage unavailable */ }
  }, [countdownSeconds]);

  // 2. Stream cleanup — runs whenever stream changes and on unmount.
  //    Keeping stream in the dependency array ensures the cleanup always
  //    holds the current MediaStream reference, preventing a memory leak.
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const playShutterSound = () => {
    const AudioContext = window.AudioContext || (window as unknown as Record<string, typeof window.AudioContext>).webkitAudioContext;
    if (!AudioContext) return;
    
    const context = new AudioContext();
    const noise = context.createBufferSource();
    const bufferSize = context.sampleRate * 0.1;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1200, context.currentTime);
    noiseFilter.Q.setValueAtTime(1, context.currentTime);
    
    const noiseEnd = context.createGain();
    noiseEnd.gain.setValueAtTime(1, context.currentTime);
    noiseEnd.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    noise.buffer = buffer;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnd);
    noiseEnd.connect(context.destination);
    
    noise.start();
    noise.stop(context.currentTime + 0.1);
    
    // Mechanical click sound
    const oscillator = context.createOscillator();
    const clickGain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, context.currentTime);
    clickGain.gain.setValueAtTime(0.2, context.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
    oscillator.connect(clickGain);
    clickGain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.05);
  };

  const takeSnapshot = () => {
    // Safety guard: Prevent captures if already completed or archiving
    if (!videoRef.current || !canvasRef.current || isUploading || phase === "completed") return;
    
    playShutterSound();

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Apply the live preview's CSS filter to the canvas draw so what the
      // user saw is what gets saved. Overlay-only effects (grain, leak,
      // vignette) are then painted on top via applyToCanvas().
      const filter = getFilter(filterId);
      ctx.filter = filter.cssFilter === "none" ? "none" : filter.cssFilter;
      // Mirror only the front camera — the rear camera should record the
      // scene as-is (otherwise text in the photo prints backwards).
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Reset transform + filter so the overlay paints on the upright frame.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      filter.applyToCanvas(ctx, canvas);
      const dataUrl = canvas.toDataURL("image/png");
      
      const newPhotos = [...capturedPhotos, dataUrl];
      setCapturedPhotos(newPhotos);
      const nextShot = currentShot + 1;
      setCurrentShot(nextShot);

      if (nextShot >= totalShots) {
        // Explicitly set phase to completed to lock further triggers
        setPhase("completed");
        // Mobile: navigate immediately (no blocking upload).
        // Desktop: still goes through handleCaptureComplete → doUpload.
        const isViewportMobile = typeof window !== "undefined" && window.innerWidth <= 768;
        if (isMobile || isViewportMobile) {
          onComplete({ reveal: true, photos: newPhotos, layout: activeLayout, filter: filterId, theme: themeId });
        } else {
          handleCaptureComplete(newPhotos);
        }
      }
    }
  };

  const startCountdown = () => {
    // Safety guard: only start if we are in capturing phase and haven't reached limit
    if (phase !== "capturing" || currentShot >= totalShots) return;

    setCountdown(countdownSeconds);

    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countInterval);
          takeSnapshot();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const doUpload = async (photos: string[]) => {
    // Guard against double-fires (React StrictMode, fast re-renders, retries hitting the same photos)
    if (uploadInFlightRef.current) return;
    uploadInFlightRef.current = true;

    setUploadError(null);
    setIsUploading(true);
    setPhase("archiving");

    try {
      // Build a local-timezone YYYY-MM-DD so the strip is filed under the
      // date the user actually captured it (server stores UTC by default).
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos,
          layout: activeLayout,
          timestamp: now.toISOString(),
          localDate,
          theme: themeId,
          filter: filterId,
        }),
      });

      if (response.status === 401) {
        setIsUploading(false);
        setSessionExpired(true);
        uploadInFlightRef.current = false;
        return;
      }

      if (!response.ok) {
        const body = await response.text();
        console.error("Upload failed:", response.status, body);
        setIsUploading(false);
        setUploadError(`Upload failed (${response.status}). Please try again.`);
        uploadInFlightRef.current = false;
        return;
      }

      const result = await response.json() as { dbSessionId?: number };
      console.log("Upload successful:", result);
      onComplete({ reveal: true, photos, layout: activeLayout, filter: filterId, sessionId: result.dbSessionId, theme: themeId });
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
      setUploadError("Network error. Please check your connection and try again.");
      uploadInFlightRef.current = false;
    }
  };

  const handleCaptureComplete = (photos: string[]) => {
    // Always navigate to the result screen immediately. Upload is
    // best-effort: a 503, 401, or network blip should not block the user
    // from seeing their captured strip. The sessionId arrives later via
    // a follow-up navigation if/when the upload succeeds.
    setUploadPhotos(photos);
    onComplete({ reveal: true, photos, layout: activeLayout, filter: filterId, theme: themeId });
    // Fire the upload in the background. Errors are logged but not surfaced
    // as a blocking modal — the user already has their strip locally.
    setTimeout(() => { doUpload(photos).catch((e) => console.error("Background upload failed:", e)); }, 100);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = totalShots - capturedPhotos.length;
    const selected = Array.from(files).slice(0, remainingSlots);

    const readAsDataUrl = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

    try {
      const dataUrls = await Promise.all(selected.map(readAsDataUrl));
      const newPhotos = [...capturedPhotos, ...dataUrls];
      setCapturedPhotos(newPhotos);
      setCurrentShot(newPhotos.length);

      if (newPhotos.length >= totalShots) {
        setPhase("completed");
        handleCaptureComplete(newPhotos);
      }
    } catch (err) {
      console.error("File read error:", err);
    } finally {
      // Reset the input so the same file(s) can be re-selected if needed
      event.target.value = "";
    }
  };

  // Viewport-based UI swap. Both branches share the same useState graph
  // above, so neither the desktop diorama nor the mobile UI duplicates
  // logic — they are presentational layers over a single state source.
  // (isMobile is declared near the top so handleCaptureComplete can use it.)

  const mobileState: PhotoboothState = {
    phase,
    videoRef,
    canvasRef,
    capturedPhotos,
    currentShot,
    totalShots,
    countdown,
    countdownSeconds,
    setCountdownSeconds,
    activeLayout,
    setActiveLayout,
    filterId,
    setFilterId,
    themeId,
    setThemeId,
    error,
    permissionDenied,
    setupCamera,
    startCountdown,
    isUploading,
    facingMode,
    setFacingMode,
    onDone: () => {
      // MobileCapture's result view tapped "Continue" — hand off to parent.
      onComplete({
        reveal: true,
        photos: capturedPhotos,
        layout: activeLayout,
        filter: filterId,
        theme: themeId,
      });
    },
  };

  // Overlays and modals that must render on BOTH mobile and desktop.
  const sharedOverlays = (
    <>
      {/* Soft White Flash Handoff Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeIn" }}
            className="fixed inset-0 bg-white z-[9999] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Session Expired Modal */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
              <p className="font-display text-lg font-bold text-zinc-900 mb-3">Session Expired</p>
              <p className="font-sans text-sm text-zinc-600 mb-6 leading-relaxed">
                Your sign-in has expired. Sign back in and we&apos;ll keep your photos so you can save them.
              </p>
              <button
                onClick={() => {
                  const ret = encodeURIComponent(window.location.pathname);
                  window.location.href = `/auth/login?redirect=${ret}`;
                }}
                className="w-full py-3 bg-[#8C1D24] text-white font-sans text-xs uppercase tracking-widest rounded-lg hover:bg-[#6e161b] transition-colors"
              >
                Sign In Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload errors are logged silently — navigation already happened,
          so the user has their strip. No blocking modal. */}

      {/* Archiving / Uploading Overlay — shown on mobile too */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center gap-12 text-center"
            >
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-[1px] border-zinc-300/50 rounded-full border-t-[#8C1D24]"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-6 border-[1px] border-dashed border-zinc-300/30 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-[#8C1D24]/60"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tighter">
                  Archiving your <span className="text-[#8C1D24] italic font-normal">moment</span>
                </h3>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8C1D24] animate-ping" />
                  <p className="text-zinc-400 font-sans tracking-[0.3em] uppercase text-[12px] font-bold">Secure Cloud Synchronization</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input — multiple selection up to the chosen layout count */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        {sharedOverlays}
        <MobileCapture state={mobileState} />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={isUploading ? { opacity: 0, y: -80, filter: "blur(10px)" } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="capture-page relative w-full min-h-full flex flex-col items-center justify-start pt-[10vh] pb-10 bg-transparent will-change-transform"
    >
      {sharedOverlays}

      {/* Background — Soft ambient environment */}
      <div className="absolute inset-0">
        {/* Very subtle warm ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,_rgba(244,241,234,0.8)_0%,_rgba(0,0,0,0.03)_100%)]" />
        {/* Soft shadow from above (studio light feel) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/30 blur-[120px] rounded-full" />
      </div>

      {/* ═══════════════════════════════════════════════
          THE PHOTOBOOTH MACHINE INTERFACE
      ═══════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

        {/* ── Decorative Right-Side Control Panel ── */}
        <div 
          className="absolute right-[-60px] md:right-[-80px] top-1/2 -translate-y-1/2 z-[5] hidden md:flex flex-col items-center gap-6 py-8 px-3 rounded-2xl select-none pointer-events-none"
          style={{
            background: `linear-gradient(
              180deg,
              #e8e8e8 0%,
              #d0d0d0 30%,
              #c4c4c4 70%,
              #b8b8b8 100%
            )`,
            boxShadow: `
              inset 0 1px 2px rgba(255,255,255,0.6),
              inset 0 -1px 2px rgba(0,0,0,0.08),
              0 4px 16px rgba(0,0,0,0.1),
              0 1px 4px rgba(0,0,0,0.06)
            `,
            border: '1px solid rgba(255,255,255,0.4)',
          }}
        >
          {/* Brushed texture */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(0,0,0,0.12) 1px,
                transparent 2px
              )`
            }}
          />

          {/* Circular Capture Button */}
          <div className="relative">
            {/* Metallic ring */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, #d4d4d4, #a0a0a0)`,
                boxShadow: `
                  inset 0 1px 2px rgba(255,255,255,0.5),
                  0 2px 6px rgba(0,0,0,0.2)
                `,
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {/* Green button center */}
              <div 
                className="w-6 h-6 rounded-full"
                style={{
                  background: `radial-gradient(circle at 40% 35%, #6fcf6f 0%, #4caf50 50%, #388e3c 100%)`,
                  boxShadow: `
                    inset 0 1px 2px rgba(255,255,255,0.4),
                    0 1px 3px rgba(0,0,0,0.2)
                  `,
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
            </div>
          </div>

          {/* Vertical Coin / Print Slot */}
          <div 
            className="w-5 h-16 rounded-sm"
            style={{
              background: `linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)`,
              boxShadow: `
                inset 0 2px 4px rgba(0,0,0,0.6),
                0 1px 1px rgba(255,255,255,0.3)
              `,
              border: '1px solid rgba(0,0,0,0.3)',
            }}
          />

          {/* Small Rectangular Compartment */}
          <div 
            className="w-8 h-6 rounded-[3px]"
            style={{
              background: `linear-gradient(180deg, #b0b0b0 0%, #999 50%, #a8a8a8 100%)`,
              boxShadow: `
                inset 0 2px 3px rgba(0,0,0,0.25),
                0 1px 1px rgba(255,255,255,0.4)
              `,
              border: '1px solid rgba(0,0,0,0.12)',
            }}
          />

          {/* PHOTOS label */}
          <span 
            className="font-mono text-[6px] font-bold text-zinc-500/50 uppercase tracking-[0.15em] mt-1"
            style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
          >
            Photos
          </span>
        </div>

        {/* ── The Frame: Brushed Silver Metal ── */}
        <div 
          className="relative p-8 md:p-12 rounded-[48px] flex flex-col items-center"
          style={{
            background: `linear-gradient(
              165deg,
              #f0f0f0 0%,
              #d4d4d8 15%,
              #fafafa 30%,
              #a1a1aa 48%,
              #e4e4e7 62%,
              #d4d4d8 78%,
              #f0f0f0 100%
            )`,
            boxShadow: `
              inset 0 1px 3px rgba(255,255,255,0.9),
              inset 0 -1px 3px rgba(0,0,0,0.05),
              0 25px 80px rgba(0,0,0,0.12),
              0 8px 24px rgba(0,0,0,0.08)
            `,
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          {/* Frame highlight reflection (top edge) */}
          <div className="absolute inset-0 rounded-[48px] overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/[0.03]" />
          </div>

          {/* Brushed metal texture overlay */}
          <div 
            className="absolute inset-0 rounded-[48px] pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(0,0,0,0.15) 1px,
                transparent 2px
              )`
            }}
          />

          {/* ── Circular Price Badge (right side, raised above midpoint) ── */}
          <div
            className="absolute right-[-44px] md:right-[-56px] top-[28%] -translate-y-1/2 z-20 pointer-events-none select-none"
          >
            <div
              className="w-[78px] h-[78px] md:w-[96px] md:h-[96px] rounded-full flex flex-col items-center justify-center"
              style={{
                background: `radial-gradient(circle at 40% 35%, #FAFAF8 0%, #EDEBE6 60%, #E2E0DA 100%)`,
                boxShadow: `
                  0 3px 10px rgba(0,0,0,0.12),
                  0 1px 3px rgba(0,0,0,0.08),
                  inset 0 1px 2px rgba(255,255,255,0.7),
                  inset 0 -1px 2px rgba(0,0,0,0.04)
                `,
                border: '1px solid rgba(0,0,0,0.08)',
                transform: 'rotate(12deg)',
              }}
            >
              <span className="font-mono text-[13px] md:text-[15px] font-bold text-[#2A2A2A] leading-none tracking-tight">
                $0
              </span>
              <span className="font-sans text-[11px] md:text-[12px] font-semibold text-zinc-400 uppercase tracking-[0.15em] mt-0.5">
                = 4 Pics
              </span>
            </div>
          </div>
          
          {/* ── "Eye Level" alignment hint (Right Side) ── */}
          <div className="absolute right-[-92px] md:right-[-110px] top-[14%] z-10 flex flex-row-reverse items-center gap-2 pointer-events-none select-none">
            <span className="text-[14px] font-sans font-black text-zinc-950 uppercase tracking-[0.2em] drop-shadow-sm whitespace-nowrap">
              Eye level
            </span>
            <div className="flex items-center">
              <div className="w-6 h-[2px] bg-zinc-950 rounded-full" />
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="text-zinc-950 -ml-1">
                <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* ── Left Side Complementary Notch ── */}
          <div className="absolute left-[-20px] top-[38%] z-10 pointer-events-none">
            <div className="w-5 h-[2px] bg-zinc-950/20 rounded-full" />
          </div>

          {/* ── The "Screen" — Dark camera display ── */}
          <div
            className={`relative w-[min(92vw,340px)] md:w-[580px] aspect-[4/3] rounded-[20px] overflow-hidden flex flex-col items-center justify-center ${getTheme(themeId).livePreviewClass}`}
            style={{
              background: 'radial-gradient(circle at center, #E8E8E8 0%, #D4D4D8 40%, #A1A1AA 100%)',
              boxShadow: `
                inset 0 8px 32px rgba(0,0,0,0.2),
                inset 0 -2px 8px rgba(0,0,0,0.1),
                inset 2px 0 8px rgba(0,0,0,0.1),
                inset -2px 0 8px rgba(0,0,0,0.1),
                0 2px 4px rgba(0,0,0,0.1)
              `,
              border: '2px solid rgba(0,0,0,0.15)',
            }}
          >
            
            {/* Camera Preview Background — Fades in Smoothly. The wrapper
                hosts CSS-only overlay effects (grain texture, light leak),
                while the <video> itself receives the colour filter. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "capturing" ? 1 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`absolute inset-0 transition-all duration-500 ${getFilter(filterId).livePreviewClass ?? ""}`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
                style={{
                  filter: `brightness(0.7) contrast(1.1) saturate(0.9) ${
                    getFilter(filterId).cssFilter === "none" ? "" : getFilter(filterId).cssFilter
                  }`,
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>

            {/* Subtle scanline overlay for CRT feel */}
            <div 
              className="absolute inset-0 pointer-events-none z-[105] opacity-[0.04]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.4) 2px,
                  transparent 4px
                )`
              }}
            />



            {/* ── SCREEN CONTENT ── */}
            <div className="relative z-[110] flex flex-col items-center justify-center w-full h-full p-8 md:p-12">
              
              <AnimatePresence mode="wait">
                {phase === "capturing" && countdown === null ? (
                  <motion.div 
                    key="buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-5 w-full max-w-[280px] md:max-w-[320px]"
                  >
                    {/* ── Frame Selection Controls ── */}
                    <div className="flex items-center justify-between w-full px-2 mb-2">
                      <button 
                        onClick={() => setActiveLayout(activeLayout === 3 ? 4 : 3)}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-1.5 p-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                          {Array.from({ length: activeLayout }).map((_, i) => (
                            <div key={i} className="w-6 h-9 bg-zinc-700/60 rounded-[1px] border border-white/5" />
                          ))}
                        </div>
                        <span className="text-[12px] font-sans font-bold text-white/50 uppercase tracking-[0.3em]">
                          {activeLayout} Shots Strip
                        </span>
                      </div>

                      <button 
                        onClick={() => setActiveLayout(activeLayout === 3 ? 4 : 3)}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* ── Take Photo Button ── */}
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#d6d3ce' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startCountdown}
                      className="w-full flex items-center justify-between px-7 py-5 rounded-xl transition-all duration-200"
                      style={{
                        background: '#E8E6E1',
                        border: '1px solid rgba(58, 58, 58, 0.25)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.3)',
                      }}
                    >
                      <span className="font-sans text-[15px] font-medium text-[#2A2A2A] tracking-wide">
                        Take Photo
                      </span>
                      {/* Camera Icon */}
                      <svg className="w-5 h-5 text-[#3A3A3A]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                    </motion.button>

                    {/* ── Upload Photo Button ── */}
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#d6d3ce' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-between px-7 py-5 rounded-xl transition-all duration-200"
                      style={{
                        background: '#E8E6E1',
                        border: '1px solid rgba(58, 58, 58, 0.25)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.3)',
                      }}
                    >
                      <span className="font-sans text-[15px] font-medium text-[#2A2A2A] tracking-wide">
                        Upload {totalShots - capturedPhotos.length > 1 ? `${totalShots - capturedPhotos.length} Photos` : "Photo"}
                      </span>
                      {/* Upload Icon */}
                      <svg className="w-5 h-5 text-[#3A3A3A]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </motion.button>
                    
                    {/* Brand watermark */}
                    <div className="mt-5 flex items-center gap-1.5">
                       <span className="text-[12px] font-sans font-bold text-white/20 uppercase tracking-[0.4em]">your</span>
                       <span className="text-[12px] font-sans font-bold text-[#8C1D24]/40 uppercase tracking-[0.4em]">Archives</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-10"
                  >
                    {countdown !== null ? (
                      <div className="flex flex-col items-center gap-4">
                        <motion.span 
                          key={countdown}
                          initial={{ scale: 2.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="text-[120px] md:text-[160px] font-display font-black text-white italic leading-none"
                          style={{
                            textShadow: '0 10px 60px rgba(0,0,0,0.6), 0 0 120px rgba(140,29,36,0.2)',
                          }}
                        >
                          {countdown}
                        </motion.span>
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-zinc-400/80 font-sans tracking-[0.4em] uppercase text-[13px] font-medium"
                        >
                          Stay Perfect
                        </motion.span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <motion.div 
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center border border-white/5 shadow-2xl"
                        >
                          <div className="w-10 h-10 border-2 border-zinc-700 border-t-[#8C1D24] rounded-full animate-spin" />
                        </motion.div>
                        <span className="text-zinc-600 font-mono text-[12px] uppercase tracking-[0.4em] animate-pulse">Preparing Booth...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exposure Progress — bottom left of screen */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {Array.from({ length: totalShots }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        backgroundColor: i < currentShot ? "#8C1D24" : "rgba(255,255,255,0.08)",
                        width: i === currentShot ? "20px" : "6px"
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-1 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-zinc-600/60 uppercase tracking-[0.2em] pl-1">
                  {currentShot}/{totalShots}
                </span>
              </div>
            </div>

            {/* Screen glass reflection */}
            <div className="absolute inset-0 pointer-events-none z-[130]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
              <div className="absolute top-0 left-0 w-1/3 h-1/4 bg-gradient-to-br from-white/[0.04] to-transparent rounded-tl-[20px]" />
            </div>
          </div>

          {/* ── Countdown Duration — pill picker. Persisted to localStorage
              under `photobooth_countdown` and used by startCountdown(). ── */}
          <div className="mt-6 w-full max-w-[620px] md:max-w-[700px]">
            <p className="text-center font-sans text-[13px] uppercase tracking-[0.3em] text-zinc-500 mb-3">
              Countdown
            </p>
            <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Countdown duration">
              {([3, 5, 10] as const).map((sec) => {
                const selected = countdownSeconds === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCountdownSeconds(sec)}
                    className={`px-5 py-2 rounded-full font-sans text-xs uppercase tracking-widest transition-all ${
                      selected
                        ? "bg-zinc-950 text-white shadow-md"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Theme Picker — pretty card grid with mini-strip previews ── */}
          <div className="mt-8 w-full max-w-[620px] md:max-w-[720px]">
            {/* Ornamental section header */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-zinc-300" />
              <p className="font-sans text-[13px] uppercase tracking-[0.4em] text-zinc-600 font-bold">
                Strip Theme
              </p>
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-zinc-300" />
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-thin px-6 pt-3 pb-4 justify-start md:justify-center">
              {STRIP_THEMES.map((theme) => {
                const selected = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    aria-pressed={selected}
                    title={theme.description}
                    className={`group/theme flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ${
                      selected ? "scale-[1.08]" : "opacity-65 hover:opacity-100 hover:scale-[1.04]"
                    }`}
                  >
                    <div
                      className={`relative w-14 h-20 rounded-lg overflow-hidden ${theme.livePreviewClass} ${
                        selected
                          ? "shadow-[0_8px_20px_rgba(140,29,36,0.25),0_0_0_2px_#8C1D24,0_0_0_4px_rgba(255,255,255,0.95)]"
                          : "shadow-[0_3px_10px_rgba(0,0,0,0.08)]"
                      }`}
                      style={
                        theme.borderWidth > 0
                          ? { border: `${Math.max(1, theme.borderWidth / 4)}px solid ${theme.borderColor}` }
                          : undefined
                      }
                    >
                      {/* Mini strip mockup — three slim horizontal photo bands */}
                      <div className="absolute inset-1.5 flex flex-col gap-0.5">
                        <div className="flex-1 rounded-sm bg-black/35" />
                        <div className="flex-1 rounded-sm bg-black/35" />
                        <div className="flex-1 rounded-sm bg-black/35" />
                        <div
                          className="text-[5px] font-bold tracking-tight text-center leading-none pt-0.5"
                          style={{ fontFamily: theme.fontFamily, color: theme.fontColor }}
                        >
                          y<span className="italic" style={{ color: theme.accentColor }}>A</span>
                        </div>
                      </div>

                      {/* Subtle inner shine */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

                      {/* Selected checkmark badge */}
                      {selected && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#8C1D24] flex items-center justify-center shadow-md"
                          aria-hidden="true"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-sans text-[11px] uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
                        selected ? "text-zinc-900 font-bold" : "text-zinc-500 group-hover/theme:text-zinc-800"
                      }`}
                    >
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Filter Picker — polished gradient swatches ── */}
          <div className="mt-7 w-full max-w-[620px] md:max-w-[720px]">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-zinc-300" />
              <p className="font-sans text-[13px] uppercase tracking-[0.4em] text-zinc-600 font-bold">
                Photo Filter
              </p>
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-zinc-300" />
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-thin px-6 pt-3 pb-4 justify-start md:justify-center">
              {PHOTO_FILTERS.map((f) => {
                const selected = filterId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterId(f.id)}
                    aria-pressed={selected}
                    title={f.description}
                    className={`group/filter flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ${
                      selected ? "scale-[1.08]" : "opacity-65 hover:opacity-100 hover:scale-[1.04]"
                    }`}
                  >
                    <div
                      className={`relative w-14 h-14 rounded-xl overflow-hidden ${
                        selected
                          ? "shadow-[0_8px_20px_rgba(140,29,36,0.25),0_0_0_2px_#8C1D24,0_0_0_4px_rgba(255,255,255,0.95)]"
                          : "shadow-[0_3px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
                      } ${f.livePreviewClass ?? ""}`}
                      style={{
                        background: "linear-gradient(135deg, #f4c1a1 0%, #c87f5c 45%, #6b4938 100%)",
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          filter: f.cssFilter === "none" ? undefined : f.cssFilter,
                          background: "linear-gradient(135deg, #f4c1a1 0%, #c87f5c 45%, #6b4938 100%)",
                        }}
                      />
                      {/* Glossy highlight in the corner for that swatch feel */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />

                      {/* Selected checkmark badge */}
                      {selected && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#8C1D24] flex items-center justify-center shadow-md"
                          aria-hidden="true"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-sans text-[11px] uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
                        selected ? "text-zinc-900 font-bold" : "text-zinc-500 group-hover/filter:text-zinc-800"
                      }`}
                    >
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Machine Indicator Lights (below screen) ── */}
          <div className="mt-7 flex items-center gap-16 md:gap-28">
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-green-400/70 shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
               <span className="text-[12px] font-sans font-semibold text-zinc-500/70 uppercase tracking-[0.15em]">Optics Ready</span>
             </div>
             <div className="flex items-center gap-2.5">
               <motion.div 
                 animate={{ opacity: [0.3, 0.9, 0.3] }}
                 transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                 className="w-2 h-2 rounded-full bg-[#8C1D24]/70 shadow-[0_0_8px_rgba(140,29,36,0.3)]" 
                />
               <span className="text-[12px] font-sans font-semibold text-zinc-500/70 uppercase tracking-[0.15em]">Archives Sync</span>
             </div>
          </div>
        </div>

        {/* Soft shadow underneath the machine */}
        <div className="mt-[-16px] w-3/5 h-8 bg-black/[0.04] blur-2xl rounded-full" />

        {/* ── Instruction Panel ── */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 w-full max-w-[620px] md:max-w-[700px]"
        >
          <div
            className="grid grid-cols-3 rounded-2xl overflow-hidden"
            style={{
              background: '#F0EDE7',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.5)',
            }}
          >
            {/* Step 1 */}
            <div className="px-3 py-3 md:px-4 md:py-4 flex flex-col items-center text-center gap-3">
              <span className="w-7 h-7 rounded-full bg-zinc-300/60 flex items-center justify-center text-[13px] font-mono font-bold text-zinc-600 shadow-sm">1</span>
              <p className="text-[15px] md:text-[16px] leading-[1.6] font-sans text-zinc-700 font-bold tracking-tight">
                Choose B&W or color filters with the toggle switch
              </p>
            </div>

            {/* Step 2 */}
            <div 
              className="px-3 py-3 md:px-4 md:py-4 flex flex-col items-center text-center gap-3"
              style={{ borderLeft: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)' }}
            >
              <span className="w-7 h-7 rounded-full bg-zinc-300/60 flex items-center justify-center text-[13px] font-mono font-bold text-zinc-600 shadow-sm">2</span>
              <p className="text-[15px] md:text-[16px] leading-[1.6] font-sans text-zinc-700 font-bold tracking-tight">
                Choose a frame using the arrows on the sides and click the green button
              </p>
            </div>

            {/* Step 3 */}
            <div className="px-3 py-3 md:px-4 md:py-4 flex flex-col items-center text-center gap-3">
              <span className="w-7 h-7 rounded-full bg-zinc-300/60 flex items-center justify-center text-[13px] font-mono font-bold text-zinc-600 shadow-sm">3</span>
              <p className="text-[15px] md:text-[16px] leading-[1.6] font-sans text-zinc-700 font-bold tracking-tight">
                Press the green button to take photo and wait for them to be printed
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ PREPARATION OVERLAY ═══ */}
      <AnimatePresence>
        {phase === "prepare" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[200] bg-transparent backdrop-blur-3xl flex flex-col items-center justify-center p-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-5 text-center"
            >
              <h2 className="font-display text-6xl md:text-7xl font-bold text-zinc-900 tracking-tighter">
                Setting the <span className="text-[#8C1D24] italic font-normal">Scene</span>
              </h2>
              <div className="flex flex-col items-center gap-8">
                {error ? (
                  <div className="space-y-6 max-w-sm mx-auto text-center">
                    <p className="text-zinc-600 font-sans text-sm leading-relaxed">
                      {permissionDenied
                        ? "Camera permission was denied. To use the photobooth, allow camera access in your browser settings."
                        : error}
                    </p>

                    {permissionDenied && (
                      <details className="text-left bg-zinc-100 rounded-xl p-4 text-xs text-zinc-500 font-sans space-y-1">
                        <summary className="cursor-pointer font-bold text-zinc-700 mb-2">
                          How to enable camera access
                        </summary>
                        <p><strong>Chrome / Edge:</strong> Click the lock icon in the address bar → Camera → Allow.</p>
                        <p><strong>Firefox:</strong> Click the shield icon → Permissions → Allow Camera.</p>
                        <p><strong>Safari:</strong> Safari menu → Settings for This Website → Camera → Allow.</p>
                      </details>
                    )}

                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => setupCamera()}
                        className="px-8 py-4 bg-zinc-900 text-white rounded-full font-sans text-sm font-bold tracking-widest uppercase hover:bg-[#8C1D24] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
                      >
                        Try Camera Again
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-4 border border-zinc-300 text-zinc-700 rounded-full font-sans text-sm font-bold tracking-widest uppercase hover:border-zinc-500 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500"
                      >
                        Upload Photos Instead
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#8C1D24] animate-ping" />
                    <p className="text-zinc-400 font-sans tracking-[0.4em] uppercase text-[13px] font-bold">Initializing Camera</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
