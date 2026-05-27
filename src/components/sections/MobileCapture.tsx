"use client";

import { RefObject, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHOTO_FILTERS, type FilterId, getFilter } from "@/lib/filters";
import { STRIP_THEMES, type ThemeId, getTheme } from "@/lib/themes";

/**
 * Shape of the shared state passed from <CaptureSection>. Mirrors the return
 * type of the (informal) usePhotobooth hook — all state, refs, and handlers
 * live in CaptureSection's single useState graph, so neither the desktop
 * diorama nor this mobile component owns its own state.
 */
export interface PhotoboothState {
  phase: "prepare" | "capturing" | "completed" | "archiving";
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  capturedPhotos: string[];
  currentShot: number;
  totalShots: number;
  countdown: number | null;
  countdownSeconds: 3 | 5 | 10;
  setCountdownSeconds: (n: 3 | 5 | 10) => void;
  activeLayout: 3 | 4;
  setActiveLayout: (n: 3 | 4) => void;
  filterId: FilterId;
  setFilterId: (id: FilterId) => void;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  error: string | null;
  permissionDenied: boolean;
  setupCamera: () => Promise<void>;
  startCountdown: () => void;
  isUploading: boolean;
  facingMode: "user" | "environment";
  setFacingMode: (m: "user" | "environment") => void;
  /**
   * Called after the user reviews the captured strip and taps "Continue".
   * MobileCapture owns the result-screen presentation; the parent just
   * navigates when this fires.
   */
  onDone?: () => void;
}

/**
 * Phone-optimised camera UI. Full-bleed live preview, bottom drawer for
 * layout + filter + countdown pickers, large circular shutter, countdown
 * numeral overlaid centre-screen.
 */
