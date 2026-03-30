"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HomeSection from "@/components/sections/HomeSection";
import ExploreSection from "@/components/sections/ExploreSection";
import AboutSection from "@/components/sections/AboutSection";
import CaptureSection from "@/components/sections/CaptureSection";

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedLayout, setSelectedLayout] = useState<3 | 4>(3);
  
  // State for captured photos to display on home screen
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [capturedLayout, setCapturedLayout] = useState<3 | 4>(3);
  const [capturedFilter, setCapturedFilter] = useState<"bw" | "color">("color");
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [shouldReveal, setShouldReveal] = useState(false);

  const handleSectionChange = (
    id: string, 
    data?: { 
      layout?: 3 | 4; 
      reveal?: boolean;
      photos?: string[];
      filterMode?: "bw" | "color";
    }
  ) => {
    if (id === activeSection) return;
    
    if (data?.layout) {
      setSelectedLayout(data.layout);
      if (id === "home") setCapturedLayout(data.layout); // save layout for home display
    }
    if (data?.reveal !== undefined) {
      setShouldReveal(data.reveal);
    }
    if (data?.photos) {
      setCapturedPhotos(data.photos);
    }
    if (data?.filterMode) {
      setCapturedFilter(data.filterMode);
    }

    setIsShutterFlashing(true);
    setTimeout(() => {
      setActiveSection(id);
      setTimeout(() => setIsShutterFlashing(false), 300);
    }, 150);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "home":
        return (
          <HomeSection 
            onNavigate={handleSectionChange} 
            forceReveal={shouldReveal} 
            capturedPhotos={capturedPhotos}
            capturedLayout={capturedLayout}
            capturedFilter={capturedFilter}
          />
        );
      case "explore":
        return <ExploreSection />;
      case "about":
        return <AboutSection />;
      case "create":
        return (
          <CaptureSection 
            layout={selectedLayout} 
            onComplete={(data) => handleSectionChange("home", data)} 
          />
        );
      default:
        return <HomeSection onNavigate={handleSectionChange} />;
    }
  };

  return (
    <main className="absolute inset-0 w-full h-full overflow-hidden bg-transparent select-none">

      {/* Shutter Flash Effect - White Flash */}
      <AnimatePresence>
        {isShutterFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-white z-[100] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-center">
          <AnimatePresence>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                 {renderSection()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </main>
  );
}
