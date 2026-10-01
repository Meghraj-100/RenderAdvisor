'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, FileCode, CheckCircle, ExternalLink, AlertCircle, X } from 'lucide-react';
import InputForm from '../components/InputForm';
import { AnalysisResult } from '../lib/types';

export default function LandingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisStart = () => {
    setError(null);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    // Store in sessionStorage and navigate
    sessionStorage.setItem('analysisResult', JSON.stringify(result));
    router.push('/analyze');
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in pt-12">

        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-balance">
          Find the <span className="gradient-text">perfect rendering strategy</span> for every page
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
          Paste a GitHub URL or upload your Next.js project. Get per-route SSG, SSR, ISR, and CSR recommendations backed by peer-reviewed performance research.
        </p>

        {/* Error Toast */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-left animate-slide-up">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <h3 className="text-red-400 font-medium">Analysis Failed</h3>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Input Form Area */}
        <div className="max-w-3xl mx-auto text-left w-full">
          <InputForm 
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
            onError={setError}
          />
        </div>
      </div>

      {/* How it Works */}
      <div className="w-full max-w-5xl mx-auto py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold text-center mb-12 text-white">How RenderAdvisor Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-teal-500/0 -z-10"></div>
          
          <div className="glass-card p-6 flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Layers size={28} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">1. Submit project</h3>
            <p className="text-sm text-gray-400">
              Provide a public GitHub URL or upload a ZIP file containing your Next.js application codebase.
            </p>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <FileCode size={28} className="text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">2. Static AST analysis</h3>
            <p className="text-sm text-gray-400">
              Our engine parses the Abstract Syntax Tree to extract 5 key signals: data freshness, auth, SEO, interactivity, and frequency.
            </p>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              <CheckCircle size={28} className="text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">3. Get recommendations</h3>
            <p className="text-sm text-gray-400">
              A weighted scoring model computes the optimal rendering strategy with confidence scores and reasoning.
            </p>
          </div>
        </div>
      </div>

      {/* Research Basis */}
      <div className="w-full py-16 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Grounded in Peer-Reviewed Research</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The decision engine weights and LCP gain estimates are derived directly from empirical web performance benchmarks and research studies.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-2 border-l-blue-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">2024</span>
              <ExternalLink size={16} className="text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1 line-clamp-2" title="Comparison of Web Page Rendering Methods Based on Next.js Framework Using Page Loading Time Test">
              Comparison of Web Page Rendering Methods Based on Next.js
            </h3>
            <p className="text-sm text-gray-400 font-mono mb-4">Hanafi et al. · TEKNIKA</p>
            <p className="text-sm text-gray-300 border-t border-white/10 pt-4">
              Provides the quantitative baseline showing SSG is 57.41% faster than CSR, establishing LCP performance reference values.
            </p>
          </div>

          <div className="glass-card p-6 border-l-2 border-l-purple-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">2025</span>
              <ExternalLink size={16} className="text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1 line-clamp-2" title="Performance Optimization Strategies for Large-scale Web Applications using Next.js">
              Performance Optimization Strategies for Large-scale Web Apps
            </h3>
            <p className="text-sm text-gray-400 font-mono mb-4">Savenko & Babii · IEEE Access</p>
            <p className="text-sm text-gray-300 border-t border-white/10 pt-4">
              Establishes the routing context rules, specifically the hard requirement for CSR on private authenticated dashboards.
            </p>
          </div>

          <div className="glass-card p-6 border-l-2 border-l-teal-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-1 rounded">2026</span>
              <ExternalLink size={16} className="text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1 line-clamp-2" title="Comparative Analysis of Next.js and Astro Frameworks">
              Comparative Analysis of Next.js and Astro Frameworks
            </h3>
            <p className="text-sm text-gray-400 font-mono mb-4">Gieda & Miłosz · JCSI</p>
            <p className="text-sm text-gray-300 border-t border-white/10 pt-4">
              Informs the interactivity weighting, highlighting how hooks and state management degrade performance if misaligned with rendering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
