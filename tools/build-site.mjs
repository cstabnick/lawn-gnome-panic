// Builds every game in games/ into a static site under site/.
// The FEATURED game is served at the site root; its old /<game>/ path becomes a redirect
// (query string and hash kept, so ?code=... links still work), as do FEATURED_ALIASES. Every other game is at
// /<game>/, and the list of all games is at /arcade/.
// Usage: npm run site
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');
const siteDir = join(root, 'site');
const FEATURED = 'sample-3d';
/** Extra short paths that redirect to the featured game, e.g. /<repo>/gnome/. */
const FEATURED_ALIASES = ['gnome'];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// First prose paragraph of a README (skips headings and blank blocks).
function readmeIntro(path) {
  if (!existsSync(path)) return '';
  const blocks = readFileSync(path, 'utf8').split(/\r?\n\s*\r?\n/);
  for (const block of blocks) {
    const text = block.trim();
    if (text && !text.startsWith('#')) return text.replace(/\s+/g, ' ');
  }
  return '';
}

// GitHub Pages has no server-side redirects: a page that replaces itself does the job.
function redirectHtml(to) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Moved</title>
  <link rel="canonical" href="${to}">
  <script>location.replace(${JSON.stringify(to)} + location.search + location.hash);</script>
  <meta http-equiv="refresh" content="0; url=${to}">
</head>
<body><a href="${to}">This game moved here.</a></body>
</html>
`;
}

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });

const games = [];
for (const name of readdirSync(gamesDir).sort()) {
  const gameDir = join(gamesDir, name);
  if (!statSync(gameDir).isDirectory()) continue;
  const pkgPath = join(gameDir, 'package.json');
  if (!existsSync(pkgPath)) continue;
  const pkg = readJson(pkgPath);
  if (!pkg.scripts || !pkg.scripts.build) continue;

  try {
    execSync(`npm run build -w games/${name}`, { cwd: root, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error(`Build failed for games/${name}`);
    process.exit(1);
  }

  if (name === FEATURED) {
    cpSync(join(gameDir, 'dist'), siteDir, { recursive: true });
    for (const path of [name, ...FEATURED_ALIASES]) {
      mkdirSync(join(siteDir, path), { recursive: true });
      writeFileSync(join(siteDir, path, 'index.html'), redirectHtml('../'));
    }
  } else {
    cpSync(join(gameDir, 'dist'), join(siteDir, name), { recursive: true });
  }
  const description = pkg.description || readmeIntro(join(gameDir, 'README.md'));
  games.push({ name, description });
}

const cards = games
  .map(
    ({ name, description }) => `    <a class="card" href="${name === FEATURED ? '../' : `../${escapeHtml(name)}/`}">
      <h2>${escapeHtml(name)}</h2>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    </a>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gnome Testbed Arcade</title>
  <style>
    body { margin: 0; padding: 32px 16px; background: #121417; color: #e8e8e8; font-family: system-ui, sans-serif; }
    h1 { text-align: center; margin: 0 0 24px; }
    .grid { display: grid; gap: 16px; max-width: 960px; margin: 0 auto; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .card { display: block; padding: 20px; border-radius: 12px; background: #1d2127; color: inherit; text-decoration: none; border: 1px solid #2c323b; }
    .card:hover { border-color: #5b8def; }
    .card h2 { margin: 0 0 8px; font-size: 1.2rem; }
    .card p { margin: 0; color: #a7adb6; line-height: 1.4; }
    footer { text-align: center; margin-top: 32px; }
    footer a { color: #8fb3ff; }
  </style>
</head>
<body>
  <h1>Gnome Testbed Arcade</h1>
  <main class="grid">
${cards}
  </main>
  <footer><a href="https://github.com/cstabnick/lawn-gnome-panic">Source code on GitHub</a> · <a href="https://github.com/cstabnick/lawn-gnome-panic/blob/main/PRIVACY.md">Privacy</a></footer>
</body>
</html>
`;

mkdirSync(join(siteDir, 'arcade'), { recursive: true });
writeFileSync(join(siteDir, 'arcade', 'index.html'), html);
writeFileSync(join(siteDir, '.nojekyll'), '');
if (!games.some((g) => g.name === FEATURED)) writeFileSync(join(siteDir, 'index.html'), redirectHtml('./arcade/'));
console.log(`Site built: ${games.length} game(s) in ${siteDir} (${FEATURED} at the root, list at arcade/)`);