export default function MobileCapture({ state }: { state: PhotoboothState }) {
  const filter = getFilter(state.filterId);
  const theme = getTheme(state.themeId);
  const [hasReviewed, setHasReviewed] = useState(false);

  // ── Result view: blurred backdrop + photostrip preview ──
  // Renders as soon as the user has finished capturing all shots, so the
  // user never gets stuck on the live camera. The Continue button hands
  // control back to the parent via onDone.
  const isCaptureComplete = state.capturedPhotos.length >= state.totalShots;

  if (isCaptureComplete && !hasReviewed) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-hidden">
        {/* Blurred camera backdrop */}
        <div className="absolute inset-0">
          <video
            ref={state.videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50 ${
              state.facingMode === "user" ? "scale-x-[-1]" : ""
            }`}
          />
          <canvas ref={state.canvasRef} className="hidden" />
          <div className="absolute inset-0 bg-zinc-950/80" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 pt-16 pb-4 text-center px-6"
        >
          <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-[#8C1D24] mb-2">
            Your Strip
          </p>
          <h2 className="font-display text-3xl font-bold text-white tracking-tight">
            Looking <span className="italic font-normal text-[#8C1D24]">good</span>
          </h2>
        </motion.div>

        {/* Photostrip preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex-1 flex items-center justify-center w-full px-8 py-4"
        >
          <div
            className={`relative w-[55vw] max-w-[220px] flex flex-col gap-1 p-2 ${theme.livePreviewClass}`}
            style={{
              aspectRatio: state.totalShots === 3 ? "2/7" : "2/9",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              border: theme.borderWidth > 0 ? `${Math.max(1, theme.borderWidth / 4)}px solid ${theme.borderColor}` : undefined,
            }}
          >
            {state.capturedPhotos.map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.18, duration: 0.5 }}
                className="relative flex-1 overflow-hidden bg-zinc-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL */}
                <img src={src} alt={`Shot ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
              </motion.div>
            ))}
            <div
              className="pt-1 text-center text-[6px] font-bold tracking-tight"
              style={{ fontFamily: theme.fontFamily, color: theme.fontColor }}
            >
              your<span className="italic ml-0.5" style={{ color: theme.accentColor }}>Archives</span>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="relative z-10 w-full px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={() => {
              setHasReviewed(true);
              state.onDone?.();
            }}
            className="w-full py-4 bg-[#8C1D24] text-white font-sans text-[13px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-[0_8px_24px_rgba(140,29,36,0.5)] active:scale-[0.98] transition-transform"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white/10 backdrop-blur-md text-white/80 font-sans text-[11px] uppercase tracking-[0.3em] rounded-2xl border border-white/15 active:scale-[0.98] transition-transform"
          >
            Retake
          </button>
        </motion.div>
      </div>
    );
  }

  // Pre-capture: error / permission UI
  if (state.error || state.permissionDenied) {
    return (
      <div className="fixed inset-0 bg-zinc-950 z-[200] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-sans text-sm text-zinc-300 mb-6 max-w-xs leading-relaxed">
          {state.error ?? "Camera permission was denied. Please grant access in your browser settings."}
        </p>
        <button
          onClick={() => state.setupCamera()}
          className="px-8 py-3 bg-white text-zinc-950 font-sans text-xs uppercase tracking-widest rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* ── Full-bleed live preview ─────────────────────────── */}
      <div className={`flex-1 relative overflow-hidden ${filter.livePreviewClass ?? ""}`}>
        <video
          ref={state.videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            state.facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
          style={{
            filter: filter.cssFilter === "none" ? undefined : filter.cssFilter,
          }}
        />
        <canvas ref={state.canvasRef} className="hidden" />

        {/* Shot counter pill */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md">
          <span className="font-sans text-[11px] uppercase tracking-widest text-white">
            {state.currentShot} / {state.totalShots}
          </span>
        </div>

        {/* Front/rear camera toggle — 44×44 tap target, top-left of the
            viewfinder so it's reachable with the thumb. */}
        <button
          type="button"
          onClick={() => state.setFacingMode(state.facingMode === "user" ? "environment" : "user")}
          aria-label={`Switch to ${state.facingMode === "user" ? "rear" : "front"} camera`}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
          style={{ touchAction: "manipulation" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
          </svg>
        </button>

        {/* Captured-photo thumbnails — slim column on the left */}
        {state.capturedPhotos.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
            {state.capturedPhotos.map((p, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-md overflow-hidden border-2 border-white/40 bg-zinc-900 shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL */}
                <img src={p} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Developing overlay — shown as soon as all shots are taken,
            stays until the parent navigates away after upload. */}
        {(state.currentShot >= state.totalShots || state.phase === "completed" || state.phase === "archiving" || state.isUploading) && (
          <div className="absolute inset-0 z-[300] bg-zinc-950/95 flex flex-col items-center justify-center gap-8 px-8">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-zinc-700 border-t-[#8C1D24] animate-spin" />
              <div className="absolute inset-3 rounded-full border border-dashed border-zinc-800 animate-[spin_3s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8C1D24]/70" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="font-display text-2xl font-bold text-white tracking-tight">
                Developing your <span className="text-[#8C1D24] italic font-normal">strip</span>
              </p>
              <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-zinc-500">Please wait…</p>
            </div>
          </div>
        )}

        {/* Countdown overlay — centre-screen */}
        <AnimatePresence>
          {state.countdown !== null && (
            <motion.div
              key={state.countdown}
              initial={{ scale: 2.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span
                className="text-[200px] font-display font-black italic text-white leading-none"
                style={{ textShadow: "0 12px 60px rgba(0,0,0,0.7), 0 0 120px rgba(140,29,36,0.35)" }}
              >
                {state.countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom control drawer ─────────────────────────── */}
      <div className="flex-shrink-0 bg-zinc-950/95 backdrop-blur-xl pt-4 pb-[max(env(safe-area-inset-bottom),16px)] px-4 border-t border-white/5">
        {/* Layout switcher (3 / 4 shots) */}
        <div className="flex justify-center gap-2 mb-3" role="radiogroup" aria-label="Strip layout">
          {([3, 4] as const).map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={state.activeLayout === n}
              onClick={() => state.setActiveLayout(n)}
              disabled={state.phase !== "prepare" && state.phase !== "capturing"}
              className={`px-4 py-1.5 rounded-full font-sans text-[10px] uppercase tracking-widest transition-all ${
                state.activeLayout === n
                  ? "bg-white text-zinc-950"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              } disabled:opacity-40`}
            >
              {n} Shots
            </button>
          ))}
        </div>

        {/* Countdown duration pills */}
        <div className="flex justify-center gap-2 mb-3" role="radiogroup" aria-label="Countdown duration">
          {([3, 5, 10] as const).map((sec) => (
            <button
              key={sec}
              role="radio"
              aria-checked={state.countdownSeconds === sec}
              onClick={() => state.setCountdownSeconds(sec)}
              className={`px-4 py-1.5 rounded-full font-sans text-[10px] uppercase tracking-widest transition-all ${
                state.countdownSeconds === sec
                  ? "bg-white text-zinc-950"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Filter scroll row */}
        <div className="flex gap-2 overflow-x-auto px-1 pb-1 mb-3 -mx-1">
          {PHOTO_FILTERS.map((f) => {
            const selected = state.filterId === f.id;
            return (
              <button
                key={f.id}
                onClick={() => state.setFilterId(f.id)}
                aria-pressed={selected}
                className={`flex-shrink-0 flex flex-col items-center gap-1 ${
                  selected ? "" : "opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-md overflow-hidden border ${
                    selected ? "border-white ring-2 ring-white/40" : "border-white/20"
                  } ${f.livePreviewClass ?? ""}`}
                  style={{
                    background: "linear-gradient(135deg,#f4c1a1 0%,#c87f5c 45%,#6b4938 100%)",
                  }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      filter: f.cssFilter === "none" ? undefined : f.cssFilter,
                      background: "linear-gradient(135deg,#f4c1a1 0%,#c87f5c 45%,#6b4938 100%)",
                    }}
                  />
                </div>
                <span className="font-sans text-[8px] uppercase tracking-[0.15em] text-white/70">
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Theme scroll row */}
        <div className="flex gap-2 overflow-x-auto px-1 pb-2 mb-4 -mx-1">
          {STRIP_THEMES.map((t) => {
            const selected = state.themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => state.setThemeId(t.id)}
                aria-pressed={selected}
                className={`flex-shrink-0 flex flex-col items-center gap-1 ${
                  selected ? "" : "opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-12 rounded-sm ${t.livePreviewClass} ${
                    selected ? "ring-2 ring-white" : ""
                  }`}
                  style={{
                    outline: t.borderWidth > 0 ? `1px solid ${t.borderColor}` : "none",
                  }}
                />
                <span className="font-sans text-[8px] uppercase tracking-[0.15em] text-white/70">
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shutter — large circular button */}
        <div className="flex items-center justify-center">
          <button
            onClick={state.startCountdown}
            disabled={
              state.phase !== "capturing" ||
              state.countdown !== null ||
              state.currentShot >= state.totalShots ||
              state.isUploading
            }
            aria-label="Take photo"
            className="relative w-[72px] h-[72px] rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] disabled:opacity-40 transition-transform active:scale-95"
          >
            <span className="absolute inset-1.5 rounded-full border-[3px] border-zinc-950" />
            <span className="absolute inset-3 rounded-full bg-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
