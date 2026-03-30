import Button from "./Button";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: PricingFeature[];
  isPopular?: boolean;
  ctaText: string;
  href: string;
}

export default function PricingCard({
  title,
  price,
  description,
  features,
  isPopular = false,
  ctaText,
  href,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 ${
        isPopular
          ? "bg-gradient-to-br from-wine-700 to-burgundy-800 border-rose-400/40 shadow-[0_20px_60px_rgba(107,16,48,0.4)] hover:shadow-[0_24px_60px_rgba(107,16,48,0.6)]"
          : "bg-burgundy-900/40 border border-[var(--border-subtle)] hover:shadow-[0_24px_60px_rgba(10,0,5,0.4)]"
      }`}
    >
      {isPopular && (
        <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-gradient-to-br from-gold-300 to-gold-400 font-sans text-[10px] font-bold text-burgundy-900 tracking-[0.08em] uppercase">
          Most Popular
        </div>
      )}

      <h3 className="font-sans text-[11px] font-bold text-rose-300 tracking-[0.14em] uppercase mb-4">
        {title}
      </h3>
      <div className="mb-2">
        <span className="font-display text-5xl font-black text-[var(--text-on-dark)] leading-none tracking-tight">
          {price !== "Free" ? <sup className="text-2xl font-normal top-[-0.5em] relative opacity-70">$</sup> : ""}
          {price}
        </span>
      </div>
      <p className="font-serif text-sm text-rose-200/60 mb-6 italic leading-relaxed">{description}</p>
      
      <div className="h-px w-full bg-[var(--border-subtle)] mb-6" />

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {feature.included ? (
              <span className="text-gold-300 shrink-0 mt-0.5" aria-hidden="true">✓</span>
            ) : (
              <span className="text-wine-600 shrink-0 mt-0.5" aria-hidden="true">✕</span>
            )}
            <span
              className={`font-serif text-sm font-light leading-relaxed ${
                feature.included ? "text-rose-100" : "text-rose-200/40"
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={isPopular ? "primary" : "ghost"}
        href={href}
        className="w-full mt-auto"
      >
        {ctaText}
      </Button>
    </div>
  );
}
