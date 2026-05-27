"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutSection() {
  return (
    <div className="w-full flex items-center justify-center py-32 px-6 bg-transparent">
      <div className="max-w-2xl w-full flex flex-col items-center text-center">
        
        {/* The Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-40 h-40 md:w-48 md:h-48 mb-12"
        >
          {/* Soft ambient glow behind image */}
          <div className="absolute inset-x-4 -inset-y-4 bg-zinc-300/30 rounded-full blur-2xl z-0" />
          
          <div
            className="relative w-full h-full rounded-[2rem] overflow-hidden z-10"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            <Image
              src="/images/oshi.jpg"
              alt="Oshi Jain"
              priority
              fill
              className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 160px, 192px"
            />
            {/* Soft inner reflection */}
            <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] pointer-events-none" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display font-bold text-3xl md:text-4xl text-zinc-800 tracking-tight mb-6"
        >
          About
        </motion.h2>

        {/* Body Text */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-sans text-[15px] md:text-[17px] text-zinc-500 leading-relaxed max-w-lg mx-auto font-medium"
        >
          This website is based on the creative idea of Oshi Jain — a simple, elegant space made to capture moments in a beautiful and memorable way.
        </motion.p>
        
        {/* Delicate Separator */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-8 h-[1px] bg-zinc-300 my-10"
        />

        {/* Credits & Instagram */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-black text-zinc-400">
            Concept by Oshi Jain
          </span>
          <a 
            href="https://instagram.com/miss.tinyyyyyy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[13px] font-sans font-bold text-zinc-400 hover:text-[#8C1D24] transition-colors duration-300 relative group flex items-center gap-1.5"
          >
            {/* Subtle elegant instagram icon */ }
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            @miss.tinyyyyyy
          </a>
        </motion.div>

        {/* Privacy Policy */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 max-w-sm"
        >
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-4">Privacy</h3>
          <p className="text-[12px] text-zinc-500 leading-relaxed font-sans font-medium">
            yourArchives respects your privacy. We do not store your photos on our servers beyond your active session. No personal data is collected or shared with third parties.
          </p>
        </motion.div>

        {/* Footer / Copyright */}
        <motion.footer 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-24 pt-8 border-t border-zinc-100 w-full flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-sans text-zinc-900 tracking-widest uppercase font-bold">
            © 2024 yourArchives. All rights reserved.
          </span>
          <span className="text-[9px] font-sans text-zinc-500 tracking-[0.3em] uppercase italic font-medium">
            Made with Elegance
          </span>
        </motion.footer>
      </div>
    </div>
  );
}
