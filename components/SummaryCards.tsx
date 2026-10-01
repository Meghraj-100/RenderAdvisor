import React from 'react';
import { Zap, Server, RefreshCw, Monitor } from 'lucide-react';
import { AnalysisResult } from '../lib/types';

interface SummaryCardsProps {
  summary: AnalysisResult['summary'];
  totalRoutes: number;
}

export default function SummaryCards({ summary, totalRoutes }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Static Generation',
      strategy: 'SSG',
      count: summary.SSG,
      icon: Zap,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Server Rendering',
      strategy: 'SSR',
      count: summary.SSR,
      icon: Server,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      title: 'Incremental',
      strategy: 'ISR',
      count: summary.ISR,
      icon: RefreshCw,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Client Rendering',
      strategy: 'CSR',
      count: summary.CSR,
      icon: Monitor,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const percentage = totalRoutes > 0 ? Math.round((card.count / totalRoutes) * 100) : 0;
        const Icon = card.icon;
        
        return (
          <div key={card.strategy} className={`glass-card p-6 border-l-4 ${card.border} hover:-translate-y-1 transition-transform duration-300`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold text-white">{card.count}</span>
                  <span className="text-gray-500 text-sm ml-2">/ {totalRoutes} routes</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-full bg-navy-800 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${card.color.replace('text-', 'bg-')}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 ml-3 min-w-[3ch]">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
