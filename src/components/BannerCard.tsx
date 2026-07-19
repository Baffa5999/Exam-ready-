import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface BannerCardProps {
  text: string;
  icon?: LucideIcon;
  accentColor?: string;
}

export default function BannerCard({
  text,
  icon: Icon = Sparkles,
  accentColor = '#FF6B35'
}: BannerCardProps) {
  return (
    <section className="flex items-center gap-4 rounded-[24px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{ backgroundColor: `${accentColor}1F`, color: accentColor }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <p className="min-w-0 flex-1 font-sans text-sm font-medium leading-6 text-[#C8D2E4]">
        {text}
      </p>
    </section>
  );
}
