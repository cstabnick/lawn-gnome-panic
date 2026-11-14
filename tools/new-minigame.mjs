#!/usr/bin/env node
// Usage: node tools/new-minigame.mjs <game> <id>
// Scaffolds a Gnome Party slice (games/<game>/src/minigames/<id>.ts) from packages/party/template/minigame.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const ID_RE = /^[a-z][a-z0-9-]*$/;
const GAMES_DIR = path.join(ROOT, 'games');
const PARTY_DIR = path.join(ROOT, 'packages', 'party');
const TEMPLATE = path.join(PARTY_DIR, 'template', 'minigame.ts');
const README_PATH = path.join(PARTY_DIR, 'README.md');

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length !== 2) fail('Usage: node tools/new-minigame.mjs <game> <id>');
const [game, id] = args;

if (!NAME_RE.test(game)) fail(`Invalid game "${game}". Use lowercase letters, digits and hyphens.`);
const gameDir = path.join(GAMES_DIR, game);
const pkgPath = path.join(gameDir, 'package.json');
if (!fs.existsSync(pkgPath)) fail(`Unknown game: games/${game} does not exist.`);

const gamePkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (!gamePkg.dependencies?.three) {
  fail(
    `${game} is not a Three.js game: reuse its simulation with a Three.js view; see packages/party/README.md`,
  );
}

if (!ID_RE.test(id)) fail(`Invalid id "${id}". Use lowercase letters, digits and hyphens, starting with a letter.`);

const minigamesDir = path.join(gameDir, 'src', 'minigames');
const sliceFile = path.join(minigamesDir, `${id}.ts`);
if (fs.existsSync(sliceFile)) fail(`games/${game}/src/minigames/${id}.ts already exists.`);

for (const other of fs.readdirSync(GAMES_DIR)) {
  const otherFile = path.join(GAMES_DIR, other, 'src', 'minigames', `${id}.ts`);
  if (fs.existsSync(otherFile)) {
    fail(`${id} is already used by games/${other}/src/minigames/${id}.ts (ids are unique across games).`);
  }
}

const title = id
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

// Validation is done: from here on, write.
fs.mkdirSync(minigamesDir, { recursive: true });
const template = fs.readFileSync(TEMPLATE, 'utf8');
const slice = template
  .split('__ID__').join(id)
  .split('__TITLE__').join(title)
  .split('__GAME__').join(game);
fs.writeFileSync(sliceFile, slice);
console.log(`Wrote games/${game}/src/minigames/${id}.ts`);

// index.ts: create it, or add the slice to the existing array.
const indexPath = path.join(minigamesDir, 'index.ts');
const importLine = `import m_NUM from './${id}';`;
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(
    indexPath,
    `import type { AnyMinigame } from '@lawn/party';\nimport m0 from './${id}';\n\nexport const minigames: AnyMinigame[] = [m0];\n`,
  );
  console.log(`Wrote games/${game}/src/minigames/index.ts`);
} else {
  const text = fs.readFileSync(indexPath, 'utf8');
  const arrayRe = /export const minigames: AnyMinigame\[\] = \[([\s\S]*?)\];/;
  const match = text.match(arrayRe);
  const usedNumbers = [...text.matchAll(/import m(\d+) from /g)].map((m) => Number(m[1]));
  const n = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 0;
  const mName = `m${n}`;
  const importText = `import ${mName} from './${id}';`;

  if (!match) {
    console.log(`Could not find \`export const minigames: AnyMinigame[] = [\` in games/${game}/src/minigames/index.ts.`);
    console.log('Add these two lines by hand:');
    console.log(`  ${importText}`);
    console.log(`  add ${mName} to the minigames array`);
  } else {
    const inner = match[1];
    let newInner;
    if (inner.trim() === '') {
      newInner = mName;
    } else {
      const multiline = inner.includes('\n');
      const trailingWs = inner.match(/\s*$/)[0];
      const body = inner.slice(0, inner.length - trailingWs.length);
      const hadComma = /,\s*$/.test(body);
      const cleanBody = body.replace(/,\s*$/, '');
      const sep = multiline ? ',\n  ' : ', ';
      const trailingComma = multiline && hadComma ? ',' : '';
      newInner = cleanBody + sep + mName + trailingComma + trailingWs;
    }
    const replacement = `export const minigames: AnyMinigame[] = [${newInner}];`;
    let updated = text.replace(arrayRe, replacement);

    // Insert the import after the last import statement.
    const lines = updated.split('\n');
    let last = -1;
    lines.forEach((line, i) => {
      if (/^\s*import\b.*;\s*$/.test(line) || /\bfrom\s+['"][^'"]+['"];?\s*$/.test(line)) last = i;
    });
    if (last >= 0) {
      lines.splice(last + 1, 0, importText);
    } else {
      lines.unshift(importText);
    }
    updated = lines.join('\n');
    fs.writeFileSync(indexPath, updated);
    console.log(`Updated games/${game}/src/minigames/index.ts (added ${id} as ${mName})`);
  }
}

