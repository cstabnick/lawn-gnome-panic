// Street events: Road incidents: fender benders, breakdowns, runaway mowers, races. (roadmap docs/roadmaps/gta-world-events-and-rewards.md)
import type { Actor, Car, EventDef } from '../types';
import { WATCH } from '../../config';
import { stepVehicle, syncVehicleMesh } from '../../vehicles';

const FENDER_BLAME = [
  '"You braked like a wet sack of acorns."',
  '"Right of way, friend. Right of way."',
  '"My ride-on has a bumper, you know. It is not a rake."',
  '"Fine. Fine. Insurance is a myth in Turfton."',
  '"I will be telling the Hat Watch about this."',
];

const FENDER_BENDER: EventDef = {
  id: 'fender-bender',
  title: 'Fender Bender',
  category: 'traffic',
  hint: 'Settle it, or drive off in one of the cars',
  weight: 1,
  cooldown: 200,
  duration: 90,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland' || c.biome === 'farmland',
  start(kit, at) {
    const fx = Math.sin(at.yaw);
    const fz = Math.cos(at.yaw);
    const sideX = Math.cos(at.yaw);
    const sideZ = -Math.sin(at.yaw);
    const a = kit.car({ kind: 'ride-on', x: at.x, z: at.z, yaw: at.yaw });
    const b = kit.car({ kind: 'ride-on', x: at.x + fx * 3, z: at.z + fz * 3, yaw: at.yaw + Math.PI + 0.4 });
    const mx = at.x + fx * 1.5;
    const mz = at.z + fz * 1.5;
    let da: Actor | null = null;
    let db: Actor | null = null;
    let ejected = false;
    let nextSmoke = 0;
    let nextBlame = 1;
    let blame = 0;
    let leaving = false;
    return {
      update(_dt, k) {
        if (a.stolen() || b.stolen()) {
          const owner = a.stolen() ? da : db;
          if (owner) k.say(`${owner.name}: "Oi! That is my ride-on!"`, owner.x(), owner.z());
          k.addHeat(0.5);
          return 'failed';
        }
        if (!ejected && k.t >= 0.3) {
          ejected = true;
          da = a.eject();
          db = b.eject();
          da?.walkTo(mx - sideX * 1.5, mz - sideZ * 1.5);
          db?.walkTo(mx + sideX * 1.5, mz + sideZ * 1.5);
        }
        if (da && db) {
          if (da.arrived()) da.face(db.x(), db.z());
          if (db.arrived()) db.face(da.x(), da.z());
        }
        if (ejected && k.t >= nextBlame && k.t < 45) {
          nextBlame += 5;
          const who = blame % 2 === 0 ? da : db;
          if (who) k.say(`${who.name}: ${FENDER_BLAME[blame % FENDER_BLAME.length]}`, mx, mz);
          blame++;
        }
        if (k.t < 30 && k.t >= nextSmoke && k.near(a.v.x, a.v.z, 80)) {
          nextSmoke = k.t + 0.25;
          k.fx.fire(a.v.x, k.ground(a.v.x, a.v.z) + 0.8, a.v.z, 0.3);
        }
        if (!leaving && k.t >= 45) {
          leaving = true;
          const to = k.spot('walk', 20, 40) ?? { x: at.x + 30, z: at.z, yaw: at.yaw };
          da?.walkTo(to.x, to.z);
          db?.walkTo(to.x, to.z);
        }
        if (k.t >= 50) return 'gone';
        return 'running';
      },
    };
  },
};

const BROKEN_DOWN_LINES = [
  '"Just a hiccup. She does this."',
  '"Do not mind the smoke. It is a feature."',
  '"Anyone with a spanner? Anyone at all?"',
  '"She ran fine this morning. Honest."',
];

