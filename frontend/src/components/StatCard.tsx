// frontend/src/components/StatCard.tsx

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color?: 'navy' | 'red' | 'gold' | 'green' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs transition-all duration-150 touch-action-manipulation ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="p-1 sm:p-1.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100 shrink-0">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div className="mt-1.5 sm:mt-2.5">
        <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </div>
        {subValue && (
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
};
