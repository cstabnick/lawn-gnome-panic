// Builds every game in games/ into a static site under site/.
// The site root is a landing page with a card per game (thumbnail, title, description). Every game is at
// /<game>/. The game's display name is its index.html <title> (sample-3d is "Lawn Gnome Panic").
// Thumbnails come from games/<game>/thumbnail.jpg (see tools/thumbnails.cjs) and are served at /thumbs/<game>.jpg.
// Lawn Gnome Panic used to live at the root, so root links that carry a query string (online invite codes,
// ?autostart=...) are forwarded to /sample-3d/ with the query and hash kept. /arcade/ and the old /gnome/ alias
// redirect too.
// Usage: npm run site
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');
const siteDir = join(root, 'site');
/** The game root links with a query string belong to (it was served at the root before the landing page). */
const LEGACY_ROOT_GAME = 'sample-3d';
/** Short paths that redirect to a game, e.g. /<repo>/gnome/ -> /<repo>/sample-3d/. */
const ALIASES = { gnome: 'sample-3d' };
/** Card order on the landing page (others follow alphabetically); sample games go last. */
const ORDER = ['gnome-bowling', 'gnome-golf', 'sample-3d', 'gnaft', 'gnome-front', 'faster-than-lawn'];

function gameTitle(gameDir, name) {
  const html = existsSync(join(gameDir, 'index.html')) ? readFileSync(join(gameDir, 'index.html'), 'utf8') : '';
  const m = /<title>([^<]+)<\/title>/i.exec(html);
  return m ? m[1].trim() : name;
}

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
mkdirSync(join(siteDir, 'thumbs'), { recursive: true });

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

  cpSync(join(gameDir, 'dist'), join(siteDir, name), { recursive: true });
  const thumb = join(gameDir, 'thumbnail.jpg');
  const hasThumb = existsSync(thumb);
  if (hasThumb) cpSync(thumb, join(siteDir, 'thumbs', `${name}.jpg`));
  const description = pkg.description || readmeIntro(join(gameDir, 'README.md'));
  games.push({ name, title: gameTitle(gameDir, name), description, hasThumb });
}

const rank = (name) => {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length + (name.startsWith('sample-') && name !== 'sample-3d' ? 100 : 0) : i;
};
games.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));

const cards = games
  .map(
    ({ name, title, description, hasThumb }) => `    <a class="card" href="./${escapeHtml(name)}/">
      ${hasThumb ? `<img src="./thumbs/${escapeHtml(name)}.jpg" alt="" loading="lazy" width="480" height="270">` : '<div class="noimg"></div>'}
      <div class="text">
        <h2>${escapeHtml(title)}</h2>
        ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      </div>
    </a>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gnome Testbed Arcade</title>
  <script>
    // Lawn Gnome Panic used to be served here: forward its links (invite codes, ?autostart=...) to it.
    if (location.search) location.replace('./${LEGACY_ROOT_GAME}/' + location.search + location.hash);
  </script>
  <style>
    body { margin: 0; padding: 32px 16px; background: #121417; color: #e8e8e8; font-family: system-ui, sans-serif; }
    h1 { text-align: center; margin: 0 0 6px; }
    .sub { text-align: center; margin: 0 0 24px; color: #a7adb6; }
    .grid { display: grid; gap: 16px; max-width: 1040px; margin: 0 auto; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .card { display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; background: #1d2127; color: inherit; text-decoration: none; border: 1px solid #2c323b; transition: border-color 0.15s, transform 0.15s; }
    .card:hover, .card:focus-visible { border-color: #5b8def; transform: translateY(-2px); }
    .card img, .card .noimg { display: block; width: 100%; aspect-ratio: 16 / 9; height: auto; object-fit: cover; background: linear-gradient(135deg, #2d4a35, #1d2a3a); }
    .card .text { padding: 14px 16px 16px; }
    .card h2 { margin: 0 0 6px; font-size: 1.15rem; }
    .card p { margin: 0; color: #a7adb6; line-height: 1.4; font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
    footer { text-align: center; margin-top: 32px; }
    footer a { color: #8fb3ff; }
  </style>
</head>
<body>
  <h1>Gnome Testbed Arcade</h1>
  <p class="sub">Small game prototypes. Pick one to play.</p>
  <main class="grid">
${cards}
  </main>
  <footer><a href="https://github.com/cstabnick/lawn-gnome-panic">Source code on GitHub</a> · <a href="https://github.com/cstabnick/lawn-gnome-panic/blob/main/PRIVACY.md">Privacy</a></footer>
</body>
</html>
`;

writeFileSync(join(siteDir, 'index.html'), html);
mkdirSync(join(siteDir, 'arcade'), { recursive: true });
writeFileSync(join(siteDir, 'arcade', 'index.html'), redirectHtml('../'));
for (const [alias, target] of Object.entries(ALIASES)) {
  if (existsSync(join(siteDir, alias))) continue;
  mkdirSync(join(siteDir, alias), { recursive: true });
  writeFileSync(join(siteDir, alias, 'index.html'), redirectHtml(`../${target}/`));
}
writeFileSync(join(siteDir, '.nojekyll'), '');
console.log(`Site built: ${games.length} game(s) in ${siteDir} (landing page at the root)`);
