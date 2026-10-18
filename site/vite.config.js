import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { buildCatalog } from '../scripts/catalog.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WATCHED = [join(ROOT, 'plugins'), join(ROOT, '.claude-plugin')];

/** Serves the catalog as /catalog.json in dev (rebuilt on every change in the repo) and emits it into dist on build. */
function catalog() {
  const json = () => JSON.stringify(buildCatalog());
  return {
    name: 'dev-digest-catalog',
    configureServer(server) {
      server.watcher.add(WATCHED);
      const reload = (file) => {
        if (WATCHED.some((dir) => file.startsWith(dir))) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload).on('change', reload).on('unlink', reload);
      server.middlewares.use('/catalog.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(json());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'catalog.json', source: json() });
    },
  };
}

// `base: './'` keeps asset URLs relative, so the build works under https://<user>.github.io/<repo>/.
export default defineConfig({
  base: './',
  plugins: [react(), catalog()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { fs: { allow: [ROOT] } },
  test: { environment: 'node', include: ['src/**/*.test.js'], root: fileURLToPath(new URL('.', import.meta.url)) },
});
