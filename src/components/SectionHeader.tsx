import { ReactNode } from "react";

interface SectionHeaderProps {
  titleLine1: ReactNode;
  titleLine2: ReactNode;
  subtitle: string;
  tag?: string;
}

export default function SectionHeader({ titleLine1, titleLine2, subtitle, tag }: SectionHeaderProps) {
  return (
    <div className="text-center mb-16 relative z-10">
      {tag && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold-300" />
          <span className="font-sans text-[11px] font-bold text-gold-200 tracking-[0.2em] uppercase">
            {tag}
          </span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold-300" />
        </div>
      )}
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
        <span className="block text-[var(--text-on-dark)]">{titleLine1}</span>
        <span className="block font-italic text-gradient-rose-gold">{titleLine2}</span>
      </h2>
      <p className="font-serif text-lg md:text-xl font-light text-rose-100/70 leading-relaxed max-w-2xl mx-auto italic">
        {subtitle}
      </p>
    </div>
  );
}