const BROKEN_DOWN_MOWER: EventDef = {
  id: 'broken-down-mower',
  title: 'Broken-Down Mower',
  category: 'traffic',
  hint: 'Park alongside and sit still for 3 seconds to jump-start it',
  weight: 1,
  cooldown: 220,
  duration: 100,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome !== 'loch',
  start(kit, at) {
    const sideX = Math.cos(at.yaw);
    const sideZ = -Math.sin(at.yaw);
    const mower = kit.car({ kind: 'ride-on', x: at.x, z: at.z, yaw: at.yaw, driver: null });
    const chicory = kit.gnome({ x: at.x + sideX * 2.5, z: at.z + sideZ * 2.5, name: 'Chicory Sprocket' });
    chicory.face(at.x, at.z);
    let smoking = true;
    let smokeAt = 0;
    let talkAt = 6;
    let parked = 0;
    let line = 0;
    return {
      update(dt, k) {
        if (smoking && k.t >= smokeAt) {
          smokeAt = k.t + 0.3;
          k.fx.fire(mower.v.x, k.ground(mower.v.x, mower.v.z) + 0.8, mower.v.z);
        }
        if (k.t >= talkAt) {
          talkAt = k.t + 9;
          k.say(`${chicory.name}: ${BROKEN_DOWN_LINES[line % BROKEN_DOWN_LINES.length]}`, chicory.x(), chicory.z());
          line++;
        }
        const pv = k.player.vehicle;
        if (k.inVehicle() && pv && k.dist(mower.v.x, mower.v.z) <= 8 && Math.abs(pv.speed) < 1) parked += dt;
        else parked = 0;
        if (parked >= 3) {
          smoking = false;
          k.say(`${chicory.name}: "She purrs! Ta, friend."`, chicory.x(), chicory.z());
          k.reward(40, 'Jump-start');
          return 'done';
        }
        return 'running';
      },
    };
  },
};

const RUNAWAY_MOWER: EventDef = {
  id: 'runaway-mower',
  title: 'Runaway Mower',
  category: 'traffic',
  hint: 'Get in and drive it off before it rolls away',
  weight: 1,
  cooldown: 260,
  duration: 70,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland' || c.biome === 'farmland',
  start(kit, at) {
    const mower = kit.car({ kind: 'zero-turn', x: at.x, z: at.z, yaw: at.yaw, driver: null });
    const owner = kit.gnome({ x: at.x + 3, z: at.z + 2, name: 'Basil Tiller' });
    owner.face(mower.v.x, mower.v.z);
    kit.say(`${owner.name}: "My mower! Somebody stop that thing!"`, owner.x(), owner.z());
    let nextRun = 0;
    return {
      update(dt, k) {
        const v = mower.v;
        if (mower.stolen()) {
          k.say(`${owner.name}: "That is my mower! Thank you, friend!"`, owner.x(), owner.z());
          k.reward(70, 'Caught the runaway');
          return 'done';
        }
        if (mower.wrecked()) {
          k.say(`${owner.name}: "My poor mower."`, owner.x(), owner.z());
          return 'failed';
        }
        if (v.driver === 'none' && !v.exploded) {
          stepVehicle(v, { throttle: 0.45, steer: Math.sin(k.t * 0.8) * 0.35, lift: 0 }, dt, k.world);
          syncVehicleMesh(v, dt);
        }
        if (k.t >= nextRun) {
          nextRun = k.t + 1;
          owner.runTo(v.x, v.z);
        }
        if (k.t >= 70) return 'gone';
        return 'running';
      },
    };
  },
};

const COACH_HONKERS = ['Lovage Dibble', 'Teasel Stoutpot', 'Chervil Hobnail'];
const COACH_HONKS = ['"Honk. HONK."', '"Get a move on, you lump of shell!"', '"Is it lunchtime yet?"', '"Beeeeeep."'];

