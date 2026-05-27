"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        // min-h-full so the photobooth home (which uses absolute positioning)
        // still gets a full-viewport container, while scrollable pages can
        // grow taller and render the footer beneath their content.
        className="w-full min-h-full"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5, filter: "blur(4px)" }}
        transition={{
          duration: 0.4,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
