"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 60, stiffness: 2000, mass: 0.2 };
  const outX = useSpring(cursorX, springConfig);
  const outY = useSpring(cursorY, springConfig);

  // Only enable the custom cursor on devices with a fine pointer (mouse /
  // trackpad). Touch devices (phones, tablets) fall back to the native
  // system cursor — keeps the red arrow from floating on mobile and avoids
  // the mousemove listener that does nothing on touch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setIsFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isFinePointer) return;

    const moveCursor = (e: MouseEvent) => {
      // The html element is `zoom: 0.67` on desktop (≥1024px), so mouse
      // coordinates (reported in scaled pixels) must be divided by the
      // scale factor to land the cursor at the correct visual position.
      const scaleVar = getComputedStyle(document.documentElement)
        .getPropertyValue("--booth-scale")
        .trim();
      const scale = parseFloat(scaleVar) || 1;
      cursorX.set(e.clientX / scale);
      cursorY.set(e.clientY / scale);
    };

    const handleHoverStart = () => setIsHovered(true);
    const handleHoverEnd = () => setIsHovered(false);

    window.addEventListener("mousemove", moveCursor);

    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, [role="button"]',
    );
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
  }, [isFinePointer, cursorX, cursorY]);

  if (!isFinePointer) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 z-[2147483647] pointer-events-none"
      style={{
        x: outX,
        y: outY,
        translateX: "-5.5px",
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
        focusable="false"
      >
        <path
          d="M5.5 3.5V19.5L9.5 15.5H16.5L5.5 3.5Z"
          fill="#8c1d24"
          stroke="white"
          strokeWidth="0.5"
          className="drop-shadow-sm"
        />
      </svg>
    </motion.div>
  );
}
