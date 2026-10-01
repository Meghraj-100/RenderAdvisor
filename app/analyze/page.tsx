'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ResultsDashboard from '../../components/ResultsDashboard';
import { AnalysisResult } from '../../lib/types';

export default function AnalyzePage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read from session storage on mount
    const stored = sessionStorage.getItem('analysisResult');
    
    if (!stored) {
      // If no data, redirect to home
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AnalysisResult;
      
      // Basic validation
      if (!parsed.projectName || !parsed.recommendations) {
        throw new Error('Invalid analysis data format');
      }
      
      setData(parsed);
    } catch (err) {
      console.error('Failed to parse analysis result:', err);
      sessionStorage.removeItem('analysisResult');
      setError('Analysis data was corrupted. Please try analyzing your project again.');
    }
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="glass-card p-8 max-w-md w-full text-center border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Data Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin-slow text-blue-500 mb-4" size={40} />
        <p className="text-gray-400 animate-pulse-slow">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResultsDashboard data={data} />
    </div>
  );
}
