import { describe, expect, it } from 'vitest';
import { bakeTile, DeltaGrid, WalkGrid } from '@lawn/level';
import { handleLevelRequest } from './handler';

const DIR = 'games/gnomes-of-gnomomia/src/data/levels';

function doc(id: string) {
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnomes-of-gnomomia',
    id,
    name: 'Mossbottom',
    bounds: { w: 200, d: 200 },
    stamps: [],
    paths: [],
    props: [],
    markers: [],
    data: {},
  };
}

const post = (route: string, body: unknown) =>
  handleLevelRequest({ method: 'POST', route, body: typeof body === 'string' ? body : JSON.stringify(body) }, DIR);

describe('level save handler: /zone', () => {
  it('writes a valid zone document to <id>.level.json', () => {
    const out = post('/zone', { doc: doc('mossbottom') });
    expect(out.status).toBe(200);
    expect(out.json).toEqual({ file: `${DIR}/mossbottom.level.json` });
    expect(out.write?.relPath).toBe(`${DIR}/mossbottom.level.json`);
    expect(out.write?.text).toBe(JSON.stringify(doc('mossbottom'), null, 2) + '\n');
  });

  it.each(['../evil', 'a/b', 'Mossbottom', 'moss bottom', ''])('rejects id %j and writes nothing', (id) => {
    const out = post('/zone', { doc: doc(id) });
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });

  it('rejects a document from another game', () => {
    const out = post('/zone', { doc: { ...doc('mossbottom'), game: 'sample-dodge' } });
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });

  it('rejects a missing doc', () => {
    const out = post('/zone', {});
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });

  it('answers a document that fails validateLevelDoc with 400 and problems', () => {
    const out = post('/zone', { doc: { format: 'nope' } });
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
    const json = out.json as { error: string; problems?: string[] };
    expect(json.error).toBeTruthy();
    if (json.problems) expect(json.problems.length).toBeGreaterThan(0);
  });
});

describe('level save handler: /deltas', () => {
  it('accepts the file a DeltaGrid produces and writes world.deltas.json', () => {
    const g = new DeltaGrid();
    g.setUnits(3, 4, 120);
    const out = post('/deltas', { file: g.toJSON() });
    expect(out.status).toBe(200);
    expect(out.write?.relPath).toBe(`${DIR}/world.deltas.json`);
    expect(out.write?.text).toBe(JSON.stringify(g.toJSON(), null, 2) + '\n');
  });

  it('rejects junk', () => {
    const out = post('/deltas', { file: { nope: true } });
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });
});

describe('level save handler: /walk', () => {
  it('accepts the file a WalkGrid produces and writes walk.bake.json', () => {
    const g = new WalkGrid();
    g.setTile(bakeTile('zone-a', { minX: 0, maxX: 4, minZ: 0, maxZ: 4 }, (x) => x < 2));
    const out = post('/walk', { file: g.toJSON() });
    expect(out.status).toBe(200);
    expect(out.write?.relPath).toBe(`${DIR}/walk.bake.json`);
    expect(out.write?.text).toBe(JSON.stringify(g.toJSON(), null, 1) + '\n');
  });

  it('rejects junk', () => {
    const out = post('/walk', { file: 'not a walk file' });
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });
});

describe('level save handler: routing and bodies', () => {
  it('answers GET /status', () => {
    const out = handleLevelRequest({ method: 'GET', route: '/status', body: '' }, DIR);
    expect(out).toEqual({ status: 200, json: { ok: true } });
  });

  it('returns 404 for an unknown route', () => {
    const out = post('/nothing', { file: {} });
    expect(out.status).toBe(404);
    expect(out.write).toBeUndefined();
  });

  it('returns 400 for invalid JSON', () => {
    const out = post('/zone', '{ not json');
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });

  it('returns 400 for a body over 20 MB', () => {
    const out = post('/zone', 'x'.repeat(20 * 1024 * 1024 + 1));
    expect(out.status).toBe(400);
    expect(out.write).toBeUndefined();
  });
});
