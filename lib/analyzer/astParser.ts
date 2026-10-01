import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { RouteFile, ParsedAST } from '../types';

/**
 * Parses a route file using @babel/parser and extracts exports and imports.
 * Returns null on parse errors.
 */
export function parseRouteFile(file: RouteFile): ParsedAST | null {
  try {
    const ast = parser.parse(file.rawCode, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'dynamicImport',
      ],
      errorRecovery: true,
    });

    const exports: string[] = [];
    const imports: string[] = [];

    traverse(ast, {
      ExportNamedDeclaration(path) {
        const decl = path.node.declaration;
        if (decl) {
          if (decl.type === 'FunctionDeclaration' && decl.id) {
            exports.push(decl.id.name);
          } else if (decl.type === 'VariableDeclaration') {
            for (const declarator of decl.declarations) {
              if (declarator.id.type === 'Identifier') {
                exports.push(declarator.id.name);
              }
            }
          }
        }
        if (path.node.specifiers) {
          for (const spec of path.node.specifiers) {
            if (spec.exported.type === 'Identifier') {
              exports.push(spec.exported.name);
            }
          }
        }
      },
      ExportDefaultDeclaration() {
        exports.push('default');
      },
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      },
    });

    return { file, exports, imports, ast };
  } catch (error) {
    console.warn(`Failed to parse ${file.filePath}:`, error);
    return null;
  }
}
