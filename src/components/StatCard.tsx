import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  accentColor?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function StatCard({
  value,
  label,
  accentColor = '#2EC4B6',
  backgroundColor = 'rgba(46, 196, 182, 0.12)',
  children
}: StatCardProps) {
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* Progress Ring Container */}
      <div className="flex flex-col items-center gap-4">
        {children ? (
          <div className="flex-shrink-0">
            {children}
          </div>
        ) : null}
        
        <div className="text-center">
          <p className="font-heading text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 font-sans text-sm font-normal text-[#8B9CB8]">{label}</p>
        </div>
      </div>
    </div>
  );
}
