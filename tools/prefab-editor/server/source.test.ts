import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CatalogSource, saveAnchors } from './source';

const SAMPLE = `// header comment
import type { PrefabDef } from '../types';

const DARK = 0x222222;

export const THINGS: PrefabDef[] = [
  {
    id: 'test-hat', name: 'Test Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat'], emoji: [], about: 'A hat, with a comma, and a } brace.',
    examine: ['It is a hat.', 'Still a hat.', 'Hats: [not parts].', 'Hat.'],
    parts: [
      // the brim
      { s: 'cyl', d: [0.17, 0.18, 0.04], at: [0, 0.02, 0], c: 'tint', seg: 12 },
      { s: 'cone', d: [0.16, 0.36], at: [0, 0.22, 0], c: 'tint', seg: 12 }, // the point
      { s: 'ball', d: [0.02], c: 0xff0000 },
    ],
  },
  {
    id: 'test-sword', name: 'Sword', category: 'weapon', uses: ['hold'], tags: [], emoji: [],
    grip: [0, 0.05, 0], about: 'x', examine: ['a', 'b', 'c', 'd'],
    parts: [{ s: 'box', d: [0.1, 0.5, 0.02], at: [0, 0.3, 0], c: DARK }],
  },
];
`;

function repo(): { root: string; file: string } {
  const root = mkdtempSync(join(tmpdir(), 'prefab-editor-'));
  const dir = join(root, 'packages/prefabs/src/catalog');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'things.ts');
  writeFileSync(file, SAMPLE);
  return { root, file };
}

describe('CatalogSource', () => {
  it('finds prefabs and tells plain parts from code-built parts', () => {
    const { root } = repo();
    const info = new CatalogSource(root).info(['test-hat', 'test-sword', 'nope']);
    expect(info['test-hat']).toMatchObject({ file: 'packages/prefabs/src/catalog/things.ts', line: 8, partsEditable: true });
    expect(info['test-sword']?.partsEditable).toBe(false);
    expect(info['test-sword']?.reason).toContain('DARK');
    expect(info.nope).toBeNull();
  });

  it('rewrites only changed parts and keeps comments', () => {
    const { root, file } = repo();
    new CatalogSource(root).save({
      id: 'test-hat',
      parts: [
        { part: { s: 'cyl', d: [0.17, 0.18, 0.04], c: 'tint' }, orig: 0, changed: false },
        { part: { s: 'cone', d: [0.16, 0.4], at: [0, 0.25, 0], c: 'tint', seg: 12 }, orig: 1, changed: true },
        { part: { s: 'box', d: [0.1, 0.1, 0.1], at: [0.1, 0, 0], rot: [0, 45, 0], c: 0x00ff00, mirror: true }, orig: null, changed: true },
      ],
    });
    const out = readFileSync(file, 'utf8');
    expect(out).toContain(`    parts: [
      // the brim
      { s: 'cyl', d: [0.17, 0.18, 0.04], at: [0, 0.02, 0], c: 'tint', seg: 12 },
      { s: 'cone', d: [0.16, 0.4], at: [0, 0.25, 0], c: 'tint', seg: 12 },
      { s: 'box', d: [0.1, 0.1, 0.1], at: [0.1, 0, 0], rot: [0, 45, 0], c: 0x00ff00, mirror: true },
    ],
  },`);
    expect(out).not.toContain('ball');
    expect(out).toContain("about: 'A hat, with a comma, and a } brace.'");
  });

  it('adds, changes and removes grip and wear', () => {
    const { root, file } = repo();
    const src = new CatalogSource(root);
    src.save({ id: 'test-hat', wear: { at: [0, 0.03, 0], scale: 1.1 } });
    expect(readFileSync(file, 'utf8')).toContain(`    wear: { at: [0, 0.03, 0], scale: 1.1 },\n    parts: [\n      // the brim`);
    src.save({ id: 'test-hat', wear: { at: [0, 0.05, 0] } });
    expect(readFileSync(file, 'utf8')).toContain('    wear: { at: [0, 0.05, 0] },\n');
    src.save({ id: 'test-hat', wear: null });
    expect(readFileSync(file, 'utf8')).toBe(SAMPLE);

    src.save({ id: 'test-sword', grip: [0, 0.1, 0.01], wear: { rot: [0, 90, 0] } });
    const out = readFileSync(file, 'utf8');
    expect(out).toContain("grip: [0, 0.1, 0.01], about: 'x'");
    expect(out).toContain("    wear: { rot: [0, 90, 0] },\n    parts: [{ s: 'box'");
    src.save({ id: 'test-sword', grip: null, wear: null });
    expect(readFileSync(file, 'utf8')).toContain("emoji: [],\n    about: 'x', examine");
    expect(readFileSync(file, 'utf8')).not.toContain('wear:');
  });

  it('refuses to rewrite code-built parts', () => {
    const { root } = repo();
    expect(() => new CatalogSource(root).save({
      id: 'test-sword', parts: [{ part: { s: 'box', d: [1, 1, 1], c: 'red' }, orig: 0, changed: true }],
    })).toThrow(/plain data/);
  });

  it('keeps CRLF line endings', () => {
    const { root, file } = repo();
    writeFileSync(file, SAMPLE.replace(/\n/g, '\r\n'));
    new CatalogSource(root).save({ id: 'test-hat', wear: { at: [0, 0.01, 0] } });
    const out = readFileSync(file, 'utf8');
    expect(out.replace(/\r\n/g, '')).not.toContain('\n');
  });
});

describe('saveAnchors', () => {
  it('rewrites one slot line', () => {
    const root = mkdtempSync(join(tmpdir(), 'prefab-editor-'));
    mkdirSync(join(root, 'packages/gnome/src'), { recursive: true });
    const p = join(root, 'packages/gnome/src/anatomy.ts');
    writeFileSync(p, "export const EQUIP_ANCHORS = {\n  head: { at: [0, 0.91, 0], rot: [0, 0, 0] },\n  back: { at: [0, 0.28, -0.22], rot: [0, 180, 0] },\n};\n");
    saveAnchors(root, { head: { at: [0, 0.93, 0.01], rot: [5, 0, 0] } });
    expect(readFileSync(p, 'utf8')).toContain('  head: { at: [0, 0.93, 0.01], rot: [5, 0, 0] },\n  back: { at: [0, 0.28, -0.22]');
  });
});
