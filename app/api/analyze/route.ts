import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth/session';
import { fetchGitHubRepo } from '../../../lib/fetcher/githubFetcher';
import { extractZipRoutes } from '../../../lib/fetcher/zipExtractor';
import { parseRouteFile } from '../../../lib/analyzer/astParser';
import { extractSignals } from '../../../lib/analyzer/signalExtractor';
import { computeRecommendation } from '../../../lib/scorer/decisionEngine';
import { AnalysisResult, RouteRecommendation } from '../../../lib/types';

export const maxDuration = 30; // Vercel timeout max duration
export const dynamic = 'force-dynamic'; // Prevent caching
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const auth = await getAuthPayload();
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, url, data, filename } = body;

    let routeFiles = [];
    let projectName = '';

    if (type === 'github') {
      if (!url) {
        return NextResponse.json({ error: 'GitHub URL is required' }, { status: 400 });
      }
      routeFiles = await fetchGitHubRepo(url);
      
      // Extract project name from URL
      const urlParts = url.replace(/https?:\/\//, '').replace(/github\.com\//, '').split('/').filter(Boolean);
      projectName = urlParts.length >= 2 ? `${urlParts[0]}/${urlParts[1]}` : url;
      
    } else if (type === 'zip') {
      if (!data) {
        return NextResponse.json({ error: 'ZIP data is required' }, { status: 400 });
      }
      
      const buffer = Buffer.from(data, 'base64');
      routeFiles = await extractZipRoutes(buffer);
      projectName = filename || 'Uploaded ZIP';
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "github" or "zip"' }, { status: 400 });
    }

    const recommendations: RouteRecommendation[] = [];
    const summary = {
      SSG: 0,
      SSR: 0,
      ISR: 0,
      CSR: 0,
      alreadyOptimal: 0,
    };

    for (const file of routeFiles) {
      const parsed = parseRouteFile(file);
      if (parsed) {
        const signals = extractSignals(parsed);
        const recommendation = computeRecommendation(signals);
        
        recommendations.push(recommendation);
        
        // Update summary counts
        summary[recommendation.recommendedStrategy]++;
        if (recommendation.isAlreadyOptimal) {
          summary.alreadyOptimal++;
        }
      }
    }

    const result: AnalysisResult = {
      projectName,
      totalRoutes: recommendations.length,
      recommendations,
      summary,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred during analysis' 
    }, { status: 400 });
  }
}
