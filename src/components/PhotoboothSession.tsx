"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface PhotoboothSessionProps {
  onClose: () => void;
  onLayoutSelected: (layout: "3-shots" | "4-shots") => void;
}

export default function PhotoboothSession({ onClose, onLayoutSelected }: PhotoboothSessionProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_sessionStage] = useState<"camera-setup" | "layout-selection">("layout-selection");

  const selectLayout = async (layout: "3-shots" | "4-shots") => {
    try {
      await fetch("/api/set-layout", {
        method: "POST",
        body: JSON.stringify({ layout }),
        headers: { "Content-Type": "application/json" }
      });
      onLayoutSelected(layout);
    } catch (err) {
      console.warn("API set-layout failed, proceeding anyway", err);
      onLayoutSelected(layout);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        background: 'radial-gradient(circle at center, #FCFCFC 0%, #F5F5F5 40%, #E5E5E5 100%)' 
      }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] backdrop-blur-md overflow-hidden flex items-center justify-center shadow-inner"
    >
      {/* Background Lighting / Atmosphere */}
      <div className="absolute inset-0">
        <motion.div 
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#8C1D24] blur-[180px] scale-150 opacity-10"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.03)_100%)]" />
      </div>
      
      {/* Main Session Content */}
      <div className="relative z-[210] w-full h-full flex flex-col items-center justify-center p-6">
        

        {/* Layout Selection Panel */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white/40 backdrop-blur-3xl p-10 md:p-20 rounded-[80px] shadow-[0_100px_200px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.4)] flex flex-col items-center gap-16 max-w-2xl text-center"
            >
                <div className="space-y-6">
                  <h2 className="font-display text-5xl md:text-7xl font-bold text-zinc-900 tracking-tight leading-none">
                    Choose your <span className="text-[#8C1D24] italic font-normal">photostrip</span> layout
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-zinc-400 font-sans tracking-[0.4em] uppercase text-[10px] font-bold">your</span>
                    <span className="text-[#8C1D24] font-sans tracking-[0.4em] uppercase text-[10px] font-bold">Archives</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 w-full">
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 40px 80px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ 
                      scale: 0.95, 
                      x: [0, -2, 2, -2, 2, 0], 
                      transition: { duration: 0.2 } 
                    }}
                    onClick={() => selectLayout("3-shots")}
                    className="flex-1 group relative bg-white/60 p-10 rounded-[40px] shadow-2xl border border-white/20 flex flex-col items-center transition-all hover:bg-white/80"
                  >
                    <div className="h-48 w-32 mb-8 bg-[#111] rounded-lg flex flex-col gap-3 p-4 items-center border border-black/5 group-hover:border-[#8C1D24]/40 transition-colors shadow-inner">
                      {[1,2,3].map(i => <motion.div key={i} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }} className="w-full h-full bg-zinc-800 rounded-sm" />)}
                    </div>
                    <span className="font-display text-2xl font-bold text-zinc-900 group-hover:text-[#8C1D24] transition-colors">3 Shots Strip</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 40px 80px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ 
                      scale: 0.95, 
                      x: [0, -2, 2, -2, 2, 0], 
                      transition: { duration: 0.2 } 
                    }}
                    onClick={() => selectLayout("4-shots")}
                    className="flex-1 group relative bg-white/60 p-10 rounded-[40px] shadow-2xl border border-white/20 flex flex-col items-center transition-all hover:bg-white/80"
                  >
                    <div className="h-48 w-32 mb-8 bg-[#111] rounded-lg flex flex-col gap-2 p-4 items-center border border-black/5 group-hover:border-[#8C1D24]/40 transition-colors shadow-inner">
                      {[1,2,3,4].map(i => <motion.div key={i} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }} className="w-full h-full bg-zinc-800 rounded-sm" />)}
                    </div>
                    <span className="font-display text-2xl font-bold text-zinc-900 group-hover:text-[#8C1D24] transition-colors">4 Shots Strip</span>
                  </motion.button>
                </div>
            </motion.div>
        </div>
      </div>

      {/* Close Button / Cancel */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 z-[230] p-4 bg-zinc-900/5 hover:bg-zinc-900/10 backdrop-blur-md rounded-full border border-zinc-900/10 transition-all text-zinc-400 hover:text-zinc-900"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

    </motion.div>
  );
}
