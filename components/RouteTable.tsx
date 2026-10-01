import React, { useState } from 'react';
import { Search, Filter, Check, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { RouteRecommendation } from '../lib/types';
import StrategyBadge from './StrategyBadge';
import ConfidenceBadge from './ConfidenceBadge';

interface RouteTableProps {
  recommendations: RouteRecommendation[];
  onViewDetails: (route: RouteRecommendation) => void;
}

export default function RouteTable({ recommendations, onViewDetails }: RouteTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'suboptimal' | 'high-confidence'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof RouteRecommendation | 'status'; direction: 'asc' | 'desc' } | null>(null);

  // Filter
  const filteredData = recommendations.filter(rec => {
    const matchesSearch = rec.routePath.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'suboptimal') {
      return !rec.isAlreadyOptimal;
    } else if (filter === 'high-confidence') {
      return rec.confidence === 'high';
    }
    
    return true;
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    let aValue: any;
    let bValue: any;

    if (key === 'status') {
      aValue = a.isAlreadyOptimal ? 1 : 0;
      bValue = b.isAlreadyOptimal ? 1 : 0;
    } else {
      aValue = a[key];
      bValue = b[key];
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof RouteRecommendation | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="glass-card flex flex-col h-full">
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">Per-Route Analysis</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-navy-800/50 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-full sm:w-64 transition-all"
            />
          </div>
          
          <div className="flex bg-navy-800/50 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-navy-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('suboptimal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'suboptimal' ? 'bg-navy-700 text-amber-400 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              Suboptimal Only
            </button>
            <button
              onClick={() => setFilter('high-confidence')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'high-confidence' ? 'bg-navy-700 text-green-400 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              High Confidence
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-navy-800/20 text-xs uppercase text-gray-400">
              <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('routePath')}>
                <div className="flex items-center gap-1">Route <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('currentStrategy')}>
                <div className="flex items-center gap-1">Current <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('recommendedStrategy')}>
                <div className="flex items-center gap-1">Recommended <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('confidence')}>
                <div className="flex items-center gap-1">Confidence <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 font-medium">LCP Gain</th>
              <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 font-medium text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {sortedData.length > 0 ? (
              sortedData.map((route, idx) => (
                <tr 
                  key={idx} 
                  className={`group transition-colors hover:bg-white/5 ${!route.isAlreadyOptimal ? 'border-l-2 border-l-amber-500' : ''} ${route.isAlreadyOptimal ? 'text-gray-400' : 'text-gray-200'}`}
                >
                  <td className="p-4 font-mono font-medium max-w-[200px] truncate" title={route.routePath}>
                    {route.routePath || '/'}
                  </td>
                  <td className="p-4">
                    <StrategyBadge strategy={route.currentStrategy} />
                  </td>
                  <td className="p-4">
                    <StrategyBadge strategy={route.recommendedStrategy} />
                  </td>
                  <td className="p-4">
                    <ConfidenceBadge confidence={route.confidence} />
                  </td>
                  <td className="p-4">
                    <span className={`font-mono text-xs ${
                      route.estimatedLCPGain.includes('faster') ? 'text-green-400 font-semibold' : 
                      route.estimatedLCPGain.includes('slower') ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {route.estimatedLCPGain}
                    </span>
                  </td>
                  <td className="p-4">
                    {route.isAlreadyOptimal ? (
                      <span className="flex items-center text-xs text-green-500 font-medium">
                        <Check size={14} className="mr-1" /> Optimal
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-amber-500 font-medium">
                        <AlertTriangle size={14} className="mr-1" /> Suboptimal
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onViewDetails(route)}
                      className="px-3 py-1 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-xs font-medium rounded transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Filter size={32} className="opacity-20 mb-3" />
                    <p>No routes match your filters</p>
                    <button 
                      onClick={() => { setFilter('all'); setSearchTerm(''); }}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
