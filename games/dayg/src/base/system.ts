// Base system: owns the base state, claims, pieces, damage, work, the sim sync and the save.
import type { WorldState } from '../sim/types';
import { setSimBase, takeBaseDamage } from '../sim/base';
import type { Bus } from '../game/bus';
import type { CampSystem, HatlessSystem, PlayerState, Vec3 } from '../game/types';
import type { Collider } from '../world/collide';
import { HIT, PUSH, SAVE, SPIKE } from './config';
import { clearBase, loadBase, saveBase } from './save';
import {
  barrierOn, baseHp, createBase, damagePiece, dismantlePiece, findPiece, piecesOn, placePiece, reinforcePiece,
  repairPiece, setDoorState, setLadderUp as setLadderUpState, canPlace,
} from './model';
import { boxHitsCircle, cellCenter, isPerimeter, ladderRoute, pieceBox, piecePlacement, plotCenter, sealedAt as gridSealedAt } from './grid';
import type { Aim, BaseState, Box, Cost, DamageCause, PieceKind, PieceState, PlotDef } from './types';

export interface BaseDeps { seed: number; world: WorldState; collider: Collider; bus: Bus; hatless: HatlessSystem; camp: CampSystem; getPlayer: () => PlayerState }
export interface BaseSystem {
  state(): BaseState | null;
  claim(plot: PlotDef): boolean;
  abandon(): void;
  place(kind: PieceKind, aim: Aim): PieceState | null;
  damage(id: string, amount: number, cause: DamageCause): void;
  repair(id: string): void;
  reinforce(id: string): void;
  dismantle(id: string): Cost[];
  setDoor(id: string, patch: { open?: boolean; locked?: boolean; hasLock?: boolean }): boolean;
  setLadderUp(id: string, up: boolean): void;
  touch(): void;                                   // contents changed (chest): save and notify
  strike(origin: Vec3, facing: number, reach: number, damage: number): boolean;
  sealedAt(pos: Vec3): boolean;
  startWork(label: string, seconds: number, done: () => void): boolean;
  busy(): { label: string; progress: number } | null;
  cancelWork(): void;
  update(dt: number, sunHours: number): void;
  onChange(fn: () => void): () => void;
}

const SPIKE_FACINGS = [0, 2.094, 4.189];
const routeId = (pieceId: string): string => `${pieceId}-route`;

