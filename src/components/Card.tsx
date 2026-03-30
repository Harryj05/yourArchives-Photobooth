import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

export default function Card({ children, className = "", glowOnHover = true }: CardProps) {
  return (
    <div
      className={`relative group bg-burgundy-900/40 backdrop-blur-sm border border-[var(--border-subtle)] rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(10,0,5,0.4)] hover:bg-wine-800/40 ${className}`}
    >
      {glowOnHover && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
