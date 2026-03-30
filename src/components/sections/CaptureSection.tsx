"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CaptureSectionProps {
  layout: 3 | 4;
  onComplete: (data?: { reveal?: boolean; photos?: string[]; layout?: 3 | 4; filterMode?: "bw" | "color" }) => void;
}

export default function CaptureSection({ layout, onComplete }: CaptureSectionProps) {
  const [phase, setPhase] = useState<"prepare" | "capturing" | "completed" | "archiving">("prepare");
  const [currentShot, setCurrentShot] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFlash, setIsFlash] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"bw" | "color">("color");
  const [activeLayout, setActiveLayout] = useState<3 | 4>(layout);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalShots = activeLayout;

  // 1. Initial Camera Setup & Trigger Loop
  useEffect(() => {
    async function setupCamera() {
      try {
        // Try with ideal constraints first
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }).catch(async (e) => {
          console.warn("Retrying with simple constraints due to error:", e);
          // Fallback to simplest possible constraints
          return await navigator.mediaDevices.getUserMedia({ video: true });
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Wait for video to be ready before transitioning
          videoRef.current.onloadedmetadata = () => {
            setTimeout(() => {
              setPhase("capturing");
            }, 800);
          };
        } else {
          // Fallback if ref is missing
          setTimeout(() => setPhase("capturing"), 1500);
        }

      } catch (err: unknown) {
        console.error("Camera access failed:", err);
        setError((err instanceof Error && err.name === 'NotAllowedError') ? "Camera access was denied. Please check your browser permissions." : "Could not connect to the camera.");
        // We stay in 'prepare' phase but the UI will show the error
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 200);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Apply B&W filter if active
      if (filterMode === "bw") {
        ctx.filter = "grayscale(100%) contrast(1.1)";
      } else {
        ctx.filter = "none";
      }
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      
      const newPhotos = [...capturedPhotos, dataUrl];
      setCapturedPhotos(newPhotos);
      const nextShot = currentShot + 1;
      setCurrentShot(nextShot);

      if (nextShot >= totalShots) {
        // Explicitly set phase to completed to lock further triggers
        setPhase("completed");
        handleCaptureComplete(newPhotos);
      }
    }
  };

  const startCountdown = () => {
    // Safety guard: only start if we are in capturing phase and haven't reached limit
    if (phase !== "capturing" || currentShot >= totalShots) return;

    setCountdown(3);
    
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

  const handleCaptureComplete = async (photos: string[]) => {
    // Immediate stop visual feedback
    setTimeout(async () => {
      setPhase("archiving");
      setIsUploading(true);
      
      console.log("Starting backend upload for", photos.length, "photos...");
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            images: photos,
            layout: layout,
            timestamp: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Upload successful:", result);
        
        // Final transition with reveal trigger and photo data
        onComplete({ 
          reveal: true, 
          photos, 
          layout: activeLayout, 
          filterMode 
        });
      } catch (err) {
        console.error("Backend upload error:", err);
        // In a real app, we might show an error state and allow retry
        // For now, we'll wait a bit and still complete to not block the user flow
        await new Promise(resolve => setTimeout(resolve, 3000));
        onComplete({ 
          reveal: true, 
          photos, 
          layout: activeLayout, 
          filterMode 
        });
      }
    }, 1200); 
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newPhotos = [...capturedPhotos, dataUrl];
        setCapturedPhotos(newPhotos);
        const nextShot = currentShot + 1;
        setCurrentShot(nextShot);

        if (nextShot >= totalShots) {
          setPhase("completed");
          handleCaptureComplete(newPhotos);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={isUploading ? { opacity: 0, y: -80, filter: "blur(10px)" } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="relative w-full h-full flex flex-col items-center justify-start pt-[5vh] md:pt-[6vh] bg-transparent overflow-hidden will-change-transform"
    >
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

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

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

          {/* ── Circular Price Badge (right side) ── */}
          <div 
            className="absolute right-[-28px] md:right-[-36px] top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none"
          >
            <div
              className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex flex-col items-center justify-center"
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
              <span className="font-sans text-[7px] md:text-[8px] font-semibold text-zinc-400 uppercase tracking-[0.15em] mt-0.5">
                = 4 Pics
              </span>
            </div>
          </div>
          
          {/* ── "Eye Level" alignment hint (Right Side) ── */}
          <div className="absolute right-[-48px] md:right-[-56px] top-[38%] z-10 flex flex-row-reverse items-center gap-2 pointer-events-none select-none">
            <span className="text-[10px] font-sans font-black text-zinc-950 uppercase tracking-[0.2em] drop-shadow-sm">
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
            className="relative w-[340px] md:w-[580px] aspect-[4/3] rounded-[20px] overflow-hidden flex flex-col items-center justify-center"
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
            
            {/* Camera Preview Background - Fades in Smoothly */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "capturing" ? 1 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`absolute inset-0 transition-all duration-500 ${filterMode === "bw" ? "grayscale contrast-110" : ""}`}
            >
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover scale-x-[-1] filter brightness-[0.7] contrast-[1.1] saturate-[0.9]"
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
                        <span className="text-[9px] font-sans font-bold text-white/50 uppercase tracking-[0.3em]">
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
                        Upload Photo
                      </span>
                      {/* Upload Icon */}
                      <svg className="w-5 h-5 text-[#3A3A3A]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </motion.button>
                    
                    {/* Brand watermark */}
                    <div className="mt-5 flex items-center gap-1.5">
                       <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-[0.4em]">your</span>
                       <span className="text-[9px] font-sans font-bold text-[#8C1D24]/40 uppercase tracking-[0.4em]">Archives</span>
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
                          className="text-zinc-400/80 font-sans tracking-[0.4em] uppercase text-[10px] font-medium"
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
                        <span className="text-zinc-600 font-mono text-[9px] uppercase tracking-[0.4em] animate-pulse">Preparing Booth...</span>
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
                <span className="text-[8px] font-mono text-zinc-600/60 uppercase tracking-[0.2em] pl-1">
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

          {/* ── Filter Toggle: B&W / Color ── */}
          <div className="mt-6 flex items-center gap-4">
            {/* B&W Label */}
            <span 
              className={`text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-colors duration-300 cursor-pointer ${
                filterMode === "bw" ? "text-zinc-800" : "text-zinc-400/60"
              }`}
              onClick={() => setFilterMode("bw")}
            >
              B&W
            </span>

            {/* Toggle Switch — Vintage Metallic Style */}
            <button
              onClick={() => setFilterMode(filterMode === "bw" ? "color" : "bw")}
              className="relative w-[52px] h-[24px] rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(
                  180deg,
                  #b8b8b8 0%,
                  #d4d4d4 40%,
                  #c0c0c0 100%
                )`,
                boxShadow: `
                  inset 0 2px 4px rgba(0,0,0,0.2),
                  inset 0 -1px 2px rgba(255,255,255,0.3),
                  0 1px 3px rgba(0,0,0,0.1)
                `,
                border: '1px solid rgba(0,0,0,0.12)',
              }}
              aria-label={`Filter mode: ${filterMode}. Click to toggle.`}
            >
              {/* Track groove */}
              <div 
                className="absolute inset-[3px] rounded-full"
                style={{
                  background: `linear-gradient(
                    180deg,
                    #9a9a9a 0%,
                    #b0b0b0 50%,
                    #a8a8a8 100%
                  )`,
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
                }}
              />
              {/* Sliding Knob */}
              <motion.div
                animate={{ 
                  x: filterMode === "color" ? 28 : 0,
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  mass: 0.8
                }}
                className="absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full"
                style={{
                  background: `linear-gradient(
                    145deg,
                    #f5f5f5 0%,
                    #e0e0e0 30%,
                    #d0d0d0 70%,
                    #c8c8c8 100%
                  )`,
                  boxShadow: `
                    0 1px 4px rgba(0,0,0,0.3),
                    0 0 1px rgba(0,0,0,0.2),
                    inset 0 1px 1px rgba(255,255,255,0.8)
                  `,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {/* Knob grip line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[6px] h-[1px] bg-zinc-400/40 rounded-full" />
                </div>
              </motion.div>
            </button>

            {/* Color Label */}
            <span 
              className={`text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-colors duration-300 cursor-pointer ${
                filterMode === "color" ? "text-zinc-800" : "text-zinc-400/60"
              }`}
              onClick={() => setFilterMode("color")}
            >
              Color
            </span>
          </div>

          {/* ── Machine Indicator Lights (below screen) ── */}
          <div className="mt-7 flex items-center gap-16 md:gap-28">
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-green-400/70 shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
               <span className="text-[8px] font-sans font-semibold text-zinc-500/70 uppercase tracking-[0.15em]">Optics Ready</span>
             </div>
             <div className="flex items-center gap-2.5">
               <motion.div 
                 animate={{ opacity: [0.3, 0.9, 0.3] }}
                 transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                 className="w-2 h-2 rounded-full bg-[#8C1D24]/70 shadow-[0_0_8px_rgba(140,29,36,0.3)]" 
                />
               <span className="text-[8px] font-sans font-semibold text-zinc-500/70 uppercase tracking-[0.15em]">Archives Sync</span>
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
              <span className="w-6 h-6 rounded-full bg-zinc-300/60 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-600 shadow-sm">1</span>
              <p className="text-[13px] md:text-[14px] leading-[1.6] font-sans text-zinc-600 font-bold tracking-tight">
                Choose B&W or color filters with the toggle switch
              </p>
            </div>

            {/* Step 2 */}
            <div 
              className="px-3 py-3 md:px-4 md:py-4 flex flex-col items-center text-center gap-3"
              style={{ borderLeft: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)' }}
            >
              <span className="w-6 h-6 rounded-full bg-zinc-300/60 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-600 shadow-sm">2</span>
              <p className="text-[13px] md:text-[14px] leading-[1.6] font-sans text-zinc-600 font-bold tracking-tight">
                Choose a frame using the arrows on the sides and click the green button
              </p>
            </div>

            {/* Step 3 */}
            <div className="px-3 py-3 md:px-4 md:py-4 flex flex-col items-center text-center gap-3">
              <span className="w-6 h-6 rounded-full bg-zinc-300/60 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-600 shadow-sm">3</span>
              <p className="text-[13px] md:text-[14px] leading-[1.6] font-sans text-zinc-600 font-bold tracking-tight">
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
                  <div className="space-y-6">
                    <p className="text-zinc-500 font-sans text-sm max-w-md mx-auto">{error}</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-4 bg-zinc-900 text-white rounded-full font-sans text-sm font-bold tracking-widest uppercase hover:bg-[#8C1D24] transition-colors"
                    >
                      Upload Photos Instead
                    </button>
                    <button 
                      onClick={() => window.location.reload()}
                      className="block mx-auto text-zinc-400 text-xs hover:text-zinc-600 underline"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#8C1D24] animate-ping" />
                    <p className="text-zinc-400 font-sans tracking-[0.4em] uppercase text-[10px] font-bold">Initializing Camera</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ARCHIVING / UPLOADING OVERLAY ═══ */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] bg-transparent backdrop-blur-3xl flex flex-col items-center justify-center p-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center gap-12 text-center"
            >
              <div className="relative w-40 h-40">
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
                <h3 className="font-display text-4xl md:text-5xl font-bold text-zinc-900 tracking-tighter">
                  Archiving your <span className="text-[#8C1D24] italic font-normal">moment</span>
                </h3>
                <div className="flex items-center justify-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#8C1D24] animate-ping" />
                   <p className="text-zinc-500 font-sans tracking-[0.3em] uppercase text-[9px] font-bold">Secure Cloud Synchronization</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
