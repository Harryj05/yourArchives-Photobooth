import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "glow" | "outline";
  href?: string;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  href,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2.5 text-label transition-all rounded-[2px] min-h-[44px]";
  
  const variants = {
    primary:
      "bg-vintage-red text-vintage-cream px-8 py-3.5 hover:bg-vintage-burgundy",
    ghost:
      "text-vintage-silver bg-vintage-black border border-vintage-silver/10 px-8 py-3.5 hover:bg-vintage-silver/5 hover:text-vintage-cream",
    glow:
      "text-vintage-cream bg-vintage-red px-8 py-4 shadow-[0_4px_16px_rgba(140,29,36,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(140,29,36,0.4)] animate-subtle-glow",
    outline:
      "border border-vintage-silver/20 text-vintage-silver px-8 py-3.5 hover:border-vintage-red hover:text-vintage-red",
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
