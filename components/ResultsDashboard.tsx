'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, BarChart3 } from 'lucide-react';
import { AnalysisResult, RouteRecommendation } from '../lib/types';
import SummaryCards from './SummaryCards';
import StrategyChart from './StrategyChart';
import RouteTable from './RouteTable';
import RouteDetailModal from './RouteDetailModal';

interface ResultsDashboardProps {
  data: AnalysisResult;
}

export default function ResultsDashboard({ data }: ResultsDashboardProps) {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState<RouteRecommendation | null>(null);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-sm text-gray-400 hover:text-blue-400 transition-colors mb-4"
          >
            <ArrowLeft size={16} className="mr-1" /> Analyze another project
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white font-mono break-all line-clamp-1">{data.projectName}</h1>
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium text-gray-300">
              {data.totalRoutes} routes
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Analyzed at {formatDate(data.analyzedAt)}</span>
          </div>
        </div>
        
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <BarChart3 className="text-blue-400" size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Analysis Confidence</p>
            <p className="text-xl font-bold text-white">
              {data.totalRoutes > 0 ? Math.round((data.recommendations.filter(r => r.confidence === 'high').length / data.totalRoutes) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500">
              {data.recommendations.filter(r => r.confidence === 'high').length} of {data.totalRoutes} routes
            </p>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <SummaryCards summary={data.summary} totalRoutes={data.totalRoutes} />

      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-6">Strategy Distribution</h3>
          <div className="flex-grow flex items-center justify-center">
            <StrategyChart summary={data.summary} />
          </div>
        </div>
        
        <div className="lg:col-span-3 glass-card p-6 flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-white mb-4">Analysis Insights</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/50 border border-white/5">
              <div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg mt-1 shrink-0">
                <span className="font-bold text-lg">{data.summary.SSG}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-200">Static Generation Potential</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Routes identified as primarily static content. Moving these to SSG can improve LCP by up to 420ms based on empirical benchmarks.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/50 border border-white/5">
              <div className="bg-purple-500/10 text-purple-500 p-2 rounded-lg mt-1 shrink-0">
                <span className="font-bold text-lg">{data.summary.SSR}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-200">Server Rendering Required</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Routes requiring request-time personalization or authentication. Recommended for dynamic, SEO-critical content.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/50 border border-white/5">
              <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg mt-1 shrink-0">
                <span className="font-bold text-lg">{data.totalRoutes - data.summary.alreadyOptimal}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-200">Suboptimal Routes</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Routes where the current rendering strategy deviates from the recommended optimal strategy based on the AST analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <RouteTable 
        recommendations={data.recommendations} 
        onViewDetails={(route) => setSelectedRoute(route)} 
      />

      {/* Detail Modal */}
      <RouteDetailModal 
        route={selectedRoute} 
        onClose={() => setSelectedRoute(null)} 
      />
    </div>
  );
}
