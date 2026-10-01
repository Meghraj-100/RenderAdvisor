'use client';

import React, { useState, useCallback } from 'react';
import { Github, UploadCloud, Loader2, FileArchive } from 'lucide-react';
import { AnalysisResult } from '../lib/types';

interface InputFormProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onError: (message: string) => void;
}

export default function InputForm({ onAnalysisStart, onAnalysisComplete, onError }: InputFormProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'github' | 'zip'>('github');

  const analyzeGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setIsAnalyzing(true);
    onAnalysisStart();
    setProgressMsg('Connecting to GitHub...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'github', url: githubUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze repository');
      }

      setProgressMsg('Computing recommendations...');
      const result: AnalysisResult = await response.json();
      onAnalysisComplete(result);
    } catch (error: any) {
      onError(error.message || 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleZipFile(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleZipFile(e.target.files[0]);
    }
  };

  const handleZipFile = async (file: File) => {
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      onError('Please upload a valid .zip file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('ZIP file too large. Maximum size is 10MB.');
      return;
    }

    setIsAnalyzing(true);
    onAnalysisStart();
    setProgressMsg('Reading ZIP file...');

    try {
      // Read file as base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      setProgressMsg('Extracting Next.js project routes...');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'zip', data: base64, filename: file.name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze ZIP file');
      }

      setProgressMsg('Computing recommendations...');
      const result: AnalysisResult = await response.json();
      onAnalysisComplete(result);
    } catch (error: any) {
      onError(error.message || 'An unexpected error occurred while processing ZIP');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden transition-all duration-500">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'github' ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
          onClick={() => setActiveTab('github')}
        >
          <Github size={18} />
          GitHub Repository
        </button>
        <button
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'zip' ? 'bg-teal-500/10 text-teal-400 border-b-2 border-teal-500' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
          onClick={() => setActiveTab('zip')}
        >
          <FileArchive size={18} />
          ZIP Upload
        </button>
      </div>

      <div className="p-8 relative min-h-[220px]">
        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in">
            <Loader2 className="animate-spin-slow text-blue-500 mb-4" size={40} />
            <h3 className="text-xl font-medium text-white mb-2">Analyzing Project</h3>
            <p className="text-gray-400 text-sm animate-pulse-slow">{progressMsg}</p>
          </div>
        )}

        {/* GitHub Form */}
        {activeTab === 'github' && (
          <form onSubmit={analyzeGithub} className="space-y-6 animate-fade-in">
            <div>
              <label htmlFor="github-url" className="block text-sm font-medium text-gray-300 mb-2">
                Public Repository URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Github className="text-gray-500" size={18} />
                </div>
                <input
                  type="url"
                  id="github-url"
                  placeholder="https://github.com/vercel/next.js/tree/canary/examples/blog-starter"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="input-field pl-10"
                  required
                  disabled={isAnalyzing}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Supports Next.js 13+ App Router and Pages Router. Free tier limits analysis to 50 routes max.
              </p>
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !githubUrl.trim()}
              className="btn-primary w-full flex justify-center items-center gap-2"
            >
              Analyze Project <ArrowRight size={18} className="ml-1" />
            </button>
          </form>
        )}

        {/* ZIP Upload Form */}
        {activeTab === 'zip' && (
          <div className="animate-fade-in flex flex-col items-center justify-center">
            <div
              className="w-full border-2 border-dashed border-white/20 hover:border-teal-500/50 hover:bg-teal-500/5 rounded-2xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => document.getElementById('zip-upload')?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} className="text-teal-500" />
              </div>
              <p className="text-white font-medium mb-1">Drag and drop your Next.js project ZIP</p>
              <p className="text-sm text-gray-400 mb-4">or click to browse files (Max 10MB)</p>
              <input
                type="file"
                id="zip-upload"
                accept=".zip,application/zip"
                className="hidden"
                onChange={onFileChange}
                disabled={isAnalyzing}
              />
              <button type="button" className="px-4 py-2 bg-white/10 rounded-lg text-sm text-gray-200 hover:bg-white/20 transition-colors">
                Select ZIP file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Need ArrowRight inside the component scope
import { ArrowRight } from 'lucide-react';
