// Street events: Creature trouble: loose livestock, squirrel heists, bee swarms. (roadmap docs/roadmaps/gta-world-events-and-rewards.md)
import type * as THREE from 'three';
import type { EventAnchor, EventDef, EventKit } from '../types';

/** A point within r of the anchor (uniform over the disc). */
function around(kit: EventKit, at: EventAnchor, r: number): { x: number; z: number } {
  const a = kit.rand() * Math.PI * 2;
  const d = Math.sqrt(kit.rand()) * r;
  // Off the road: the animals graze the verge, not the lanes.
  return kit.offRoad(at.x + Math.cos(a) * d, at.z + Math.sin(a) * d);
}

/** Move (x, z) towards (tx, tz) by at most `step`. `d` is the distance before the move. */
function towards(x: number, z: number, tx: number, tz: number, step: number): { x: number; z: number; d: number } {
  const dx = tx - x;
  const dz = tz - z;
  const d = Math.hypot(dx, dz);
  if (d <= step || d === 0) return { x: tx, z: tz, d };
  return { x: x + (dx / d) * step, z: z + (dz / d) * step, d };
}

const LIVESTOCK_LINES = [
  'Shoo! Shoo, you great lumps!',
  'Not the lawn, Clover! Not the lawn!',
  'Keep off the road, you daft hens!',
];

interface Animal {
  o: THREE.Object3D;
  x: number;
  z: number;
  yaw: number;
  tx: number;
  tz: number;
  timer: number;
  state: 'graze' | 'flee' | 'shooed';
  fleeX: number;
  fleeZ: number;
  fleeT: number;
}

const LOOSE_LIVESTOCK: EventDef = {
  id: 'loose-livestock',
  title: 'Loose Livestock',
  category: 'wild',
  hint: 'Shoo all four animals off the road',
  weight: 1,
  cooldown: 260,
  duration: 120,
  anchor: 'road',
  when: (c) => c.biome === 'farmland' || c.biome === 'parkland' || c.biome === 'city',
  start(kit, at) {
    const farmer = kit.gnome({
      x: at.x + 4,
      z: at.z + 3,
      name: 'Farmer Bramble',
      look: { hat: 0x8a6a3a, shirt: 0x6b8e3a, beard: 0xd9d4c4 },
    });
    const herd: Animal[] = [];
    for (let i = 0; i < 4; i++) {
      const p = around(kit, at, 15);
      const o = kit.prop(kit.pick(['sheep', 'pig', 'cow', 'hen']), p.x, p.z);
      herd.push({ o, x: p.x, z: p.z, yaw: 0, tx: p.x, tz: p.z, timer: 0, state: 'graze', fleeX: 0, fleeZ: 0, fleeT: 0 });
    }
    const place = (a: Animal): void => {
      a.o.position.set(a.x, kit.ground(a.x, a.z), a.z);
      a.o.rotation.y = a.yaw;
    };
    let farmerGoal = 0;
    let lastLine = -10;
    let shooedCount = 0;

    return {
      update(dt) {
        const now = kit.t;
        // Bramble wanders among the herd, saying his piece now and then.
        if (now >= farmerGoal) {
          const p = around(kit, at, 8);
          farmer.walkTo(p.x, p.z);
          farmerGoal = now + 6;
        }
        if (now - lastLine > 9) {
          kit.say(`${farmer.name}: "${kit.pick(LIVESTOCK_LINES)}"`, farmer.x(), farmer.z());
          lastLine = now;
        }

        for (const a of herd) {
          if (a.state === 'shooed') continue;
          if (a.state === 'graze' && kit.near(a.x, a.z, 4)) {
            // Run away from the player for 2 s, then it counts as shooed.
            const dx = a.x - kit.px();
            const dz = a.z - kit.pz();
            const d = Math.hypot(dx, dz) || 1;
            a.fleeX = dx / d;
            a.fleeZ = dz / d;
            a.fleeT = 2;
            a.state = 'flee';
          }
          if (a.state === 'flee') {
            a.fleeT -= dt;
            a.x += a.fleeX * 6 * dt;
            a.z += a.fleeZ * 6 * dt;
            a.yaw = Math.atan2(a.fleeX, a.fleeZ);
            if (a.fleeT <= 0) {
              a.state = 'shooed';
              shooedCount++;
              kit.dropProp(a.o);
              kit.say(`${farmer.name}: "One off the road."`, farmer.x(), farmer.z());
              continue;
            }
            place(a);
          } else {
            a.timer -= dt;
            if (a.timer <= 0) {
              const p = around(kit, at, 15);
              a.tx = p.x;
              a.tz = p.z;
              a.timer = 3 + kit.rand() * 2;
            }
            const m = towards(a.x, a.z, a.tx, a.tz, 2.5 * dt);
            if (m.d > 0.05) a.yaw = Math.atan2(a.tx - a.x, a.tz - a.z);
            a.x = m.x;
            a.z = m.z;
            place(a);
          }
        }

        if (shooedCount === herd.length) {
          kit.reward(60, 'Herded the flock');
          kit.say(`${farmer.name}: "Right, that's the lot. Tea?"`, farmer.x(), farmer.z());
          return 'done';
        }
        return 'running';
      },
      blip: () => ({ x: farmer.x(), z: farmer.z() }),
    };
  },
};

