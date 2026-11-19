// Shape and sense checks for the three file formats. They return readable problems rather than throwing, so a
// level editor or a loader can show every fault at once.
import { base64ToBytes } from './math';
import type { LevelDoc } from './types';
import { decodeRle } from './walkgrid';

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPos = (v: unknown): v is number => isFin(v) && v > 0;
const isIntPos = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;
const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

const ID_RE = /^[a-z0-9][a-z0-9/_-]*$/;
const DELTA_KEY_RE = /^-?\d+,-?\d+$/;
const PATH_KINDS: string[] = ['road', 'wall', 'fence'];
const DELTA_CHUNK_BYTES = 64 * 64 * 2;

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Problems with a level document, one readable string each, empty when it is fine. Checks the shared layers only
 * (the game validates its own `data`). Never throws. */
export function validateLevelDoc(doc: unknown): string[] {
  if (!isObj(doc)) return ['(root): must be an object'];
  const out: string[] = [];
  if (doc.format !== 'lawn-level') out.push('format: must be "lawn-level"');
  if (doc.version !== 1) out.push('version: must be 1');
  if (!isNonEmpty(doc.game)) out.push('game: must be a non-empty string');
  if (!isNonEmpty(doc.id)) out.push('id: must be a non-empty string');
  else if (!ID_RE.test(doc.id)) out.push(`id: "${doc.id}" must match ${ID_RE}`);
  if (typeof doc.name !== 'string') out.push('name: must be a string');
  checkBounds(doc.bounds, out);
  if (doc.base !== undefined) checkBase(doc.base, out);
  checkStamps(doc.stamps, out);
  checkPaths(doc.paths, out);
  checkProps(doc.props, out);
  checkMarkers(doc.markers, out);
  if (!('data' in doc)) out.push('data: must be present (the game\'s own block; use {} when there is none)');
  return out;
}

/** True (and narrows) when validateLevelDoc finds nothing. */
export function isLevelDoc(doc: unknown): doc is LevelDoc {
  return validateLevelDoc(doc).length === 0;
}

/** Problems with a delta file (the brush-edit height raster), empty when it is fine. Never throws. */
export function validateDeltaFile(file: unknown): string[] {
  if (!isObj(file)) return ['(root): must be an object'];
  const out: string[] = [];
  if (file.format !== 'lawn-deltas') out.push('format: must be "lawn-deltas"');
  if (file.version !== 1) out.push('version: must be 1');
  if (file.chunk !== 64) out.push('chunk: must be 64');
  if (file.unit !== 0.01) out.push('unit: must be 0.01');
  if (!isObj(file.chunks)) {
    out.push('chunks: must be an object');
    return out;
  }
  for (const [key, b64] of Object.entries(file.chunks)) {
    const at = `chunks["${key}"]`;
    if (!DELTA_KEY_RE.test(key)) out.push(`${at}: key must look like "ci,cj"`);
    if (typeof b64 !== 'string') {
      out.push(`${at}: must be a base64 string`);
      continue;
    }
    try {
      const n = base64ToBytes(b64).length;
      if (n !== DELTA_CHUNK_BYTES) out.push(`${at}: must decode to ${DELTA_CHUNK_BYTES} bytes, got ${n}`);
    } catch {
      out.push(`${at}: is not valid base64`);
    }
  }
  return out;
}

/** Problems with a walk file (the baked walkability tiles), empty when it is fine. Never throws. */
export function validateWalkFile(file: unknown): string[] {
  if (!isObj(file)) return ['(root): must be an object'];
  const out: string[] = [];
  if (file.format !== 'lawn-walk') out.push('format: must be "lawn-walk"');
  if (file.version !== 1) out.push('version: must be 1');
  if (file.cell !== 0.25) out.push('cell: must be 0.25');
  if (typeof file.inputHash !== 'string') out.push('inputHash: must be a string');
  if (!Array.isArray(file.tiles)) {
    out.push('tiles: must be an array');
    return out;
  }
  const seen = new Set<string>();
  file.tiles.forEach((t: unknown, i: number) => {
    const p = `tiles[${i}]`;
    if (!isObj(t)) {
      out.push(`${p}: must be an object`);
      return;
    }
    if (typeof t.id !== 'string') out.push(`${p}.id: must be a string`);
    else if (seen.has(t.id)) out.push(`${p}.id: duplicate id "${t.id}"`);
    else seen.add(t.id);
    if (!isFin(t.minX)) out.push(`${p}.minX: must be a finite number`);
    if (!isFin(t.minZ)) out.push(`${p}.minZ: must be a finite number`);
    if (!isIntPos(t.cols)) out.push(`${p}.cols: must be a positive integer`);
    if (!isIntPos(t.rows)) out.push(`${p}.rows: must be a positive integer`);
    if (typeof t.rle !== 'string') out.push(`${p}.rle: must be a base64 string`);
    else if (isIntPos(t.cols) && isIntPos(t.rows)) {
      try {
        decodeRle(base64ToBytes(t.rle), t.cols * t.rows);
      } catch (e) {
        out.push(`${p}.rle: does not decode to ${t.cols * t.rows} cells (${errText(e)})`);
      }
    }
  });
  return out;
}

function checkBounds(v: unknown, out: string[]): void {
  if (!isObj(v)) {
    out.push('bounds: must be an object with w and d');
    return;
  }
  if (!isPos(v.w)) out.push('bounds.w: must be a number > 0');
  if (!isPos(v.d)) out.push('bounds.d: must be a number > 0');
}

