// Street events: Hat Watch at work: chases, stops, checkpoints. (roadmap docs/roadmaps/gta-world-events-and-rewards.md)
import { WATCH } from '../../config';
import type { Actor, EventAnchor, EventDef } from '../types';

const WATCH_LOOK = { hat: WATCH.hat, shirt: WATCH.coat };
const RED_CAP_LOOK = { hat: 0xd8342c, shirt: 0x2b2e34 };
const OFFICER = 'Officer Yarrow Ladle';

/** A point `fwd` units along the anchor's heading (negative = behind) and `side` units to its right. */
function offset(at: EventAnchor, fwd: number, side: number): { x: number; z: number } {
  const sin = Math.sin(at.yaw);
  const cos = Math.cos(at.yaw);
  return { x: at.x + sin * fwd + cos * side, z: at.z + cos * fwd - sin * side };
}

const WATCH_PURSUIT: EventDef = {
  id: 'watch-pursuit',
  title: 'Hat Watch Pursuit',
  category: 'police',
  hint: 'Wreck or stop the getaway, or steal it',
  weight: 1,
  cooldown: 240,
  duration: 90,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland' || c.biome === 'farmland' || c.biome === 'desert',
  start(kit, at) {
    const getaway = kit.car({ kind: 'lowrider', x: at.x, z: at.z, yaw: at.yaw, driver: RED_CAP_LOOK });
    const goal = kit.spot('road', 150, 260) ?? { x: at.x + 200, z: at.z, yaw: at.yaw };
    getaway.driveTo(goal.x, goal.z, 0.85);
    const chase = () => ({ x: getaway.v.x, z: getaway.v.z });
    for (const side of [0, 3]) {
      const back = offset(at, -(12 + kit.rand() * 6), side);
      const cop = kit.car({ kind: 'ride-on', x: back.x, z: back.z, yaw: at.yaw, tint: WATCH.hat, driver: WATCH_LOOK });
      cop.follow(chase, 0.9);
    }
    if (kit.near(at.x, at.z, 60)) kit.sfx('alarm');
    return {
      update(_dt, k) {
        if (getaway.stolen()) {
          k.addHeat(1.5);
          k.reward(90, 'Loot in the boot');
          return 'done';
        }
        if (getaway.wrecked() || getaway.lost()) {
          const robber = getaway.eject();
          robber?.flee(getaway.v.x, getaway.v.z);
          k.reward(120, 'Watch reward');
          return 'done';
        }
        if (getaway.arrived()) {
          k.say('The getaway made it. The Watch lost the trail.', getaway.v.x, getaway.v.z);
          return 'failed';
        }
        return 'running';
      },
      blip: () => ({ x: getaway.v.x, z: getaway.v.z }),
    };
  },
};

const TRAFFIC_LINES: readonly (readonly [0 | 1, string])[] = [
  [0, '"Grass is three fingers over the edge, sir."'],
  [1, '"It is a hat-angle matter, officer. Tilted, not crooked."'],
  [0, '"Tilt is a matter for the Watch. Hat straight, please."'],
  [1, '"Then I will be straight as a fence post going home."'],
];

const TRAFFIC_STOP: EventDef = {
  id: 'traffic-stop',
  title: 'Traffic Stop',
  category: 'police',
  hint: 'Drive past it at speed and the Watch will notice',
  weight: 1,
  cooldown: 200,
  duration: 80,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    const stopped = kit.car({ kind: 'ride-on', x: at.x, z: at.z, yaw: at.yaw });
    const behind = offset(at, -6, 0);
    kit.car({ kind: 'ride-on', x: behind.x, z: behind.z, yaw: at.yaw, tint: WATCH.hat, driver: WATCH_LOOK });
    const mid = offset(at, -3, 2.5);
    const officer = kit.gnome({ x: mid.x, z: mid.z, name: OFFICER, look: WATCH_LOOK });
    let driver: Actor | null = null;
    let ejected = false;
    let warned = false;
    let walking = false;
    let line = 0;
    let nextLine = 1;
    return {
      update(_dt, k) {
        if (officer.stopped()) {
          k.addHeat(1);
          k.say(`${OFFICER}: "Assault on a Watch officer. Nobody moves."`, officer.x(), officer.z());
          return 'failed';
        }
        if (!ejected && k.t >= 0.5) {
          ejected = true;
          driver = stopped.eject();
          driver?.hold();
        }
        if (driver) officer.face(driver.x(), driver.z());
        if (!warned) {
          const pv = k.player.vehicle;
          if (pv && Math.abs(pv.speed) > 18 && k.near(stopped.v.x, stopped.v.z, 10)) {
            warned = true;
            k.addHeat(0.5);
            k.say(`${OFFICER}: "Oi! Slow down, Gnome!"`, officer.x(), officer.z());
          }
        }
        if (line < TRAFFIC_LINES.length && k.t >= nextLine) {
          const [who, text] = TRAFFIC_LINES[line];
          line++;
          nextLine += 6;
          const speaker = who === 0 ? officer : driver;
          if (speaker) k.say(`${speaker.name}: ${text}`, speaker.x(), speaker.z());
        }
        if (k.t >= 45) {
          if (driver && !walking) {
            driver.walkTo(stopped.v.x, stopped.v.z);
            walking = true;
          }
          if (!driver || driver.arrived(2) || k.t >= 52) return 'gone';
        }
        return 'running';
      },
    };
  },
};