export function createBaseSystem(deps: BaseDeps): BaseSystem {
  const { seed, world, collider, bus, hatless, camp, getPlayer } = deps;
  let state: BaseState | null = loadBase(seed);
  let clock = 0;
  let dirty = false;
  let saveAt = 0;
  let sinceSync = 0;
  let work: { label: string; seconds: number; elapsed: number; done: () => void } | null = null;
  const doorTimers = new Map<string, number>();
  const spikeTimers = new Map<string, number>();
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const fn of [...listeners]) fn();
  }

  function syncSim(): void {
    if (!state) { setSimBase(world, null); return; }
    const plot = state.plot;
    const c = plotCenter(plot);
    const warmth = state.pieces.filter((p) => {
      if (p.kind !== 'fire-ring') return false;
      const cc = cellCenter(plot, p.slot);
      return camp.nearFire({ x: cc.x, y: plot.y, z: cc.z });
    }).length;
    setSimBase(world, { region: plot.region, x: c.x, z: c.z, ...baseHp(state), warmth });
  }

  function save(): void {
    if (state) saveBase(state);
    dirty = false;
  }

  function changed(): void {
    dirty = true;
    saveAt = clock + SAVE.debounceSec;
    syncSim();
    notify();
  }

  /** Adds the piece's collider block and ladder route. */
  function apply(piece: PieceState): void {
    if (!state) return;
    const box = pieceBox(state.plot, piece);
    if (box) collider.addBlock({ id: piece.id, kind: 'piece', ...box });
    else collider.removeBlock(piece.id);
    if (piece.kind === 'ladder') {
      collider.removeRoute(routeId(piece.id));
      const wall = barrierOn(state, piece.slot);
      if (wall && !piece.up) collider.addRoute(ladderRoute(piece, wall));
    }
  }

  function unapply(piece: PieceState): void {
    collider.removeBlock(piece.id);
    if (piece.kind === 'ladder') collider.removeRoute(routeId(piece.id));
  }

  function hasBarricadeOver(door: PieceState): boolean {
    return !!state && piecesOn(state, door.slot).some((p) => p.kind === 'barricade' && p.overDoor);
  }

  /** Hatless within PUSH.radius of a box's centre, at plot height. */
  function pushersAt(box: Box): number {
    if (!state) return 0;
    return hatless.nearCount({ x: (box.x0 + box.x1) / 2, y: state.plot.y, z: (box.z0 + box.z1) / 2 }, PUSH.radius);
  }

  function hurt(id: string, amount: number, cause: DamageCause): void {
    if (!state) return;
    const piece = findPiece(state, id);
    if (!piece) return;
    const removed = damagePiece(state, id, amount);
    if (removed.length === 0) {
      bus.emit('piece-damaged', { id, kind: piece.kind, hp: piece.hp, maxHp: piece.maxHp, cause });
    } else {
      for (const r of removed) {
        unapply(r);
        bus.emit('piece-broken', { id: r.id, kind: r.kind, cause });
        if (r.kind === 'chest' && r.items.length > 0) bus.emit('hint', { text: 'The chest splits and its things scatter.' });
      }
    }
    changed();
  }

  if (state) {
    for (const p of state.pieces) apply(p);
    syncSim();
  }

  bus.on('player-hit', () => {
    if (!work) return;
    work = null;
    bus.emit('hint', { text: 'You are interrupted.' });
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => { if (state) save(); });
  }

  return {
    state: () => state,

    claim(plot: PlotDef): boolean {
      if (state) return false;
      state = createBase(seed, plot);
      save();
      syncSim();
      const c = plotCenter(plot);
      bus.emit('base-claimed', { region: plot.region, x: c.x, z: c.z });
      notify();
      return true;
    },

    abandon(): void {
      if (!state) return;
      const old = state;
      for (const p of old.pieces) unapply(p);
      clearBase(seed);
      setSimBase(world, null);
      state = null;
      dirty = false;
      bus.emit('base-abandoned', { region: old.plot.region });
      notify();
    },

    place(kind: PieceKind, aim: Aim): PieceState | null {
      if (!state) return null;
      const reason = canPlace(state, kind, aim);
      if (reason) {
        bus.emit('hint', { text: reason });
        return null;
      }
      const piece = placePiece(state, kind, aim);
      apply(piece);
      bus.emit('piece-placed', { id: piece.id, kind });
      changed();
      return piece;
    },

    damage: hurt,

    repair(id: string): void {
      if (!state) return;
      const piece = findPiece(state, id);
      if (!piece) return;
      repairPiece(state, id);
      bus.emit('piece-repaired', { id, kind: piece.kind });
      changed();
    },

    reinforce(id: string): void {
      if (!state) return;
      const piece = findPiece(state, id);
      if (!piece || piece.kind !== 'barricade') return;
      reinforcePiece(state, id);
      bus.emit('piece-repaired', { id, kind: piece.kind });
      changed();
    },

    dismantle(id: string): Cost[] {
      if (!state) return [];
      if (!findPiece(state, id)) return [];
      const { removed, refund } = dismantlePiece(state, id);
      for (const r of removed) unapply(r);
      if (removed.length > 0) changed();
      return refund;
    },

    setDoor(id: string, patch: { open?: boolean; locked?: boolean; hasLock?: boolean }): boolean {
      if (!state) return false;
      const piece = findPiece(state, id);
      if (!piece || piece.kind !== 'door') return false;
      if (patch.open === false) {
        const closed = pieceBox(state.plot, { ...piece, open: false });
        const p = getPlayer();
        if (closed && boxHitsCircle(closed, p.pos.x, p.pos.z, 0.45)) {
          bus.emit('hint', { text: 'Step out of the doorway.' });
          return false;
        }
      }
      if (!setDoorState(state, id, patch)) return false;
      apply(piece);
      changed();
      return true;
    },

    setLadderUp(id: string, up: boolean): void {
      if (!state) return;
      const piece = findPiece(state, id);
      if (!piece || piece.kind !== 'ladder') return;
      setLadderUpState(state, id, up);
      apply(piece);
      changed();
    },

    touch(): void {
      if (!state) return;
      changed();
      save();
    },

    strike(origin: Vec3, facing: number, reach: number, damage: number): boolean {
      if (!state) return false;
      const plot = state.plot;
      const cosLimit = Math.cos(Math.PI / 3);
      let best: { id: string; dist: number } | null = null;
      for (const piece of state.pieces) {
        const pl = piecePlacement(plot, piece);
        const dx = pl.x - origin.x, dz = pl.z - origin.z;
        const dist = Math.hypot(dx, dz);
        if (dist > reach + 0.5) continue;
        if (dist > 1e-6) {
          const dot = (dx * Math.sin(facing) + dz * Math.cos(facing)) / dist;
          if (dot < cosLimit) continue;
        }
        if (!best || dist < best.dist) best = { id: piece.id, dist };
      }
      if (!best) return false;
      hurt(best.id, damage * HIT.hpPerDamage, 'hit');
      return true;
    },

    sealedAt(pos: Vec3): boolean {
      return state ? gridSealedAt(state, pos.x, pos.z) : false;
    },

    startWork(label: string, seconds: number, done: () => void): boolean {
      if (work) return false;
      work = { label, seconds, elapsed: 0, done };
      return true;
    },

    busy(): { label: string; progress: number } | null {
      if (!work) return null;
      const progress = work.seconds <= 0 ? 1 : Math.min(1, work.elapsed / work.seconds);
      return { label: work.label, progress };
    },

    cancelWork(): void {
      work = null;
    },

    update(dt: number, sunHours: number): void {
      clock += dt;

      // 1. Work job.
      if (work) {
        work.elapsed += dt;
        if (work.elapsed >= work.seconds) {
          const done = work.done;
          work = null;
          done();
        }
      }

      if (state) {
        const plot = state.plot;

        // 2. Pushing: Hatless lean on every boxed piece (a door with a barricade over it is held shut).
        for (const id of state.pieces.map((p) => p.id)) {
          const piece = findPiece(state, id);
          if (!piece) continue;
          const box = pieceBox(plot, piece);
          if (!box) continue;
          if (piece.kind === 'door' && hasBarricadeOver(piece)) continue;
          const n = pushersAt(box);
          if (n > 0) hurt(id, n * sunHours * 60 * PUSH.hpPerHatlessSunMinute, 'push');
        }

        // 3. Door burst: a closed, unlocked, unbarred door pushed hard for long enough opens.
        for (const id of state.pieces.map((p) => p.id)) {
          const piece = findPiece(state, id);
          if (!piece || piece.kind !== 'door' || piece.open || piece.locked || hasBarricadeOver(piece)) {
            doorTimers.delete(id);
            continue;
          }
          const box = pieceBox(plot, piece);
          if (!box || pushersAt(box) < PUSH.doorBurstPushers) {
            doorTimers.delete(id);
            continue;
          }
          const t = (doorTimers.get(id) ?? 0) + dt;
          if (t < PUSH.doorBurstSeconds) {
            doorTimers.set(id, t);
            continue;
          }
          doorTimers.delete(id);
          if (setDoorState(state, id, { open: true })) {
            apply(piece);
            bus.emit('hint', { text: 'The door bursts open.' });
            changed();
          }
        }

        // 4. Spikes: every SPIKE.everySec each spike line strikes the Hatless in front of it.
        for (const id of state.pieces.filter((p) => p.kind === 'spike-line').map((p) => p.id)) {
          const piece = findPiece(state, id);
          if (!piece) { spikeTimers.delete(id); continue; }
          const t = (spikeTimers.get(id) ?? 0) + dt;
          if (t < SPIKE.everySec) { spikeTimers.set(id, t); continue; }
          spikeTimers.set(id, t - SPIKE.everySec);
          const c = cellCenter(plot, piece.slot);
          for (const f of SPIKE_FACINGS) {
            if (!findPiece(state, id)) break;
            const hits = hatless.strike({ x: c.x, y: plot.y, z: c.z }, f, SPIKE.reach, SPIKE.damage);
            if (hits > 0) hurt(id, hits * SPIKE.wearPerHit, 'push');
          }
        }

        // 5. Away damage: the sim's owed damage lands on the perimeter (or every boxed piece).
        const owed = takeBaseDamage(world);
        if (owed > 0) {
          const boxed = state.pieces.filter((p) => pieceBox(plot, p) !== null);
          let targets = boxed.filter((p) => isPerimeter(p.slot));
          if (targets.length === 0) targets = boxed;
          if (targets.length > 0) {
            const share = owed / targets.length;
            for (const p of targets) hurt(p.id, share, 'away');
          }
          const c = plotCenter(plot);
          const pl = getPlayer();
          if (Math.hypot(pl.pos.x - c.x, pl.pos.z - c.z) < 30) {
            bus.emit('hint', { text: 'Your walls took a beating while you were away.' });
          }
        }
      }

      // 6. Sim sync once a second.
      sinceSync += dt;
      if (sinceSync >= 1) {
        sinceSync = 0;
        syncSim();
      }

      // 7. Save when dirty and the debounce has passed.
      if (dirty && clock >= saveAt) save();
    },

    onChange(fn: () => void): () => void {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
  };
}