function checkBase(v: unknown, out: string[]): void {
  if (!isObj(v)) {
    out.push('base: must be an object');
    return;
  }
  if (typeof v.id !== 'string') out.push('base.id: must be a string');
  if (!Number.isInteger(v.version)) out.push('base.version: must be an integer');
  if (v.seed !== undefined && !isFin(v.seed)) out.push('base.seed: must be a finite number');
  if (!isObj(v.params)) {
    out.push('base.params: must be an object');
    return;
  }
  for (const [k, p] of Object.entries(v.params)) {
    if (typeof p !== 'number' && typeof p !== 'string' && typeof p !== 'boolean') {
      out.push(`base.params.${k}: must be a number, string or boolean`);
    }
  }
}

function checkStamps(v: unknown, out: string[]): void {
  if (!Array.isArray(v)) {
    out.push('stamps: must be an array');
    return;
  }
  v.forEach((s: unknown, i: number) => {
    const p = `stamps[${i}]`;
    if (!isObj(s)) {
      out.push(`${p}: must be an object`);
      return;
    }
    if (s.op === 'flatten') {
      if (!isFin(s.x)) out.push(`${p}.x: must be a finite number`);
      if (!isFin(s.z)) out.push(`${p}.z: must be a finite number`);
      if (!isFin(s.to)) out.push(`${p}.to: must be a finite number`);
      if (!isFin(s.inner)) out.push(`${p}.inner: must be a finite number`);
      else if (s.inner < 0) out.push(`${p}.inner: must be >= 0`);
      if (!isFin(s.outer)) out.push(`${p}.outer: must be a finite number`);
      else if (isFin(s.inner) && s.outer <= s.inner) out.push(`${p}.outer: must be greater than inner`);
    } else if (s.op === 'gauss') {
      if (!isFin(s.x)) out.push(`${p}.x: must be a finite number`);
      if (!isFin(s.z)) out.push(`${p}.z: must be a finite number`);
      if (!isFin(s.amount)) out.push(`${p}.amount: must be a finite number`);
      if (!isPos(s.sigma)) out.push(`${p}.sigma: must be a number > 0`);
    } else {
      out.push(`${p}.op: must be "flatten" or "gauss"`);
    }
  });
}

function checkPaths(v: unknown, out: string[]): void {
  if (!Array.isArray(v)) {
    out.push('paths: must be an array');
    return;
  }
  const seen = new Set<string>();
  v.forEach((pd: unknown, i: number) => {
    const p = `paths[${i}]`;
    if (!isObj(pd)) {
      out.push(`${p}: must be an object`);
      return;
    }
    if (typeof pd.id !== 'string') out.push(`${p}.id: must be a string`);
    else if (seen.has(pd.id)) out.push(`${p}.id: duplicate id "${pd.id}"`);
    else seen.add(pd.id);
    if (typeof pd.kind !== 'string' || !PATH_KINDS.includes(pd.kind)) out.push(`${p}.kind: must be "road", "wall" or "fence"`);
    const pts = pd.points;
    if (!Array.isArray(pts) || pts.length < 2) {
      out.push(`${p}.points: must be an array of at least 2 [x, z] points`);
    } else {
      pts.forEach((pt: unknown, j: number) => {
        if (!Array.isArray(pt) || pt.length !== 2 || !isFin(pt[0]) || !isFin(pt[1])) {
          out.push(`${p}.points[${j}]: must be an [x, z] pair of finite numbers`);
        }
      });
    }
    if (pd.width !== undefined && !isPos(pd.width)) out.push(`${p}.width: must be a number > 0`);
  });
}

function checkProps(v: unknown, out: string[]): void {
  if (!Array.isArray(v)) {
    out.push('props: must be an array');
    return;
  }
  v.forEach((pr: unknown, i: number) => {
    const p = `props[${i}]`;
    if (!isObj(pr)) {
      out.push(`${p}: must be an object`);
      return;
    }
    if (!isNonEmpty(pr.prefab)) out.push(`${p}.prefab: must be a non-empty string`);
    if (!isFin(pr.x)) out.push(`${p}.x: must be a finite number`);
    if (!isFin(pr.z)) out.push(`${p}.z: must be a finite number`);
    if (pr.rot !== undefined && !isFin(pr.rot)) out.push(`${p}.rot: must be a finite number`);
    if (pr.scale !== undefined && !isPos(pr.scale)) out.push(`${p}.scale: must be a number > 0`);
    if (pr.solidR !== undefined && !(isFin(pr.solidR) && pr.solidR >= 0)) out.push(`${p}.solidR: must be a number >= 0`);
    if (pr.tint !== undefined && typeof pr.tint !== 'string') out.push(`${p}.tint: must be a string`);
  });
}

function checkMarkers(v: unknown, out: string[]): void {
  if (!Array.isArray(v)) {
    out.push('markers: must be an array');
    return;
  }
  const seen = new Set<string>();
  v.forEach((m: unknown, i: number) => {
    const p = `markers[${i}]`;
    if (!isObj(m)) {
      out.push(`${p}: must be an object`);
      return;
    }
    if (typeof m.id !== 'string') out.push(`${p}.id: must be a string`);
    else if (seen.has(m.id)) out.push(`${p}.id: duplicate id "${m.id}"`);
    else seen.add(m.id);
    if (typeof m.kind !== 'string') out.push(`${p}.kind: must be a string`);
    if (!isFin(m.x)) out.push(`${p}.x: must be a finite number`);
    if (!isFin(m.z)) out.push(`${p}.z: must be a finite number`);
    if (m.r !== undefined && !(isFin(m.r) && m.r >= 0)) out.push(`${p}.r: must be a number >= 0`);
    if (m.data !== undefined && (typeof m.data !== 'object' || m.data === null || Array.isArray(m.data))) out.push(`${p}.data: must be an object when given`);
  });
}
