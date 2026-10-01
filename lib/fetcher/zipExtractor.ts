import AdmZip from 'adm-zip';
import { RouteFile } from '../types';

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
  const isPagesRouter = path.includes('/pages/') || path.startsWith('pages/');
  const isAppRouter = path.includes('/app/') || path.startsWith('app/');
  
  if (!isPagesRouter && !isAppRouter) return false;
  
  if (isPagesRouter && path.includes('/api/')) return false;

  const ext = '.' + path.split('.').pop();
  if (!ROUTE_EXTENSIONS.has(ext)) return false;

  const filename = path.split('/').pop() || '';
  
  if (isAppRouter) {
    const baseName = filename.split('.')[0];
    if (baseName !== 'page' && baseName !== 'route') return false;
  }
  
  if (EXCLUDED_FILES.has(filename)) return false;

  return true;
}

function deriveRoutePath(filePath: string): string {
  let route = filePath;

  const pagesIdx = route.indexOf('pages/');
  const appIdx = route.indexOf('app/');

  if (pagesIdx !== -1) {
    route = route.substring(pagesIdx + 'pages/'.length);
  } else if (appIdx !== -1) {
    route = route.substring(appIdx + 'app/'.length);
  }

  route = route.replace(/\.(tsx|ts|jsx|js)$/, '');
  route = route.replace(/\/page$/, '');
  if (route === 'page') route = '';
  route = route.replace(/\/index$/, '');
  if (route === 'index') route = '';

  route = '/' + route;
  route = route.replace(/\/+/g, '/');

  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1);
  }

  return route;
}

/**
 * Extracts route files from an uploaded ZIP buffer containing a Next.js project.
 */
export async function extractZipRoutes(zipBuffer: Buffer): Promise<RouteFile[]> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // Find the root of the Next.js project by looking for package.json with next dependency
  let projectRoot = '';
  let foundNextProject = false;

  for (const entry of entries) {
    if (entry.entryName.endsWith('package.json') && !entry.isDirectory) {
      try {
        const content = entry.getData().toString('utf8');
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps && deps['next']) {
          foundNextProject = true;
          // The project root is the directory containing this package.json
          const parts = entry.entryName.split('/');
          parts.pop(); // Remove 'package.json'
          projectRoot = parts.join('/');
          if (projectRoot && !projectRoot.endsWith('/')) {
            projectRoot += '/';
          }
          break;
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  if (!foundNextProject) {
    throw new Error('No Next.js project found in ZIP');
  }

  const routeFiles: RouteFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    let relativePath = entry.entryName;
    if (projectRoot && relativePath.startsWith(projectRoot)) {
      relativePath = relativePath.substring(projectRoot.length);
    }

    if (!isRouteFile(relativePath)) continue;

    try {
      const rawCode = entry.getData().toString('utf8');
      routeFiles.push({
        filePath: relativePath,
        routePath: deriveRoutePath(relativePath),
        rawCode,
      });
    } catch {
      console.warn(`Failed to read ZIP entry: ${entry.entryName}`);
    }
  }

  if (routeFiles.length === 0) {
    throw new Error('No page or route files found. Make sure the project has a pages/ or app/ directory.');
  }

  return routeFiles.slice(0, 50); // Limit to 50 route files
}
