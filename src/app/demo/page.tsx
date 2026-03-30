"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function DemoPage() {
  const [switchState, setSwitchState] = useState<'neutral' | 'collect' | 'print'>('neutral');

  // Demo reset to neutral after action
  useEffect(() => {
    if (switchState !== 'neutral') {
      const timer = setTimeout(() => setSwitchState('neutral'), 1000);
      return () => clearTimeout(timer);
    }
  }, [switchState]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F4F1EA] p-10">
      <h1 className="text-2xl font-serif text-[#1a1a1a] mb-8">Zoom View Layout Verification</h1>
      
      {/* Simulation of the Zoom Overlay Container in HomeSection */}
      <div 
        className="w-[min(340px,90vw)] h-[min(580px,70vh)] relative p-4 border-[2px] border-zinc-400 shadow-2xl group"
        style={{
          background: 'linear-gradient(90deg, #f0f0f0 0%, #ffffff 15%, #d0d0d0 85%, #b0b0b0 100%)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,1)',
          borderRadius: '4px'
        }}
      >
        {/* Vintage Brass Toggle Switch - As per mockup */}
        <div className="absolute -right-36 top-1/2 -translate-y-1/2 flex items-center gap-4 z-50">
          {/* Chrome Plate */}
          <div 
            className="relative w-12 h-20 rounded-lg shadow-xl flex flex-col items-center justify-center p-2 border border-zinc-400 order-first overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #e5e7eb, #9ca3af)',
              boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.2), 2px 2px 5px rgba(0,0,0,0.2)',
            }}
          >
            {/* Clickable areas for Top (Collect) and Bottom (Print) */}
            <div 
              className="absolute top-0 inset-x-0 h-1/2 z-20 cursor-pointer"
              onClick={() => setSwitchState('collect')}
            />
            <div 
              className="absolute bottom-0 inset-x-0 h-1/2 z-20 cursor-pointer"
              onClick={() => setSwitchState('print')}
            />

            {/* Screws */}
            <div className="absolute top-1.5 w-1 h-1 rounded-full bg-zinc-600 opacity-60 shadow-inner" />
            <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-zinc-600 opacity-60 shadow-inner" />
            
            {/* Switch Lever Base */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #ffffff, #9ca3af)',
                boxShadow: '1px 1px 3px rgba(0,0,0,0.3), inset 1px 1px 1px rgba(255,255,255,0.5)'
              }}
            >
              {/* Toggle Lever (3-Way) - Chrome Styling */}
              <motion.div
                animate={{ 
                  rotateX: switchState === 'collect' ? -35 : switchState === 'print' ? 35 : 0 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-2 h-6 bg-gradient-to-b from-[#ffffff] via-[#d1d5db] to-[#4b5563] rounded-full flex flex-col items-center shadow-md origin-center transform-gpu"
                style={{ perspective: '1000px' }}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#9ca3af] to-[#ffffff] shadow-sm -mt-1" />
              </motion.div>
            </div>
          </div>

          {/* Labels on the RIGHT of the switch */}
          <div className="flex flex-col justify-between h-20 py-0.5 text-left cursor-default select-none">
            <span className={`text-[12px] font-serif font-bold tracking-[0.15em] uppercase leading-none transition-colors duration-300 ${switchState === 'collect' ? 'text-zinc-900' : 'text-zinc-400'}`}>COLLECT STRIP</span>
            <span className={`text-[12px] font-serif font-bold tracking-[0.15em] uppercase leading-none transition-colors duration-300 ${switchState === 'print' ? 'text-zinc-900' : 'text-zinc-400'}`}>PRINT</span>
          </div>
        </div>

        <div 
          className="w-full h-full bg-[#E5E5E5] relative overflow-hidden flex items-center justify-center p-2"
          style={{
            background: 'linear-gradient(135deg, #d8d8d8 0%, #f5f5f5 50%, #d8d8d8 100%)',
            boxShadow: 'inset 0 40px 100px rgba(0,0,0,0.4), inset 0 10px 20px rgba(0,0,0,0.2), inset 0 -10px 20px rgba(255,255,255,0.8)'
          }}
        >
          {/* Shadow cast from top edges for depth */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent z-20 pointer-events-none" />
          
          {/* The Polished Chrome T-Lever (Hyper-Realistic Version) */}
          <div className="absolute inset-x-0 bottom-0 h-[75%] flex flex-col items-center z-[40] pointer-events-none">
            {/* The Horizontal Grip */}
            <div 
              className="relative w-[90%] h-4 rounded-full shadow-2xl z-10"
              style={{
                background: 'linear-gradient(180deg, #9ca3af 0%, #f3f4f6 30%, #ffffff 50%, #d1d5db 70%, #4b5563 100%)',
                boxShadow: '0 8px 15px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.8)'
              }}
            >
              <div className="absolute top-[10%] inset-x-1 h-px bg-white/40 blur-[0.5px]" />
            </div>

            {/* The Vertical Rod (Stem) */}
            <div 
              className="relative w-4 h-full -mt-1 rounded-b-full shadow-2xl"
              style={{
                background: 'linear-gradient(90deg, #4b5563 0%, #d1d5db 20%, #ffffff 50%, #9ca3af 80%, #374151 100%)',
                boxShadow: '10px 0 20px rgba(0,0,0,0.5), -10px 0 20px rgba(0,0,0,0.5), inset 1px 0 1px rgba(255,255,255,0.6)'
              }}
            >
              <div className="absolute left-[20%] inset-y-0 w-px bg-white/30 blur-[0.5px]" />
            </div>

            {/* Joint Cap */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full z-[41] -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d1d5db 60%, #4b5563 100%)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.4)'
              }}
            />
          </div>

          {/* Photostrip Sample */}
          <div className="h-[96%] w-[160px] bg-white p-3 shadow-2xl z-10 flex flex-col gap-2 relative">
             <div className="w-full aspect-[4/3] bg-zinc-200" />
             <div className="w-full aspect-[4/3] bg-zinc-200" />
             <div className="w-full aspect-[4/3] bg-zinc-200" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-zinc-500 text-center max-w-sm">
        Verification Page: Sign (tag) has been removed. Container height reduced for better viewport visibility.
      </p>
    </div>
  );
}
