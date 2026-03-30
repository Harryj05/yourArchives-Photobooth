import { ReactNode } from "react";
import Link from "next/link";
import { motion, HTMLMotionProps } from "framer-motion";

const MotionLink = motion.create(Link);

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "variant"> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "glow";
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
  const baseStyles = "inline-flex items-center justify-center gap-2.5 font-sans text-sm rounded-full tracking-wider uppercase transition-colors duration-300 min-h-[44px]";
  
  const variants = {
    primary:
      "font-medium text-burgundy-900 bg-gradient-to-br from-gold-300 to-gold-400 px-8 py-3.5 hover:shadow-[0_8px_30px_rgba(201,162,39,0.4)] shadow-[0_4px_20px_rgba(201,162,39,0.2)]",
    ghost:
      "font-normal text-rose-200 bg-wine-800/30 border border-white/10 px-8 py-3.5 hover:bg-wine-700/40 hover:border-rose-400/50 hover:text-rose-100",
    glow:
      "font-medium text-white bg-gradient-to-br from-rose-400 to-wine-600 px-8 py-4 shadow-[0_4px_16px_rgba(168,34,85,0.4)] hover:shadow-[0_8px_32px_rgba(168,34,85,0.6)] animate-pulse-glow",
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  const motionProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  };

  if (href) {
    return (
      <MotionLink href={href} className={combinedClassName} {...motionProps}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button className={combinedClassName} {...props} {...motionProps}>
      {children}
    </motion.button>
  );
}
