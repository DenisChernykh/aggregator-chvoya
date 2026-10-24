import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] ?? 'assets/tokens.json';
const outputPath = process.argv[3] ?? 'assets/scss/generated-tokens.scss';

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON from ${filePath}: ${error.message}`);
  }
}

function countTokens(node) {
  if (!node || typeof node !== 'object') return 0;
  if ('$value' in node) return 1;
  return Object.values(node).reduce((count, value) => count + countTokens(value), 0);
}

function flattenTokens(node, pathParts = []) {
  if (!node || typeof node !== 'object') return [];
  if ('$value' in node) {
    return [{ path: pathParts, token: node }];
  }

  return Object.entries(node).flatMap(([key, value]) => flattenTokens(value, [...pathParts, key]));
}

function cssName(pathParts) {
  return pathParts
    .join('-')
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function refToPath(ref) {
  const match = ref.match(/^\{(.+)\}$/);
  if (!match) return null;
  return match[1].split('.');
}

function hasPath(node, pathParts) {
  let cursor = node;
  for (const part of pathParts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) {
      return false;
    }
    cursor = cursor[part];
  }
  return Boolean(cursor && typeof cursor === 'object' && '$value' in cursor);
}

function renderGlobalToken(pathParts, token) {
  return `  --${cssName(pathParts)}: ${token.$value};`;
}

function renderSemanticToken(pathParts, token, globals) {
  const targetPath = refToPath(token.$value);
  if (!targetPath) {
    throw new Error(`Semantic token "${pathParts.join('.')}" must be an alias, got "${token.$value}"`);
  }
  if (!hasPath(globals, targetPath)) {
    throw new Error(`Semantic token "${pathParts.join('.')}" points to missing global token "${token.$value}"`);
  }

  return `  --${cssName(pathParts)}: var(--${cssName(targetPath)});`;
}

function renderTheme({ globals, semantic }) {
  if (!globals || !semantic) {
    throw new Error('Expected tokens JSON with top-level "globals" and "semantic" objects');
  }

  const globalLines = flattenTokens(globals).map(({ path: tokenPath, token }) =>
    renderGlobalToken(tokenPath, token),
  );
  const semanticLines = flattenTokens(semantic).map(({ path: tokenPath, token }) =>
    renderSemanticToken(tokenPath, token, globals),
  );

  return `/* Generated from ${inputPath} by scripts/build-token-theme.mjs. */
/* Do not edit manually; rerun npm run tokens:build-css. */

:root {
  /* Global color tokens */
${globalLines.join('\n')}

  /* Semantic color tokens */
${semanticLines.join('\n')}
}
`;
}

const tokens = readJson(inputPath);
const theme = renderTheme(tokens);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, theme);

console.log(`Wrote ${countTokens(tokens.globals)} global tokens and ${countTokens(tokens.semantic)} semantic tokens to ${outputPath}`);
