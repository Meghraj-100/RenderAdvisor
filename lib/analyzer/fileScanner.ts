/**
 * Converts a file path to a URL route path.
 * Handles both Pages Router and App Router patterns.
 */
export function deriveRoutePath(filePath: string): string {
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
