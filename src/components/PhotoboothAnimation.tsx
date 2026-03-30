"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

interface PhotoboothAnimationProps {
  onComplete?: () => void;
  isTriggered?: boolean;
}

export default function PhotoboothAnimation({ onComplete, isTriggered = false }: PhotoboothAnimationProps) {
  const [stage, setStage] = useState<"curtains" | "interior" | "printed">("curtains");
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!isTriggered || stage !== "curtains") return;

    const sequence = async () => {
      // 1. Open Curtains
      setStage("interior");
      await new Promise((r) => setTimeout(r, 1500));
      
      // 2. Trigger Flash simultaneously with Print initiation
      setIsFlashing(true);
      
      // 3. Print - animation has a 0.4s delay internally, so they sync nicely
      setStage("printed");
      
      // Wait for the strip to fully slide out (spring takes ~1.5 - 2s)
      await new Promise((r) => setTimeout(r, 2000));
      
      // 4. Turn off flash only after strip is down
      setIsFlashing(false);
      
      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
    };

    sequence();
  }, [onComplete, isTriggered, stage]);

  // View logic matches previous, updating only the flash trigger references
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden shadow-2xl rounded-sm">
      {/* 1. Photobooth Interior revealed behind curtains */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-vintage-red overflow-hidden">
        {/* Deep shadows for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-0" />
        <div className="absolute inset-0 ring-[60px] ring-inset ring-black/20 pointer-events-none" />
        
        {/* High-end Delivery Plate (Mechanical/Vintage) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={stage !== "curtains" ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="z-10 mb-8 relative"
        >
          {/* "In Use" Red Status Light (Industrial LED) */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-sm bg-zinc-900/80 border border-zinc-700/50 shadow-xl backdrop-blur-sm">
            <motion.div 
              animate={stage === "interior" && !isFlashing ? { 
                backgroundColor: ["#ff3333", "#cc0000", "#ff3333"],
                boxShadow: [
                  "0 0 12px 2px rgba(255, 0, 0, 0.6)",
                  "0 0 4px 1px rgba(255, 0, 0, 0.3)",
                  "0 0 12px 2px rgba(255, 0, 0, 0.6)"
                ]
              } : { 
                backgroundColor: "#440000",
                boxShadow: "0 0 0px rgba(0,0,0,0)"
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full border border-black/20"
            />
            <span className="text-[7px] md:text-[8px] font-mono font-bold text-zinc-100/80 uppercase tracking-[0.2em] whitespace-nowrap">
              {stage === "interior" && !isFlashing ? "Recording" : "Standby"}
            </span>
          </div>

          <div className="relative w-36 h-44 md:w-44 md:h-52 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-500/30 rounded-sm overflow-hidden vintage-chrome p-1.5">
             <div className="w-full h-full rounded-sm border-2 border-zinc-800/20 flex flex-col items-center justify-start py-6 px-4 bg-zinc-300 brushed-metal relative overflow-hidden">
                {/* Main Instruction Text */}
                <div className="flex flex-col items-center gap-1 mb-6">
                  <span className="font-display text-[10px] md:text-[14px] font-bold text-zinc-900/90 tracking-[0.2em] text-center uppercase leading-tight z-10">
                    Photos<br/>Delivered<br/>Here
                  </span>
                  <span className="font-display text-[8px] md:text-[10px] font-medium text-zinc-800/70 tracking-widest text-center uppercase z-10 mt-1">
                    In 4 Minutes
                  </span>
                </div>

                {/* Contact Handles (Vintage industrial look) */}
                <div className="flex flex-col items-center gap-0.5 mb-6 z-10 opacity-60">
                  <span className="font-mono text-[5px] md:text-[6px] text-zinc-800 tracking-tighter">help@autofoto.org</span>
                  <span className="font-mono text-[5px] md:text-[6px] text-zinc-800 tracking-tighter">@autofoto.london</span>
                </div>

                {/* Industrial Down Arrow */}
                <div className="mt-auto z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-950">
                    <path d="M12 21l-8-9h5V3h6v9h5l-8 9z" />
                  </svg>
                </div>

                {/* Soft top lighting */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                {/* Metallic shine diagonal */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-40 transform -skew-x-12" />
             </div>
          </div>
        </motion.div>

        {/* The Mechanical Slot */}
        <div className="relative p-1.5 vintage-chrome rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-zinc-600/50 z-10">
          <div className="relative w-44 md:w-56 h-72 md:h-96 bg-zinc-950 rounded-lg border-[3px] border-zinc-900 shadow-[inset_0_0_80px_rgba(0,0,0,1)] overflow-hidden">
             
             {/* 3. Inner Cavity Shadows (Deepest layer inside the slot) */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/90 pointer-events-none z-0 opacity-80" />
             
             {/* 4. Photo Strip Animation (Z-index 10) */}
             <AnimatePresence>
               {stage === "printed" && (
                 <motion.div 
                   initial={{ y: "-110%", rotateZ: -0.5 }}
                   animate={{ y: "10%", rotateZ: 0.5 }}
                   transition={{ 
                     y: {
                       type: "spring",
                       stiffness: 80,
                       damping: 15,
                       mass: 1.5,
                       delay: 0.4
                     },
                     rotateZ: {
                       duration: 2,
                       repeat: Infinity,
                       repeatType: "reverse",
                       ease: "easeInOut"
                     }
                   }}
                   className="absolute left-[8%] right-[8%] z-10 origin-top"
                 >
                    <div className="bg-white p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex flex-col gap-2 relative">
                       {/* Very subtle paper curve shadow */}
                       <div className="absolute inset-0 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.05),inset_2px_0_10px_rgba(0,0,0,0.05)] pointer-events-none z-20" />
                       
                       {[1, 2, 3].map((i) => (
                         <div key={i} className="aspect-[4/5] bg-zinc-200 relative overflow-hidden ring-1 ring-black/5">
                            <Image 
                              src={`/images/strip${(i % 2) + 1}.png`} 
                              alt="Memory" 
                              fill 
                              className="object-cover grayscale contrast-[1.1] brightness-[0.95]"
                            />
                            {/* Paper Overlay */}
                            <div className="absolute inset-0 bg-orange-950/5 mix-blend-multiply opacity-30" />
                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" />
                         </div>
                       ))}
                       {/* Subtle watermark or date */}
                       <div className="text-[6px] font-mono text-zinc-400 text-right pr-1 uppercase tracking-tighter">
                         EST. 1924 • YOUR ARCHIVES
                       </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* 5. T-Shaped Lever Layer (Mechanical Detail - Z-index 20, TOPMOST) */}
             <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Horizontal Bar (Top of the T - Above the stem) */}
                <div className="absolute bottom-[28%] left-[32%] right-[32%] h-1 md:h-1.5 z-30">
                    {/* Shadow cast on strip below */}
                    <div className="absolute -bottom-1 inset-x-0 h-2 bg-black/40 blur-[2px]" />
                    <div className="h-full w-full chrome-lever-h rounded-full shadow-[0_1px_5px_rgba(0,0,0,0.6)] relative z-10" />
                    {/* Metallic shine reflection */}
                    <div className="absolute inset-x-0 top-1/4 h-[0.5px] bg-white/30 z-20" />
                </div>
                
                {/* Vertical Bar (Stem - Attached to bottom base) */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[3%] h-[25%] w-1 md:w-1.5 z-20">
                    {/* Shadow cast on strip */}
                    <div className="absolute -left-1 inset-y-0 w-2 bg-black/40 blur-[2px]" />
                    <div className="h-full w-full chrome-lever shadow-[1px_0_5px_rgba(0,0,0,0.6)] relative z-10" />
                    {/* Metallic shine reflection */}
                    <div className="absolute inset-y-0 left-1/3 w-[0.5px] bg-white/30 z-20" />
                </div>
                
                {/* Joint Connector (Intersection) */}
                <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-1.5 h-1 md:w-2 md:h-1.5 chrome-lever rounded-sm z-40 opacity-95 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Cinematic Curtains Layer */}
      <div className="absolute inset-0 flex z-50 pointer-events-none">
        {/* Left Curtain */}
        <motion.div 
          initial={{ x: 0 }}
          animate={stage !== "curtains" ? { x: "-100%" } : { x: 0 }}
          transition={{ duration: 1.8, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
          className="relative w-1/2 h-full bg-vintage-red shadow-[10px_0_40px_rgba(0,0,0,0.5)] flex"
        >
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
          {/* Edge Fabric Fold Shadow */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/40 to-transparent" />
        </motion.div>

        {/* Right Curtain */}
        <motion.div 
          initial={{ x: 0 }}
          animate={stage !== "curtains" ? { x: "100%" } : { x: 0 }}
          transition={{ duration: 1.8, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
          className="relative w-1/2 h-full bg-vintage-red shadow-[-10px_0_40px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
          {/* Edge Fabric Fold Shadow */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/40 to-transparent" />
        </motion.div>
      </div>

      {/* 3. Global Camera Flash & Ambient Effects */}
      <AnimatePresence>
        {/* Realistic Red Ambient Glow during "Recording" phase */}
        {stage === "interior" && !isFlashing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-40 pointer-events-none mix-blend-soft-light"
          >
            <div className="absolute inset-0 bg-red-600/20" />
            <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-red-500/30 to-transparent" />
          </motion.div>
        )}

        {isFlashing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }} // slower fade out for that retina burn effect
            className="absolute inset-0 z-[60] bg-white mix-blend-overlay flex items-center justify-center"
          >
             {/* Strobe core - much more intense */}
             <motion.div 
               animate={{ opacity: [0.6, 1, 0.5] }}
               transition={{ duration: 0.15, repeat: Infinity, repeatType: "reverse" }}
               className="w-full h-full bg-white opacity-80 blur-2xl saturate-[2]" 
             />
             <div className="absolute inset-0 bg-white opacity-40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Artistic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-[70] mix-blend-overlay opacity-30 film-grain" />
      <div className="absolute inset-0 pointer-events-none z-[70] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </div>
  );
}
