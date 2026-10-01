import { RouteSignals, RouteRecommendation } from '../types';
import { LCP_REFERENCE, LCP_ABSOLUTE } from './weights';

/**
 * Computes the optimal rendering strategy recommendation for a route
 * based on extracted signals and weighted scoring.
 */
export function computeRecommendation(signals: RouteSignals): RouteRecommendation {
  const auth = signals.hasAuthDependency ? 10 : 0;
  const fresh = signals.dataFreshnessScore;
  const seo = signals.seoScore;
  const interact = signals.interactivityScore;
  const update = signals.updateFrequency;

  // Compute raw scores using weighted formula
  let SSG = ((10 - fresh) * 0.35) + (seo * 0.25) + ((10 - auth) * 0.20) + ((10 - interact) * 0.10) + ((10 - update) * 0.10);
  let SSR = (fresh * 0.40) + (auth * 0.30) + (seo * 0.15) + (interact * 0.10) + (update * 0.05);
  let CSR = (interact * 0.40) + ((10 - seo) * 0.25) + (auth * 0.20) + (fresh * 0.15);
  let ISR = ((10 - fresh) * 0.25) + (fresh * 0.25) + (seo * 0.25) + ((10 - auth) * 0.15) + ((10 - interact) * 0.10);

  // Normalize to 0-10
  SSG = SSG / 10 * 10;
  SSR = SSR / 10 * 10;
  CSR = CSR / 10 * 10;
  ISR = ISR / 10 * 10;

  const scores = {
    SSG: Math.round(SSG * 100) / 100,
    SSR: Math.round(SSR * 100) / 100,
    ISR: Math.round(ISR * 100) / 100,
    CSR: Math.round(CSR * 100) / 100,
  };

  // Determine winner before overrides
  let recommendedStrategy: RouteRecommendation['recommendedStrategy'];
  let forced = false;

  // Hard override rules (highest priority)
  const isPrivateRoute = signals.seoScore === 0;

  if (isPrivateRoute) {
    // Private routes: /dashboard, /settings, /admin etc.
    // Use CSR for low-freshness private pages (typical dashboards)
    // Use SSR for high-freshness private pages (real-time data dashboards)
    if (fresh >= 8) {
      recommendedStrategy = 'SSR';
    } else {
      recommendedStrategy = 'CSR';
    }
    forced = true;
  } else if (signals.hasAuthDependency && signals.seoScore >= 7) {
    // Personalized public page → SSR required
    recommendedStrategy = 'SSR';
    forced = true;
  } else if (fresh === 0 && !signals.hasAuthDependency) {
    // Purely static public page → SSG
    recommendedStrategy = 'SSG';
    forced = true;
  } else if (fresh > 0 && fresh < 8 && !signals.hasAuthDependency) {
    // Periodically updating public page → ISR
    // Only if the scoring also agrees (check SSG vs ISR)
    const entries = Object.entries(scores) as [RouteRecommendation['recommendedStrategy'], number][];
    entries.sort((a, b) => b[1] - a[1]);
    recommendedStrategy = entries[0][0];
    // But if winner is SSG and there is revalidate data, prefer ISR
    if (recommendedStrategy === 'SSG' && fresh >= 2) {
      recommendedStrategy = 'ISR';
    }
    forced = false;
  } else {
    // Default: pick strategy with highest weighted score
    const entries = Object.entries(scores) as [RouteRecommendation['recommendedStrategy'], number][];
    entries.sort((a, b) => b[1] - a[1]);
    recommendedStrategy = entries[0][0];
  }

  // Compute confidence
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const winningScore = scores[recommendedStrategy];
  const gap = sortedScores[0] - sortedScores[1];

  let confidence: RouteRecommendation['confidence'];
  if (forced || (winningScore > 7.0 && gap > 2.0)) {
    confidence = 'high';
  } else if (winningScore > 5.0 || gap > 1.0) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Compute estimated LCP gain
  const estimatedLCPGain = computeLCPGain(recommendedStrategy, signals.currentStrategy);

  // Consider a route optimal if currentStrategy matches recommended,
  // OR if currentStrategy is 'SSG' and recommended is 'SSG'
  // (App Router default matches our recommendation)
  const isAlreadyOptimal =
    (signals.currentStrategy !== 'unknown' &&
      signals.currentStrategy === recommendedStrategy) ||
    (signals.currentStrategy === 'SSG' && recommendedStrategy === 'SSG');

  // Build reasoning array (3-5 items, always cite at least one paper)
  const reasoning = buildReasoning(signals, forced);

  return {
    routePath: signals.routePath,
    filePath: signals.filePath,
    currentStrategy: signals.currentStrategy,
    recommendedStrategy,
    confidence,
    scores,
    reasoning,
    detectedPatterns: signals.detectedPatterns,
    isAlreadyOptimal,
    estimatedLCPGain,
  };
}