const SNAIL_COACH_JAM: EventDef = {
  id: 'snail-coach-jam',
  title: 'Snail Coach Jam',
  category: 'traffic',
  hint: 'Overtake the snail coach before the whole street queues behind it',
  weight: 1,
  cooldown: 300,
  duration: 100,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    const fwdX = Math.sin(at.yaw);
    const fwdZ = Math.cos(at.yaw);
    const goal = kit.spot('road', 120, 180) ?? { x: at.x + fwdX * 150, z: at.z + fwdZ * 150, yaw: at.yaw };
    const coach = kit.car({ kind: 'snail-coach', x: at.x, z: at.z, yaw: at.yaw });
    coach.driveTo(goal.x, goal.z, 0.2);
    const jam: Car[] = [];
    let ahead: Car = coach;
    for (const d of [8, 14, 20]) {
      const leader = ahead;
      const c = kit.car({ kind: 'ride-on', x: at.x - fwdX * d, z: at.z - fwdZ * d, yaw: at.yaw });
      c.follow(() => ({ x: leader.v.x, z: leader.v.z }), 0.25);
      jam.push(c);
      ahead = c;
    }
    let nextHonk = 6;
    let behind = false;
    return {
      update(_dt, k) {
        if (coach.arrived()) return 'gone';
        if (k.t >= nextHonk) {
          nextHonk = k.t + 6;
          const c = k.pick(jam);
          k.say(`${k.pick(COACH_HONKERS)}: ${k.pick(COACH_HONKS)}`, c.v.x, c.v.z);
        }
        if (k.inVehicle()) {
          const dx = k.px() - coach.v.x;
          const dz = k.pz() - coach.v.z;
          const along = dx * Math.sin(coach.v.yaw) + dz * Math.cos(coach.v.yaw);
          const d = Math.hypot(dx, dz);
          if (behind && along >= 0 && d <= 6) {
            k.say('"Show-off!" shouts a driver from the queue.', coach.v.x, coach.v.z);
            k.reward(15, 'Overtook the snail');
            return 'done';
          }
          if (along < 0 && d <= 40) behind = true;
        }
        return 'running';
      },
      blip: () => ({ x: coach.v.x, z: coach.v.z }),
    };
  },
};

const STREET_RACE_PASS: EventDef = {
  id: 'street-race-pass',
  title: 'Street Race',
  category: 'traffic',
  hint: 'Keep up with the racers for 12 seconds',
  weight: 1,
  cooldown: 280,
  duration: 60,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'desert',
  start(kit, at) {
    const fwdX = Math.sin(at.yaw);
    const fwdZ = Math.cos(at.yaw);
    const sideX = Math.cos(at.yaw);
    const sideZ = -Math.sin(at.yaw);
    const goal = kit.spot('road', 200, 300) ?? { x: at.x + fwdX * 250, z: at.z + fwdZ * 250, yaw: at.yaw };
    const red = kit.car({ kind: 'lowrider', x: at.x, z: at.z, yaw: at.yaw, tint: 0xef4444 });
    const blue = kit.car({ kind: 'lowrider', x: at.x + sideX * 3, z: at.z + sideZ * 3, yaw: at.yaw, tint: 0x3b82f6 });
    red.driveTo(goal.x, goal.z, 1);
    blue.driveTo(goal.x, goal.z, 1);
    let watch: Car | null = null;
    let raced = 0;
    return {
      update(dt, k) {
        if (!watch && k.t >= 6) {
          const w = k.car({
            kind: 'ride-on',
            x: at.x - fwdX * 25,
            z: at.z - fwdZ * 25,
            yaw: at.yaw,
            driver: { hat: WATCH.hat, shirt: WATCH.coat },
          });
          w.follow(() => ({ x: red.v.x, z: red.v.z }), 0.9);
          watch = w;
        }
        if (k.inVehicle() && (k.dist(red.v.x, red.v.z) <= 20 || k.dist(blue.v.x, blue.v.z) <= 20)) raced += dt;
        if (raced >= 12) {
          k.reward(60, 'Kept up with the racers');
          return 'done';
        }
        if (red.arrived() && blue.arrived()) return 'gone';
        return 'running';
      },
      blip: () => ({ x: red.v.x, z: red.v.z }),
    };
  },
};

export const TRAFFIC_EVENTS: readonly EventDef[] = [FENDER_BENDER, BROKEN_DOWN_MOWER, RUNAWAY_MOWER, SNAIL_COACH_JAM, STREET_RACE_PASS];
