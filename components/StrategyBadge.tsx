import React from 'react';

interface StrategyBadgeProps {
  strategy: string;
}

const colors: Record<string, string> = {
  SSG: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SSR: 'bg-purple-100 text-purple-800 border-purple-200',
  ISR: 'bg-blue-100 text-blue-800 border-blue-200',
  CSR: 'bg-amber-100 text-amber-800 border-amber-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function StrategyBadge({ strategy }: StrategyBadgeProps) {
  const colorClass = colors[strategy] || colors.unknown;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {strategy}
    </span>
  );
}
