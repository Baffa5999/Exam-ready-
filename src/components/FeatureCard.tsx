import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  label: string;
  subtext?: string;
  href: string;
  onNavigate: (path: string) => void;
  accentColor?: string;
  variant?: 'large' | 'medium';
}

export default function FeatureCard({
  icon: Icon,
  label,
  subtext,
  href,
  onNavigate,
  accentColor = '#FF6B35',
  variant = 'medium'
}: FeatureCardProps) {
  const isLarge = variant === 'large';

  return (
    <button
      type="button"
      onClick={() => onNavigate(href)}
      className={`group flex w-full flex-col items-start rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-4 text-left text-white shadow-[0_18px_45px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 ${isLarge ? 'min-h-[156px] sm:min-h-[168px]' : 'min-h-[132px] sm:min-h-[142px]'}`}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{ backgroundColor: `${accentColor}1F`, color: accentColor }}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="mt-auto w-full pt-4">
        <h3 className="font-heading text-base font-bold leading-tight text-white">{label}</h3>
        {subtext ? (
          <p className="mt-1.5 overflow-hidden font-sans text-xs font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {subtext}
          </p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1 font-sans text-[11px] font-bold uppercase tracking-wide text-[#FFB199] transition group-hover:text-[#FF6B35]">
          Open
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
