// frontend/src/components/Badge.tsx

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantMap = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-[#0e3a7c] border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    gold: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
