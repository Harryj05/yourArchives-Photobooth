"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Minimal site footer. Only rendered on routes that scroll — the photobooth
 * home page uses absolute positioning, which collapses normal flow and would
 * cause the footer to overlap the navbar.
 */
const ROUTES_WITHOUT_FOOTER = new Set<string>(["/"]);

export default function Footer() {
  const pathname = usePathname();
  if (ROUTES_WITHOUT_FOOTER.has(pathname)) return null;

  return (
    <footer className="w-full border-t border-zinc-200/60 py-10 px-6 bg-white/40 backdrop-blur-sm mt-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-base font-black text-zinc-900 tracking-tighter">
            your<span className="text-[#8C1D24] italic font-light ml-0.5">Archives</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className="font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Terms
          </Link>
        </nav>

        <p className="font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-400">
          © {new Date().getFullYear()} yourArchives
        </p>
      </div>
    </footer>
  );
}
