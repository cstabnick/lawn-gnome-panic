#!/usr/bin/env node
// Gnome lore knowledge base: check entries, rebuild the index, search.
//
//   npm run lore                 check every entry and rewrite docs/lore/INDEX.md
//   npm run lore -- check        check only (writes nothing); exit 1 on any error
//   npm run lore -- find <text>  search names, aliases, ids, then entry text
//
// The schema lives in docs/lore/README.md. Keep this file dependency-free.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LORE = join(ROOT, 'docs', 'lore');
const ENTRIES = join(LORE, 'entries');

const KINDS = ['place', 'person', 'faction', 'creature', 'object', 'event', 'era', 'concept', 'term'];
const TIERS = ['core', 'setting', 'game', 'apocrypha'];
const ERAS = ['planting', 'charters', 'rumbling', 'now', 'timeless'];
const STATUSES = ['canon', 'draft'];
const REQUIRED = ['id', 'name', 'kind', 'tier', 'setting', 'status', 'sources'];
const LISTS = ['games', 'aliases', 'sources', 'related'];

const posix = (p) => p.split(sep).join('/');

/** Setting ids are the `## \`id\`` headings in docs/lore/settings.md. */
function readSettings() {
  const text = readFileSync(join(LORE, 'settings.md'), 'utf8');
  const out = [];
  for (const m of text.matchAll(/^## `([a-z0-9-]+)`\s*(.*)$/gm)) out.push({ id: m[1], title: m[2].replace(/^[:\-–\s]+/, '') });
  return out;
}

/** The table at the top of settings.md: every folder in games/ is in exactly one setting row. */
function checkGameRows(settingIds) {
  const text = readFileSync(join(LORE, 'settings.md'), 'utf8');
  const where = new Map();
  const errors = [];
  for (const m of text.matchAll(/^\| `([a-z0-9-]+)` \| (.*) \|\s*$/gm)) {
    if (!settingIds.has(m[1])) errors.push(`docs/lore/settings.md: table row \`${m[1]}\` has no ## heading`);
    for (const part of m[2].split(',')) {
      const g = part.trim().split(/[\s(]/)[0];
      if (!/^[a-z0-9-]+$/.test(g) || g === 'none') continue;
      if (!existsSync(join(ROOT, 'games', g))) errors.push(`docs/lore/settings.md: no folder games/${g}`);
      else if (where.has(g)) errors.push(`docs/lore/settings.md: ${g} is in both ${where.get(g)} and ${m[1]}`);
      else where.set(g, m[1]);
    }
  }
  for (const g of readdirSync(join(ROOT, 'games'))) {
    if (statSync(join(ROOT, 'games', g)).isDirectory() && existsSync(join(ROOT, 'games', g, 'package.json')) && !where.has(g))
      errors.push(`docs/lore/settings.md: games/${g} is in no setting (add it to a row of the table)`);
  }
  return errors;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** Tiny frontmatter parser: `key: value` lines, `[a, b]` lists. */
function parse(file) {
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: null, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) { meta.__bad = (meta.__bad || []).concat(line); continue; }
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    meta[kv[1]] = v;
  }
  for (const k of LISTS) if (meta[k] !== undefined && !Array.isArray(meta[k])) meta[k] = meta[k] ? [meta[k]] : [];
  return { meta, body: m[2] };
}

/** First paragraph of the body that is not a heading: the one-line summary. */
function summary(body) {
  for (const para of body.split(/\n\s*\n/)) {
    const t = para.trim();
    if (t && !t.startsWith('#')) return t.replace(/\s+/g, ' ');
  }
  return '';
}

function load() {
  const settings = readSettings();
  const settingIds = new Set(settings.map((s) => s.id));
  const errors = [];
  const entries = [];
  for (const file of walk(ENTRIES)) {
    const rel = posix(relative(ROOT, file));
    const { meta, body } = parse(file);
    const err = (msg) => errors.push(`${rel}: ${msg}`);
    if (!meta) { err('no frontmatter (--- block at the top)'); continue; }
    if (meta.__bad) err(`unreadable frontmatter line(s): ${meta.__bad.join(' | ')}`);
    for (const k of REQUIRED) if (meta[k] === undefined || meta[k] === '' || (Array.isArray(meta[k]) && !meta[k].length)) err(`missing ${k}`);
    const e = { ...meta, file, rel, body, summary: summary(body) };
    for (const k of LISTS) e[k] = e[k] || [];
    if (e.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) err(`id "${e.id}" is not kebab-case`);
    if (e.id && basename(file, '.md') !== e.id) err(`file name must be ${e.id}.md`);
    if (e.kind && !KINDS.includes(e.kind)) err(`kind "${e.kind}" not one of ${KINDS.join(', ')}`);
    if (e.tier && !TIERS.includes(e.tier)) err(`tier "${e.tier}" not one of ${TIERS.join(', ')}`);
    if (e.status && !STATUSES.includes(e.status)) err(`status "${e.status}" not one of ${STATUSES.join(', ')}`);
    if (e.era && !ERAS.includes(e.era)) err(`era "${e.era}" not one of ${ERAS.join(', ')}`);
    if (e.setting && !settingIds.has(e.setting)) err(`setting "${e.setting}" is not a heading in docs/lore/settings.md`);
    if ((e.tier === 'core') !== (e.setting === 'core')) err('tier core and setting core go together');
    const folder = posix(relative(ENTRIES, dirname(file)));
    if (e.setting && folder !== e.setting) err(`lives in entries/${folder}/ but setting is ${e.setting} (move it to entries/${e.setting}/)`);
    for (const g of e.games) if (!existsSync(join(ROOT, 'games', g))) err(`games: no folder games/${g}`);
    for (const s of e.sources) {
      const path = s.split('#')[0];
      if (!existsSync(join(ROOT, path))) err(`sources: ${path} does not exist (paths are from the repo root)`);
    }
    if (!e.summary) err('body needs a one-paragraph summary before the first heading');
    entries.push(e);
  }
  const byId = new Map();
  for (const e of entries) {
    if (!e.id) continue;
    if (byId.has(e.id)) errors.push(`${e.rel}: duplicate id "${e.id}" (also ${byId.get(e.id).rel})`);
    else byId.set(e.id, e);
  }
  for (const e of entries) for (const r of e.related) if (!byId.has(r)) errors.push(`${e.rel}: related "${r}" is not an entry id`);
  errors.push(...checkGameRows(settingIds));
  // Two entries claiming the same name or alias inside one setting is a contradiction waiting to happen.
  const names = new Map();
  for (const e of entries) for (const n of [e.name, ...e.aliases]) {
    if (!n) continue;
    const key = `${e.setting}|${n.toLowerCase()}`;
    if (names.has(key) && names.get(key) !== e.id) errors.push(`${e.rel}: name/alias "${n}" also used by ${names.get(key)} in ${e.setting}`);
    else names.set(key, e.id);
  }
  return { settings, entries, errors };
}

function cell(s) { return String(s).replace(/\|/g, '\\|'); }

function buildIndex({ settings, entries }) {
  const lines = [
    '# Lore index',
    '',
    '<!-- Generated by `npm run lore`. Do not edit by hand: edit the entries and run it again. -->',
    '',
    `${entries.length} entries. Search with \`npm run lore -- find <text>\`. Schema and tiers: [README.md](README.md).`,
    '',
  ];
  for (const s of settings) {
    const list = entries.filter((e) => e.setting === s.id);
    if (!list.length) continue;
    lines.push(`## ${s.title || s.id} (\`${s.id}\`)`, '');
    for (const kind of KINDS) {
      const k = list.filter((e) => e.kind === kind).sort((a, b) => a.name.localeCompare(b.name));
      if (!k.length) continue;
      lines.push(`### ${kind}`, '', '| Entry | Tier | Also called | Summary |', '|---|---|---|---|');
      for (const e of k) {
        let sum = e.summary.replace(/\*\*/g, '');
        if (sum.length > 160) sum = sum.slice(0, 157).replace(/\s+\S*$/, '') + '...';
        const draft = e.status === 'draft' ? ' (draft)' : '';
        lines.push(`| [${cell(e.name)}](${posix(relative(LORE, e.file))}) | ${e.tier}${draft} | ${cell(e.aliases.join(', '))} | ${cell(sum)} |`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

function find(entries, query) {
  const q = query.toLowerCase();
  const hits = [];
  for (const e of entries) {
    const names = [e.id, e.name, ...e.aliases].map((n) => String(n).toLowerCase());
    let score = 0;
    if (names.some((n) => n === q)) score = 3;
    else if (names.some((n) => n.includes(q))) score = 2;
    const lines = e.body.split('\n').filter((l) => l.toLowerCase().includes(q));
    if (!score && lines.length) score = 1;
    if (score) hits.push({ e, score, lines });
  }
  hits.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name));
  if (!hits.length) {
    console.log(`No entry mentions "${query}". Check docs/lore/rulings.md, then the setting's sources in docs/lore/settings.md.`);
    console.log('If you decide something new, add an entry or a ruling (docs/lore/README.md says how).');
    return;
  }
  for (const { e, score, lines } of hits.slice(0, 25)) {
    console.log(`${e.name}  [${e.setting}/${e.tier}${e.status === 'draft' ? ', draft' : ''}]  ${e.rel}`);
    if (score >= 2) console.log(`  ${e.summary.slice(0, 200)}`);
    else for (const l of lines.slice(0, 2)) console.log(`  …${l.trim().slice(0, 160)}`);
  }
  if (hits.length > 25) console.log(`(${hits.length - 25} more)`);
}

const [cmd = 'index', ...rest] = process.argv.slice(2);
const data = load();

if (cmd === 'find') {
  if (!rest.length) { console.error('usage: npm run lore -- find <text>'); process.exit(2); }
  find(data.entries, rest.join(' '));
  process.exit(0);
}
if (cmd !== 'check' && cmd !== 'index') { console.error(`unknown command "${cmd}" (use check, find or nothing)`); process.exit(2); }

if (data.errors.length) {
  console.error(`${data.errors.length} lore error(s):`);
  for (const e of data.errors) console.error(`  ${e}`);
}
if (cmd === 'index') {
  writeFileSync(join(LORE, 'INDEX.md'), buildIndex(data) + '\n');
  console.log(`Wrote docs/lore/INDEX.md (${data.entries.length} entries).`);
}
if (data.errors.length) process.exit(1);
console.log(`Lore OK: ${data.entries.length} entries across ${new Set(data.entries.map((e) => e.setting)).size} settings.`);
