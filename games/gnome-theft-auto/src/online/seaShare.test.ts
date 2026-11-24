// Two clients that share the host's sea record compute the same waves (docs/roadmaps/gta-water-waves.md). waves.ts keeps
// module state, so the host and the guest each get a fresh module graph, with the same wall clock and a different
// wave-clock offset on the host. The host's record goes to the guest's seaSync, and the two graphs must then agree.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SyncFrame, SyncLink } from './hub';
import { encodeSea } from './seaSync';

const FAKE_WALL_MS = 1735689600000 + 90_000; // 90 s after the wave epoch, fixed for both graphs

afterEach(() => {
  vi.restoreAllMocks();
});

type WavesMod = typeof import('../waves');
type SeaMod = typeof import('./seaSync');

async function loadGraph(): Promise<{ waves: WavesMod; sea: SeaMod }> {
  vi.resetModules();
  const waves = await import('../waves');
  const sea = await import('./seaSync');
  return { waves, sea };
}

describe('shared sea', () => {
  it('a guest that applies the host record has the host clock, sea state and wave heights', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FAKE_WALL_MS);
    vi.spyOn(performance, 'now').mockReturnValue(FAKE_WALL_MS);

    const host = await loadGraph();
    host.waves.setWaveClockOffset(4321);
    host.waves.tickWaveClock();
    host.waves.setSeaState('blustery', host.waves.waveTime());
    const hostT = host.waves.waveTime();
    const record = encodeSea(hostT, host.waves.forcedSeaState());

    const guest = await loadGraph();
    guest.waves.tickWaveClock();
    expect(Math.abs(guest.waves.waveTime() - hostT)).toBeGreaterThan(4); // they start apart

    const link = {} as unknown as SyncLink;
    const adapter = guest.sea.createSeaSync(link);
    adapter.receive(
      { added: [{ owner: 1, id: 0, rec: record, str: undefined, seenAt: 0, sentAt: 0 }], changed: [], removed: [] },
      { hostId: 1, myId: 2 } as unknown as SyncFrame,
    );
    // The guest's clock is read once per frame (app.ts), so tick it again after the correction.
    guest.waves.tickWaveClock();

    expect(Math.abs(guest.waves.waveTime() - host.waves.waveTime())).toBeLessThan(0.25);
    expect(guest.waves.forcedSeaState()?.state).toBe('blustery');
    expect(Math.abs((guest.waves.forcedSeaState()?.at ?? NaN) - (host.waves.forcedSeaState()?.at ?? NaN))).toBeLessThan(0.1);

    const points: [number, number][] = [[0, 0], [120, -40], [-300, 210], [500, 500], [-700, -650]];
    let size = 0;
    for (const [x, z] of points) {
      const hh = host.waves.waveHeight(x, z, host.waves.waveTime());
      const gh = guest.waves.waveHeight(x, z, guest.waves.waveTime());
      size += Math.abs(hh);
      expect(Math.abs(hh - gh), `height at (${x}, ${z}): host ${hh} guest ${gh}`).toBeLessThan(0.02);
    }
    // Not trivially equal: there are real (if small, the swell builds over the forced transition) waves at these points.
    expect(size).toBeGreaterThan(0.01);
  });
});
