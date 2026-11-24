import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWaves, seaState, tickWaveClock, waveClockOffset, waveTime } from '../waves';
import type { MirrorEnt, OwnedEnt, SyncFrame, SyncLink } from './hub';
import { parseWireMsg, SYS } from './protocol';
import { clockCorrectionMs, createSeaSync, decodeSea, encodeSea } from './seaSync';

const link: SyncLink = { command() {}, pay() {}, online: () => true, myId: () => 2 };
const frame = (isHost: boolean): SyncFrame => ({ isHost, hostId: isHost ? 2 : 1, myId: 2 } as unknown as SyncFrame);
const ent = (owner: number, rec: number[]): MirrorEnt => ({ owner, id: 0, rec, str: undefined, seenAt: 0, sentAt: 0 });
const MS = 1.8e12;

describe('sea sync codec', () => {
  it('round trips schedule, forced states and forced-back-to-schedule', () => {
    expect(decodeSea(encodeSea(123.4, null))).toEqual({ t: 123.4, state: undefined, at: 0 });
    expect(decodeSea(encodeSea(10, { state: 'blustery', at: 7.5 }))).toEqual({ t: 10, state: 'blustery', at: 7.5 });
    expect(decodeSea(encodeSea(10, { state: null, at: 3 }))).toEqual({ t: 10, state: null, at: 3 });
    expect(encodeSea(3.3e7, { state: 'calm', at: 3.3e7 }).every(Number.isInteger)).toBe(true);
  });
  it('rejects bad records', () => {
    expect(decodeSea([0, 1, 2])).toBeNull();
    expect(decodeSea([0, 1, 3, 0])).toBeNull();
    expect(decodeSea([0, 1, -3, 0])).toBeNull();
  });
  it('ignores clock differences inside the dead band', () => {
    expect(clockCorrectionMs(100.1, 100)).toBe(0);
    expect(clockCorrectionMs(101, 100)).toBeCloseTo(1000, 6);
    expect(clockCorrectionMs(99, 100)).toBeCloseTo(-1000, 6);
  });
  it('rides the wire', () => {
    expect(parseWireMsg({ o: 'ent', y: SYS.sea, t: 1, e: [encodeSea(3.3e7, null)] })).not.toBeNull();
  });
});

describe('createSeaSync', () => {
  // The adapter ticks the wave clock itself (Date.now) before it reads or publishes it: freeze the wall clock.
  beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(MS); resetWaves(); tickWaveClock(MS); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('only the host publishes', () => {
    const a = createSeaSync(link);
    const out: OwnedEnt[] = [];
    a.collect(out, frame(false));
    expect(out).toHaveLength(0);
    a.collect(out, frame(true));
    expect(out).toHaveLength(1);
    expect(out[0].rec[1]).toBe(Math.round(waveTime() * 10));
  });

  it('a mirror follows the host clock and forced state', () => {
    const a = createSeaSync(link);
    const t = waveTime();
    a.receive({ added: [ent(1, encodeSea(t + 1, { state: 'blustery', at: t - 100 }))], changed: [], removed: [] }, frame(false));
    expect(waveClockOffset()).toBeCloseTo(1000, 0);
    expect(seaState(t)).toBe('blustery');
  });

  it('ignores a record from someone who is not the host', () => {
    const a = createSeaSync(link);
    const t = waveTime();
    a.receive({ added: [ent(3, encodeSea(t + 5, { state: 'blustery', at: t }))], changed: [], removed: [] }, frame(false));
    expect(waveClockOffset()).toBe(0);
  });
});
