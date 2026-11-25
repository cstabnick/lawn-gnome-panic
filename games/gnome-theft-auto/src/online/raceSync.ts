// E26 online races (SYS.race): each player publishes one record (id 0) with their lobby state and race progress; every
// mirror reads the others' records to list lobbies, members and progress. Implements RaceNet (streetRace/types.ts) for
// the race-mode session. Wire: [0, state, trackIdx, laps, vehicleIdx, hostId, seq, distDm, finishCs, dnf], str = name.
import { TRACK_IDS, type TrackId } from '../raceTrack/tracks';
import type { RaceLobby, RaceNet, RaceRacer } from '../streetRace/types';
import type { VehicleKind } from '../types';
import type { MirrorChanges, MirrorEnt, OwnedEnt } from './replicate';
import type { SyncAdapter, SyncFrame, SyncLink } from './hub';
import { SYS } from './protocol';

export interface RaceSyncDeps {
  /** My display name (as other players see it). */
  name(): string;
}

export type RaceSync = SyncAdapter & RaceNet;

/** vehicleIdx on the wire = index here. */
export const RACE_VEHICLES: readonly VehicleKind[] = [
  'lowrider', 'zero-turn', 'ride-on', 'push-bike', 'dirt-bike', 'euro-hatch', 'deux-pots', 'wespa',
];

/** state: 0 idle, 1 hosting a lobby, 2 joined a lobby, 3 racing, 4 finished. */
export interface RaceRec {
  state: number;
  trackIdx: number;
  laps: number;
  vehicleIdx: number;
  hostId: number;
  seq: number;
  distDm: number;
  finishCs: number;
  dnf: number;
}

export function encodeRaceRec(r: RaceRec): number[] {
  return [0, r.state, r.trackIdx, r.laps, r.vehicleIdx, r.hostId, r.seq, r.distDm, r.finishCs, r.dnf];
}

const isInt = (n: unknown, lo: number, hi: number): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= lo && n <= hi;

/** Null when the record is malformed or out of range. */
export function decodeRaceRec(rec: readonly number[]): RaceRec | null {
  if (rec.length < 10) return null;
  const [, state, trackIdx, laps, vehicleIdx, hostId, seq, distDm, finishCs, dnf] = rec;
  if (!isInt(state, 0, 4) || !isInt(trackIdx, 0, TRACK_IDS.length - 1) || !isInt(laps, 1, 99)
    || !isInt(vehicleIdx, 0, RACE_VEHICLES.length - 1) || !isInt(hostId, 0, 1e9) || !isInt(seq, 0, 1e9)
    || !isInt(distDm, 0, 1e8) || !isInt(finishCs, -1, 1e8) || !isInt(dnf, 0, 1)) return null;
  return { state, trackIdx, laps, vehicleIdx, hostId, seq, distDm, finishCs, dnf };
}

interface Peer extends RaceRec { name: string }