// minigames.test.ts and play.ts: only when missing.
const testPath = path.join(minigamesDir, 'minigames.test.ts');
if (!fs.existsSync(testPath)) {
  fs.writeFileSync(
    testPath,
    "import { testMinigame } from '@lawn/party/testkit';\nimport { minigames } from '.';\n\nfor (const m of minigames) testMinigame(m);\n",
  );
  console.log(`Wrote games/${game}/src/minigames/minigames.test.ts`);
}

const playPath = path.join(minigamesDir, 'play.ts');
if (!fs.existsSync(playPath)) {
  fs.writeFileSync(
    playPath,
    [
      "import { playMinigame } from '@lawn/party';",
      "import { minigames } from '.';",
      '',
      '// Plays this game\'s slice alone against 3 CPUs: open the page with #minigame=<id>, or get the first slice.',
      'export function playOwnSlice(): void {',
      '  const wanted = /[#&]minigame=([^&]+)/.exec(location.hash)?.[1];',
      '  const def = minigames.find((m) => m.meta.id === wanted) ?? minigames[0];',
      '  if (!def) throw new Error(`games/' + game + ' has no minigames`);',
      "  playMinigame(def, { canvas: document.getElementById('game') as HTMLCanvasElement, ui: document.getElementById('ui') as HTMLElement });",
      '}',
      '',
    ].join('\n'),
  );
  console.log(`Wrote games/${game}/src/minigames/play.ts`);
}

// games/<game>/package.json: dependencies, devDependencies and the test script.
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.dependencies = pkg.dependencies ?? {};
if (!('@lawn/party' in pkg.dependencies)) pkg.dependencies['@lawn/party'] = '*';
pkg.devDependencies = pkg.devDependencies ?? {};
if (!('vitest' in pkg.devDependencies)) pkg.devDependencies.vitest = '5.1.0';
pkg.scripts = pkg.scripts ?? {};
if (!('test' in pkg.scripts)) pkg.scripts.test = 'vitest run';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// packages/party/README.md backlog row.
const readme = fs.readFileSync(README_PATH, 'utf8');
const lines = readme.split('\n');
const backlogStart = lines.findIndex((l) => /^##\s+Backlog\s*$/.test(l));
if (backlogStart < 0) fail('packages/party/README.md has no "## Backlog" section.');
let tableEnd = -1;
let rowIndex = -1;
for (let i = backlogStart + 1; i < lines.length; i++) {
  const line = lines[i];
  if (/^\s*\|/.test(line)) {
    tableEnd = i;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells[0] === id) rowIndex = i;
  } else if (tableEnd >= 0 && line.trim() !== '') {
    break;
  }
}
if (rowIndex >= 0) {
  const cells = lines[rowIndex].split('|');
  cells[cells.length - 2] = ' building ';
  lines[rowIndex] = cells.join('|');
} else if (tableEnd >= 0) {
  lines.splice(tableEnd + 1, 0, `| ${id} | ${game} | TODO one-line idea | building |`);
} else {
  fail('packages/party/README.md backlog has no table.');
}
fs.writeFileSync(README_PATH, lines.join('\n'));
console.log(`Backlog: ${id} is marked building in packages/party/README.md`);

// games/<game>/src/main.ts: the entry must split out #minigame.
const mainPath = path.join(gameDir, 'src', 'main.ts');
const mainText = fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf8') : '';
if (!mainText.includes('minigames/play')) {
  console.log(
    'Split the entry: git mv src/main.ts src/app.ts, remove loadMyGnome from app.ts, and write the 5-line main.ts from packages/party/README.md (How a game surfaces a slice).',
  );
}

// Size rules, from the markers in the README.
const sizeMatch = fs.readFileSync(README_PATH, 'utf8').match(/<!-- size-rules -->([\s\S]*?)<!-- \/size-rules -->/);
if (sizeMatch) console.log(`\nSize rules:\n${sizeMatch[1].trim()}\n`);

console.log(`Try it: npm run dev -w games/${game}, open the page with #minigame=${id}.`);
console.log(`Check it: npm test -w games/${game}.`);
