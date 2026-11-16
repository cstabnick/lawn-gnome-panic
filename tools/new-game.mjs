#!/usr/bin/env node
// Usage: node tools/new-game.mjs <name> [--from <existing-game>] [--party-only]
// Copies an existing game (default: sample-dodge) into games/<name>.
// --party-only marks it "lawn": { "partyOnly": true }: not on the landing page, its slices play inside gnome-party.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
let name;
let from = 'sample-dodge';
let partyOnly = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--from') {
    from = args[++i];
    if (!from) fail('Missing value for --from.');
  } else if (arg === '--party-only') {
    partyOnly = true;
  } else if (name === undefined) {
    name = arg;
  } else {
    fail(`Unexpected argument: ${arg}`);
  }
}

if (!name) fail('Usage: node tools/new-game.mjs <name> [--from <existing-game>] [--party-only]');
if (!NAME_RE.test(name)) {
  fail(`Invalid name "${name}". Use lowercase letters, digits and hyphens, starting with a letter or digit.`);
}

const gamesDir = path.join(ROOT, 'games');
const src = path.join(gamesDir, from);
const dest = path.join(gamesDir, name);

if (!fs.existsSync(src)) fail(`Source game does not exist: games/${from}`);
if (fs.existsSync(dest)) fail(`games/${name} already exists.`);

fs.cpSync(src, dest, {
  recursive: true,
  filter: (p) => !/[\\/](node_modules|dist)([\\/]|$)/.test(p),
});

const pkgPath = path.join(dest, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = name;
if (partyOnly) pkg.lawn = { ...(pkg.lawn ?? {}), partyOnly: true };
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const htmlPath = path.join(dest, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(htmlPath, html.replace(/<title>[\s\S]*?<\/title>/, `<title>${name}</title>`));
}

console.log(`Created games/${name}. Next: npm install && npm run dev -w games/${name}`);
if (partyOnly) {
  console.log(`Party-only: not on the landing page. Add events with npm run new-mini -- ${name} <id>; play one alone at #minigame=<id>.`);
} else {
  console.log('Name its Gnome Party slice: add a backlog row in packages/party/README.md (see the size rules there).');
}
