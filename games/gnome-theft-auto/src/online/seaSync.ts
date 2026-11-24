// The shared sea (docs/roadmaps/gta-water-waves.md): the host publishes its wave clock and any forced sea state as one
// record (id 0) every 2 s; every other client nudges its wave clock to the host's and applies the forced state with the
// host's start time, so all clients draw and float on the same waves (waves.ts depends only on x, z, the clock and the
// sea state). Offline nothing runs: waves.ts falls back to the wall clock and its own schedule, which already agree.
//
// Record: [0, round(waveTime * 10), state, round(forcedAt * 10)]; state -2 = never forced (schedule), -1 = forced back
// to the schedule, 0 calm, 1 breezy, 2 blustery.
import { forcedSeaState, setSeaState, setWaveClockOffset, tickWaveClock, waveClockOffset, waveTime, type SeaState } from '../waves';
import type { MirrorChanges, MirrorEnt, OwnedEnt, SyncAdapter, SyncFrame, SyncLink } from './hub';
import { SYS } from './protocol';

export const SEA_STATE_CODES = ['calm', 'breezy', 'blustery'] as const;

/** A clock difference under this (s) is latency, not skew: left alone so the offset does not twitch. */
const DEAD_BAND_S = 0.2;

export function encodeSea(t: number, forced: { state: SeaState | null; at: number } | null): number[] {
  const code = forced ? (forced.state ? SEA_STATE_CODES.indexOf(forced.state) : -1) : -2;
  return [0, Math.round(t * 10), code, forced ? Math.round(forced.at * 10) : 0];
}

/** state undefined = the host runs on the schedule (never forced). Null when malformed. */
export function decodeSea(rec: readonly number[]): { t: number; state: SeaState | null | undefined; at: number } | null {
  if (rec.length !== 4) return null;
  const code = rec[2];
  if (!Number.isInteger(code) || code < -2 || code >= SEA_STATE_CODES.length) return null;
  const state = code === -2 ? undefined : code === -1 ? null : SEA_STATE_CODES[code];
  return { t: rec[1] / 10, state, at: rec[3] / 10 };
}

/** How far (ms) to move my wave clock to match the host's: 0 inside the dead band. */
export function clockCorrectionMs(hostT: number, myT: number): number {
  const d = hostT - myT;
  return Math.abs(d) < DEAD_BAND_S || !Number.isFinite(d) ? 0 : d * 1000;
}

function apply(e: MirrorEnt): void {
  const d = decodeSea(e.rec);
  if (!d) return;
  // Compare against my clock now, not as of my last frame (a slow frame would read as skew).
  tickWaveClock();
  const corr = clockCorrectionMs(d.t, waveTime());
  if (corr !== 0) setWaveClockOffset(waveClockOffset() + corr);
  if (d.state === undefined) return;
  const cur = forcedSeaState();
  if (!cur || cur.state !== d.state || Math.abs(cur.at - d.at) > 0.05) setSeaState(d.state, d.at);
}

export function createSeaSync(_link: SyncLink): SyncAdapter {
  return {
    sys: SYS.sea,
    radius: 100000,
    hz: 0.5,
    collect(out: OwnedEnt[], f: SyncFrame) {
      if (!f.isHost) return;
      // The clock as of now, not as of my last frame (multiplayer audit: slow frames read as skew on the guests).
      tickWaveClock();
      out.push({ id: 0, x: 0, z: 0, rec: encodeSea(waveTime(), forcedSeaState()) });
    },
    receive(ch: MirrorChanges, f: SyncFrame | null) {
      if (!f) return;
      for (const e of ch.added) if (e.owner === f.hostId) apply(e);
      for (const e of ch.changed) if (e.owner === f.hostId) apply(e);
    },
    ownerGone() { /* nothing to adopt: the next host publishes its own sea */ },
    update() { /* nothing per frame */ },
    reset() { /* keep the clock offset: no jump when going offline */ },
  };
}