function computeLCPGain(recommended: string, current: string): string {
  if (current === 'unknown') {
    const absLCP = LCP_ABSOLUTE[recommended];
    if (absLCP) {
      return `~${absLCP}ms expected LCP`;
    }
    return 'Unknown baseline';
  }

  if (current === recommended) {
    return 'Already optimal';
  }

  const key = `${recommended}_vs_${current}`;
  const value = LCP_REFERENCE[key];

  if (value !== undefined) {
    if (value < 0) {
      return `${value}ms (faster)`;
    } else if (value > 0) {
      return `+${value}ms (slower)`;
    }
    return 'No change';
  }

  // Try reverse lookup
  const reverseKey = `${current}_vs_${recommended}`;
  const reverseValue = LCP_REFERENCE[reverseKey];

  if (reverseValue !== undefined) {
    const flipped = -reverseValue;
    if (flipped < 0) {
      return `${flipped}ms (faster)`;
    } else if (flipped > 0) {
      return `+${flipped}ms (slower)`;
    }
    return 'No change';
  }

  // Estimate from absolute values
  const recLCP = LCP_ABSOLUTE[recommended];
  const curLCP = LCP_ABSOLUTE[current];
  if (recLCP && curLCP) {
    const diff = recLCP - curLCP;
    if (diff < 0) {
      return `~${diff}ms (faster)`;
    } else if (diff > 0) {
      return `~+${diff}ms (slower)`;
    }
    return 'No change';
  }

  return 'Estimated improvement';
}

function buildReasoning(signals: RouteSignals, forced: boolean): string[] {
  const reasons: string[] = [];

  reasons.push(
    `dataFreshnessScore=${signals.dataFreshnessScore}: ${signals.freshnessReason}`
  );
  reasons.push(
    `seoScore=${signals.seoScore}: ${signals.seoReason}`
  );
  reasons.push(
    `interactivityScore=${signals.interactivityScore}: ${signals.hookCount} React hooks detected`
  );
  reasons.push(
    `authDependency=${signals.hasAuthDependency}: ${signals.authReason}`
  );

  if (forced) {
    if (signals.seoScore === 0) {
      reasons.push(
        'Override: Private route detected (seoScore=0) - CSR recommended for dashboard-type pages per Savenko & Babii IEEE Access 2025 guidelines'
      );
    } else if (signals.dataFreshnessScore === 0 && !signals.hasAuthDependency) {
      reasons.push(
        'Override: Purely static content - SSG recommended. Hanafi et al. TEKNIKA 2024 found SSG is 57.41% faster than CSR on equivalent pages'
      );
    } else if (signals.hasAuthDependency && signals.seoScore >= 7) {
      reasons.push(
        'Override: Personalized public page needs SSR for SEO + auth. Per Gieda & Miłosz JCSI 2026, SSR provides best balance for dynamic public content'
      );
    }
  } else {
    reasons.push(
      'Reference: Hanafi et al. TEKNIKA 2024 found SSG is 57.41% faster than CSR on equivalent pages'
    );
  }

  return reasons;
}
