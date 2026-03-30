"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout" initial={true}>
      <motion.div
        key={pathname}
        className="absolute inset-0 w-full h-full will-change-[transform,opacity,filter]"
        initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
        transition={{ 
          duration: 0.6, 
          ease: [0.22, 1, 0.36, 1] // High-end quintic out
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
