import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ParsedAST, RouteSignals } from '../types';

const AUTH_IMPORTS = [
  'next-auth', '@clerk/nextjs', '@supabase/auth-helpers-nextjs',
  'iron-session', 'jose', '@auth0/nextjs-auth0',
];

const AUTH_CALLS = [
  'cookies', 'headers', 'getSession', 'getServerSession', 'useSession', 'auth',
];

const AUTH_GLOBALS = ['localStorage', 'sessionStorage', 'document.cookie'];

const HOOKS = [
  'useState', 'useEffect', 'useReducer', 'useCallback',
  'useMemo', 'useRef', 'useContext', 'useTransition',
];

const EVENT_HANDLERS = [
  'onClick', 'onChange', 'onSubmit', 'onInput', 'onKeyDown', 'onMouseEnter',
];

const PRIVATE_SEGMENTS = [
  '/dashboard', '/settings', '/profile', '/account', '/admin', '/app', '/portal',
];

const PUBLIC_CONTENT_SEGMENTS = [
  '/blog', '/article', '/post', '/news', '/product', '/category',
  '/shop', '/about', '/contact', '/pricing', '/docs', '/faq', '/team',
];

function computeInteractivityScore(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 2;
  if (count <= 4) return 4;
  if (count <= 6) return 6;
  if (count <= 9) return 8;
  return 10;
}

/**
 * Extracts 5 analysis signals from a parsed AST.
 */
