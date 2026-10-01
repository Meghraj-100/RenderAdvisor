import React from 'react';

interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low';
}

const colors: Record<string, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
};

const dotColors: Record<string, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
};

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const colorClass = colors[confidence] || colors.low;
  const dotColorClass = dotColors[confidence] || dotColors.low;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColorClass}`}></span>
      {confidence}
    </span>
  );
}
