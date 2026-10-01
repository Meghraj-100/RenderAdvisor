import { RouteFile } from '../types';

/**
 * Parses a GitHub URL to extract owner and repo name.
 * Accepts formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/main
 * - github.com/owner/repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  let cleaned = url.trim();

  // Remove protocol if present
  cleaned = cleaned.replace(/^https?:\/\//, '');

  // Remove github.com prefix
  cleaned = cleaned.replace(/^github\.com\//, '');

  // Split remaining path
  const parts = cleaned.split('/').filter(Boolean);

  if (parts.length < 2) {
    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
  }

  return { owner: parts[0], repo: parts[1] };
}

/** Files to exclude from analysis */
const EXCLUDED_FILES = new Set([
  '_app.tsx', '_app.ts', '_app.jsx', '_app.js',
  '_document.tsx', '_document.ts', '_document.jsx', '_document.js',
  'layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js',
  'error.tsx', 'error.ts', 'error.jsx', 'error.js',
  'loading.tsx', 'loading.ts', 'loading.jsx', 'loading.js',
  'not-found.tsx', 'not-found.ts', 'not-found.jsx', 'not-found.js',
]);

const ROUTE_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);

function isRouteFile(path: string): boolean {
  // Must be inside pages/ or app/ directory
  const isPagesRouter = path.startsWith('pages/') || path.includes('/pages/');
  const isAppRouter = path.startsWith('app/') || path.includes('/app/');

  if (!isPagesRouter && !isAppRouter) return false;

  // Must not be inside api/ subdirectory (unless it's an app router route.ts)
  if (isPagesRouter && path.includes('/api/')) return false;

  // Must have a valid extension
  const ext = '.' + path.split('.').pop();
  if (!ROUTE_EXTENSIONS.has(ext)) return false;

  const filename = path.split('/').pop() || '';
  
  // App router: only page.* or route.* are routes
  if (isAppRouter) {
    const baseName = filename.split('.')[0];
    if (baseName !== 'page' && baseName !== 'route') return false;
  }

  // Must not be an excluded file
  if (EXCLUDED_FILES.has(filename)) return false;

  return true;
}

function deriveRoutePath(filePath: string): string {
  let route = filePath;

  // Strip any leading directory before pages/ or app/
  const pagesIdx = route.indexOf('pages/');
  const appIdx = route.indexOf('app/');

  if (pagesIdx !== -1) {
    route = route.substring(pagesIdx + 'pages/'.length);
  } else if (appIdx !== -1) {
    route = route.substring(appIdx + 'app/'.length);
  }

  // Remove file extension
  route = route.replace(/\.(tsx|ts|jsx|js)$/, '');

  // For app router: remove /page suffix
  route = route.replace(/\/page$/, '');
  if (route === 'page') route = '';

  // Remove trailing /index
  route = route.replace(/\/index$/, '');
  if (route === 'index') route = '';

  // Ensure leading slash
  route = '/' + route;

  // Clean up double slashes
  route = route.replace(/\/+/g, '/');

  // Remove trailing slash (except root)
  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1);
  }

  return route;
}

/**
 * Fetches route files from a public GitHub repository.
 */
export async function fetchGitHubRepo(repoUrl: string): Promise<RouteFile[]> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  // Fetch the full file tree
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RenderAdvisor/1.0',
      },
    }
  );

  if (treeResponse.status === 404) {
    throw new Error('Repository not found or is private');
  }

  if (treeResponse.status === 403 || treeResponse.status === 429) {
    throw new Error('GitHub rate limit reached. Try again in a minute.');
  }

  if (!treeResponse.ok) {
    throw new Error(`GitHub API error: ${treeResponse.status} ${treeResponse.statusText}`);
  }

  const treeData = await treeResponse.json();
  const tree = treeData.tree as Array<{ path: string; type: string }>;

  if (!tree || !Array.isArray(tree)) {
    throw new Error('Invalid repository structure');
  }

  // Filter for route files
  const routeFilePaths = tree
    .filter((item) => item.type === 'blob' && isRouteFile(item.path))
    .slice(0, 50); // Limit to 50 route files

  if (routeFilePaths.length === 0) {
    throw new Error('No page or route files found. Make sure the project has a pages/ or app/ directory.');
  }

  // Fetch raw content for each file
  const routeFiles: RouteFile[] = [];

  for (const file of routeFilePaths) {
    try {
      const rawResponse = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`,
        {
          headers: { 'User-Agent': 'RenderAdvisor/1.0' },
        }
      );

      if (rawResponse.ok) {
        const rawCode = await rawResponse.text();
        routeFiles.push({
          filePath: file.path,
          routePath: deriveRoutePath(file.path),
          rawCode,
        });
      }
    } catch {
      // Skip files that fail to fetch
      console.warn(`Failed to fetch: ${file.path}`);
    }
  }

  if (routeFiles.length === 0) {
    throw new Error('Failed to fetch any route files from the repository.');
  }

  return routeFiles;
}
