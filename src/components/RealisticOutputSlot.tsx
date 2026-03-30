"use client";

import React from "react";
import { motion } from "framer-motion";

const RealisticOutputSlot = () => {
  const [switchState, setSwitchState] = React.useState<'neutral' | 'collect' | 'print'>('neutral');

  // Handle auto-reset to neutral for the spring-loaded feel
  React.useEffect(() => {
    if (switchState !== 'neutral') {
      const timer = setTimeout(() => setSwitchState('neutral'), 800);
      return () => clearTimeout(timer);
    }
  }, [switchState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[700px] bg-[#F4F1EA] p-10 gap-16">
      {/* Main Container - The Metallic Block */}
      <div 
        className="relative w-44 h-80 rounded-2xl p-6 shadow-2xl flex items-center justify-center"
        style={{
          background: `
            linear-gradient(135deg, #d1d5db 0%, #ffffff 30%, #9ca3af 50%, #f3f4f6 70%, #4b5563 100%),
            repeating-linear-gradient(90deg, transparent 0px, rgba(255,255,255,0.05) 1px, transparent 2px)
          `,
          boxShadow: `
            inset 2px 2px 5px rgba(255,255,255,0.8),
            inset -2px -2px 5px rgba(0,0,0,0.2),
            10px 10px 20px rgba(0,0,0,0.1),
            -5px -5px 15px rgba(255,255,255,0.5),
            0 0 0 1px rgba(0,0,0,0.1)
          `,
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        {/* Subtle Brushed Metal Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/brushed-alum.png")',
            mixBlendMode: 'overlay'
          }}
        />

        {/* The Recessed Slot (Inner Cavity) */}
        <div 
          className="relative w-36 h-full rounded-xl bg-zinc-900 overflow-hidden shadow-[inset_0_20px_40px_rgba(0,0,0,0.9)]"
          style={{
            borderTop: '2px solid rgba(255,255,255,0.1)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Inner Cavity Top Reflection highlight */}
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          {/* Inner Cavity Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none" />

          {/* Photostrip Dispensing */}
          <motion.div 
            initial={{ y: -100, opacity: 0.8 }}
            animate={{ y: switchState === 'collect' ? 40 : 10 }}
            transition={{ 
              duration: 1.5,
              ease: "easeInOut" 
            }}
            className="absolute left-1/2 -translate-x-1/2 top-4 w-24 h-[120%] bg-zinc-950 px-0.5 py-1.5 shadow-2xl z-10 overflow-hidden"
            style={{
              boxShadow: '0 0 30px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {/* Photostrip Content (Simulated Photos) */}
            <div className="flex flex-col gap-[1px] h-full opacity-90 grayscale contrast-125">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="relative aspect-square bg-zinc-900 overflow-hidden brightness-110 contrast-125"
                >
                  <div 
                    className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                  />
                </div>
              ))}
            </div>
            {/* Strip Depth Shadow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
          </motion.div>

          {/* Polished Chrome T-Lever Layer */}
          <div className="absolute inset-x-0 bottom-0 h-[75%] flex flex-col items-center z-20 pointer-events-none">
            {/* The Horizontal Grip */}
            <div 
              className="relative w-[90%] h-3.5 rounded-full shadow-lg z-10"
              style={{
                background: 'linear-gradient(180deg, #9ca3af 0%, #f3f4f6 30%, #ffffff 50%, #d1d5db 70%, #4b5563 100%)',
                boxShadow: '0 8px 15px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.8)'
              }}
            >
              <div className="absolute top-[10%] inset-x-1 h-px bg-white/40 blur-[0.5px]" />
            </div>

            {/* The Vertical Rod (Stem) */}
            <div 
              className="relative w-3 h-full -mt-1 rounded-b-full shadow-lg"
              style={{
                background: 'linear-gradient(90deg, #4b5563 0%, #d1d5db 20%, #ffffff 50%, #9ca3af 80%, #374151 100%)',
                boxShadow: '4px 0 10px rgba(0,0,0,0.5), -4px 0 10px rgba(0,0,0,0.5), inset 1px 0 1px rgba(255,255,255,0.6)'
              }}
            >
              <div className="absolute left-[20%] inset-y-0 w-px bg-white/30 blur-[0.5px]" />
            </div>

            {/* Joint Cap */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full z-30 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d1d5db 60%, #4b5563 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }}
            />
          </div>
        </div>

        {/* Exterior Refection Flare */}
        <div 
          className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, white, transparent)' }}
        />
      </div>

      {/* Vintage 3-Way Toggle Switch - Now Centered Below */}
      <div className="flex items-center gap-10 group z-50 bg-white/40 p-8 rounded-3xl backdrop-blur-md shadow-2xl border border-white/30">
        <div className="flex flex-col items-end gap-1 text-right cursor-default select-none">
          <span className={`text-[12px] font-sans font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${switchState === 'collect' ? 'text-zinc-900' : 'text-zinc-400'}`}>COLLECT</span>
          <span className={`text-[9px] font-mono text-zinc-500/50 uppercase tracking-[0.1em]`}>STRIP</span>
        </div>

        <div 
          className="relative w-16 h-28 rounded-xl flex flex-col items-center justify-center p-2 overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #e5e7eb, #9ca3af)',
            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.2), 0 15px 30px rgba(0,0,0,0.2)',
            border: '1px solid #9ca3af'
          }}
        >
          {/* Screw Heads */}
          <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-zinc-500 shadow-inner" style={{ boxShadow: 'inset 0.5px 0.5px 1px black' }}>
            <div className="w-full h-[1px] bg-black/40 rotate-45 mt-[0.5px]" />
          </div>
          <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-zinc-500 shadow-inner" style={{ boxShadow: 'inset 0.5px 0.5px 1px black' }}>
            <div className="w-full h-[1px] bg-black/40 -rotate-45 mt-[0.5px]" />
          </div>

          {/* Switch Plate Inner Circle */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff, #9ca3af)',
              boxShadow: '1px 1px 3px rgba(0,0,0,0.3), inset 1px 1px 1px rgba(255,255,255,0.5)'
            }}
          >
            {/* Tactile Drag Lever */}
            <motion.div
              drag="y"
              dragConstraints={{ top: -30, bottom: 30 }}
              dragElastic={0.1}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.y < -20) {
                  setSwitchState('collect');
                } else if (info.offset.y > 20) {
                  setSwitchState('print');
                }
              }}
              whileDrag={{ scale: 1.1, cursor: "grabbing" }}
              animate={{ 
                rotateX: switchState === 'collect' ? -35 : switchState === 'print' ? 35 : 0,
                y: switchState === 'collect' ? -5 : switchState === 'print' ? 5 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative w-3.5 h-10 bg-gradient-to-b from-[#ffffff] via-[#d1d5db] to-[#4b5563] rounded-full origin-center transform-gpu cursor-grab active:cursor-grabbing"
              style={{
                boxShadow: '0 6px 10px rgba(0,0,0,0.4)',
                perspective: '1000px'
              }}
            >
              <div 
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #ffffff, #d1d5db)',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.5)'
                }}
              />
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 text-left cursor-default select-none">
          <span className={`text-[12px] font-sans font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${switchState === 'print' ? 'text-zinc-900' : 'text-zinc-400'}`}>PRINT</span>
          <span className={`text-[9px] font-mono text-zinc-500/50 uppercase tracking-[0.1em]`}>MEMORIES</span>
        </div>
      </div>
    </div>
  );
};

export default RealisticOutputSlot;
