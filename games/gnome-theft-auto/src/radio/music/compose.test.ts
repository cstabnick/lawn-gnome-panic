// The theory checks: every Turfton FM song (songs/*.ts) is a valid spec and composes into notes that are in key,
// consonant on the strong beats, in range, and varied enough across a station.
import { describe, expect, it } from 'vitest';
import { MODES } from '@lawn/music';
import { checkSpec, compose, isStrong, levelsAt, titleSeed, triadQuality } from './compose';
import { RADIO_SONGS } from './songs';
import type { RadioStation, SongSpec } from './spec';

const STATIONS: RadioStation[] = ['blade', 'fpr', 'beats'];
const all: [RadioStation, SongSpec][] = STATIONS.flatMap((st) => RADIO_SONGS[st].map((s): [RadioStation, SongSpec] => [st, s]));

/** What each station may use, so it keeps its identity. */
const IDENTITY: Record<RadioStation, { chord: string[]; kit: string[]; bpm: [number, number] }> = {
  blade: { chord: ['crunch', 'brass', 'organ'], kit: ['break', 'rock'], bpm: [90, 170] },
  fpr: { chord: ['musicBox', 'strings', 'piano', 'nylon'], kit: ['soft', 'none'], bpm: [56, 100] },
  beats: { chord: ['rhodes', 'piano', 'organ', 'nylon'], kit: ['brush', 'soft'], bpm: [64, 128] },
};

describe('triadQuality', () => {
  it('knows the chords of the major scale', () => {
    const q = [0, 1, 2, 3, 4, 5, 6].map((d) => triadQuality(MODES.ionian, d));
    expect(q).toEqual(['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim']);
  });
  it('finds the augmented chord in harmonic minor', () => {
    expect(triadQuality(MODES.harmonic, 2)).toBe('aug');
    expect(triadQuality(MODES.harmonic, 4)).toBe('major');
  });
});

describe('Turfton FM songs', () => {
  it('has at least twelve songs per station, each with a unique title', () => {
    for (const st of STATIONS) expect(RADIO_SONGS[st].length, st).toBeGreaterThanOrEqual(12);
    const titles = all.map(([, s]) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('every spec passes checkSpec', () => {
    for (const [st, s] of all) expect(checkSpec(s), `${st}: ${s.title}`).toEqual([]);
  });

  it('keeps each station sounding like itself', () => {
    for (const [st, s] of all) {
      const id = IDENTITY[st];
      expect(id.chord, `${s.title} chord voice`).toContain(s.chord);
      expect(id.kit, `${s.title} drum kit`).toContain(s.kit);
      expect(s.bpm, `${s.title} tempo`).toBeGreaterThanOrEqual(id.bpm[0]);
      expect(s.bpm, `${s.title} tempo`).toBeLessThanOrEqual(id.bpm[1]);
    }
  });

  it('varies tempo, key, mode and instruments within a station', () => {
    for (const st of STATIONS) {
      const songs = RADIO_SONGS[st];
      const bpms = songs.map((s) => s.bpm);
      expect(Math.max(...bpms) - Math.min(...bpms), `${st} tempo spread`).toBeGreaterThanOrEqual(20);
      expect(new Set(songs.map((s) => s.tonic % 12)).size, `${st} keys`).toBeGreaterThanOrEqual(5);
      expect(new Set(songs.map((s) => s.mode)).size, `${st} modes`).toBeGreaterThanOrEqual(3);
      expect(new Set(songs.map((s) => `${s.chord}/${s.lead}/${s.bass}`)).size, `${st} instrument sets`).toBeGreaterThanOrEqual(5);
      expect(new Set(songs.map((s) => JSON.stringify(s.progressions))).size, `${st} progressions`).toBe(songs.length);
    }
  });

  it('composes every note inside the key', () => {
    for (const [, s] of all) {
      const c = compose(s, titleSeed(s.title));
      for (const ev of c.events) {
        for (const m of ev.midi) expect(c.scale, `${s.title}: ${ev.layer} note ${m} at bar ${ev.bar}`).toContain(((m % 12) + 12) % 12);
      }
    }
  });

  it('puts the melody on chord tones on strong beats and held notes', () => {
    for (const [, s] of all) {
      const c = compose(s, titleSeed(s.title));
      for (const ev of c.events) {
        if (ev.layer !== 'lead') continue;
        if (!isStrong(ev.pos, c.grid) && ev.len < 4) continue;
        const h = c.harmony[ev.bar * 2 + (ev.pos >= c.grid / 2 ? 1 : 0)];
        expect(h.pcs, `${s.title}: lead ${ev.midi[0]} at bar ${ev.bar} pos ${ev.pos}`).toContain(ev.midi[0] % 12);
      }
    }
  });

  it('keeps the melody singable: in range, one note at a time, no leap past an octave', () => {
    for (const [, s] of all) {
      const c = compose(s, titleSeed(s.title));
      const lead = c.events.filter((e) => e.layer === 'lead');
      let prev: (typeof lead)[number] | null = null;
      for (const e of lead) {
        expect(e.midi[0]).toBeGreaterThanOrEqual(48);
        expect(e.midi[0]).toBeLessThanOrEqual(91);
        if (prev && prev.bar === e.bar) {
          expect(prev.pos + prev.len, `${s.title}: overlap at bar ${e.bar}`).toBeLessThanOrEqual(e.pos);
          expect(Math.abs(e.midi[0] - prev.midi[0]), `${s.title}: leap at bar ${e.bar}`).toBeLessThanOrEqual(12);
        }
        prev = e;
      }
    }
  });

  it('keeps the bass low and the chords in the middle', () => {
    for (const [, s] of all) {
      const c = compose(s, titleSeed(s.title));
      for (const e of c.events) {
        if (e.layer === 'bass') { expect(e.midi[0]).toBeGreaterThanOrEqual(33); expect(e.midi[0]).toBeLessThanOrEqual(62); }
        if (e.layer === 'chord') for (const m of e.midi) { expect(m).toBeGreaterThanOrEqual(40); expect(m).toBeLessThanOrEqual(84); }
      }
    }
  });

  it('ends the loop on the tonic chord', () => {
    for (const [, s] of all) {
      const c = compose(s, titleSeed(s.title));
      expect(c.harmony[c.harmony.length - 1].degree, s.title).toBe(0);
    }
  });

  it('gives a smooth energy curve and levels in 0..1', () => {
    for (const [, s] of all) {
      const c = compose(s, titleSeed(s.title));
      for (let b = 0; b < c.bars; b++) {
        expect(Math.abs(c.energy[b] - c.energy[(b + c.bars - 1) % c.bars]), `${s.title} bar ${b}`).toBeLessThanOrEqual(0.75);
        for (const v of Object.values(levelsAt(s, c, b))) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
      }
    }
  });

  it('is deterministic per title', () => {
    const [, s] = all[0];
    expect(compose(s, titleSeed(s.title)).events).toEqual(compose(s, titleSeed(s.title)).events);
  });
});
