// Pure request handling for the level editor's save API: no fs, no Vite. The Vite plugin in api.ts does the I/O.
// File names are built only from fixed names and a checked zone id, never from anything else the request sends.
import { validateDeltaFile, validateLevelDoc, validateWalkFile } from '@lawn/level';

const GAME = 'gnomes-of-gnomomia';
const ZONE_ID = /^[a-z0-9-]+$/;
const MAX_BODY = 20 * 1024 * 1024;

export interface LevelRequest {
  method: string;
  route: string;
  body: string;
}

export interface LevelResponse {
  status: number;
  json: unknown;
  write?: { relPath: string; text: string };
}

function fail(status: number, error: string, problems?: string[]): LevelResponse {
  return { status, json: problems ? { error, problems } : { error } };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function handleLevelRequest(req: LevelRequest, levelsDirRel: string): LevelResponse {
  if (req.method === 'GET' && req.route === '/status') return { status: 200, json: { ok: true } };
  if (req.method !== 'POST' || !['/zone', '/deltas', '/walk'].includes(req.route)) {
    return { status: 404, json: { error: `No route ${req.method} ${req.route}` } };
  }
  if (req.body.length > MAX_BODY) return fail(400, 'Request body is over 20 MB');

  let parsed: unknown;
  try {
    parsed = JSON.parse(req.body);
  } catch {
    return fail(400, 'Request body is not valid JSON');
  }
  if (!isObject(parsed)) return fail(400, 'Request body must be a JSON object');

  if (req.route === '/zone') {
    const doc = parsed.doc;
    if (!isObject(doc)) return fail(400, 'Missing "doc" object');
    const problems = validateLevelDoc(doc);
    if (problems.length > 0) return fail(400, 'Level document is invalid', problems);
    if (doc.game !== GAME) return fail(400, `Level document game must be "${GAME}"`);
    const id = doc.id;
    if (typeof id !== 'string' || !ZONE_ID.test(id)) {
      return fail(400, 'Zone id must match /^[a-z0-9-]+$/');
    }
    return {
      status: 200,
      json: { file: `${levelsDirRel}/${id}.level.json` },
      write: { relPath: `${levelsDirRel}/${id}.level.json`, text: JSON.stringify(doc, null, 2) + '\n' },
    };
  }

  if (req.route === '/deltas') {
    const file = parsed.file;
    const problems = validateDeltaFile(file);
    if (problems.length > 0) return fail(400, 'Delta file is invalid', problems);
    const relPath = `${levelsDirRel}/world.deltas.json`;
    return { status: 200, json: { file: relPath }, write: { relPath, text: JSON.stringify(file, null, 2) + '\n' } };
  }

  const file = parsed.file;
  const problems = validateWalkFile(file);
  if (problems.length > 0) return fail(400, 'Walk file is invalid', problems);
  const relPath = `${levelsDirRel}/walk.bake.json`;
  return { status: 200, json: { file: relPath }, write: { relPath, text: JSON.stringify(file, null, 1) + '\n' } };
}
