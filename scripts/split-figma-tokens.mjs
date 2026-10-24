import fs from 'node:fs';
import path from 'node:path';

const GLOBAL_COLLECTION = 'Color/Globals Tokens';
const SEMANTIC_COLLECTION = 'Color/Semantic Tokens';
const DEFAULT_GLOBAL_MODE = process.env.FIGMA_GLOBAL_MODE ?? 'Хвоя';
const DEFAULT_SEMANTIC_MODE = process.env.FIGMA_SEMANTIC_MODE ?? 'light';

function parseArgs(argv) {
  const positional = [];
  const options = {
    globalMode: DEFAULT_GLOBAL_MODE,
    semanticMode: DEFAULT_SEMANTIC_MODE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--global-mode') {
      options.globalMode = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--global-mode=')) {
      options.globalMode = arg.slice('--global-mode='.length);
      continue;
    }

    if (arg === '--semantic-mode') {
      options.semanticMode = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--semantic-mode=')) {
      options.semanticMode = arg.slice('--semantic-mode='.length);
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option "${arg}"`);
    }

    positional.push(arg);
  }

  if (!options.globalMode) {
    throw new Error('Expected a non-empty --global-mode value');
  }

  if (!options.semanticMode) {
    throw new Error('Expected a non-empty --semantic-mode value');
  }

  return {
    inputPath: positional[0] ?? 'assets/tokens.figma.json',
    outputDir: positional[1] ?? 'assets/tokens',
    combinedOutputPath: positional[2] ?? 'assets/tokens.json',
    globalMode: options.globalMode,
    semanticMode: options.semanticMode,
  };
}

const { inputPath, outputDir, combinedOutputPath, globalMode, semanticMode } = parseArgs(
  process.argv.slice(2),
);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON from ${filePath}: ${error.message}`);
  }
}

function normalizeName(name) {
  return name.replace(/\//g, '.');
}

function setNested(target, dottedPath, value) {
  const parts = dottedPath.split('.');
  let cursor = target;

  for (const part of parts.slice(0, -1)) {
    cursor[part] ??= {};
    cursor = cursor[part];
  }

  cursor[parts.at(-1)] = value;
}

function colorToHexOrRgba(value) {
  const r = Math.round(value.r * 255);
  const g = Math.round(value.g * 255);
  const b = Math.round(value.b * 255);
  const alpha = Math.round(value.a * 1000) / 1000;

  if (Math.abs(alpha - 1) < 0.001) {
    return `#${[r, g, b]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createToken(variable, value) {
  const token = {
    $type: 'color',
    $value: value,
  };

  if (variable.description) {
    token.$description = variable.description;
  }

  return token;
}

function findCollection(collections, collectionName) {
  const collection = collections.find((item) => item.name === collectionName);
  if (!collection) {
    throw new Error(`Collection "${collectionName}" was not found in the Figma export`);
  }
  return collection;
}

function findModeId(collection, modeName) {
  const mode = collection.modes.find((item) => item.name === modeName);
  if (!mode) {
    const availableModes = collection.modes.map((item) => `"${item.name}"`).join(', ');
    throw new Error(
      `Mode "${modeName}" was not found in collection "${collection.name}". Available modes: ${availableModes}`,
    );
  }
  return mode.modeId;
}

function countTokens(node) {
  if (!node || typeof node !== 'object') return 0;
  if ('$value' in node) return 1;
  return Object.values(node).reduce((count, value) => count + countTokens(value), 0);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const rawExport = readJson(inputPath);
const collections = rawExport.collections;

if (!Array.isArray(collections)) {
  throw new Error('Expected a Figma MCP export with a top-level "collections" array');
}

const variablesById = new Map();
for (const collection of collections) {
  for (const variable of collection.variables ?? []) {
    variablesById.set(variable.id, variable);
  }
}

const globalsCollection = findCollection(collections, GLOBAL_COLLECTION);
const semanticCollection = findCollection(collections, SEMANTIC_COLLECTION);
const globalsModeId = findModeId(globalsCollection, globalMode);
const semanticModeId = findModeId(semanticCollection, semanticMode);
const globalVariableIds = new Set((globalsCollection.variables ?? []).map((variable) => variable.id));

const globals = {};
for (const variable of globalsCollection.variables ?? []) {
  if (variable.resolvedType !== 'COLOR') continue;

  const value = variable.valuesByMode?.[globalsModeId];
  if (!value) {
    throw new Error(`Global token "${variable.name}" has no value for mode "${globalMode}"`);
  }
  if (value.type === 'VARIABLE_ALIAS') {
    throw new Error(`Global token "${variable.name}" unexpectedly points to an alias`);
  }

  setNested(globals, normalizeName(variable.name), createToken(variable, colorToHexOrRgba(value)));
}

const semantic = {};
for (const variable of semanticCollection.variables ?? []) {
  if (variable.resolvedType !== 'COLOR') continue;

  const value = variable.valuesByMode?.[semanticModeId];
  if (!value) {
    throw new Error(`Semantic token "${variable.name}" has no value for mode "${semanticMode}"`);
  }
  if (value.type !== 'VARIABLE_ALIAS') {
    throw new Error(`Semantic token "${variable.name}" must stay an alias in mode "${semanticMode}"`);
  }

  const target = variablesById.get(value.id);
  if (!target) {
    throw new Error(`Semantic token "${variable.name}" points to missing variable "${value.id}"`);
  }
  if (!globalVariableIds.has(target.id)) {
    throw new Error(
      `Semantic token "${variable.name}" points to "${target.name}", which is not a global token`,
    );
  }

  const targetValue = target.valuesByMode?.[globalsModeId];
  if (!targetValue) {
    throw new Error(
      `Semantic token "${variable.name}" points to "${target.name}", but the target has no value for global mode "${globalMode}"`,
    );
  }
  if (targetValue.type === 'VARIABLE_ALIAS') {
    throw new Error(
      `Semantic token "${variable.name}" points to "${target.name}", but the target unexpectedly points to another alias in global mode "${globalMode}"`,
    );
  }

  setNested(semantic, normalizeName(variable.name), createToken(variable, `{${normalizeName(target.name)}}`));
}

writeJson(path.join(outputDir, 'globals.json'), globals);
writeJson(path.join(outputDir, 'semantic.json'), semantic);
writeJson(combinedOutputPath, { globals, semantic });

console.log(`Using "${GLOBAL_COLLECTION}" mode "${globalMode}"`);
console.log(`Using "${SEMANTIC_COLLECTION}" mode "${semanticMode}"`);
console.log(`Wrote ${countTokens(globals)} global tokens to ${path.join(outputDir, 'globals.json')}`);
console.log(`Wrote ${countTokens(semantic)} semantic tokens to ${path.join(outputDir, 'semantic.json')}`);
console.log(`Wrote combined tokens to ${combinedOutputPath}`);
