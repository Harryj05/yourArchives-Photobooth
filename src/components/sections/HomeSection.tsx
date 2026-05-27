import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Button from "@/components/Button";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_THEME_ID, getTheme, type ThemeId } from "@/lib/themes";
import { DEFAULT_FILTER_ID, getFilter, type FilterId } from "@/lib/filters";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileHome from "@/components/sections/MobileHome";

interface HomeSectionProps {
  onNavigate: (section: string, data?: Record<string, unknown>) => void;
  forceReveal?: boolean;
  capturedPhotos?: string[];
  capturedLayout?: 3 | 4;
  capturedFilter?: FilterId;
  capturedSessionId?: number | null;
  capturedTheme?: ThemeId;
}

export default function HomeSection({
  onNavigate,
  forceReveal = false,
  capturedPhotos = [],
  capturedLayout = 3,
  capturedFilter = DEFAULT_FILTER_ID,
  capturedSessionId = null,
  capturedTheme = DEFAULT_THEME_ID,
}: HomeSectionProps) {
  const theme = getTheme(capturedTheme);
  const photoFilter = getFilter(capturedFilter);
  const [, setIsTriggered] = useState(forceReveal);

  // Printing Animation State
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSlotDetailOpen, setIsSlotDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [switchState, setSwitchState] = useState<'neutral' | 'collect' | 'print'>('neutral');

  // 1. Entrance Animation Trigger (Only if not returning from capture)
  useEffect(() => {
    if (capturedPhotos.length === 0) {
      const timer = setTimeout(() => setIsTriggered(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [capturedPhotos.length]);

  // 1b. Print Delivery Trigger (When returning from capture)
  useEffect(() => {
    if (capturedPhotos.length > 0) {
      // Immediately open the details view and mark as printed for layoutId return
      setIsPrinting(true);
      setIsSlotDetailOpen(true);
    }
  }, [capturedPhotos.length]);

  // 2. Camera Permission Monitor (Non-active)
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });

        const handleStatusChange = () => {
          if (status.state === 'granted') {
            console.log("Camera permission ready.");
          }
        };

        handleStatusChange();
        status.onchange = handleStatusChange;

      } catch (err) {
        console.warn("Permissions API not supported or failed:", err);
      }
    };

    checkPermission();
  }, []);

  const [transitionStage, setTransitionStage] = useState<"landing" | "zooming">("landing");
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);

  // Download Logic
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const CANVAS_WIDTH = 600;
      const PADDING = 12; // Corresponding to px-0.5
      const INNER_WIDTH = CANVAS_WIDTH - (PADDING * 2);
      const PHOTO_HEIGHT = INNER_WIDTH; // Perfect Square
      const GAP = 4; // Tight spacing
      const FOOTER_HEIGHT = 120;
      
      const CANVAS_HEIGHT = PADDING + (capturedLayout * PHOTO_HEIGHT) + ((capturedLayout - 1) * GAP) + FOOTER_HEIGHT;

      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      // Themed background
      ctx.fillStyle = theme.backgroundColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          // Use window.Image — `Image` in this scope is the next/image component.
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // `object-fit: cover` for canvas — center-crops the source image to
      // fill the slot without distorting its aspect ratio. Prevents the
      // squished look that drawImage(img, x, y, w, h) produces when the
      // photo's native ratio differs from the (square) slot.
      const drawCover = (
        image: HTMLImageElement,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
      ) => {
        const imgRatio = image.naturalWidth / image.naturalHeight;
        const slotRatio = dw / dh;
        let sx: number, sy: number, sw: number, sh: number;
        if (imgRatio > slotRatio) {
          // image is wider than the slot → crop the sides
          sh = image.naturalHeight;
          sw = sh * slotRatio;
          sx = (image.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          // image is taller than the slot → crop top/bottom
          sw = image.naturalWidth;
          sh = sw / slotRatio;
          sx = 0;
          sy = (image.naturalHeight - sh) / 2;
        }
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      };

      for (let i = 0; i < capturedLayout; i++) {
        if (!capturedPhotos[i]) continue;
        const yPos = PADDING + (i * (PHOTO_HEIGHT + GAP));
        // Filter is already baked into the captured data URL at takeSnapshot
        // time, so we just draw the photo as-is — but center-cropped to
        // preserve aspect ratio.
        const img = await loadImage(capturedPhotos[i]);
        drawCover(img, PADDING, yPos, INNER_WIDTH, PHOTO_HEIGHT);

        // Themed border around each photo
        if (theme.borderWidth > 0) {
          ctx.lineWidth = theme.borderWidth;
          ctx.strokeStyle = theme.borderColor;
          ctx.strokeRect(
            PADDING + theme.borderWidth / 2,
            yPos + theme.borderWidth / 2,
            INNER_WIDTH - theme.borderWidth,
            PHOTO_HEIGHT - theme.borderWidth,
          );
        }
      }

      // Themed overlay effect
      if (theme.overlayEffect === "vignette") {
        const grad = ctx.createRadialGradient(
          CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
          CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.75,
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else if (theme.overlayEffect === "grain") {
        ctx.save();
        ctx.globalAlpha = 0.08;
        for (let n = 0; n < 1800; n++) {
          ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
          ctx.fillRect(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT,
            1, 1,
          );
        }
        ctx.restore();
      } else if (theme.overlayEffect === "glow") {
        ctx.save();
        ctx.shadowColor = theme.accentColor;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.accentColor;
        ctx.strokeRect(3, 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - 6);
        ctx.restore();
      }

      const footerY = CANVAS_HEIGHT - (FOOTER_HEIGHT / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const text1 = "your";
      const text2 = "Archives";

      ctx.font = `bold 28px ${theme.fontFamily}`;
      const width1 = ctx.measureText(text1).width;
      ctx.font = `italic 300 28px ${theme.fontFamily}`;
      const width2 = ctx.measureText(text2).width;

      const totalWidth = width1 + width2;
      const startX = (CANVAS_WIDTH - totalWidth) / 2;

      ctx.fillStyle = theme.fontColor;
      ctx.font = `bold 28px ${theme.fontFamily}`;
      ctx.fillText(text1, startX + (width1 / 2), footerY);

      ctx.fillStyle = theme.accentColor;
      ctx.font = `italic 300 28px ${theme.fontFamily}`;
      ctx.fillText(text2, startX + width1 + (width2 / 2), footerY);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `yourArchives-strip-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating download:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [capturedPhotos, capturedLayout, theme]);

  // Toggle Switch Actions
  useEffect(() => {
    if (switchState === "collect") {
      handleDownload();
      const timer = setTimeout(() => setSwitchState("neutral"), 1000);
      return () => clearTimeout(timer);
    } else if (switchState === "print") {
      window.print();
      const timer = setTimeout(() => setSwitchState("neutral"), 1000);
      return () => clearTimeout(timer);
    }
  }, [switchState, handleDownload]);

  const startTransition = async () => {
    // Phase 1: Open the Velvet Curtain Immediately
    setIsCurtainOpen(true);

    // Phase 2: Start Cinematic Zoom into the interface after the curtain is mostly open
    setTimeout(() => {
      setTransitionStage("zooming");
    }, 1000); 

    // Phase 3: Final hand-off navigate smoothly after the 0.8s zoom duration
    setTimeout(() => {
      onNavigate("create", { layout: 3 });
    }, 1800);
  };

  const handleSlotClick = () => {
    if (capturedPhotos.length === 0) return;
    setIsSlotDetailOpen(true);
  };

  // Viewport-driven swap. The desktop diorama (chamber + curtain + delivery
  // slot) is far too dense to scale down to a 375 px phone — we render a
  // clean branded landing instead, and the slot detail overlay (which IS
  // mobile-friendly) opens via tap on the captured-strip thumbnail.
  const isMobile = useIsMobile(768);

  if (isMobile && !isSlotDetailOpen) {
    return (
      <MobileHome
        onEnterBooth={() => onNavigate("create", { layout: 3 })}
        capturedPhotos={capturedPhotos}
        onOpenSlot={capturedPhotos.length > 0 ? handleSlotClick : undefined}
      />
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent">
      {/* Cinematic Vignette Overlay */}
      <motion.div 
        animate={{ opacity: transitionStage === "zooming" ? 1 : 0 }}
        className="absolute inset-0 cinematic-vignette opacity-0 z-[60] pointer-events-none"
      />

      {/* 1. Landing & Zooming Environment */}
      <motion.div
        animate={{
          scale: isSlotDetailOpen ? 3 : (transitionStage === "zooming" ? 2.5 : 1),
          x: isSlotDetailOpen ? "25%" : (transitionStage === "zooming" ? "-5%" : "0%"),
          y: isSlotDetailOpen ? "-20%" : (transitionStage === "zooming" ? "5%" : "0%"),
          opacity: isSlotDetailOpen ? 0 : 1,
          filter: isSlotDetailOpen ? "blur(8px)" : "blur(0px)"
        }}
        transition={{ 
          duration: isSlotDetailOpen ? 0.8 : 0.8, // Snappier duration aligned with navigation
          ease: [0.22, 1, 0.36, 1] // Luxury high-smoothness easement
        }}
        className="absolute inset-0 flex flex-col items-center justify-center z-10 will-change-transform"
      >
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay film-grain z-0" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/5 aspect-[4/3] gallery-glow pointer-events-none" />

        <div className="relative flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-[1px] relative z-20"
          >
            <div className="photos-sign-retro px-16 py-4 flex items-center justify-center">
              <div className="font-sans text-3xl md:text-5xl font-[1000] tracking-[-0.04em] px-8 leading-none border-x-[10px] border-zinc-950 flex items-center justify-center">
                <span className="text-[#8C1D24] uppercase">PHOTOBOOTH</span>
              </div>
            </div>
          </motion.div>

          {/* Realistic Three-Panel Cabinet */}
          <motion.div
            animate={{ 
              scale: transitionStage === "zooming" ? 1.05 : 1,
              boxShadow: transitionStage === "zooming" 
                ? "0 40px 80px rgba(0,0,0,0.2)"
                : "0 80px 160px rgba(0,0,0,0.4)" 
            }}
            transition={{ duration: 0.8 }}
            className="relative w-[min(95vw,780px)] aspect-[1.2/1] rounded-[1px] flex overflow-hidden group cursor-default border-t-[4px] border-zinc-200 will-change-transform"
          >
            {/* Left Panel: Mirrored Silver with Photo Delivery (More prominent) */}
            <div className="w-[46%] h-full relative flex flex-col items-center py-12 px-2 md:px-6 border-r border-zinc-950/20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)_inset]">
              {/* Metallic Brushed Texture */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />

              {/* ── Branding Silver Box ── */}
              <div 
                className="w-full py-6 px-8 z-20 flex items-center justify-center mb-6 mt-16"
                style={{
                  background: 'linear-gradient(135deg, #f0f0f0 0%, #d8d8d8 45%, #b0b0b0 55%, #c0c0c0 100%)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.9)',
                  border: '1px solid #999',
                  borderRadius: '2px'
                }}
              >
                <div className="flex items-center font-display text-[22px] font-extrabold tracking-tight leading-none text-zinc-900 drop-shadow-sm">
                  <span>your</span>
                  <span className="text-[#8C1D24] italic font-light ml-0.5">Archives</span>
                </div>
              </div>

              {/* ── Brushed Metal Plaque ── */}
              <div
                className="w-[40%] flex flex-col items-center justify-center text-center mt-2 z-20 py-3 px-2"
                style={{
                  background: 'linear-gradient(135deg, #e5e5e5 0%, #b8b8b8 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.7)',
                  border: '1px solid #888'
                }}
              >
                <span className="text-[7px] font-sans font-black text-black tracking-[0.25em] leading-[1.6] uppercase mb-2">
                  Photos<br/>Delivered<br/>Here
                </span>
                <div className="w-10 h-[1px] bg-black/20 mb-2" />
                <div className="mt-1 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-black/70" />
              </div>

              <div
                className="mt-2 w-[40%] aspect-[7/10] relative z-20 p-[10px]"
                style={{
                  background: 'linear-gradient(90deg, #f0f0f0 0%, #ffffff 15%, #d0d0d0 85%, #b0b0b0 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.9)',
                  border: '1px solid #888'
                }}
              >
                <div 
                  className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex justify-center"
                  style={{ boxShadow: 'inset 0 15px 25px rgba(0,0,0,1)' }}
                >
                  <AnimatePresence>
                    {isPrinting && capturedPhotos.length > 0 && !isSlotDetailOpen && (
                      <motion.div
                        initial={{ y: -300, rotateZ: 15, x: 30, opacity: 0 }}
                        animate={{ y: 40, rotateZ: -25, x: -15, scale: 1, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        transition={{
                          type: "spring",
                          stiffness: 70,
                          damping: 12,
                          delay: 0.6,
                        }}
                        onClick={(e) => { e.stopPropagation(); handleSlotClick(); }}
                        className="absolute w-[32%] p-1 bg-white flex flex-col overflow-hidden cursor-pointer hover:scale-[1.1] z-10"
                        style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.9)', aspectRatio: capturedLayout === 3 ? "1/3.5" : "1/4.5" }}
                      >
                        <div className="flex-1 flex flex-col gap-1.5">
                          {Array.from({ length: capturedLayout }).map((_, i) => (
                            <div key={i} className="relative aspect-square bg-zinc-700/50 overflow-hidden">
                              {capturedPhotos[i] ? (
                                <Image
                                  src={capturedPhotos[i]}
                                  alt={`Pose ${i + 1}`}
                                  fill
                                  unoptimized
                                  sizes="120px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                        <div className="h-4 w-full flex items-center justify-center mt-auto">
                          <span className="font-display text-[5px] font-bold text-vintage-black">
                            your<span className="text-vintage-red italic font-light">Archives</span>
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* T-Lever Graphic */}
                  <div className="absolute inset-x-0 bottom-0 h-[75%] flex flex-col items-center z-20 pointer-events-none">
                    <div className="relative w-[90%] h-1.5 rounded-full z-10" style={{ background: 'linear-gradient(180deg, #9ca3af, #ffffff, #4b5563)' }} />
                    <div className="relative w-1.5 h-full -mt-0.5 rounded-b-full shadow-lg" style={{ background: 'linear-gradient(90deg, #4b5563, #ffffff, #374151)' }} />
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-10 kick-plate" />
            </div>

            {/* Middle Opening: Entrance with Interior Perspective */}
            <div
              className="w-[34%] h-full bg-[#1a0506] relative overflow-hidden cursor-default"
              onClick={() => {
                if (transitionStage === "landing") {
                  setIsCurtainOpen(!isCurtainOpen);
                }
              }}
            >


              {/* Internal Textured Wall */}
              <div className="absolute inset-0 bg-[#8C1D24] opacity-90 velvet-curtain" />
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
              <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />
              
              {/* Realistic Tapered Stool - Tucked to the right, half-visible */}
              <div className="absolute bottom-[3%] right-[-12%] w-[38%] z-10 flex flex-col items-center">
                <div className="w-[72%] h-2 bg-gradient-to-b from-zinc-400 via-zinc-200 to-zinc-900 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20" />
                <div className="w-[10%] h-[30%] bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-950 mx-auto -mt-0.5" style={{ minHeight: '2rem' }} />
                <div
                  className="w-[72%] aspect-[5/6] bg-[#F4F1EA] mx-auto border-x-2 border-zinc-400 relative"
                  style={{
                    clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
                    background: 'linear-gradient(135deg, #F4F1EA 0%, #e0ddd5 100%)',
                    boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* The Velvet Curtain */}
              <motion.div
                className="absolute inset-0 bg-[#8C1D24] z-20 border-r border-black/40 shadow-2xl origin-left overflow-hidden"
                animate={{ scaleX: isCurtainOpen ? 0.2 : 1, x: isCurtainOpen ? "-10%" : "0%" }}
                transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
                onClick={(e) => { e.stopPropagation(); setIsCurtainOpen(!isCurtainOpen); }}
              >
                <div className="absolute inset-0 flex">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-full flex-1 border-r border-black/10"
                      style={{ background: `linear-gradient(90deg, transparent, rgba(0,0,0,${0.1 + (i * 0.05)}), transparent)` }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.1)_21px,transparent_42px)] opacity-30" />
              </motion.div>

              <div className="absolute inset-x-0 bottom-0 h-10 bg-zinc-900 border-t border-zinc-950" />
            </div>

            {/* Right Panel: Synchronized Chrome Effect */}
            <div className="w-[20%] h-full relative border-l border-zinc-950/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)_inset]">
              {/* Metallic Brushed Texture (Sync with Left) */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10 pointer-events-none" />
              
              <div className="absolute inset-x-0 bottom-0 h-10 kick-plate" />
            </div>
          </motion.div>

          <div className="mt-12 h-20 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {capturedPhotos.length === 0 && (
                <motion.div key="enter-booth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button 
                    variant="glow" 
                    onClick={startTransition} 
                    className="group relative px-12 py-5 text-xl bg-[#8C1D24] hover:bg-[#4A0F14] shadow-2xl tracking-[0.2em] uppercase font-bold overflow-hidden"
                  >
                    {/* Animated Shimmer Overlay */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                    Enter Booth
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Output Slot Detail Overlay */}
      <AnimatePresence>
        {isSlotDetailOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ 
              opacity: 1, 
              backdropFilter: "blur(10px)",
              background: 'radial-gradient(circle at center, #F5F5F5 0%, #C8C8C8 60%, #B0B0B0 100%)'
            }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          >
            <div className="relative w-full flex flex-col items-center justify-center h-full px-8 md:px-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center w-full max-w-4xl"
              >
                {/* ── Main Row: Photostrip (center anchor) + Toggle (right, vertically centered) ── */}
                {/* On phones the toggle stacks below the strip; on desktop it sits beside it. */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full">

                  {/* ── Photostrip Column (primary center anchor) ── */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    {/* Header — aligned to photostrip center axis */}
                    <div 
                      className="w-[min(85vw,280px)] md:w-[320px] py-6 px-4 mb-4 flex flex-col items-center justify-center text-center border border-zinc-400/50"
                      style={{
                        background: 'linear-gradient(135deg, #f0f0f0 0%, #d8d8d8 45%, #b0b0b0 55%, #c0c0c0 100%)',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.9)',
                        borderRadius: '2px'
                      }}
                    >
                      <span className="text-[16px] font-sans font-black text-zinc-900 tracking-[0.35em] leading-tight uppercase">
                        Photos Delivered Here
                      </span>
                      <div className="w-10 h-[1.5px] bg-zinc-800/20 mt-3 rounded-full" />
                      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[11px] border-l-transparent border-r-transparent border-t-zinc-800 mt-3" />
                    </div>

                    {/* Photostrip Box */}
                    <div
                      className="w-[min(85vw,280px)] md:w-[320px] h-[min(70vh,480px)] md:h-[540px] relative p-3 border-[2px] border-zinc-400 rounded-[4px] flex items-center justify-center cursor-default"
                      style={{ 
                        background: 'linear-gradient(90deg, #f0f0f0, #ffffff 15%, #d0d0d0 85%, #b0b0b0)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    >
                      {/* Inner Cavity */}
                      <div 
                        className="w-full h-full relative overflow-hidden flex items-center justify-center p-2"
                        style={{ 
                          background: 'linear-gradient(135deg, #d8d8d8, #f5f5f5 50%, #d8d8d8)',
                          boxShadow: 'inset 0 10px 25px rgba(0,0,0,0.15)',
                          perspective: 1000
                        }}
                      >
                          <motion.div
                            initial={{ y: -350, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 70,
                              damping: 16,
                              mass: 1,
                              delay: 0.15,
                            }}
                            className={`h-[94%] w-auto px-0.5 py-1.5 flex flex-col relative overflow-hidden ${theme.livePreviewClass}`}
                            style={{
                              aspectRatio: capturedLayout === 3 ? "2/7" : "2/9",
                              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.2)',
                              border: theme.borderWidth > 0 ? `${Math.max(1, theme.borderWidth / 3)}px solid ${theme.borderColor}` : '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                          {/* Paper Texture */}
                          <div 
                            className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-15"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                          />
                          
                          <div className="flex-1 flex flex-col gap-0.5">
                            {Array.from({ length: capturedLayout }).map((_, i) => (
                              <div key={i} className="relative w-full aspect-square bg-zinc-900 overflow-hidden shadow-inner">
                                {capturedPhotos[i] ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- src is a base64 data URL; next/image does not support data: URIs
                                  <motion.img
                                    initial={{ opacity: 0, filter: "brightness(2)" }}
                                    animate={{ opacity: 1, filter: "brightness(1)" }}
                                    transition={{ duration: 1.5, delay: 0.4 + (i * 0.1), ease: "easeOut" }}
                                    src={capturedPhotos[i]}
                                    className="w-full h-full object-cover brightness-[1.05] contrast-[1.1]"
                                    alt={`Shot ${i + 1}`}
                                  />
                                ) : null}
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
                              </div>
                            ))}
                            <div
                              className="mt-auto pt-4 pb-1 w-full flex items-center justify-center text-sm font-bold tracking-tight"
                              style={{ fontFamily: theme.fontFamily, color: theme.fontColor }}
                            >
                              your
                              <span className="italic ml-0.5" style={{ color: theme.accentColor }}>
                                Archives
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* ── Bottom Buttons — strictly centered relative to photostrip box ── */}
                    <div className="mt-8 flex flex-col items-center gap-3 w-full">
                      <div className="flex flex-row items-center justify-center gap-4 w-full flex-wrap">
                        <Button variant="primary" onClick={handleDownload} disabled={isDownloading} className="px-8 py-4 bg-zinc-950 text-white rounded-xl text-[13px] font-bold uppercase tracking-widest whitespace-nowrap min-w-[160px]">
                          {isDownloading ? "Generating..." : "Collect Strip"}
                        </Button>
                        <Button variant="primary" onClick={() => { window.location.href = capturedSessionId != null ? "/vault" : "/auth/login?redirect=/vault"; }} className="px-8 py-4 bg-emerald-700 text-white rounded-xl text-[13px] font-bold uppercase tracking-widest whitespace-nowrap min-w-[160px] inline-flex items-center justify-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                          Save to Vault
                        </Button>
                        <Button variant="glow" onClick={() => { setIsSlotDetailOpen(false); setTransitionStage("landing"); onNavigate("create", { layout: capturedLayout }); }} className="px-8 py-4 bg-[#8C1D24] text-white rounded-xl text-[13px] font-bold uppercase tracking-widest whitespace-nowrap min-w-[160px]">
                          Retake Photos
                        </Button>
                      </div>
                      <p className="font-sans text-[13px] uppercase tracking-[0.3em] text-zinc-500">
                        Theme · <span className="text-zinc-900 font-bold">{theme.name}</span>
                        <span className="mx-2 text-zinc-300">|</span>
                        Filter · <span className="text-zinc-900 font-bold">{photoFilter.label}</span>
                      </p>
                      {capturedSessionId != null && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 font-sans text-[13px] uppercase tracking-[0.3em] text-emerald-700">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            Saved to Your Vault
                          </div>
                          <div className="flex items-center gap-5">
                            <a
                              href={`/archive/${capturedSessionId}`}
                              className="font-sans text-[13px] uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 transition-colors underline-offset-4 hover:underline"
                            >
                              View Strip
                            </a>
                            <span className="w-px h-4 bg-zinc-300" />
                            <a
                              href="/vault"
                              className="font-sans text-[13px] uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 transition-colors underline-offset-4 hover:underline"
                            >
                              Open Vault
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Toggle Switch Column (vertically centered to photostrip) ── */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-16">
                    <div className="flex flex-col items-center gap-6 relative group">
                      <div className="flex flex-col items-center gap-8 bg-white/40 py-10 px-8 rounded-[40px] shadow-[0_12px_30px_rgba(0,0,0,0.12)] border-2 border-white/60 backdrop-blur-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fff_0%,_transparent_100%)]" />
                        
                        <span className={`text-[14px] font-sans font-black tracking-[0.4em] transition-all duration-500 ${switchState === 'collect' ? 'text-zinc-950 scale-110 drop-shadow-md' : 'text-zinc-400'}`}>COLLECT</span>

                        <div 
                          className="relative w-20 h-32 rounded-[2rem] flex items-center justify-center p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.2),_0_4px_10px_rgba(255,255,255,0.7)]"
                          style={{ 
                            background: 'linear-gradient(145deg, #e5e7eb, #ffffff)',
                            border: '1px solid #d1d5db'
                          }}
                        >
                          <motion.div
                            drag="y"
                            dragConstraints={{ top: -45, bottom: 45 }}
                            dragElastic={0.1}
                            dragSnapToOrigin
                            onDragEnd={(_, info) => {
                              if (info.offset.y < -30) setSwitchState('collect');
                              else if (info.offset.y > 30) setSwitchState('print');
                            }}
                            animate={{ rotateX: switchState === 'collect' ? -45 : switchState === 'print' ? 45 : 0, y: switchState === 'collect' ? -12 : switchState === 'print' ? 12 : 0 }}
                            className="relative w-8 h-18 rounded-full z-30 cursor-grab active:cursor-grabbing preserve-3d"
                            style={{ 
                              background: 'linear-gradient(90deg, #4b5563 0%, #d1d5db 20%, #ffffff 50%, #9ca3af 80%, #374151 100%)',
                              boxShadow: '0 12px 24px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.5)'
                            }}
                          >
                            <div 
                              className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full"
                              style={{ 
                                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #e5e7eb 40%, #9ca3af 70%, #4b5563 100%)',
                                boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.8)'
                              }}
                            />
                            <div className="absolute inset-x-1.5 top-3 bottom-3 bg-black/10 rounded-full blur-[1px]" />
                          </motion.div>
                        </div>

                        <span className={`text-[14px] font-sans font-black tracking-[0.4em] transition-all duration-500 ${switchState === 'print' ? 'text-zinc-950 scale-110 drop-shadow-md' : 'text-zinc-400'}`}>PRINT</span>
                      </div>
                      
                      <p className="w-40 text-center text-zinc-900 font-sans text-[13px] font-black tracking-[0.3em] uppercase transition-all duration-500 mt-3 drop-shadow-sm">
                        Drag Lever
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Close button — rendered last in DOM order so it paints on top of all siblings */}
            <button
              type="button"
              onClick={() => { setIsSlotDetailOpen(false); setTransitionStage("landing"); }}
              aria-label="Close"
              className="absolute top-6 right-6 z-[9999] w-12 h-12 rounded-full bg-zinc-950 hover:bg-[#8C1D24] active:scale-90 flex items-center justify-center text-white shadow-xl transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
              style={{ WebkitTapHighlightColor: "transparent", pointerEvents: "auto" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" style={{ pointerEvents: "none" }}>
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PhotoboothSession has been bypassed directly into CaptureSection */}

      {mounted && createPortal(
        <div id="printable-strip-root" className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none">
          <div id="printable-strip" className="flex flex-col items-center bg-white p-12" style={{ width: '380px', backgroundColor: 'white' }}>
            <div className="flex flex-col gap-8 w-full">
              {capturedPhotos.map((photo, i) => (
                <div key={i} className="relative w-full aspect-square border-[12px] border-white shadow-sm overflow-hidden bg-zinc-50">
                  <Image
                    src={photo}
                    alt=""
                    fill
                    unoptimized
                    sizes="380px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col items-center">
              <div className="flex items-center text-4xl font-serif font-black">
                <span className="text-zinc-900">your</span>
                <span className="text-[#8C1D24] italic ml-1">Archives</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
