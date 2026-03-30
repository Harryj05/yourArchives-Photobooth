"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent pointer-events-none">
      {/* Background Blur Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/5 backdrop-blur-xl"
      />
      
      {/* Loading Spinner / Indicator */}
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-zinc-300/20 rounded-full border-t-[#8C1D24]"
          />
          <motion.div 
            animate={{ scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-5 bg-[#8C1D24]/30 rounded-full blur-sm"
          />
        </div>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-sans font-bold tracking-[0.4em] text-zinc-400 uppercase"
        >
          Developing...
        </motion.p>
      </div>

      {/* Cinematic Film Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay film-grain" />
    </div>
  );
}
