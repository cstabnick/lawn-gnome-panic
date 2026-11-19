import type * as ToneNS from 'tone';
import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { buildGnomeFrontMenu, buildGnomeFrontTrack, type GnomeFrontOptions } from './gnomeFront';
import { buildGnomeFrontBattle } from './gnomeFrontBattle';

type Build = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

const MATCHES: [string, GnomeFrontOptions][] = [
  ['calm', {}],
  ['red caps lead, hot', { lead: () => 0, intensity: () => 1 }],
  ['blue caps lead, hot', { lead: () => 1, intensity: () => 1 }],
  ['a combine near', { combine: () => true, intensity: () => 0.5 }],
];

describe('Gnome Front music', () => {
  const builds: [string, Build][] = [
    ['menu', (T, keep, out) => buildGnomeFrontMenu(T, keep, out, 42)],
    ...MATCHES.map(([n, o]): [string, Build] => [`march, ${n}`, (T, keep, out) => buildGnomeFrontTrack(T, keep, out, 42, o)]),
    ...MATCHES.map(([n, o]): [string, Build] => [`battle, ${n}`, (T, keep, out) => buildGnomeFrontBattle(T, keep, out, 42, o)]),
  ];
  for (const [name, build] of builds) {
    it(`${name}: no graph problems`, () => {
      expect(lintSongGraph(build).issues).toEqual([]);
    });
  }
  for (const [name, build] of builds) {
    it(`${name}: no one-note voice is triggered twice at once`, () => {
      const conflicts: string[] = [];
      captureNoteEvents(build, 120, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    });
  }
  for (const name of ['menu', 'march, calm', 'battle, red caps lead, hot', 'battle, blue caps lead, hot']) {
    it(`${name}: stays in its key`, () => {
      const build = builds.find(([n]) => n === name)![1];
      const theory = analyzeTheory(build, 40);
      expect(theory.detectedKey.inScaleRatio).toBeGreaterThan(0.85);
    });
  }
});
