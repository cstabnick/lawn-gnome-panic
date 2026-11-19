// Reads and rewrites prefab definitions in packages/prefabs/src/catalog/*.ts as text, so a save touches only the
// lines that changed and keeps comments, helpers and formatting everywhere else.
//
// A prefab's `parts` can be saved only when its array is plain data (numbers, strings, true/false, the Part keys).
// Arrays built by code (spreads, helper calls, constants like DARK) are read-only here: the editor offers a copy
// of the new array instead. `grip` and `wear` can always be saved.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type Vec3 = [number, number, number];
export interface PartData {
  s: string;
  d: number[];
  name?: string;
  group?: string;
  at?: Vec3;
  rot?: Vec3;
  scale?: Vec3;
  c: string | number;
  glow?: boolean;
  alpha?: number;
  seg?: number;
  mirror?: boolean;
}
export interface WearData { at?: Vec3; rot?: Vec3; scale?: number }

/** One part in a save: its data, the index it had in the file (null = new), and whether it changed. */
export interface SavePart { part: PartData; orig: number | null; changed: boolean }
export interface SaveRequest {
  id: string;
  /** Omit to leave `parts` alone. */
  parts?: SavePart[];
  /** null removes the field; omit to leave it alone. */
  grip?: Vec3 | null;
  wear?: WearData | null;
}

export interface SourceInfo {
  file: string;   // repo-relative
  abs: string;    // absolute path, for an editor link
  line: number;   // 1-based line of the id
  partsEditable: boolean;
  reason?: string;
}

// ------------------------------------------------------------------ a tiny scanner (strings and comments aware)

/** Index just past the string or comment starting at i, or i if none starts there. */
function skipNonCode(src: string, i: number): number {
  const ch = src[i];
  if (ch === '/' && src[i + 1] === '/') {
    const e = src.indexOf('\n', i);
    return e < 0 ? src.length : e;
  }
  if (ch === '/' && src[i + 1] === '*') {
    const e = src.indexOf('*/', i + 2);
    return e < 0 ? src.length : e + 2;
  }
  if (ch === '\'' || ch === '"' || ch === '`') {
    let j = i + 1;
    while (j < src.length && src[j] !== ch) {
      if (src[j] === '\\') j++;
      j++;
    }
    return j + 1;
  }
  return i;
}

/** Index of the bracket that closes the one at `open` ({, [ or (). */
function matchBracket(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const skip = skipNonCode(src, i);
    if (skip !== i) { i = skip - 1; continue; }
    const ch = src[i];
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error('Unbalanced brackets');
}

/** The `{ ... }` of the object literal holding `id: '<id>'`. */
function findDef(src: string, id: string): { open: number; close: number; idAt: number } | null {
  const stack: number[] = [];
  const re = new RegExp(`^id\\s*:\\s*(['"])${id.replace(/[-]/g, '\\-')}\\1`);
  for (let i = 0; i < src.length; i++) {
    const skip = skipNonCode(src, i);
    if (skip !== i) { i = skip - 1; continue; }
    const ch = src[i];
    if (ch === '{' || ch === '[' || ch === '(') stack.push(ch === '{' ? i : -1);
    else if (ch === '}' || ch === ']' || ch === ')') stack.pop();
    else if (ch === 'i' && !/[\w$.]/.test(src[i - 1] ?? '') && re.test(src.slice(i, i + id.length + 12))) {
      const open = stack[stack.length - 1];
      if (open !== undefined && open >= 0) return { open, close: matchBracket(src, open), idAt: i };
    }
  }
  return null;
}

interface Prop { keyStart: number; valueStart: number; valueEnd: number }