const SQUIRREL_HEIST: EventDef = {
  id: 'squirrel-heist',
  title: 'Squirrel Heist',
  category: 'wild',
  hint: 'Catch the squirrel before it gets away with the flour',
  weight: 1,
  cooldown: 240,
  duration: 60,
  anchor: 'walk',
  when: (c) => c.biome !== 'tundra',
  start(kit, at) {
    const holder = kit.gnome({ x: at.x, z: at.z, name: 'Sorrel Pottage', look: { beard: 0x9c7a4a } });
    holder.hold();
    const s0 = kit.offRoad(at.x + 1.2, at.z + 0.8);
    let sx = s0.x;
    let sz = s0.z;
    const sq = kit.prop('squirrel', sx, sz);
    const sack = kit.prop('acorn-flour-sack', sx, sz);
    const away = kit.spot('walk', 40, 70) ?? { x: at.x + 55, z: at.z, yaw: 0 };
    holder.face(sx, sz);
    kit.say(`${holder.name}: "Shoo! That's my acorn flour!"`, holder.x(), holder.z());

    let phase: 'hold' | 'run' = 'hold';
    let runT = 0;

    return {
      update(dt) {
        // The sack rides on the squirrel's back.
        if (phase === 'hold' && kit.t >= 2) {
          phase = 'run';
          kit.say(`${holder.name}: "That squirrel! Stop him!"`, holder.x(), holder.z());
        }
        if (kit.near(sx, sz, 2.5)) {
          kit.dropProp(sq);
          kit.dropProp(sack);
          kit.reward(50, 'Sack recovered');
          kit.say(`${holder.name}: "Poor beast is only hungry. I'll have my flour back, though."`, holder.x(), holder.z());
          return 'done';
        }
        if (phase === 'run') {
          runT += dt;
          // Zigzag: the heading wobbles around the bearing to the spot, so it still makes progress.
          const heading = Math.atan2(away.x - sx, away.z - sz) + Math.sin(runT * 9) * 0.6;
          sx += Math.sin(heading) * 4.5 * dt;
          sz += Math.cos(heading) * 4.5 * dt;
          sq.rotation.y = heading;
          if (Math.hypot(away.x - sx, away.z - sz) < 2) {
            kit.dropProp(sq);
            kit.dropProp(sack);
            kit.say(`${holder.name}: "Gone. Bread's gone."`, holder.x(), holder.z());
            return 'failed';
          }
        }
        sq.position.set(sx, kit.ground(sx, sz), sz);
        sack.position.set(sx, kit.ground(sx, sz) + 0.6, sz);
        return 'running';
      },
      blip: () => (phase === 'run' ? { x: sx, z: sz } : null),
    };
  },
};

interface Bee {
  o: THREE.Object3D;
  a: number;
  r: number;
  w: number;
  h: number;
}

const BEE_LINES = [
  'Come on, my lovelies. Home is that way.',
  'Mind the hive, not the man!',
];

const BEE_SWARM: EventDef = {
  id: 'bee-swarm',
  title: 'Bee Swarm',
  category: 'wild',
  hint: 'Lead the swarm back to its hive without getting stung',
  weight: 1,
  cooldown: 300,
  duration: 80,
  anchor: 'walk',
  when: (c) => c.biome === 'farmland' || c.biome === 'parkland' || c.biome === 'forest',
  start(kit, at) {
    const h0 = kit.offRoad(at.x + 2, at.z + 2.5);
    const hx = h0.x;
    const hz = h0.z;
    const keeper = kit.gnome({ x: at.x - 1.5, z: at.z, name: 'Linden Skep', look: { shirt: 0xe8e2cf } });
    keeper.hold();
    keeper.face(hx, hz);
    kit.prop('bee-hive', hx, hz);
    const drift = kit.spot('walk', 30, 50) ?? { x: at.x + 40, z: at.z, yaw: 0 };

    const bees: Bee[] = [];
    for (let i = 0; i < 8; i++) {
      bees.push({
        o: kit.prop('bee', hx, hz),
        a: (i / 8) * Math.PI * 2 + kit.rand() * 0.5,
        r: 1.5 + kit.rand() * 1.5,
        w: (kit.rand() < 0.5 ? -1 : 1) * (2 + kit.rand() * 1.5),
        h: 1.2 + kit.rand() * 0.8,
      });
    }

    let cx = hx;
    let cz = hz;
    let left = false;
    let lastSting = -10;
    let lastLine = -10;

    return {
      update(dt) {
        // The swarm drifts off towards the far spot, or towards the player while they are close, so they can lead it.
        if (kit.dist(cx, cz) <= 8) {
          const m = towards(cx, cz, kit.px(), kit.pz(), 2 * dt);
          cx = m.x;
          cz = m.z;
        } else {
          const m = towards(cx, cz, drift.x, drift.z, 2 * dt);
          cx = m.x;
          cz = m.z;
        }
        const fromHive = Math.hypot(cx - hx, cz - hz);
        if (fromHive > 8) left = true;

        for (const b of bees) {
          b.a += b.w * dt;
          const x = cx + Math.cos(b.a) * b.r;
          const z = cz + Math.sin(b.a) * b.r;
          b.o.position.set(x, kit.ground(x, z) + b.h, z);
          b.o.rotation.y = b.a + Math.PI / 2;
        }

        if (kit.near(cx, cz, 3) && kit.t - lastSting >= 1.5) {
          lastSting = kit.t;
          kit.sfx('gnome-hit');
          kit.player.hurt(0.03);
        }

        if (kit.t - lastLine > 10) {
          kit.say(`${keeper.name}: "${kit.pick(BEE_LINES)}"`, keeper.x(), keeper.z());
          lastLine = kit.t;
        }

        if (left && fromHive <= 4) {
          kit.reward(45, 'Swarm rehived');
          kit.say(`${keeper.name}: "There's my girls. Good lead, that."`, keeper.x(), keeper.z());
          return 'done';
        }
        return 'running';
      },
      blip: () => ({ x: cx, z: cz }),
    };
  },
};

export const WILD_EVENTS: readonly EventDef[] = [LOOSE_LIVESTOCK, SQUIRREL_HEIST, BEE_SWARM];
