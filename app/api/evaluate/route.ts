import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth/session';
import { fetchGitHubRepo } from '../../../lib/fetcher/githubFetcher';
import { parseRouteFile } from '../../../lib/analyzer/astParser';
import { extractSignals } from '../../../lib/analyzer/signalExtractor';
import { computeRecommendation } from '../../../lib/scorer/decisionEngine';
import { EvaluationInput, EvaluationResult } from '../../../lib/types';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
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

    const body: EvaluationInput = await req.json();
    const { routes, githubUrl } = body;

    if (!routes || !Array.isArray(routes) || !githubUrl) {
      return NextResponse.json({ 
        error: 'Invalid input. Requires routes array and githubUrl string' 
      }, { status: 400 });
    }

    // Fetch repo files
    const routeFiles = await fetchGitHubRepo(githubUrl);
    
    let correct = 0;
    const confusionMatrix: Record<string, Record<string, number>> = {
      'SSG': { 'SSG': 0, 'SSR': 0, 'ISR': 0, 'CSR': 0 },
      'SSR': { 'SSG': 0, 'SSR': 0, 'ISR': 0, 'CSR': 0 },
      'ISR': { 'SSG': 0, 'SSR': 0, 'ISR': 0, 'CSR': 0 },
      'CSR': { 'SSG': 0, 'SSR': 0, 'ISR': 0, 'CSR': 0 },
    };

    // Analyze files and compare with human labels
    for (const file of routeFiles) {
      // Find matching label
      const labeledRoute = routes.find(r => r.routePath === file.routePath);
      if (!labeledRoute) continue;

      const parsed = parseRouteFile(file);
      if (!parsed) continue;

      const signals = extractSignals(parsed);
      const recommendation = computeRecommendation(signals);
      
      const predicted = recommendation.recommendedStrategy;
      const actual = labeledRoute.humanLabel;

      if (predicted === actual) {
        correct++;
      }
      
      if (confusionMatrix[actual] && confusionMatrix[actual][predicted] !== undefined) {
          confusionMatrix[actual][predicted]++;
      }
    }

    const totalEvaluated = routes.filter(r => routeFiles.some(f => f.routePath === r.routePath)).length;

    // Calculate precision
    const perStrategyPrecision: Record<string, number> = {};
    const strategies = ['SSG', 'SSR', 'ISR', 'CSR'];
    
    for (const strat of strategies) {
      let truePositives = confusionMatrix[strat][strat];
      let predictedPositives = 0;
      
      for (const actualStrat of strategies) {
        predictedPositives += confusionMatrix[actualStrat][strat];
      }
      
      perStrategyPrecision[strat] = predictedPositives > 0 ? truePositives / predictedPositives : 0;
    }

    const result: EvaluationResult = {
      accuracy: totalEvaluated > 0 ? correct / totalEvaluated : 0,
      total: totalEvaluated,
      correct,
      confusionMatrix,
      perStrategyPrecision,
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ 
      error: error.message || 'An error occurred during evaluation' 
    }, { status: 400 });
  }
}
