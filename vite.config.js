import path from 'node:path';
import { defineConfig } from 'vite';
import fs from 'node:fs';

function resolveHtmlIncludes(html, fromFile, seen = new Set()) {
  const includeRe = /@@include\(\s*['"]([^'"]+)['"]\s*\)/g;
  const fromDir = path.dirname(fromFile);

  return html.replace(includeRe, (_match, raw) => {
    const spec = String(raw).trim();

    let includeFile;
    if (spec.startsWith('@/')) includeFile = path.resolve(process.cwd(), spec.slice(2));
    else if (spec.startsWith('/')) includeFile = path.resolve(process.cwd(), spec.slice(1));
    else includeFile = path.resolve(fromDir, spec);

    const normalized = path.normalize(includeFile);
    if (seen.has(normalized)) {
      throw new Error(`Circular @@include detected: ${normalized}`);
    }
    if (!fs.existsSync(normalized)) {
      throw new Error(`@@include not found: ${normalized} (from ${fromFile})`);
    }

    seen.add(normalized);
    const chunk = fs.readFileSync(normalized, 'utf8');
    const result = resolveHtmlIncludes(chunk, normalized, seen);
    seen.delete(normalized);
    return result;
  });
}

function htmlIncludesPlugin() {
  const root = process.cwd();
  const partialsDir = path.resolve(root, 'templates');

  return {
    name: 'html-includes',
    enforce: 'pre',
    configureServer(server) {
      if (fs.existsSync(partialsDir)) server.watcher.add(partialsDir);
    },
    handleHotUpdate({ file, server }) {
      const isPartial =
        file.endsWith('.html') &&
        path.normalize(file).startsWith(path.normalize(partialsDir + path.sep));
      if (isPartial) server.ws.send({ type: 'full-reload' });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const filename =
          ctx?.filename ??
          (ctx?.path
            ? path.resolve(root, ctx.path.replace(/^\//, ''))
            : path.resolve(root, 'index.html'));

        return resolveHtmlIncludes(html, filename);
      },
    },
  };
}

function collectHtmlEntries() {
  const root = process.cwd();
  const entries = [];

  // HTML-файлы в корне (index.html, archive.html, single.html и т.д.)
  if (fs.existsSync(root)) {
    const rootItems = fs.readdirSync(root, { withFileTypes: true });
    for (const item of rootItems) {
      if (item.isFile() && item.name.endsWith('.html') && !item.name.startsWith('_')) {
        entries.push(path.join(root, item.name));
      }
    }
  }

  // HTML-файлы из папки pages/ (рекурсивно)
  const pagesDir = path.resolve(root, 'pages');
  if (fs.existsSync(pagesDir)) {
    const stack = [pagesDir];
    while (stack.length) {
      const dir = stack.pop();
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) stack.push(fullPath);
        else if (item.isFile() && item.name.endsWith('.html') && !item.name.startsWith('_')) {
          entries.push(fullPath);
        }
      }
    }
  }

  return entries.sort((a, b) => a.localeCompare(b));
}

function collectEntries() {
  const htmlFiles = collectHtmlEntries();

  const entries = Object.fromEntries(
    htmlFiles.map((file) => {
      const name = path
        .relative(process.cwd(), file)
        .replace(/\\/g, '/')
        .replace(/\.html$/, '');

      return [name, file];
    }),
  );

  entries.theme = path.resolve(process.cwd(), 'assets/scss/theme.scss');
  entries.dev = path.resolve(process.cwd(), 'assets/js/libs/dev.js');
  entries.devConfig = path.resolve(process.cwd(), 'assets/js/libs/dev.config.js');

  return entries;
}

export default defineConfig({
  base: './',
  plugins: [htmlIncludesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd()),
    },
  },


  build: {
    outDir: "build",
    assetsDir: "assets",
    cssCodeSplit: true,
    emptyOutDir: true, // очищаем папку билда
    sourcemap: false, // отключаем карты
    assetsInlineLimit: 0,
    rollupOptions: {
      input: collectEntries(),
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "dev") {
            return "assets/js/dev.js";
          }

          if (chunkInfo.name === "devConfig") {
            return "assets/js/dev.config.js";
          }

          return "assets/js/[name]-[hash].js";
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? "";
          const ext = name.split(".").pop()?.toLowerCase() ?? "";

          if (/(png|jpe?g|gif|svg|webp|ico|avif)$/i.test(ext)) {
            // Получаем путь из originalFileName
            let fullPath = assetInfo.originalFileName || name;

            // Убираем префикс "assets/images/" если он есть
            let relativePath = fullPath.replace(/^assets\/images\//, "");

            // Получаем директорию (без имени файла)
            let dir = "";
            const lastSlash = relativePath.lastIndexOf("/");
            if (lastSlash > -1) {
              dir = relativePath.substring(0, lastSlash);
            }

            // Кладем ВСЕ изображения в assets/images/
            if (dir) {
              return `assets/images/${dir}/[name][extname]`;
            }
            return `assets/images/[name][extname]`;
          }

          if (/(woff2?|ttf|otf|eot)$/i.test(ext)) {
            return "assets/fonts/[name][extname]";
          }

          if (/\.css$/i.test(name)) {
            // Если это наш theme.css, убираем хеш и кладем в assets/css/
            if (name.startsWith("theme")) {
              return "assets/css/theme[extname]";
            }
            // Для остальных CSS оставляем хеш
            return "assets/css/[name]-[hash][extname]";
          }

          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

});