/** A top-level property of the object literal at [open, close]. valueEnd is exclusive. */
function findProp(src: string, open: number, close: number, name: string): Prop | null {
  let depth = 0;
  for (let i = open + 1; i < close; i++) {
    const skip = skipNonCode(src, i);
    if (skip !== i) { i = skip - 1; continue; }
    const ch = src[i];
    if (ch === '{' || ch === '[' || ch === '(') { depth++; continue; }
    if (ch === '}' || ch === ']' || ch === ')') { depth--; continue; }
    if (depth !== 0 || /[\w$]/.test(src[i - 1] ?? '')) continue;
    const m = /^([A-Za-z_$][\w$]*)\s*:\s*/.exec(src.slice(i, i + 64));
    if (!m || m[1] !== name) continue;
    const valueStart = i + m[0].length;
    let valueEnd: number;
    if (src[valueStart] === '[' || src[valueStart] === '{') valueEnd = matchBracket(src, valueStart) + 1;
    else {
      let j = valueStart;
      let d = 0;
      for (; j < close; j++) {
        const s2 = skipNonCode(src, j);
        if (s2 !== j) { j = s2 - 1; continue; }
        const c = src[j];
        if (c === '{' || c === '[' || c === '(') d++;
        else if (c === '}' || c === ']' || c === ')') d--;
        else if (c === ',' && d === 0) break;
      }
      valueEnd = j;
    }
    return { keyStart: i, valueStart, valueEnd };
  }
  return null;
}

const PART_KEYS = new Set(['s', 'd', 'name', 'group', 'at', 'rot', 'scale', 'c', 'glow', 'alpha', 'seg', 'mirror', 'true', 'false']);

/** Why this array text is not plain data, or null if it is. */
function notPlainData(arrayText: string): string | null {
  let code = '';
  for (let i = 0; i < arrayText.length; i++) {
    const skip = skipNonCode(arrayText, i);
    if (skip !== i) {
      const ch = arrayText[i];
      code += ch === '\'' || ch === '"' || ch === '`' ? '""' : ' ';
      if (ch === '`') return 'uses a template string';
      i = skip - 1;
      continue;
    }
    code += arrayText[i];
  }
  if (code.includes('...')) return 'built with ...spreads';
  for (const m of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) {
    if (!PART_KEYS.has(m[1])) return `uses \`${m[1]}\` (code, not plain data)`;
  }
  return null;
}

/** Top-level elements of an array literal: each one's code span plus its comment lines. */
interface Chunk { lead: string; code: string; trail: string }
function splitArray(src: string, open: number, close: number): Chunk[] {
  const chunks: Chunk[] = [];
  let depth = 0;
  let start = open + 1;
  const push = (end: number): void => {
    const raw = src.slice(start, end);
    // Comment lines before the element, the element itself.
    const lines = raw.split('\n'); // keeps any \r, so multi-line elements keep the file's line endings
    const lead: string[] = [];
    while (lines.length && /^\s*(\/\/[^\n]*)?$/.test(lines[0])) {
      const l = lines.shift()!;
      if (l.trim()) lead.push(l.trim());
    }
    const code = lines.join('\n').trim();
    if (code) chunks.push({ lead: lead.join('\n'), code, trail: '' });
  };
  for (let i = open + 1; i < close; i++) {
    const skip = skipNonCode(src, i);
    if (skip !== i) { i = skip - 1; continue; }
    const ch = src[i];
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      push(i);
      // A comment on the rest of this line belongs to this element.
      const eol = src.indexOf('\n', i);
      const rest = src.slice(i + 1, eol < 0 ? close : Math.min(eol, close));
      const cm = /^\s*(\/\/[^\n]*)$/.exec(rest);
      if (cm && chunks.length) {
        chunks[chunks.length - 1].trail = cm[1].trimEnd();
        start = i + 1 + rest.length;
      } else start = i + 1;
    }
  }
  push(close);
  return chunks;
}

// ------------------------------------------------------------------ formatting

const num = (n: number): string => {
  const r = Math.round(n * 10000) / 10000;
  return Object.is(r, -0) ? '0' : String(r);
};
const vec = (v: readonly number[]): string => `[${v.map(num).join(', ')}]`;
const str = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const isZero = (v?: readonly number[]): boolean => !v || v.every((x) => Math.abs(x) < 1e-9);
const isOne = (v?: readonly number[]): boolean => !v || v.every((x) => Math.abs(x - 1) < 1e-9);

