/**
 * Signal weights for each rendering strategy.
 * Derived from analysis of Hanafi et al. TEKNIKA 2024,
 * Savenko & Babii IEEE Access 2025, and Gieda & Miłosz JCSI 2026.
 */
export const WEIGHTS = {
  SSG: { freshness: 0.35, seo: 0.25, auth: 0.20, interactivity: 0.10, update: 0.10 },
  SSR: { freshness: 0.40, auth: 0.30, seo: 0.15, interactivity: 0.10, update: 0.05 },
  CSR: { interactivity: 0.40, seo: 0.25, auth: 0.20, freshness: 0.15 },
  ISR: { freshness_inv: 0.25, freshness: 0.25, seo: 0.25, auth_inv: 0.15, interactivity_inv: 0.10 },
};

/**
 * LCP reference values from Hanafi et al. TEKNIKA 2024.
 * Values in milliseconds — negative = improvement, positive = regression.
 */
export const LCP_REFERENCE: Record<string, number> = {
  SSG_vs_CSR: -420,   // ms improvement
  SSG_vs_SSR: -390,
  ISR_vs_CSR: -280,
  SSR_vs_CSR: -150,
  CSR_vs_SSG: 420,
  CSR_vs_SSR: 150,
};

/**
 * Absolute LCP estimates from Hanafi et al. for home page test.
 */
export const LCP_ABSOLUTE: Record<string, number> = {
  SSG: 1135,
  SSR: 1525,
  CSR: 1350,
  ISR: 1200,
};
