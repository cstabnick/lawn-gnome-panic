import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const target = process.argv[2] || 'baseline';

const server = await createServer({
  root: rootDir,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const modPath = path.resolve(__dirname, `${target}.ts`);
  const mod = await server.ssrLoadModule(modPath);
  if (typeof mod.main === 'function') {
    await mod.main(process.argv.slice(3));
  }
} finally {
  await server.close();
}
