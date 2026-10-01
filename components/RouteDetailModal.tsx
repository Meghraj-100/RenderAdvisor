import React, { useEffect } from 'react';
import { X, ArrowRight, BookOpen, Code, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { RouteRecommendation } from '../lib/types';
import StrategyBadge from './StrategyBadge';
import ConfidenceBadge from './ConfidenceBadge';

interface RouteDetailModalProps {
  route: RouteRecommendation | null;
  onClose: () => void;
}

export default function RouteDetailModal({ route, onClose }: RouteDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (route) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [route]);

  if (!route) return null;

  const maxScore = Math.max(...Object.values(route.scores));

  const getHowToFix = (current: string, recommended: string) => {
    if (current === recommended || current === 'unknown') return null;

    const fixes: Record<string, { title: string; code: string }> = {
      'CSR_SSG': {
        title: 'Replace useEffect fetch with getStaticProps',
        code: `export async function getStaticProps() {
  const data = await fetch('...').then(r => r.json());
  return { props: { data } };
}`
      },
      'SSR_ISR': {
        title: 'Add revalidate to getServerSideProps (switch to getStaticProps) or Route Segment Config',
        code: `export const revalidate = 3600; // revalidate every hour

// or with pages router:
export async function getStaticProps() {
  return { props: { data }, revalidate: 3600 };
}`
      },
      'CSR_SSR': {
        title: 'Move data fetching to getServerSideProps',
        code: `export async function getServerSideProps(context) {
  const data = await fetch('...', { headers: context.req.headers }).then(r => r.json());
  return { props: { data } };
}`
      },
      'SSG_CSR': {
        title: 'This page needs client-side interactivity, use SWR or React Query',
        code: `import useSWR from 'swr';

function Profile() {
  const { data, error } = useSWR('/api/user', fetcher);
  // ...
}`
      },
      'SSG_ISR': {
        title: 'Add a revalidation period to getStaticProps or Segment Config',
        code: `export const revalidate = 60; // seconds`
      },
      'SSR_SSG': {
        title: 'Change getServerSideProps to getStaticProps',
        code: `export async function getStaticProps() {
  // ...
}`
      }
    };

    const key = `${current}_${recommended}`;
    return fixes[key] || { title: `Refactor ${current} patterns to ${recommended}`, code: `// Follow Next.js docs for ${recommended} implementation` };
  };

  const fix = getHowToFix(route.currentStrategy, route.recommendedStrategy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-900/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close modal"
      ></div>
      
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-navy-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-navy-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white font-mono truncate max-w-[280px] sm:max-w-md">
                {route.routePath || '/'}
              </h2>
              <ConfidenceBadge confidence={route.confidence} />
            </div>
            <p className="text-sm text-gray-400 font-mono truncate max-w-[300px] sm:max-w-md">
              {route.filePath}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-8 flex-grow custom-scrollbar">
          
          {/* Strategy Comparison */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 p-6 bg-navy-900/50 rounded-xl border border-white/5">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2 font-medium">Current Strategy</p>
              <StrategyBadge strategy={route.currentStrategy} />
            </div>
            
            <ArrowRight size={24} className="text-gray-600 hidden sm:block" />
            <ArrowRight size={24} className="text-gray-600 rotate-90 sm:hidden" />
            
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2 font-medium">Recommended</p>
              <StrategyBadge strategy={route.recommendedStrategy} />
            </div>
            
            <div className="ml-0 sm:ml-4 flex items-center justify-center">
              {route.isAlreadyOptimal ? (
                <div className="flex items-center text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                  <CheckCircle2 size={18} className="mr-2" />
                  <span className="text-sm font-medium">Already Optimal</span>
                </div>
              ) : (
                <div className="flex items-center text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  <AlertCircle size={18} className="mr-2" />
                  <span className="text-sm font-medium">Suboptimal — {route.estimatedLCPGain}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Scores & Patterns */}
            <div className="space-y-8">
              {/* Score Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Terminal size={18} className="mr-2 text-blue-400" /> Score Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(route.scores).sort((a, b) => b[1] - a[1]).map(([strategy, score]) => (
                    <div key={strategy}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-300">{strategy}</span>
                        <span className="text-gray-400">{score.toFixed(1)} / 10</span>
                      </div>
                      <div className="w-full bg-navy-900 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${strategy === route.recommendedStrategy ? 'bg-blue-500' : 'bg-gray-600'}`} 
                          style={{ width: `${(score / maxScore) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detected Patterns */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Code size={18} className="mr-2 text-teal-400" /> Detected Patterns
                </h3>
                <ul className="space-y-2">
                  {route.detectedPatterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start bg-navy-900/50 p-2.5 rounded border border-white/5 font-mono">
                      <span className="text-teal-500 mr-2">›</span>
                      {pattern}
                    </li>
                  ))}
                  {route.detectedPatterns.length === 0 && (
                    <li className="text-sm text-gray-500 italic">No specific rendering patterns detected</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Right Column: Reasoning & Fix */}
            <div className="space-y-8">
              {/* Reasoning */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BookOpen size={18} className="mr-2 text-purple-400" /> Reasoning
                </h3>
                <ul className="space-y-3">
                  {route.reasoning.map((reason, idx) => {
                    const isCitation = reason.startsWith('Reference:') || reason.startsWith('Override:');
                    return (
                      <li key={idx} className={`text-sm flex items-start ${isCitation ? 'text-blue-300 bg-blue-900/10 p-3 rounded-lg border border-blue-500/20' : 'text-gray-300'}`}>
                        {!isCitation && <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 mr-2 flex-shrink-0"></span>}
                        <span>{reason}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* How to Fix */}
              {fix && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <AlertCircle size={18} className="mr-2 text-amber-400" /> How to fix
                  </h3>
                  <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl overflow-hidden">
                    <div className="bg-amber-900/30 px-4 py-2 border-b border-amber-500/20">
                      <p className="text-sm text-amber-300 font-medium">{fix.title}</p>
                    </div>
                    <div className="p-4 bg-navy-950 overflow-x-auto">
                      <pre className="text-sm text-gray-300 font-mono">
                        <code>{fix.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-navy-900/80 text-center">
          <p className="text-xs text-gray-500">
            Powered by RenderAdvisor Analysis Engine • Performance-Calibrated Decision Engine
          </p>
        </div>
      </div>
    </div>
  );
}
