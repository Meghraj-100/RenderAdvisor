export interface RouteFile {
  filePath: string;       // relative path within project e.g. pages/blog/[slug].tsx
  routePath: string;      // URL route e.g. /blog/[slug]
  rawCode: string;        // file contents as string
}

export interface ParsedAST {
  file: RouteFile;
  exports: string[];
  imports: string[];
  ast: any; // babel File node
}

export interface RouteSignals {
  routePath: string;
  filePath: string;
  dataFreshnessScore: number;     // 0-10
  freshnessReason: string;
  hasAuthDependency: boolean;
  authReason: string;
  seoScore: number;               // 0-10
  seoReason: string;
  interactivityScore: number;     // 0-10
  hookCount: number;
  updateFrequency: number;        // 0-10, defaults to 5
  detectedPatterns: string[];
  currentStrategy: 'SSG' | 'SSR' | 'ISR' | 'CSR' | 'unknown';
}

export interface RouteRecommendation {
  routePath: string;
  filePath: string;
  currentStrategy: string;
  recommendedStrategy: 'SSG' | 'SSR' | 'ISR' | 'CSR';
  confidence: 'high' | 'medium' | 'low';
  scores: { SSG: number; SSR: number; ISR: number; CSR: number };
  reasoning: string[];
  detectedPatterns: string[];
  isAlreadyOptimal: boolean;
  estimatedLCPGain: string;
}

export interface AnalysisResult {
  projectName: string;
  totalRoutes: number;
  recommendations: RouteRecommendation[];
  summary: {
    SSG: number;
    SSR: number;
    ISR: number;
    CSR: number;
    alreadyOptimal: number;
  };
  analyzedAt: string;
}

export interface EvaluationInput {
  routes: Array<{
    routePath: string;
    humanLabel: 'SSG' | 'SSR' | 'ISR' | 'CSR';
  }>;
  githubUrl: string;
}

export interface EvaluationResult {
  accuracy: number;
  total: number;
  correct: number;
  confusionMatrix: Record<string, Record<string, number>>;
  perStrategyPrecision: Record<string, number>;
}
