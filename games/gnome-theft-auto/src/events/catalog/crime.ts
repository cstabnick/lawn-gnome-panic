// Street events: Crimes in progress: robberies, snatches, carjackings, hustles. (roadmap docs/roadmaps/gta-world-events-and-rewards.md)
import type { EventDef } from '../types';
import { WATCH } from '../../config';

const RED_CAP = { hat: 0xd8342c, shirt: 0x2b2e34 };
const HOA_LOOK = { hat: WATCH.hoaHat, shirt: WATCH.hoaCoat };

const SHOP_STICKUP: EventDef = {
  id: 'shop-stickup', title: 'Stick-Up', category: 'crime',
  hint: 'Knock the robber down before he reaches the getaway car',
  weight: 1, cooldown: 260, duration: 80, anchor: 'walk',
  when: (c) => c.biome === 'city',
  start(kit, at) {
    const clerk = kit.gnome({ x: at.x, z: at.z, name: 'Comfrey Mudge', look: { beard: null } });
    const robber = kit.gnome({ x: at.x + 2, z: at.z, name: 'Bindweed Rook', look: RED_CAP });
    clerk.hold();
    clerk.face(robber.x(), robber.z());
    robber.hold();
    robber.face(clerk.x(), clerk.z());
    const sack = kit.prop('sack', robber.x(), robber.z());
    const spot = kit.spot('road', 25, 45) ?? { x: at.x + 30, z: at.z, yaw: 0 };
    const car = kit.car({ kind: 'lowrider', x: spot.x, z: spot.z, yaw: spot.yaw, tint: 0xd8342c, driver: RED_CAP });
    let phase: 'grab' | 'run' | 'getaway' = 'grab';
    return {
      update(_dt, k) {
        if (phase !== 'getaway' && robber.stopped()) {
          k.reward(100, 'Stopped the stick-up');
          return 'done';
        }
        if (phase === 'grab') {
          if (k.t < 4) return 'running';
          phase = 'run';
          k.dropProp(sack);
          robber.runTo(car.v.x, car.v.z);
          k.say(`${clerk.name}: "Take the acorns, not the till!"`, clerk.x(), clerk.z());
          return 'running';
        }
        if (phase === 'run') {
          if (robber.arrived(3)) {
            robber.remove();
            const far = k.spot('road', 150, 250, car.v.x, car.v.z) ?? { x: car.v.x + 200, z: car.v.z, yaw: 0 };
            car.driveTo(far.x, far.z, 0.85);
            phase = 'getaway';
          }
          return 'running';
        }
        if (car.lost()) {
          k.reward(100, 'Stopped the stick-up');
          return 'done';
        }
        if (car.arrived()) return 'failed';
        return 'running';
      },
      blip: () => {
        if (phase === 'run') return { x: robber.x(), z: robber.z() };
        if (phase === 'getaway') return { x: car.v.x, z: car.v.z };
        return null;
      },
    };
  },
};

const PURSE_SNATCH: EventDef = {
  id: 'purse-snatch', title: 'Acorn-Purse Snatch', category: 'crime',
  hint: 'Knock the snatcher down before he gets away', weight: 1, cooldown: 200, duration: 70, anchor: 'walk',
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    const victim = kit.gnome({ x: at.x, z: at.z, name: 'Old Tansy Ladle', look: { beard: null, dress: true } });
    const thief = kit.gnome({ x: at.x + 2, z: at.z + 1, name: 'Nettle Grubb', look: { hat: 0x2b2e34, shirt: 0x2b2e34 } });
    const away = kit.spot('walk', 50, 90) ?? { x: at.x + 60, z: at.z, yaw: 0 };
    let phase: 'grab' | 'run' = 'grab';
    return {
      update(_dt, k) {
        if (phase === 'grab') {
          if (k.t < 2) return 'running';
          phase = 'run';
          thief.runTo(away.x, away.z);
          victim.face(thief.x(), thief.z());
          k.say(`${victim.name}: "My acorn purse! Stop that gnome!"`);
          return 'running';
        }
        if (thief.stopped()) {
          k.reward(60, 'Purse returned');
          k.say(`${victim.name}: "Bless your glaze!"`, victim.x(), victim.z());
          return 'done';
        }
        if (thief.arrived(3)) { k.say('The snatcher got away.', thief.x(), thief.z()); return 'failed'; }
        return 'running';
      },
      blip: () => (phase === 'run' ? { x: thief.x(), z: thief.z() } : null),
    };
  },
};

const CARJACKING: EventDef = {
  id: 'carjacking', title: 'Carjacking', category: 'crime',
  hint: 'Wreck or steal the ride before the thief gets away',
  weight: 1, cooldown: 240, duration: 75, anchor: 'road', roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    const car = kit.car({ kind: 'ride-on', x: at.x, z: at.z, yaw: at.yaw, driver: RED_CAP });
    // Three units to the right of the car (the car's facing is (sin yaw, cos yaw)).
    const owner = kit.gnome({
      x: at.x + Math.cos(at.yaw) * 3, z: at.z - Math.sin(at.yaw) * 3,
      name: 'Hollis Dibble', look: { beard: null },
    });
    let phase: 'parked' | 'drive' = 'parked';
    let nextRun = 0;
    return {
      update(_dt, k) {
        if (car.lost()) {
          k.say(`${owner.name}: "Thanks for bringing her back!"`, owner.x(), owner.z());
          k.reward(90, 'Ride returned');
          return 'done';
        }
        if (phase === 'parked') {
          if (k.t < 1.5) return 'running';
          phase = 'drive';
          const to = k.spot('road', 120, 200) ?? { x: at.x + 160, z: at.z, yaw: 0 };
          car.driveTo(to.x, to.z, 0.8);
          k.say(`${owner.name}: "Oi! That's my ride!"`, owner.x(), owner.z());
          nextRun = k.t;
          return 'running';
        }
        if (car.arrived()) return 'failed';
        if (k.t >= nextRun) {
          owner.runTo(car.v.x, car.v.z);
          nextRun = k.t + 1;
        }
        return 'running';
      },
      blip: () => ({ x: car.v.x, z: car.v.z }),
    };
  },
};

