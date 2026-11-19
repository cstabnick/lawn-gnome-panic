// The prefab editor is a local tool: its dev server also writes prefab and anchor edits back into the repo's source.
import { defineConfig, type Plugin } from 'vite';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { CatalogSource, findUsage, saveAnchors, type Anchors, type SaveRequest } from './server/source';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const reviewPath = resolve(here, 'review.json');

function body(req: IncomingMessage): Promise<unknown> {
  return new Promise((ok, fail) => {
    let s = '';
    req.on('data', (c) => { s += c; });
    req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { fail(e); } });
  });
}

function send(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(data));
}

function editorApi(): Plugin {
  const catalog = new CatalogSource(repo);
  return {
    name: 'prefab-editor-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        try {
          const route = (req.url ?? '').split('?')[0];
          if (route === '/source' && req.method === 'POST') {
            const { ids } = (await body(req)) as { ids: string[] };
            return send(res, 200, catalog.info(ids));
          }
          if (route === '/usage' && req.method === 'POST') {
            const { ids } = (await body(req)) as { ids: string[] };
            return send(res, 200, findUsage(repo, ids));
          }
          if (route === '/save' && req.method === 'POST') {
            return send(res, 200, catalog.save((await body(req)) as SaveRequest));
          }
          if (route === '/anchors' && req.method === 'POST') {
            saveAnchors(repo, (await body(req)) as Anchors);
            return send(res, 200, { file: 'packages/gnome/src/anatomy.ts' });
          }
          if (route === '/review' && req.method === 'GET') {
            return send(res, 200, existsSync(reviewPath) ? JSON.parse(readFileSync(reviewPath, 'utf8')) : {});
          }
          if (route === '/review' && req.method === 'POST') {
            const data = (await body(req)) as Record<string, unknown>;
            const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
            writeFileSync(reviewPath, JSON.stringify(sorted, null, 2) + '\n');
            return send(res, 200, { file: 'tools/prefab-editor/review.json' });
          }
          send(res, 404, { error: `No route ${req.method} ${route}` });
        } catch (e) {
          send(res, 400, { error: e instanceof Error ? e.message : String(e) });
        }
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 5390,
    // The page saves into these files itself; reloading on top of that would throw away the editor's state.
    watch: { ignored: ['**/tools/prefab-editor/review.json'] },
  },
  plugins: [editorApi()],
});
