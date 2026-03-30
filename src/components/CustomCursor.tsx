"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 60, stiffness: 2000, mass: 0.2 };
  const outX = useSpring(cursorX, springConfig);
  const outY = useSpring(cursorY, springConfig);

  // Force hide all cursors on mount to ensure custom cursor dominance
  useEffect(() => {
    document.documentElement.style.cursor = 'none';
    const all = document.querySelectorAll('*');
    all.forEach((el) => {
      (el as HTMLElement).style.cursor = 'none';
    });
  }, []);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHoverStart = () => setIsHovered(true);
    const handleHoverEnd = () => setIsHovered(false);

    window.addEventListener("mousemove", moveCursor);

    // Initial listener setup
    const interactiveElements = document.querySelectorAll('button, a, input, textarea, [role="button"]');
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleHoverStart);
      el.addEventListener("mouseleave", handleHoverEnd);
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleHoverStart);
        el.removeEventListener("mouseleave", handleHoverEnd);
      });
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          x: outX,
          y: outY,
          translateX: "-5.5px", // Offset to align SVG path tip with mouse
          translateY: "-3.5px",
        }}
        animate={{
          scale: isHovered ? 2.2 : 1.6,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Classic Pointer Arrow Shape */}
          <path 
            d="M5.5 3.5V19.5L9.5 15.5H16.5L5.5 3.5Z" 
            fill="#8c1d24" 
            stroke="white" 
            strokeWidth="0.5"
            className="drop-shadow-sm"
          />
        </svg>
      </motion.div>
    </>
  );
}
