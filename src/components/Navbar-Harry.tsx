"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", id: "home" },
  { label: "Explore", id: "explore" },
  { label: "About", id: "about" },
];

interface NavbarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function Navbar({ activeSection, onSectionChange }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-vintage-cream/80 backdrop-blur-md px-8 md:px-16 py-6 transition-all duration-500 border-b border-vintage-red/5">
      <div className="max-w-[1440px] mx-auto w-full relative flex items-center justify-between">
        {/* Brand - Editorial Serif */}
        <div className="flex-1 flex justify-start">
          <button 
            onClick={() => onSectionChange("home")}
            className="flex items-center group overflow-hidden"
          >
            <span className="font-display text-2xl font-bold text-vintage-black tracking-tight relative">
              your<span className="text-vintage-red italic font-light">Archives</span>
            </span>
          </button>
        </div>

        {/* Navigation - Minimal Editorial - Dead Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <ul className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => onSectionChange(link.id)}
                  className={`font-sans font-light text-[11px] uppercase tracking-[0.25em] transition-all duration-500 relative py-2 ${
                    activeSection === link.id ? "text-vintage-red" : "text-vintage-black/40 hover:text-vintage-black"
                  }`}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <motion.span 
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-px bg-vintage-red shadow-[0_1px_4px_rgba(140,29,36,0.2)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button - Minimal */}
        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-8">
            {/* Mobile Toggle - Minimal Lines */}
            <button
              className="lg:hidden text-vintage-black p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="space-y-1.5 flex flex-col items-end">
                <span className={`block w-6 h-[1px] bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block w-4 h-[1px] bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block w-6 h-[1px] bg-current transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Minimal Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-vintage-cream backdrop-blur-xl z-[60] p-12 flex flex-col items-center justify-center gap-8"
          >
             <button
              className="absolute top-10 right-10 text-vintage-black/40 hover:text-vintage-red text-2xl font-light"
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onSectionChange(link.id);
                  setMobileOpen(false);
                }}
                className={`font-display text-4xl font-bold transition-colors ${
                  activeSection === link.id ? "text-vintage-red" : "text-vintage-black/60"
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="mt-12 w-24 h-px bg-vintage-red/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
