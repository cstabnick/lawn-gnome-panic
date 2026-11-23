import { describe, expect, it } from 'vitest';
import { TAXI } from './config';
import { KEYS, MOVE_KEYS, keyLabel } from './keys';

// node:fs is loaded untyped: the game's tsconfig has no node types (the browser build never sees this file).
const NODE_FS = 'node:fs';
type Fs = {
  readFileSync(p: URL, enc: 'utf8'): string;
  readdirSync(p: URL, o: { recursive: true }): string[];
};

describe('the key table', () => {
  it('binds every pressed key to one action', () => {
    const codes = Object.values(KEYS);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('never presses a held key', () => {
    const held = new Set<string>(Object.values(MOVE_KEYS).flat());
    for (const [action, code] of Object.entries(KEYS)) expect(held.has(code), `${action} uses held key ${code}`).toBe(false);
    const all = Object.values(MOVE_KEYS).flat();
    // Shift is shared on purpose (boost on the ground, descend in the air); nothing else repeats.
    expect(new Set(all).size).toBe(all.length);
  });

  it('keeps the map and the mute apart', () => {
    expect(KEYS.map).not.toBe(KEYS.mute);
  });

  it('matches the taxi key in config', () => {
    expect(KEYS.taxi).toBe(TAXI.key);
  });

  it('labels keys for help text', () => {
    expect(keyLabel('KeyM')).toBe('M');
    expect(keyLabel('Escape')).toBe('Esc');
    expect(keyLabel('Space')).toBe('Space');
  });

  it('has every key a module listens for, and no key two modules use for different things', async () => {
    const fs = (await import(/* @vite-ignore */ NODE_FS)) as Fs;
    const root = new URL('./', import.meta.url);
    const files = fs.readdirSync(root, { recursive: true })
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.startsWith('testing/'));
    const known = new Set<string>([...Object.values(KEYS), ...Object.values(MOVE_KEYS).flat()]);
    const users = new Map<string, Set<string>>();
    const pattern = /\.code\s*[!=]==\s*'([A-Za-z0-9]+)'/g;
    for (const f of files) {
      const text = fs.readFileSync(new URL(f, root), 'utf8');
      for (const m of text.matchAll(pattern)) {
        const code = m[1];
        expect(known.has(code), `${f} listens for ${code}, which is not in keys.ts`).toBe(true);
        if (!users.has(code)) users.set(code, new Set());
        users.get(code)!.add(f);
      }
    }
    // A key may be read in several files only when it is the same action everywhere (Esc closes whatever is on top; T
    // opens whichever garage you are parked at; Enter goes on; the arrows and Space are prevented from scrolling in input.ts).
    const shared = new Set<string>([KEYS.close, KEYS.confirm, KEYS.garage, KEYS.jump]);
    for (const [code, where] of users) {
      if (shared.has(code)) continue;
      expect(where.size, `${code} is read in ${[...where].join(', ')}`).toBe(1);
    }
  });
});
