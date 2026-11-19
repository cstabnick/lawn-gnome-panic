// The level editor's save API, mounted on the Vite dev server. The page posts level files here and this writes them
// into the game's src/data/levels folder. The request logic lives in handler.ts; this file only does the I/O.
import type { Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface LevelApiOptions {
  /** Absolute path of the repo root. */
  repo: string;
  /** Absolute path of games/gnomes-of-gnomomia/src/data/levels. */
  levelsDir: string;
}

const MAX_BODY = 20 * 1024 * 1024;

/** Reads the whole body as text. Resolves null when it is over 20 MB (the rest is drained, not kept). */
function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((ok, fail) => {
    const parts: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size <= MAX_BODY) parts.push(c);
    });
    req.on('end', () => ok(size > MAX_BODY ? null : Buffer.concat(parts).toString('utf8')));
    req.on('error', fail);
  });
}

function send(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(data));
}

export function levelApi(opts: LevelApiOptions): Plugin {
  const repo = resolve(opts.repo);
  const levelsDir = resolve(opts.levelsDir);
  const levelsRel = relative(repo, levelsDir);
  // The handler imports @lawn/level, whose files are extensionless TypeScript: Node cannot load them, so the handler
  // is loaded through Vite's own module pipeline (and kept out of the config's static imports).
  const handlerPath = resolve(dirname(fileURLToPath(import.meta.url)), 'handler.ts');
  return {
    name: 'level-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        try {
          const route = (req.url ?? '').split('?')[0];
          const text = await readBody(req);
          if (text === null) return send(res, 400, { error: 'Request body is over 20 MB' });
          const { handleLevelRequest } = (await server.ssrLoadModule(handlerPath)) as typeof import('./handler');
          const out = handleLevelRequest({ method: req.method ?? 'GET', route, body: text }, levelsRel);
          if (out.write) {
            const abs = resolve(repo, out.write.relPath);
            if (!abs.startsWith(levelsDir + sep)) throw new Error(`Refusing to write outside ${levelsRel}`);
            mkdirSync(dirname(abs), { recursive: true });
            writeFileSync(abs, out.write.text);
          }
          send(res, out.status, out.json);
        } catch (e) {
          send(res, 500, { error: e instanceof Error ? e.message : String(e) });
        }
      });
    },
  };
}
