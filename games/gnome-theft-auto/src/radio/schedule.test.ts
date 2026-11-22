// The radio's programme rules and the content checks. Run: npm test -w games/gnome-theft-auto
import { describe, expect, it } from 'vitest';
import { UNDERGROUND_JOURNEY } from '@lawn/music';
import { PLACES } from '../config';
import { ADS, allLines, BRIDGE_TRAFFIC, EVENT_BULLETINS, HEAT_BULLETINS, STATIONS, trafficLine } from './content';
import { createProgram, DIAL, readSeconds, type Segment } from './schedule';

/** A seeded generator, so a failing run can be replayed. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function play(station: 'blade' | 'fpr' | 'beats' | 'under', count: number, seed = 7): Segment[] {
  const p = createProgram(seeded(seed));
  p.tune(station);
  return Array.from({ length: count }, () => p.next()!);
}

describe('the dial', () => {
  it('cycles blade, fpr, beats, under, off and back round', () => {
    const p = createProgram(seeded(1));
    const seen: (string | null)[] = [];
    for (let i = 0; i < DIAL.length * 2; i++) seen.push(p.cycle());
    expect(seen).toEqual(['blade', 'fpr', 'beats', 'under', null, 'blade', 'fpr', 'beats', 'under', null]);
  });

  it('is silent when off: no programme, no bulletins', () => {
    const p = createProgram(seeded(2));
    expect(p.station).toBeNull();
    expect(p.next()).toBeNull();
    expect(p.bulletin('heat-1')).toBeNull();
  });

  it('ignores an unknown station id instead of tuning to nothing', () => {
    const p = createProgram(seeded(3));
    p.tune('nope' as 'blade');
    expect(p.station).toBeNull();
  });
});

describe('a station programme', () => {
  it('opens with the sign-on, then two songs for every break', () => {
    const segs = play('blade', 13);
    expect(segs[0].kind).toBe('talk');
    expect(segs[0].who).toBe('DOCK');
    segs.forEach((s, i) => {
      if (i > 0) expect(s.kind === 'song', `segment ${i}`).toBe(i % 3 !== 0);
    });
  });

  it('covers every kind of break within a few rounds', () => {
    const kinds = new Set(play('fpr', 60).map((s) => s.kind));
    for (const k of ['song', 'talk', 'ad', 'caller', 'traffic']) expect(kinds.has(k as Segment['kind'])).toBe(true);
  });

  it('never plays the same line twice in a row within one kind of break', () => {
    for (const st of STATIONS) {
      const segs = play(st.id, 400, 11);
      for (const kind of ['talk', 'ad', 'caller', 'traffic'] as const) {
        const texts = segs.filter((s) => s.kind === kind).map((s) => s.text);
        for (let i = 1; i < texts.length; i++) expect(texts[i], `${st.id} ${kind} ${i}`).not.toBe(texts[i - 1]);
      }
    }
  });

  it('never plays the same song twice in a row, and every song gets played', () => {
    for (const st of STATIONS) {
      const songs = play(st.id, 400, 13).filter((s) => s.kind === 'song');
      for (let i = 1; i < songs.length; i++) expect(songs[i].song!.title).not.toBe(songs[i - 1].song!.title);
      const titles = new Set(songs.map((s) => s.song!.title));
      expect(titles.size).toBe(st.songs.length);
    }
  });

  it('gives every song its own music seed and a run time between 55 and 85 seconds', () => {
    const songs = play('beats', 200, 17).filter((s) => s.kind === 'song');
    for (const s of songs) {
      expect(s.seconds).toBeGreaterThanOrEqual(55);
      expect(s.seconds).toBeLessThanOrEqual(85);
      expect(s.song!.seed).toBeGreaterThan(0);
    }
    expect(new Set(songs.map((s) => s.song!.seed)).size).toBeGreaterThan(songs.length * 0.9);
  });

  it('keeps every segment on screen for a readable time', () => {
    for (const s of play('blade', 200, 19)) {
      if (s.kind === 'song') continue;
      expect(s.seconds).toBeGreaterThanOrEqual(4);
      expect(s.seconds).toBeLessThanOrEqual(10);
    }
  });

  it('keeps the station on every segment it plays', () => {
    for (const s of play('fpr', 50, 23)) expect(s.station).toBe('fpr');
  });
});

describe('bulletins', () => {
  it('picks a heat bulletin for the current tier only', () => {
    const p = createProgram(seeded(29));
    p.tune('blade');
    for (const level of [1, 2, 3, 4] as const) {
      const seg = p.bulletin(`heat-${level}`)!;
      expect(seg.kind).toBe('bulletin');
      expect(HEAT_BULLETINS[level].map((l) => l.text)).toContain(seg.text);
    }
  });

  it('does not repeat the same bulletin twice in a row', () => {
    const p = createProgram(seeded(31));
    p.tune('beats');
    let prev = '';
    for (let i = 0; i < 40; i++) {
      const t = p.bulletin('heat-3')!.text;
      expect(t).not.toBe(prev);
      prev = t;
    }
  });

  it('returns null for an unknown event', () => {
    const p = createProgram(seeded(37));
    p.tune('blade');
    expect(p.bulletin('gta-not-real')).toBeNull();
  });
});

describe('content', () => {
  it('gives every station enough to say, so a long drive does not loop', () => {
    for (const st of STATIONS) {
      expect(st.banter.length, `${st.id} banter`).toBeGreaterThanOrEqual(12);
      // The Subsoil set has one title per cut of its journey (7), not a playlist.
      expect(st.songs.length, `${st.id} songs`).toBeGreaterThanOrEqual(st.id === 'under' ? UNDERGROUND_JOURNEY.length : 8);
      expect(st.calls.length, `${st.id} calls`).toBeGreaterThanOrEqual(2);
      expect(st.ads.length + ADS.length, `${st.id} ads`).toBeGreaterThanOrEqual(8);
    }
  });

  it('has a bulletin for every Hat Watch tier and for every achievement and story event the radio reacts to', () => {
    for (const level of [1, 2, 3, 4] as const) expect(HEAT_BULLETINS[level].length).toBeGreaterThanOrEqual(3);
    const eventKeys = [
      'gta-borrowed',
      'gta-whirligig',
      'gta-kaboom',
      'gta-pilot',
      'gta-skydiver',
      'gta-first-contract',
      'gta-ragdoll',
      'gta-drifter',
      'gta-washed-out',
      'gta-fresh-kiln',
      'gta-boot-legger',
      'gta-turf-violator',
      'gta-mid-air-jack',
      'gta-snail-saboteur',
      'gta-dry-bone',
      'gta-even-cut',
      'prologue-fresh-kiln',
      'ch1-mowers-keepers',
      'ch1-two-coat-tail',
      'ch1-tax-break-in',
      'ch1-founders-boot',
      'ch2-dew-run',
      'ch2-sprinkler-gauntlet',
      'ch2-vespers-offer',
      'ch2-unmowed-tablet',
      'ch3-salvage-raid',
      'ch3-kiln-resin-ice',
      'ch3-tundra-drift-run',
      'ch4-runway-flares',
      'ch4-sandpit-drop',
      'ch4-spade-truce',
      'ch5-even-cut',
      'sq-grid-truthers',
      'sq-porcelain-blues',
      'sq-fescue-fugitive',
      'sq-hoa-audit',
      'sq-castaway-drydock',
      'sq-mulch-pyramid',
      'sq-biscuit-hotdog',
      'sq-snail-rigging',
      'sq-porcelain-support',
      'sq-hose-revolt',
      'sq-big-lou-embargo',
    ];
    for (const id of eventKeys) {
      expect(EVENT_BULLETINS[id]?.length ?? 0, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('has two bulletin lines for each wildlife event', () => {
    const wildlifeKeys = [
      'cow-tipped',
      'herd-herded',
      'drey-raid',
      'drey-mower-stolen',
      'drey-scattered',
      'snowman-smashed',
      'bear-shrug',
      'hive-knocked',
      'swarm-escaped',
    ];
    for (const id of wildlifeKeys) expect(EVENT_BULLETINS[id]?.length ?? 0, id).toBeGreaterThanOrEqual(2);
  });

  it('has one traffic line for each of the five river bridges', () => {
    expect(BRIDGE_TRAFFIC.length).toBe(5);
    for (const name of ['Fellsmelt Bridge', 'Ravine Bridge', 'Bracken Bridge', 'Culvert Bridge', 'Clover Bridge']) {
      expect(BRIDGE_TRAFFIC.filter((l) => l.text.includes(name)), name).toHaveLength(1);
    }
    for (const l of BRIDGE_TRAFFIC) expect(l.who).toBe('TRAFFIC');
  });

  it('builds a traffic report for every place on the map', () => {
    for (const p of PLACES) expect(trafficLine(p).text).toContain(p.reason);
  });

  it('keeps the no-wet, no-gore rule (R-021): nothing gets soaked, dripped on or bleeds', () => {
    const banned = /\b(wet|wetter|wetness|soak\w*|drip\w*|dripping|blood\w*|gore|bleed\w*)\b/i;
    for (const line of allLines()) expect(line.text, line.text).not.toMatch(banned);
    for (const st of STATIONS) expect(st.songs.map((s) => s.title).join(' '), st.id).not.toMatch(banned);
  });

  it('reads a line in four to ten seconds', () => {
    expect(readSeconds('x')).toBe(4);
    expect(readSeconds('x'.repeat(500))).toBe(10);
  });
});
