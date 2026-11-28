// Quest fuzzer: the things that go wrong mid-quest. Each one is applied once to a running session, through RunSession only.
// The sim has no traffic.ts or app.ts, so traffic-sweep and crack-player mirror what those do, by hand.
import { explodeVehicle } from '../../vehicles';
import type { Vehicle } from '../../types';
import type { RunSession } from '../types';
import { pick } from './rng';

export type DisruptionId =
  | 'destroy-vehicle' | 'sink-vehicle' | 'teleport-away' | 'crack-player' | 'despawn-npc'
  | 'exit-vehicle' | 'idle-wait' | 'heat-4' | 'save-reload' | 'traffic-sweep';

export interface Disruption {
  id: DisruptionId;
  describe: string;
  /** False when there is nothing to disrupt right now (no vehicle, no quest NPC, ...). */
  applies(s: RunSession): boolean;
  /** Do it; returns a one-line note of what happened. May step the session (idle-wait). */
  apply(s: RunSession, rng: () => number): Promise<string>;
}

const dist = (s: RunSession, v: { x: number; z: number }): number => Math.hypot(v.x - s.player.x, v.z - s.player.z);

/** The player's vehicle, else the nearest quest-owned one within 200 m. */
function targetVehicle(s: RunSession, groundOnly: boolean): Vehicle | null {
  const ok = (v: Vehicle): boolean => !v.exploded && !v.sunk && (!groundOnly || (!v.spec.flies && !v.spec.boat));
  const mine = s.player.vehicle;
  if (mine && ok(mine)) return mine;
  let best: Vehicle | null = null;
  for (const v of s.vehicles) {
    if (!v.questOwned || !ok(v) || dist(s, v) > 200) continue;
    if (!best || dist(s, v) < dist(s, best)) best = v;
  }
  return best;
}

const name = (v: Vehicle): string => `${v.kind}#${v.id}`;

const list: Disruption[] = [
  {
    id: 'destroy-vehicle',
    describe: "the player's vehicle (or the nearest quest vehicle) is blown up",
    applies: (s) => targetVehicle(s, false) !== null,
    async apply(s) {
      const v = targetVehicle(s, false)!;
      const wasMine = s.player.vehicle === v;
      explodeVehicle(v);
      return `exploded ${name(v)}${wasMine ? ' (player ride)' : ''}`;
    },
  },
  {
    id: 'sink-vehicle',
    describe: 'a ground vehicle is dumped in deep water (sunk, undrivable)',
    applies: (s) => targetVehicle(s, true) !== null,
    async apply(s) {
      const v = targetVehicle(s, true)!;
      v.sunk = true;
      v.sunkT = 0;
      v.speed = 0;
      return `sank ${name(v)}`;
    },
  },
  {
    id: 'teleport-away',
    describe: 'the player is moved 400 m away (out of the vehicle)',
    applies: () => true,
    async apply(s, rng) {
      if (s.player.vehicle) s.exit();
      const a = rng() * Math.PI * 2;
      const lim = s.world.half - 20;
      const x = Math.max(-lim, Math.min(lim, s.player.x + Math.cos(a) * 400));
      const z = Math.max(-lim, Math.min(lim, s.player.z + Math.sin(a) * 400));
      s.teleport(x, z);
      return `teleported to ${x.toFixed(0)}, ${z.toFixed(0)}`;
    },
  },
  {
    id: 'crack-player',
    describe: 'the player is Washed Out (as app.ts does on death)',
    applies: () => true,
    async apply(s) {
      if (s.player.vehicle) s.exit();
      const handled = s.quests.onPlayerDown?.() ?? false;
      if (!handled) s.teleport(s.world.hospital.x, s.world.hospital.z);
      return handled ? 'player down: the quest handled it' : 'player down: sent to the hospital';
    },
  },
  {
    id: 'despawn-npc',
    describe: 'a quest NPC vanishes from the world (a buggy cleanup)',
    applies: (s) => s.npcs.list.some((n) => n.quest),
    async apply(s, rng) {
      const n = pick(rng, s.npcs.list.filter((x) => x.quest));
      const i = s.npcs.list.indexOf(n);
      if (i >= 0) s.npcs.list.splice(i, 1);
      n.model.object.removeFromParent();
      return `removed npc ${n.name} (${n.quest})`;
    },
  },
  {
    id: 'exit-vehicle',
    describe: 'the player gets out of the vehicle they are driving',
    applies: (s) => s.player.vehicle !== null,
    async apply(s) {
      const v = s.player.vehicle!;
      s.exit();
      return `left ${name(v)}`;
    },
  },
  {
    id: 'idle-wait',
    describe: 'the player does nothing for 120 sim seconds',
    applies: () => true,
    async apply(s) {
      s.drive({ throttle: 0, steer: 0, lift: 0 });
      s.walk({ moveX: 0, moveY: 0, camYaw: 0 });
      const t0 = s.now();
      while (s.now() - t0 < 120) await s.step(0.1);
      return 'idled 120 s';
    },
  },
  {
    id: 'heat-4',
    describe: 'the Hat Watch heat jumps by 4 (cheats noHeat / noWanted are off for this run)',
    applies: () => true,
    async apply(s) {
      s.watch.addHeat(4);
      return 'added 4 heat';
    },
  },
  {
    id: 'save-reload',
    describe: 'the game is saved and reloaded before the step (runner.reloadBeforeStep)',
    applies: () => true,
    async apply() {
      return 'saved and reloaded';
    },
  },
  {
    id: 'traffic-sweep',
    describe: "traffic.ts's cleanup runs on every unattended, unpinned vehicle farther than 60 m",
    applies: () => true,
    async apply(s) {
      let n = 0;
      for (let i = s.vehicles.length - 1; i >= 0; i--) {
        const v = s.vehicles[i];
        if (v.driver !== 'none' || v.questOwned || v.questPinned || v.kind === 'whirligig' || dist(s, v) <= 60) continue;
        v.object.removeFromParent();
        s.vehicles.splice(i, 1);
        n++;
      }
      return `swept ${n} vehicles`;
    },
  },
];

export const DISRUPTIONS = Object.fromEntries(list.map((d) => [d.id, d])) as Record<DisruptionId, Disruption>;
export const DISRUPTION_IDS: readonly DisruptionId[] = list.map((d) => d.id);
