import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  accentColor?: string;
  backgroundColor?: string;
}

export default function StatCard({
  icon: Icon,
  value,
  label,
  accentColor = '#FF6B35',
  backgroundColor = 'rgba(255,107,53,0.12)'
}: StatCardProps) {
  return (
    <article className="flex flex-col items-center gap-2.5 rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[#111827]/85 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-2xl"
        style={{ backgroundColor, color: accentColor }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-heading text-xl font-bold leading-none text-white">{value}</p>
      <p className="font-sans text-[11px] font-semibold leading-4 text-[#8B9CB8]">{label}</p>
    </article>
  );
}
