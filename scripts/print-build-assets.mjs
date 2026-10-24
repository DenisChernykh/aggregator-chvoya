import fs from 'node:fs';
import path from 'node:path';

const buildDir = path.resolve(process.cwd(), 'build');
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.warn('[cms-assets] build/index.html not found. Run the build first.');
  process.exit(0);
}

const html = fs.readFileSync(indexPath, 'utf8');

const collectAssets = (pattern) =>
  [...html.matchAll(pattern)]
    .map((match) => match[1].replace(/^\.\//, '').replace(/^assets\//, ''))
    .filter((asset, index, assets) => assets.indexOf(asset) === index);

const cssAssets = collectAssets(/href=["']\.\/assets\/(css\/[^"']+\.css)["']/g)
  .filter((asset) => /\/main-[^/]+\.css$/.test(asset));

const jsAssets = collectAssets(/(?:src|href)=["']\.\/assets\/(js\/[^"']+\.js)["']/g)
  .filter((asset) => /\/main-[^/]+\.js$/.test(asset));

console.log('\nCMS assets:');

for (const asset of cssAssets) {
  const mainCss = path.posix.basename(asset);

  console.log(`$mainCss = '${mainCss}';`);
  console.log('<link rel="stylesheet" href="{{ assets_url() }}/css/{{ $mainCss }}">');
}

for (const asset of jsAssets) {
  console.log(`<script type="module" src="{{ assets_url() }}/${asset}" defer></script>`);
}

if (!cssAssets.length && !jsAssets.length) {
  console.log('No hashed main CSS/JS assets found in build/index.html.');
}