export function formatPart(p: PartData): string {
  const out: string[] = [`s: ${str(p.s)}`, `d: ${vec(p.d)}`];
  if (p.name) out.push(`name: ${str(p.name)}`);
  if (p.group) out.push(`group: ${str(p.group)}`);
  if (!isZero(p.at)) out.push(`at: ${vec(p.at!)}`);
  if (!isZero(p.rot)) out.push(`rot: ${vec(p.rot!)}`);
  if (!isOne(p.scale)) out.push(`scale: ${vec(p.scale!)}`);
  out.push(`c: ${typeof p.c === 'number' ? `0x${p.c.toString(16).padStart(6, '0')}` : str(p.c)}`);
  if (p.glow) out.push('glow: true');
  if (p.alpha !== undefined && p.alpha !== 1) out.push(`alpha: ${num(p.alpha)}`);
  if (p.seg !== undefined) out.push(`seg: ${p.seg}`);
  if (p.mirror) out.push('mirror: true');
  return `{ ${out.join(', ')} }`;
}

export function formatWear(w: WearData): string | null {
  const out: string[] = [];
  if (!isZero(w.at)) out.push(`at: ${vec(w.at!)}`);
  if (!isZero(w.rot)) out.push(`rot: ${vec(w.rot!)}`);
  if (w.scale !== undefined && Math.abs(w.scale - 1) > 1e-9) out.push(`scale: ${num(w.scale)}`);
  return out.length ? `{ ${out.join(', ')} }` : null;
}

// ------------------------------------------------------------------ the catalog

export class CatalogSource {
  private readonly repo: string;
  constructor(repo: string) { this.repo = repo; }

  private get dir(): string { return join(this.repo, 'packages/prefabs/src/catalog'); }