export function extractSignals(parsed: ParsedAST): RouteSignals {
  const code = parsed.file.rawCode;
  const routePath = parsed.file.routePath;
  const detectedPatterns: string[] = [];

  // ── Signal 1: Data Freshness ──
  let dataFreshnessScore = 0;
  let freshnessReason = 'No data fetching detected - purely static content';

  // Check for fetch with cache options
  if (code.includes("cache: 'no-store'") || code.includes('cache: "no-store"')) {
    dataFreshnessScore = 10;
    freshnessReason = 'fetch() with no-store cache detected - data must be fresh on every request';
    detectedPatterns.push("fetch() with cache: 'no-store'");
  } else if (code.includes('revalidate: 0') || code.includes('revalidate:0')) {
    dataFreshnessScore = 10;
    freshnessReason = 'revalidate: 0 forces SSR behavior';
    detectedPatterns.push('revalidate: 0');
  }

  // Check for revalidate with N > 0
  const revalidateMatch = code.match(/revalidate\s*[:=]\s*(\d+)/);
  if (revalidateMatch && dataFreshnessScore < 10) {
    const N = parseInt(revalidateMatch[1], 10);
    if (N > 0) {
      dataFreshnessScore = Math.max(2, 10 - Math.floor(N / 3600));
      freshnessReason = `ISR with revalidate: ${N}s detected`;
      detectedPatterns.push(`revalidate: ${N}`);
    }
  }

  // Check for export const revalidate = N
  const exportRevalidateMatch = code.match(/export\s+const\s+revalidate\s*=\s*(\d+)/);
  if (exportRevalidateMatch && dataFreshnessScore < 10) {
    const N = parseInt(exportRevalidateMatch[1], 10);
    if (N === 0) {
      dataFreshnessScore = 10;
      freshnessReason = 'revalidate: 0 forces SSR behavior';
      detectedPatterns.push('export const revalidate = 0');
    } else {
      dataFreshnessScore = Math.max(2, 10 - Math.floor(N / 3600));
      freshnessReason = `ISR with revalidate: ${N}s detected`;
      detectedPatterns.push(`export const revalidate = ${N}`);
    }
  }

  // Check for dynamic = 'force-dynamic'
  if (code.includes("dynamic = 'force-dynamic'") || code.includes('dynamic = "force-dynamic"')) {
    dataFreshnessScore = 10;
    freshnessReason = "export const dynamic = 'force-dynamic' forces SSR";
    detectedPatterns.push("export const dynamic = 'force-dynamic'");
  }

  // Check for getServerSideProps
  if (parsed.exports.includes('getServerSideProps')) {
    if (dataFreshnessScore < 9) {
      dataFreshnessScore = 9;
      freshnessReason = 'getServerSideProps requires server render per request';
    }
    detectedPatterns.push('getServerSideProps');
  }

  // Check for getStaticProps
  if (parsed.exports.includes('getStaticProps')) {
    if (dataFreshnessScore === 0) {
      // Check if there's revalidate in the code (already handled above)
      if (!revalidateMatch) {
        dataFreshnessScore = 1;
        freshnessReason = 'getStaticProps with no revalidate - data is build-time only';
      }
    }
    detectedPatterns.push('getStaticProps');
  }

  // Check if there are any fetch calls at all
  const hasFetch = code.includes('fetch(') || code.includes('fetch (');
  if (!hasFetch && dataFreshnessScore === 0 && !parsed.exports.includes('getStaticProps') && !parsed.exports.includes('getServerSideProps')) {
    dataFreshnessScore = 0;
    freshnessReason = 'No data fetching detected - purely static content';
  }

  // ── Signal 2: Auth Dependency ──
  let hasAuthDependency = false;
  let authReason = 'No authentication patterns detected';

  for (const imp of parsed.imports) {
    if (AUTH_IMPORTS.some((authImp) => imp.includes(authImp))) {
      hasAuthDependency = true;
      authReason = `Auth import detected: ${imp}`;
      detectedPatterns.push(`Auth import: ${imp}`);
      break;
    }
  }

  if (!hasAuthDependency) {
    for (const call of AUTH_CALLS) {
      const callRegex = new RegExp(`\\b${call}\\s*\\(`);
      if (callRegex.test(code)) {
        hasAuthDependency = true;
        authReason = `Auth function call detected: ${call}()`;
        detectedPatterns.push(`${call}() call`);
        break;
      }
    }
  }

  if (!hasAuthDependency) {
    for (const global of AUTH_GLOBALS) {
      if (code.includes(global)) {
        hasAuthDependency = true;
        authReason = `Client-side auth pattern detected: ${global}`;
        detectedPatterns.push(`${global} access`);
        break;
      }
    }
  }

  // App Router: detect redirect()-based auth patterns
  if (!hasAuthDependency) {
    if (
      code.includes('redirect(') &&
      (code.includes('session') ||
        code.includes('token') ||
        code.includes('auth'))
    ) {
      hasAuthDependency = true;
      authReason = 'redirect() with session/token check - auth-gated route';
      detectedPatterns.push('Auth-based redirect() detected');
    }
  }

  // Route path implies private area - covers middleware-based auth
  // which AST cannot see
  if (!hasAuthDependency) {
    if (PRIVATE_SEGMENTS.some((seg) => routePath.includes(seg))) {
      hasAuthDependency = true;
      authReason = `Route path "${routePath}" indicates a private authenticated area`;
      detectedPatterns.push(`Private route path detected: ${routePath}`);
    }
  }

  // ── Signal 3: SEO Score ──
  let seoScore = 6;
  let seoReason = 'Standard public route - moderate SEO priority';

  if (PRIVATE_SEGMENTS.some((seg) => routePath.includes(seg))) {
    seoScore = 0;
    seoReason = 'Private route - behind auth, no SEO value';
  } else if (routePath === '/') {
    seoScore = 10;
    seoReason = 'Homepage - maximum SEO priority';
  } else if (PUBLIC_CONTENT_SEGMENTS.some((seg) => routePath.includes(seg))) {
    seoScore = 9;
    seoReason = 'Public content route - high SEO priority';
    // If it has a dynamic segment under a public path
    if (routePath.includes('[')) {
      seoScore = 8;
      seoReason = 'Dynamic public content route - high SEO priority';
    }
  } else if (routePath.includes('[')) {
    seoScore = 6;
    seoReason = 'Dynamic route - moderate SEO priority';
  }

  // ── Signal 4: Interactivity Score ──
  let hookCount = 0;
  let handlerCount = 0;

  for (const hook of HOOKS) {
    const regex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
    const matches = code.match(regex);
    if (matches) hookCount += matches.length;
  }

  for (const handler of EVENT_HANDLERS) {
    const regex = new RegExp(`\\b${handler}\\s*[={]`, 'g');
    const matches = code.match(regex);
    if (matches) handlerCount += matches.length;
  }

  const totalInteractivity = hookCount + handlerCount;
  const interactivityScore = computeInteractivityScore(totalInteractivity);

  // ── Signal 5: Update Frequency ──
  const updateFrequency = 5;
  detectedPatterns.push('Git analysis unavailable in web mode - using default update frequency score');

  // ── Current Strategy Detection ──
  let currentStrategy: RouteSignals['currentStrategy'] = 'unknown';

  if (parsed.exports.includes('getStaticProps')) {
    if (revalidateMatch && parseInt(revalidateMatch[1], 10) > 0) {
      currentStrategy = 'ISR';
    } else {
      currentStrategy = 'SSG';
    }
  } else if (parsed.exports.includes('getServerSideProps')) {
    currentStrategy = 'SSR';
  } else if (code.includes("dynamic = 'force-dynamic'") || code.includes('dynamic = "force-dynamic"')) {
    currentStrategy = 'SSR';
  } else if (exportRevalidateMatch) {
    const N = parseInt(exportRevalidateMatch[1], 10);
    if (N === 0) {
      currentStrategy = 'SSR';
    } else {
      currentStrategy = 'ISR';
    }
  } else if (parsed.exports.includes('generateStaticParams')) {
    if (!code.includes("dynamic = 'force-dynamic'") && !code.includes('dynamic = "force-dynamic"')) {
      currentStrategy = 'SSG';
    }
  }

  // App Router: detect 'use client' directive with hooks or interactivity = CSR
  if (currentStrategy === 'unknown') {
    if (code.includes("'use client'") || code.includes('"use client"')) {
      if (hookCount > 0 || totalInteractivity > 0) {
        currentStrategy = 'CSR';
        detectedPatterns.push("'use client' directive with React hooks/handlers - client component");
      } else {
        // 'use client' with no interactivity — still a client component
        currentStrategy = 'CSR';
        detectedPatterns.push("'use client' directive - client component");
      }
    }
  }

  // App Router: default server components are SSG unless marked dynamic
  if (currentStrategy === 'unknown') {
    const hasUseClient = code.includes("'use client'") || code.includes('"use client"');
    const hasDynamicMarker =
      code.includes('force-dynamic') ||
      code.includes('no-store') ||
      code.includes('revalidate');
    if (!hasUseClient && !hasDynamicMarker) {
      currentStrategy = 'SSG';
      detectedPatterns.push(
        'App Router server component - SSG by default (no dynamic markers detected)'
      );
    }
  }

  // Check for CSR pattern: useEffect with fetch inside
  if (currentStrategy === 'unknown') {
    let hasUseEffectFetch = false;
    try {
      traverse(parsed.ast, {
        CallExpression(path) {
          if (
            path.node.callee.type === 'Identifier' &&
            path.node.callee.name === 'useEffect'
          ) {
            const callback = path.node.arguments[0];
            if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
              const bodyCode = parsed.file.rawCode.substring(
                callback.start || 0,
                callback.end || 0
              );
              if (bodyCode.includes('fetch(') || bodyCode.includes('fetch (') || bodyCode.includes('axios')) {
                hasUseEffectFetch = true;
              }
            }
          }
        },
      });
    } catch {
      // Fallback to regex
      hasUseEffectFetch = /useEffect\s*\(\s*(?:async\s*)?\(\)\s*=>\s*\{[^}]*fetch\s*\(/.test(code);
    }
    if (hasUseEffectFetch) {
      currentStrategy = 'CSR';
      detectedPatterns.push('useEffect with fetch - client-side data fetching');
    }
  }

  return {
    routePath,
    filePath: parsed.file.filePath,
    dataFreshnessScore,
    freshnessReason,
    hasAuthDependency,
    authReason,
    seoScore,
    seoReason,
    interactivityScore,
    hookCount,
    updateFrequency,
    detectedPatterns,
    currentStrategy,
  };
}
