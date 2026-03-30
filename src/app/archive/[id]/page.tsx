"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/Button";

export default function ArchiveViewer() {
  const [activeImage, setActiveImage] = useState(1);
  const totalImages = 8;
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-burgundy-950 flex flex-col md:flex-row overflow-hidden">
      {/* Main Viewer */}
      <div className="flex-1 relative flex flex-col">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-burgundy-950/80 to-transparent">
          <Button variant="ghost" href="/" className="!px-4 !py-2 !rounded-lg bg-wine-800/80 backdrop-blur-md border-transparent hover:border-[var(--border-subtle)]">
            ← Back to Archive
          </Button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-10 h-10 rounded-lg bg-wine-800/80 backdrop-blur-md text-rose-200 flex items-center justify-center hover:bg-wine-700 hover:text-white transition-colors"
              aria-label="Toggle Metadata"
            >
              ℹ️
            </button>
            <button
              className="w-10 h-10 rounded-lg bg-wine-800/80 backdrop-blur-md text-rose-200 flex items-center justify-center hover:bg-wine-700 hover:text-white transition-colors"
              aria-label="Share"
            >
              🔗
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 relative flex items-center justify-center p-12 bg-[url('https://images.unsplash.com/photo-1626245388040-cfc9920155b4?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
          <div className="absolute inset-0 bg-burgundy-950/70 backdrop-blur-md" />
          
          <div className="relative z-10 max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            <Image 
              src={`https://images.unsplash.com/photo-${1550000000000 + activeImage * 100}?w=1600&q=80`}
              alt="Archive Item"
              fill
              className="object-contain rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              unoptimized
            />
          </div>

          {/* Navigation Arrows */}
          <button 
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-wine-800/50 backdrop-blur-md text-white flex items-center justify-center text-xl hover:bg-wine-700 transition-colors z-10 disabled:opacity-30"
            onClick={() => setActiveImage(Math.max(1, activeImage - 1))}
            disabled={activeImage === 1}
          >
            ←
          </button>
          <button 
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-wine-800/50 backdrop-blur-md text-white flex items-center justify-center text-xl hover:bg-wine-700 transition-colors z-10 disabled:opacity-30"
            onClick={() => setActiveImage(Math.min(totalImages, activeImage + 1))}
            disabled={activeImage === totalImages}
          >
            →
          </button>
        </div>

        {/* Film Strip Navigation */}
        <div className="h-32 bg-burgundy-950 border-t border-[var(--border-subtle)] p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max px-auto justify-center">
            {Array.from({ length: totalImages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i + 1)}
                className={`w-32 h-24 rounded overflow-hidden relative transition-all ${
                  activeImage === i + 1 
                    ? "ring-2 ring-gold-300 ring-offset-2 ring-offset-burgundy-950 scale-105" 
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                <Image 
                  src={`https://images.unsplash.com/photo-${1550000000000 + (i + 1) * 100}?w=300&q=80`}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metadata Sidebar */}
      <div 
        className={`bg-burgundy-950/90 backdrop-blur-xl border-l border-[var(--border-subtle)] transition-all duration-300 ease-in-out ${
          showMetadata ? "w-full md:w-80" : "w-0 overflow-hidden"
        }`}
      >
        <div className="w-full md:w-80 p-8 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-display text-xl font-bold text-white">Metadata</h3>
            <button className="text-rose-200/60 hover:text-white md:hidden" onClick={() => setShowMetadata(false)}>✕</button>
          </div>

          <div className="space-y-6">
            <div>
              <span className="font-sans text-[10px] text-rose-300 uppercase tracking-widest block mb-1">Date Captured</span>
              <p className="font-serif text-sm text-rose-100 italic">October 14, 2023</p>
            </div>
            
            <div>
              <span className="font-sans text-[10px] text-rose-300 uppercase tracking-widest block mb-1">Location</span>
              <p className="font-serif text-sm text-rose-100 italic">Kyoto, Japan</p>
            </div>
            
            <div>
              <span className="font-sans text-[10px] text-rose-300 uppercase tracking-widest block mb-1">Camera</span>
              <p className="font-serif text-sm text-rose-100 italic">Leica M6, 35mm Summicron</p>
            </div>

            <div>
              <span className="font-sans text-[10px] text-rose-300 uppercase tracking-widest block mb-1">Tags</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Travel", "Analog", "Japan", "Autumn"].map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-wine-800 text-xs text-rose-200/80">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" className="w-full justify-center !text-xs !py-3">
                Download Original
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
