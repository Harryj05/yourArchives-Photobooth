"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 md:px-12 py-3 flex items-center justify-between border-b ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-zinc-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.03)]"
          : "bg-transparent border-transparent py-6"
      }`}
    >
      {/* 1. Left Side: Logo + Brand */}
      <Link href="/" className="flex items-center gap-2.5 no-underline group shrink-0" aria-label="yourArchives Home">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-base transition-transform group-hover:scale-110 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <span className="font-display text-xl font-black text-zinc-900 tracking-tighter">
          your<span className="text-[#8C1D24] italic font-light ml-0.5 group-hover:text-[#4A0F14] transition-colors">Archives</span>
        </span>
      </Link>

      {/* 2. Center Side: Links */}
      <ul className="hidden lg:flex items-center gap-12 list-none" role="navigation" aria-label="Main navigation">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`font-sans text-[11px] tracking-[0.25em] uppercase transition-all duration-300 relative group py-2 font-bold ${
                pathname === link.href ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
              }`}
            >
              {link.label}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[#8C1D24] transition-all duration-500 ${pathname === link.href ? "w-4" : "w-0 group-hover:w-2"}`} />
            </Link>
          </li>
        ))}
      </ul>

      {/* 3. Right Side: Interaction (Minimal) */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Icon */}
        <button
          className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.2 bg-zinc-100/50 border border-zinc-200/50 rounded-xl hover:bg-zinc-200/50 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className={`block w-4 h-[1.5px] bg-zinc-900 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-4 h-[1.5px] bg-zinc-900 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-4 h-[1.5px] bg-zinc-900 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="absolute top-[calc(100%+1px)] left-0 right-0 bg-white/95 backdrop-blur-3xl border-b border-zinc-200/50 lg:hidden py-12 px-8 flex flex-col gap-6 animate-fade-up">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-display text-3xl font-bold tracking-tight transition-all ${
                pathname === link.href ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-900"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
