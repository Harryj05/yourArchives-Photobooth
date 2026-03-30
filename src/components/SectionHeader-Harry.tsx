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
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-6 bg-vintage-red/30" />
          <span className="text-label text-vintage-red font-medium">
            {tag}
          </span>
          <div className="h-px w-6 bg-vintage-red/30" />
        </div>
      )}
      <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
        <span className="block text-vintage-black">{titleLine1}</span>
        <span className="block text-vintage-red editorial-font italic font-light">{titleLine2}</span>
      </h2>
      <p className="text-editorial text-lg md:text-xl text-vintage-black/60 leading-relaxed max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
}
