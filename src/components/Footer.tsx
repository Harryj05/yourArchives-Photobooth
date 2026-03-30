"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border-subtle)] bg-burgundy-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 no-underline mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-wine-600 to-rose-400 rounded-lg flex items-center justify-center text-sm">
                📷
              </div>
              <span className="font-display text-lg font-bold text-[var(--text-on-dark)] tracking-tight">
                your<span className="text-rose-300">Archives</span>
              </span>
            </Link>
            <p className="font-serif text-sm text-rose-200/60 leading-relaxed max-w-xs italic">
              Preserving memories, media, and personal history in beautiful interactive archives. Your story, forever captured.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-sans text-[11px] font-bold text-rose-300 tracking-[0.14em] uppercase mb-5">Product</h4>
            <ul className="list-none flex flex-col gap-3">
              {["Gallery", "Create Archive", "Dashboard", "Archive Viewer", "Pricing"].map((item) => (
                <li key={item}>
                  <Link href="#" className="font-sans text-sm text-rose-200/70 no-underline transition-colors hover:text-gold-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-sans text-[11px] font-bold text-rose-300 tracking-[0.14em] uppercase mb-5">Company</h4>
            <ul className="list-none flex flex-col gap-3">
              {["About", "Blog", "Careers", "Press Kit", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="font-sans text-sm text-rose-200/70 no-underline transition-colors hover:text-gold-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-sans text-[11px] font-bold text-rose-300 tracking-[0.14em] uppercase mb-5">Stay Updated</h4>
            <p className="font-serif text-sm text-rose-200/60 mb-4 italic">Get the latest on memory preservation.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-lg bg-wine-800/60 border border-[var(--border-subtle)] text-sm text-rose-100 placeholder:text-rose-200/40 focus:outline-none focus:border-gold-300/50 transition-colors font-sans"
                aria-label="Email address"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-wine-600 to-rose-400 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 min-w-[44px]"
                aria-label="Subscribe"
              >
                →
              </button>
            </form>
            <div className="flex gap-4 mt-6">
              {["𝕏", "IG", "YT", "LI"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full bg-wine-800/50 border border-[var(--border-subtle)] flex items-center justify-center text-xs text-rose-200/60 no-underline transition-all hover:bg-wine-700/50 hover:text-gold-200"
                  aria-label={social}
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border-subtle)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[10px] text-rose-200/40 uppercase tracking-widest">
            © 2026 yourArchives. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <Link
                key={item}
                href="#"
                className="font-sans text-[10px] text-rose-200/40 no-underline hover:text-rose-200/70 transition-colors uppercase tracking-widest"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
