import { describe, expect, it } from 'vitest';
import { BLOCK_SECONDS, liveAt } from './broadcast';
import { computeSpeakerAcoustics, SPEAKER_MAX_DIST, SPEAKER_MAX_GAIN, SPEAKER_NEAR_DIST } from './spatial';

describe('liveAt broadcast clock', () => {
  it('is deterministic for any station and timestamp', () => {
    const stations = ['blade', 'fpr', 'beats', 'under'] as const;
    for (const st of stations) {
      const a = liveAt(st, 1700000123.45);
      const b = liveAt(st, 1700000123.45);
      expect(a).toEqual(b);
      expect(a.station).toBe(st);
      expect(a.remainingSec).toBeGreaterThan(0);
    }
  });

  it('advances offsetSec continuously within the same song and keeps trackKey stable', () => {
    const t0 = 1700000040;
    const a = liveAt('blade', t0);
    const b = liveAt('blade', t0 + 5);
    expect(b.trackKey).toBe(a.trackKey);
    expect(b.offsetSec).toBeCloseTo(a.offsetSec + 5, 5);
    expect(b.songOffsetSec).toBeCloseTo(a.songOffsetSec + 5, 5);
  });

  it('rolls into a fresh broadcast block every hour', () => {
    const a = liveAt('fpr', 1700000100);
    const b = liveAt('fpr', 1700000100 + BLOCK_SECONDS);
    expect(b.blockId).toBe(a.blockId + 1);
    expect(b.trackKey).not.toBe(a.trackKey);
  });

  it('tracks Subsoil continuous set offset and dominant cut index', () => {
    const a = liveAt('under', 1700000500);
    const b = liveAt('under', 1700000500 + 12);
    expect(a.trackKey).toBe(b.trackKey);
    expect(b.songOffsetSec).toBeCloseTo(a.songOffsetSec + 12, 5);
    expect(a.songIndex).toBeGreaterThanOrEqual(0);
  });
});

describe('computeSpeakerAcoustics', () => {
  it('is at max gain near the vehicle and drops monotonically to silent at max distance', () => {
    const near = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: 0, y: 0, z: SPEAKER_NEAR_DIST });
    const mid = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: 0, y: 0, z: 15 });
    const far = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: 0, y: 0, z: SPEAKER_MAX_DIST });

    expect(near.audible).toBe(true);
    expect(near.gain).toBeCloseTo(SPEAKER_MAX_GAIN, 4);
    expect(mid.audible).toBe(true);
    expect(mid.gain).toBeLessThan(near.gain);
    expect(mid.gain).toBeGreaterThan(0);
    expect(far.audible).toBe(false);
    expect(far.gain).toBe(0);
  });

  it('pans left/right relative to listener yaw and attenuates vertically for flyers', () => {
    // Yaw 0 faces +z, so rightX = -1, rightZ = 0 -> source at -x is to the right (+pan), +x is to the left (-pan).
    const right = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: -10, y: 0, z: 0 });
    const left = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: 10, y: 0, z: 0 });
    expect(right.pan).toBeGreaterThan(0.5);
    expect(left.pan).toBeLessThan(-0.5);

    const ground = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: 0, y: 0, z: 10 });
    const high = computeSpeakerAcoustics({ x: 0, y: 0, z: 0, yaw: 0 }, { x: 0, y: 30, z: 10 });
    expect(high.gain).toBeLessThan(ground.gain);
  });
});