const FOOT_CHASE: EventDef = {
  id: 'foot-chase',
  title: 'Foot Chase',
  category: 'police',
  hint: 'Knock the thief down before he gets away',
  weight: 1,
  cooldown: 180,
  duration: 70,
  anchor: 'walk',
  when: (c) => c.biome === 'city',
  start(kit, at) {
    const thief = kit.gnome({ x: at.x, z: at.z, name: 'Sorrel Grubb', look: { hat: 0x2b2e34, shirt: 0x2b2e34 } });
    const officer = kit.gnome({ x: at.x + 5, z: at.z + 2, name: 'Officer Hob Trowel', look: WATCH_LOOK });
    const far = kit.spot('walk', 40, 70) ?? { x: at.x + 55, z: at.z, yaw: 0 };
    thief.runTo(far.x, far.z);
    let started = false;
    let reissue = 0;
    return {
      update(dt, k) {
        if (!started) {
          started = true;
          k.say(`${officer.name}: "Stop, thief!"`, officer.x(), officer.z());
          officer.runTo(thief.x(), thief.z());
          reissue = 1;
        }
        if (thief.stopped()) {
          k.reward(70, 'Collar assist');
          return 'done';
        }
        if (Math.hypot(officer.x() - thief.x(), officer.z() - thief.z()) <= 1.5) {
          thief.hold();
          k.say(`${officer.name}: "Got you."`, officer.x(), officer.z());
          return 'failed';
        }
        if (thief.arrived(3)) {
          k.say('The thief got away.', thief.x(), thief.z());
          return 'failed';
        }
        reissue -= dt;
        if (reissue <= 0 && !officer.cracked()) {
          reissue = 1;
          officer.runTo(thief.x(), thief.z());
        }
        return 'running';
      },
      blip: () => ({ x: thief.x(), z: thief.z() }),
    };
  },
};

const WATCH_CHECKPOINT: EventDef = {
  id: 'watch-checkpoint',
  title: 'Watch Checkpoint',
  category: 'police',
  hint: 'Pass slowly with the paperwork in order, or smash through and pay for it',
  weight: 1,
  cooldown: 300,
  duration: 120,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city',
  start(kit, at) {
    const left = offset(at, 0, 4);
    const right = offset(at, 0, -4);
    kit.prop('barricade', left.x, left.z, at.yaw);
    kit.prop('barricade', right.x, right.z, at.yaw);
    const ofsA = offset(at, -1.5, 6.5);
    const ofsB = offset(at, -1.5, -6.5);
    const officerA = kit.gnome({ x: ofsA.x, z: ofsA.z, name: 'Officer Sedge Rake', look: WATCH_LOOK });
    const officerB = kit.gnome({ x: ofsB.x, z: ofsB.z, name: 'Officer Mabel Spindle', look: WATCH_LOOK });
    let shouted = false;
    let judged = false;
    return {
      update(_dt, k) {
        if (judged || !k.near(at.x, at.z, 8)) return 'running';
        if (k.heat() >= 1) {
          if (!shouted) {
            shouted = true;
            k.say(`${officerA.name}: "Pull over, Gnome. Your heat is showing."`, officerA.x(), officerA.z());
            k.addHeat(1);
          }
          return 'running';
        }
        const pv = k.player.vehicle;
        if (!pv) return 'running';
        judged = true;
        if (Math.abs(pv.speed) < 8) {
          k.reward(20, 'Paperwork in order');
          k.say(`${officerB.name}: "Paperwork in order. Drive on, Gnome."`, officerB.x(), officerB.z());
          return 'done';
        }
        k.addHeat(0.5);
        k.say(`${officerB.name}: "Oi! That barricade is for the Watch!"`, officerB.x(), officerB.z());
        return 'failed';
      },
    };
  },
};

export const POLICE_EVENTS: readonly EventDef[] = [WATCH_PURSUIT, TRAFFIC_STOP, FOOT_CHASE, WATCH_CHECKPOINT];