const SHELL_GAME: EventDef = {
  id: 'shell-game', title: 'Shell Game', category: 'crime',
  hint: 'Stand close to the hustler and try your luck (10 Acorns a go)',
  weight: 1, cooldown: 300, duration: 120, anchor: 'walk',
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    kit.prop('table', at.x, at.z, at.yaw);
    const hustler = kit.gnome({ x: at.x - 1.5, z: at.z, name: 'Clover Thimblerig', look: { beard: null } });
    const onlookers = [
      kit.gnome({ x: at.x + 0.5, z: at.z + 1.8, name: 'Dunstan Clod' }),
      kit.gnome({ x: at.x - 1, z: at.z + 2.2, name: 'Mossy Trowell' }),
    ];
    hustler.hold();
    hustler.face(at.x, at.z);
    for (const o of onlookers) {
      o.hold();
      o.face(at.x, at.z);
    }
    let tries = 0;
    let nearT = 0;
    let pauseUntil = 0;
    return {
      update(dt, k) {
        if (hustler.stopped()) {
          for (const o of onlookers) o.flee(k.px(), k.pz());
          return 'failed';
        }
        if (k.inVehicle()) nearT = 0;
        else if (k.near(hustler.x(), hustler.z(), 3)) nearT += dt;
        else nearT = 0;
        if (nearT < 2 || k.t < pauseUntil) return 'running';
        nearT = 0;
        if (!k.charge(10, 'Shell game')) {
          k.say(`${hustler.name}: "No acorns, no game, friend."`, hustler.x(), hustler.z());
          pauseUntil = k.t + 4;
          return 'running';
        }
        tries++;
        if (k.rand() < 1 / 3) {
          k.reward(30, 'Shell game win');
          return 'done';
        }
        if (tries >= 3) {
          k.say(`${hustler.name}: "Packing up. Shell game's over."`, hustler.x(), hustler.z());
          return 'gone';
        }
        k.say(`${hustler.name}: "Bad luck, friend."`, hustler.x(), hustler.z());
        pauseUntil = k.t + 4;
        return 'running';
      },
    };
  },
};

const GNOME_NAPPING: EventDef = {
  id: 'gnome-napping', title: 'Gnome-Napping', category: 'crime',
  hint: 'Knock the crook down or wreck the van before it drives off',
  weight: 1, cooldown: 360, duration: 90, anchor: 'road',
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    const van = kit.car({ kind: 'hoa-van', x: at.x, z: at.z, yaw: at.yaw, tint: 0x18181e, driver: HOA_LOOK });
    const victim = kit.gnome({
      x: at.x + Math.cos(at.yaw) * 2, z: at.z - Math.sin(at.yaw) * 2,
      name: 'Burnet Thatch', look: { beard: null },
    });
    const crook = kit.gnome({
      x: at.x - Math.cos(at.yaw) * 2, z: at.z + Math.sin(at.yaw) * 2,
      name: 'Gorse Muckett', look: HOA_LOOK,
    });
    const run = kit.spot('walk', 25, 40) ?? { x: at.x + 32, z: at.z, yaw: 0 };
    victim.runTo(run.x, run.z);
    let phase: 'chase' | 'escape' = 'chase';
    let nextWalk = 0;
    return {
      update(_dt, k) {
        if (phase === 'chase') {
          if (crook.stopped()) {
            k.say(`${victim.name}: "Oh, thank goodness!"`, victim.x(), victim.z());
            k.reward(110, 'Gnome rescued');
            return 'done';
          }
          if (k.t >= nextWalk) {
            crook.walkTo(victim.x(), victim.z());
            nextWalk = k.t + 1;
          }
          const dx = crook.x() - victim.x();
          const dz = crook.z() - victim.z();
          if (k.t >= 12 && Math.hypot(dx, dz) <= 2) {
            victim.remove();
            crook.remove();
            const to = k.spot('road', 150, 250) ?? { x: at.x + 200, z: at.z, yaw: 0 };
            van.driveTo(to.x, to.z, 0.8);
            phase = 'escape';
          }
          return 'running';
        }
        if (van.lost()) {
          k.reward(110, 'Gnome rescued');
          return 'done';
        }
        if (van.arrived()) return 'failed';
        return 'running';
      },
      blip: () => (phase === 'chase' ? { x: crook.x(), z: crook.z() } : { x: van.v.x, z: van.v.z }),
    };
  },
};

export const CRIME_EVENTS: readonly EventDef[] = [SHOP_STICKUP, PURSE_SNATCH, CARJACKING, SHELL_GAME, GNOME_NAPPING];
