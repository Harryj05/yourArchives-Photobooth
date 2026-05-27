"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/hooks/useActivity";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const { user, isLoading, isConfigured, signOut } = useAuth();
  const activity = useActivity();
  const showActivity = activity && (activity.thisMonth > 0 || activity.total > 0);
  const activityTooltip = "Strips taken this month · Lifetime strips";

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);

      // Always show at top
      if (y < 10) {
        setHidden(false);
      } else if (y > lastScrollY.current + 4) {
        // Scrolling down — hide
        setHidden(true);
      } else if (y < lastScrollY.current - 4) {
        // Scrolling up — show
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 md:px-12 py-3 flex items-center justify-between border-b pointer-events-none ${
        hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      } ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-zinc-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.03)]"
          : "bg-transparent border-transparent py-6"
      }`}
    >
      {/* 1. Left Side: Logo + Brand */}
      <Link href="/" className="flex items-center gap-2.5 no-underline group shrink-0 pointer-events-auto" aria-label="yourArchives Home">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-base transition-transform group-hover:scale-110 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <span className="font-display text-xl font-black text-zinc-900 tracking-tighter">
          your<span className="text-[#8C1D24] italic font-light ml-0.5 group-hover:text-[#4A0F14] transition-colors">Archives</span>
        </span>
      </Link>

      {/* 2. Center Side: Links — absolutely centered to the viewport so they align with the photobooth */}
      <ul className="hidden lg:flex items-center gap-12 list-none pointer-events-auto absolute left-1/2 -translate-x-1/2" role="navigation" aria-label="Main navigation">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`font-sans text-[14px] tracking-[0.22em] uppercase transition-all duration-300 relative group py-2 font-bold ${
                pathname === link.href ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
              }`}
            >
              {link.label}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[#8C1D24] transition-all duration-500 ${pathname === link.href ? "w-4" : "w-0 group-hover:w-2"}`} />
            </Link>
          </li>
        ))}
        {user && (
          <li>
            <Link
              href="/vault"
              className={`font-sans text-[14px] tracking-[0.22em] uppercase transition-all duration-300 relative group py-2 font-bold ${
                pathname === "/vault" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Vault
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[#8C1D24] transition-all duration-500 ${pathname === "/vault" ? "w-4" : "w-0 group-hover:w-2"}`} />
            </Link>
          </li>
        )}
      </ul>

      {/* 3. Right Side: Auth + Interaction */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* Auth controls — desktop */}
        {!isLoading && isConfigured && (
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex flex-col items-end">
                  <Link
                    href="/settings"
                    className="font-sans text-[13px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-900 truncate max-w-[200px] transition-colors"
                    title={user.email ?? ""}
                  >
                    {user.email}
                  </Link>
                  {showActivity && (
                    <span
                      className="font-sans text-xs text-zinc-500 opacity-60 mt-0.5 cursor-help"
                      title={activityTooltip}
                      aria-label={activityTooltip}
                    >
                      {activity!.thisMonth} this month · {activity!.total} total
                    </span>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="font-sans text-[14px] tracking-[0.22em] uppercase text-zinc-400 hover:text-[#8C1D24] transition-colors font-bold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="font-sans text-[14px] tracking-[0.22em] uppercase text-zinc-900 hover:text-[#8C1D24] transition-colors font-bold"
              >
                Sign In
              </Link>
            )}
          </div>
        )}

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
        <div className="absolute top-[calc(100%+1px)] left-0 right-0 bg-white/95 backdrop-blur-3xl border-b border-zinc-200/50 lg:hidden py-12 px-8 flex flex-col gap-6 animate-fade-up pointer-events-auto">
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
          {user && (
            <Link
              href="/vault"
              className={`font-display text-3xl font-bold tracking-tight transition-all ${
                pathname === "/vault" ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-900"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              Vault
            </Link>
          )}
          {!isLoading && isConfigured && (
            <div className="pt-6 border-t border-zinc-200/50">
              {user ? (
                <>
                  <p className="font-sans text-xs text-zinc-500 truncate">{user.email}</p>
                  {showActivity && (
                    <p
                      className="font-sans text-xs text-zinc-500 opacity-60 mb-3"
                      title={activityTooltip}
                    >
                      {activity!.thisMonth} this month · {activity!.total} total
                    </p>
                  )}
                  {!showActivity && <div className="mb-3" />}
                  <button
                    onClick={() => { setMobileOpen(false); signOut(); }}
                    className="font-sans text-sm uppercase tracking-widest text-[#8C1D24] font-bold"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="font-sans text-sm uppercase tracking-widest text-zinc-900 font-bold"
                >
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