  private files(): string[] {
    return readdirSync(this.dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'));
  }

  private locate(id: string): { path: string; rel: string; src: string; def: { open: number; close: number; idAt: number } } | null {
    for (const f of this.files()) {
      const path = join(this.dir, f);
      const src = readFileSync(path, 'utf8');
      if (!src.includes(id)) continue;
      const def = findDef(src, id);
      if (def) return { path, rel: `packages/prefabs/src/catalog/${f}`, src, def };
    }
    return null;
  }

  info(ids: readonly string[]): Record<string, SourceInfo | null> {
    const out: Record<string, SourceInfo | null> = {};
    const texts = this.files().map((f) => ({ f, src: readFileSync(join(this.dir, f), 'utf8') }));
    for (const id of ids) {
      out[id] = null;
      for (const { f, src } of texts) {
        if (!src.includes(id)) continue;
        const def = findDef(src, id);
        if (!def) continue;
        const parts = findProp(src, def.open, def.close, 'parts');
        const reason = !parts ? 'no parts array' : src[parts.valueStart] !== '[' ? 'parts come from code'
          : notPlainData(src.slice(parts.valueStart, parts.valueEnd));
        out[id] = {
          file: `packages/prefabs/src/catalog/${f}`,
          abs: join(this.dir, f).split('\\').join('/'),
          line: src.slice(0, def.idAt).split('\n').length,
          partsEditable: !reason,
          ...(reason ? { reason } : {}),
        };
        break;
      }
    }
    return out;
  }

  save(req: SaveRequest): { file: string } {
    const loc = this.locate(req.id);
    if (!loc) throw new Error(`Cannot find "${req.id}" as a literal id in the catalog (is it made by a helper?)`);
    let { src } = loc;
    const eol = src.includes('\r\n') ? '\r\n' : '\n';
    let def = loc.def;
    const refind = (): void => { def = findDef(src, req.id)!; };

    // Indent of the def's own properties: the line holding `id:`.
    const lineStart = src.lastIndexOf('\n', def.idAt) + 1;
    const propIndent = /^\s*/.exec(src.slice(lineStart))![0];

    if (req.parts) {
      const prop = findProp(src, def.open, def.close, 'parts');
      if (!prop || src[prop.valueStart] !== '[') throw new Error('This prefab has no literal parts array');
      const why = notPlainData(src.slice(prop.valueStart, prop.valueEnd));
      if (why) throw new Error(`Parts are not plain data (${why}); copy the array instead`);
      const chunks = splitArray(src, prop.valueStart, prop.valueEnd - 1);
      const inner = propIndent + '  ';
      const lines: string[] = [];
      for (const sp of req.parts) {
        const keep = !sp.changed && sp.orig !== null ? chunks[sp.orig] : undefined;
        if (keep?.lead) for (const l of keep.lead.split('\n')) lines.push(inner + l);
        const code = keep ? keep.code : formatPart(sp.part);
        lines.push(inner + code + ',' + (keep?.trail ? ' ' + keep.trail : ''));
      }
      const text = `[${eol}${lines.join(eol)}${eol}${propIndent}]`;
      src = src.slice(0, prop.valueStart) + text + src.slice(prop.valueEnd);
      refind();
    }

    const setField = (name: string, value: string | null): void => {
      const prop = findProp(src, def.open, def.close, name);
      if (prop) {
        if (value === null) {
          // Remove `name: value,` and the whitespace after it (or the whole line if it is alone on it).
          let end = prop.valueEnd;
          if (src[end] === ',') end++;
          const ls = src.lastIndexOf('\n', prop.keyStart) + 1;
          const le = src.indexOf('\n', end);
          if (/^\s*$/.test(src.slice(ls, prop.keyStart)) && /^\s*$/.test(src.slice(end, le))) {
            src = src.slice(0, ls) + src.slice(le + 1);
          } else {
            while (src[end] === ' ') end++;
            src = src.slice(0, prop.keyStart) + src.slice(end);
          }
        } else {
          src = src.slice(0, prop.valueStart) + value + src.slice(prop.valueEnd);
        }
      } else if (value !== null) {
        // New field: its own line just before `parts:`.
        const parts = findProp(src, def.open, def.close, 'parts');
        if (!parts) throw new Error('No parts field to insert before');
        const ls = src.lastIndexOf('\n', parts.keyStart) + 1;
        const onOwnLine = /^\s*$/.test(src.slice(ls, parts.keyStart));
        const insertAt = onOwnLine ? ls : parts.keyStart;
        const line = onOwnLine ? `${propIndent}${name}: ${value},${eol}` : `${name}: ${value}, `;
        src = src.slice(0, insertAt) + line + src.slice(insertAt);
      }
      refind();
    };

    if (req.grip !== undefined) setField('grip', req.grip ? vec(req.grip) : null);
    if (req.wear !== undefined) setField('wear', req.wear ? formatWear(req.wear) : null);

    writeFileSync(loc.path, src);
    return { file: loc.rel };
  }
}

// ------------------------------------------------------------------ slot anchors (packages/gnome/src/anatomy.ts)

export type Anchors = Record<string, { at: Vec3; rot: Vec3 }>;

export function saveAnchors(repo: string, anchors: Anchors): void {
  const path = join(repo, 'packages/gnome/src/anatomy.ts');
  let src = readFileSync(path, 'utf8');
  for (const [slot, a] of Object.entries(anchors)) {
    const re = new RegExp(`^(\\s*${slot}: )\\{ at: \\[[^\\]]*\\], rot: \\[[^\\]]*\\] \\},`, 'm');
    if (!re.test(src)) throw new Error(`Cannot find the ${slot} line in EQUIP_ANCHORS`);
    src = src.replace(re, `$1{ at: ${vec(a.at)}, rot: ${vec(a.rot)} },`);
  }
  writeFileSync(path, src);
}

// ------------------------------------------------------------------ who uses what

const SKIP_DIRS = new Set(['node_modules', 'dist', '.vite', 'public']);

function walk(dir: string, out: string[]): void {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
}

/** For each id: the repo files (outside the prefab catalog) that name it in a string literal. */
export function findUsage(repo: string, ids: readonly string[]): Record<string, string[]> {
  const want = new Set(ids);
  const out: Record<string, string[]> = {};
  const files: string[] = [];
  for (const top of ['games', 'packages']) {
    let names: string[] = [];
    try { names = readdirSync(join(repo, top)); } catch { /* none */ }
    for (const n of names) walk(join(repo, top, n, 'src'), files);
  }
  for (const path of files) {
    const rel = path.slice(repo.length + 1).replace(/\\/g, '/');
    if (rel.startsWith('packages/prefabs/src/')) continue;
    const src = readFileSync(path, 'utf8');
    const seen = new Set<string>();
    for (const m of src.matchAll(/['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g)) {
      if (want.has(m[1]) && !seen.has(m[1])) {
        seen.add(m[1]);
        (out[m[1]] ??= []).push(rel);
      }
    }
  }
  return out;
}
