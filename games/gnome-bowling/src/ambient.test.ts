import { describe, expect, it } from 'vitest';
import {
  AMBIENT_LANE_XS,
  AMBIENT_SPECS,
  createAmbientLane,
  tickAmbientLane,
  type AmbientAudioCallback,
} from './ambient';

function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

describe('ambient bowlers', () => {
  it('places bowlers on all 6 neighbouring lanes and never on the centre lane (x = 0)', () => {
    expect(AMBIENT_LANE_XS).toHaveLength(6);
    expect(AMBIENT_LANE_XS).not.toContain(0);
    expect(AMBIENT_SPECS.map((s) => s.laneX)).toEqual(AMBIENT_LANE_XS);
  });

  it('cycles through wait -> lineup -> approach -> roll -> react -> sweep -> wait and emits cues', () => {
    const lane = createAmbientLane(AMBIENT_SPECS[2], 0.2);
    const rand = seeded(42);
    const cues: AmbientAudioCallback[] = [];
    const seen = new Set<string>([lane.phase]);

    for (let i = 0; i < 400; i++) {
      tickAmbientLane(lane, 0.05, rand, (c) => cues.push(c));
      seen.add(lane.phase);
      if (lane.rolls.length > 0 && lane.phase === 'wait') break;
    }

    expect(seen).toEqual(new Set(['wait', 'lineup', 'approach', 'roll', 'react', 'sweep']));
    expect(lane.rolls.length).toBe(1);
    expect(cues.some((c) => c.type === 'release')).toBe(true);
    expect(cues.some((c) => c.type === 'outcome')).toBe(true);
    expect(cues.some((c) => c.type === 'pinsetter')).toBe(true);
  });

  it('resets rolls and racks a fresh 10 pins after completing a full 10-frame game', () => {
    const lane = createAmbientLane(AMBIENT_SPECS[0], 0.1);
    const rand = seeded(123);
    let completedGames = 0;
    let prevLen = 0;

    for (let i = 0; i < 6000; i++) {
      tickAmbientLane(lane, 0.1, rand);
      if (lane.rolls.length === 0 && prevLen >= 10) {
        completedGames++;
        break;
      }
      prevLen = lane.rolls.length;
    }

    expect(completedGames).toBe(1);
    expect(lane.standing.every(Boolean)).toBe(true);
  }, 30000);
});