export function createRaceSync(link: SyncLink, d: RaceSyncDeps): RaceSync {
  const peers = new Map<number, Peer>();
  const invited = new Set<string>();
  let state = 0;
  let trackIdx = 0;
  let laps = 1;
  let vehicleIdx = 0;
  let hostId = 0;
  let seq = 0;
  let distDm = 0;
  let finishCs = -1;
  let dnf = 0;
  let hostSeq = 0;
  let leaveTok = 0;

  const trackId = (i: number): TrackId => TRACK_IDS[i];

  function take(e: MirrorEnt): void {
    const r = decodeRaceRec(e.rec);
    if (!r) { peers.delete(e.owner); return; }
    peers.set(e.owner, { ...r, name: (e.str ?? '').slice(0, 40) || 'Gnome' });
    if (r.state === 1 && r.hostId === e.owner) {
      const key = `${e.owner}:${r.seq}`;
      if (!invited.has(key)) {
        invited.add(key);
        const l = lobbyOf(e.owner);
        if (l && net.onInvite) net.onInvite(l);
      }
    }
  }

  /** Joiners follow their host: go with it, or drop back to idle when the lobby is gone before go. */
  function follow(): void {
    if (state !== 2) return;
    const h = peers.get(hostId);
    if (!h || h.seq !== seq || h.hostId !== hostId || h.state === 0 || h.state === 2) {
      state = 0; hostId = 0; distDm = 0; finishCs = -1; dnf = 0;
    } else if (h.state >= 3) state = 3;
  }

  function membersOf(h: number, s: number): { id: number; name: string }[] {
    const me = link.myId();
    const out: { id: number; name: string }[] = [];
    const hp = peers.get(h);
    if (h === me) out.push({ id: h, name: d.name() });
    else if (hp) out.push({ id: h, name: hp.name });
    const rest: { id: number; name: string }[] = [];
    for (const [id, p] of peers) if (id !== h && p.hostId === h && p.seq === s && p.state >= 2) rest.push({ id, name: p.name });
    if (me !== null && h !== me && hostId === h && seq === s && state >= 2) rest.push({ id: me, name: d.name() });
    rest.sort((a, b) => a.id - b.id);
    return out.concat(rest);
  }

  function lobbyOf(h: number): RaceLobby | null {
    const p = peers.get(h);
    if (!p || p.state !== 1 || p.hostId !== h) return null;
    return {
      hostId: h, hostName: p.name, trackId: trackId(p.trackIdx), laps: p.laps, vehicle: RACE_VEHICLES[p.vehicleIdx],
      members: membersOf(h, p.seq), phase: 'lobby',
    };
  }

  const net: RaceSync = {
    sys: SYS.race, radius: 100000, hz: 4, keyframeMs: 1500, staleMs: 6000,
    collect(out: OwnedEnt[], f: SyncFrame) {
      out.push({
        id: 0, x: f.me.x, z: f.me.z,
        rec: encodeRaceRec({ state, trackIdx, laps, vehicleIdx, hostId, seq, distDm, finishCs, dnf }),
        str: d.name().slice(0, 40),
      });
    },
    receive(ch: MirrorChanges) {
      for (const e of ch.added) take(e);
      for (const e of ch.changed) take(e);
      for (const e of ch.removed) peers.delete(e.owner);
      follow();
    },
    ownerGone(owner: number) {
      peers.delete(owner);
      follow();
    },
    update() { follow(); },
    reset() {
      peers.clear();
      invited.clear();
    },
    online: () => link.online(),
    myId: () => link.myId(),
    lobbies() {
      const me = link.myId();
      const out: RaceLobby[] = [];
      for (const id of peers.keys()) {
        if (id === me) continue;
        const l = lobbyOf(id);
        if (l) out.push(l);
      }
      return out.sort((a, b) => a.hostId - b.hostId);
    },
    mine() {
      const me = link.myId();
      if (state === 0 || me === null) return null;
      const h = hostId;
      return {
        hostId: h, hostName: h === me ? d.name() : peers.get(h)?.name ?? 'Gnome', trackId: trackId(trackIdx), laps,
        vehicle: RACE_VEHICLES[vehicleIdx], members: membersOf(h, seq), phase: state >= 3 ? 'racing' : 'lobby',
      };
    },
    host(t: TrackId, l: number, v: VehicleKind) {
      const me = link.myId();
      const ti = TRACK_IDS.indexOf(t);
      const vi = RACE_VEHICLES.indexOf(v);
      if (me === null || ti < 0 || vi < 0) return;
      hostSeq++; leaveTok++;
      state = 1; hostId = me; seq = hostSeq; trackIdx = ti; vehicleIdx = vi;
      laps = Math.max(1, Math.min(99, Math.round(l)));
      distDm = 0; finishCs = -1; dnf = 0;
    },
    join(h: number) {
      const p = peers.get(h);
      if (!p || p.state !== 1 || p.hostId !== h) return;
      leaveTok++;
      state = 2; hostId = h; seq = p.seq; trackIdx = p.trackIdx; laps = p.laps; vehicleIdx = p.vehicleIdx;
      distDm = 0; finishCs = -1; dnf = 0;
    },
    leave() {
      // A DNF must reach the others before the record resets (collect runs at 4 Hz): linger so it is broadcast.
      if (dnf === 1 && state >= 2) {
        const tok = ++leaveTok;
        setTimeout(() => { if (leaveTok === tok) { state = 0; hostId = 0; distDm = 0; finishCs = -1; dnf = 0; } }, 2000);
        return;
      }
      leaveTok++;
      state = 0; hostId = 0; distDm = 0; finishCs = -1; dnf = 0;
    },
    go() {
      if (state === 1 && hostId === link.myId()) state = 3;
    },
    started: () => state >= 3,
    progress(p) {
      distDm = Math.max(0, Math.min(1e8, Math.round(p.dist * 10)));
      finishCs = p.finishedAt === null ? -1 : Math.max(0, Math.min(1e8, Math.round(p.finishedAt * 100)));
      dnf = p.dnf ? 1 : 0;
      if (p.finishedAt !== null && state === 3) state = 4;
    },
    racers() {
      const me = link.myId();
      const l = net.mine();
      if (!l) return [];
      const out: RaceRacer[] = [];
      for (const m of l.members) {
        const p = peers.get(m.id);
        if (m.id === me || !p) continue;
        out.push({ id: m.id, name: m.name, dist: p.distDm / 10, finishedAt: p.finishCs >= 0 ? p.finishCs / 100 : null, dnf: p.dnf === 1 });
      }
      return out;
    },
    onInvite: null,
  };
  return net;
}
