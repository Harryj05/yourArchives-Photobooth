import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

export default function Card({ children, className = "", glowOnHover = true }: CardProps) {
  return (
    <div
      className={`relative group bg-white/20 backdrop-blur-sm border border-vintage-black/5 rounded-[2px] p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_40px_100px_rgba(0,0,0,0.05)] ${className}`}
    >
      {glowOnHover && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-vintage-red/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
