// Street events: Non-violent street scenes: buskers, parades, picnics, yard sales. (roadmap docs/roadmaps/gta-world-events-and-rewards.md)
import { WATCH } from '../../config';
import type { Actor, EventAnchor, EventDef, EventKit } from '../types';

/** Unit vector for a yaw (the same convention the kit uses: forward = (sin yaw, cos yaw)). */
function fwd(yaw: number): { x: number; z: number } {
  return { x: Math.sin(yaw), z: Math.cos(yaw) };
}

/**
 * If any scene gnome was cracked or knocked over, the rest of the scene runs off and the event fails.
 * Returns true when the scene is over.
 */
function troubled(actors: readonly Actor[], kit: EventKit): boolean {
  if (!actors.some((a) => a.stopped())) return false;
  for (const a of actors) if (!a.stopped()) a.flee(kit.px(), kit.pz());
  return true;
}

const SONG_LINES = [
  'Tuning the bass with a garden spade.',
  'Hello, hello, the hedge is green and so am I.',
  'This one is about a gnome who never came home from the compost.',
  'Clap if you have acorns. Clap if you do not.',
];

const STREET_BUSKER: EventDef = {
  id: 'street-busker',
  title: 'Street Busker',
  category: 'scene',
  hint: 'Stand close for a few seconds and tip him 5 Acorns',
  weight: 1,
  cooldown: 200,
  duration: 120,
  anchor: 'walk',
  when: (c) => c.biome === 'city' || c.biome === 'parkland',
  start(kit, at) {
    const f = fwd(at.yaw);
    const busker = kit.gnome({ x: at.x, z: at.z, name: 'Fennel Washboard' });
    busker.face(at.x + f.x * 3.5, at.z + f.z * 3.5);
    kit.prop('gsr-upright-bass', at.x - f.x * 1.5, at.z - f.z * 1.5, at.yaw);
    const crowd = [0, 1, 2].map((i) => {
      const a = at.yaw + (i - 1) * 0.9;
      const g = kit.gnome({ x: at.x + 3.5 * Math.sin(a), z: at.z + 3.5 * Math.cos(a) });
      g.face(at.x, at.z);
      return g;
    });
    const all: Actor[] = [busker, ...crowd];
    const bx = at.x;
    const bz = at.z;
    let nextSong = 2;
    let standT = 0;
    return {
      update(dt, k) {
        if (troubled(all, k)) return 'failed';
        if (k.t >= nextSong) {
          nextSong = k.t + 8;
          if (k.near(bx, bz, 20)) k.say(`${busker.name}: "${k.pick(SONG_LINES)}"`, bx, bz);
        }
        if (!k.inVehicle() && k.near(bx, bz, 4)) standT += dt;
        else standT = 0;
        if (standT >= 3) {
          if (k.charge(5, 'Busker tip')) {
            k.say(`${crowd[0].name}: "Encore! Encore!"`, bx, bz);
            k.heal(0.1);
            k.fx.confetti(bx, k.ground(bx, bz) + 2, bz);
            return 'done';
          }
          standT = 0;
          k.say(`${busker.name}: "Acorns only, friend. Acorns."`, bx, bz);
        }
        return 'running';
      },
    };
  },
};

const CLAY_WEDDING: EventDef = {
  id: 'clay-wedding',
  title: 'Clay Wedding',
  category: 'scene',
  hint: 'Stay near the wedding float for 20 seconds to get a favour; wreck it and the guests run',
  weight: 1,
  cooldown: 300,
  duration: 110,
  anchor: 'road',
  roadScene: true,
  when: (c) => c.biome === 'city' || c.biome === 'parkland' || c.biome === 'farmland',
  start(kit, at) {
    const float = kit.car({ kind: 'boot-float', x: at.x, z: at.z, yaw: at.yaw, tint: 0xffffff });
    const v = float.v;
    const dest = kit.spot('road', 120, 200) ?? { x: at.x + 160, z: at.z, yaw: 0 };
    float.driveTo(dest.x, dest.z, 0.35);
    const COUPLE = ['Juniper Kettle', 'Rue Ladle'];
    // The spot i guests stand at: 6 units behind the float, spread sideways.
    const behind = (i: number): { x: number; z: number } => {
      const f = fwd(v.yaw);
      const side = (i - 1.5) * 1.5;
      return { x: v.x - f.x * 6 + Math.cos(v.yaw) * side, z: v.z - f.z * 6 - Math.sin(v.yaw) * side };
    };
    const guests: Actor[] = [];
    let spawnT = 0;
    let regroupT = 0;
    let confT = 0;
    let together = 0;
    return {
      update(dt, k) {
        if (guests.length > 0 && troubled(guests, k)) return 'failed';
        if (float.wrecked() || float.stolen()) {
          for (const g of guests) if (!g.stopped()) g.flee(k.px(), k.pz());
          k.addHeat(0.5);
          return 'failed';
        }
        spawnT += dt;
        if (guests.length < 4 && spawnT >= 1.5) {
          spawnT = 0;
          const i = guests.length;
          const p = behind(i);
          guests.push(kit.gnome({ x: p.x, z: p.z, name: i < 2 ? COUPLE[i] : undefined }));
        }
        regroupT += dt;
        if (regroupT >= 1.5) {
          regroupT = 0;
          guests.forEach((g, i) => {
            const p = behind(i);
            g.walkTo(p.x, p.z);
          });
        }
        confT += dt;
        if (confT >= 2) {
          confT = 0;
          if (k.near(v.x, v.z, 60)) k.fx.confetti(v.x, k.ground(v.x, v.z) + 2, v.z);
        }
        if (k.near(v.x, v.z, 25)) together += dt;
        if (together >= 20) {
          const [bride, groom] = guests;
          k.reward(40, 'Wedding favour');
          k.say(`${bride.name}: "A favour for the one who stayed. Keep the glaze shiny."`, v.x, v.z);
          k.say(`${groom.name}: "Our first gift, for a friend."`, v.x, v.z);
          return 'done';
        }
        if (float.arrived(8)) return 'gone';
        return 'running';
      },
      blip: () => ({ x: v.x, z: v.z }),
    };
  },
};

const LAWN_PICNIC: EventDef = {
  id: 'lawn-picnic',
  title: 'Lawn Picnic',
  category: 'scene',
  hint: 'Sit down at the rug for a bite',
  weight: 1,
  cooldown: 240,
  duration: 120,
  anchor: 'walk',
  when: (c) => c.biome === 'parkland' || c.biome === 'farmland' || c.biome === 'city',
  start(kit, at) {
    kit.prop('rug', at.x, at.z, at.yaw);
    const cake = kit.prop('seed-cake', at.x - 0.4, at.z, 0);
    const bread = kit.prop('bread-loaf', at.x + 0.4, at.z + 0.2, 0.5);
    for (const p of [cake, bread]) p.position.y = kit.ground(p.position.x, p.position.z) + 0.15;
    const sitters = [0, 1, 2].map((i) => {
      const a = i * 2.1;
      const g = kit.gnome({ x: at.x + 3 * Math.sin(a), z: at.z + 3 * Math.cos(a) });
      g.face(at.x, at.z);
      return g;
    });
    let sitT = 0;
    return {
      update(dt, k) {
        if (troubled(sitters, k)) return 'failed';
        if (!k.inVehicle() && k.near(at.x, at.z, 4)) sitT += dt;
        else sitT = 0;
        if (sitT >= 2) {
          k.say(`${sitters[0].name}: "Pull up a toadstool!"`, at.x, at.z);
          k.heal(0.25);
          k.sfx('drink');
          return 'done';
        }
        return 'running';
      },
    };
  },
};

const LOST_HAT: EventDef = {
  id: 'lost-hat',
  title: 'Lost Hat',
  category: 'scene',
  hint: 'Pick up the lost pointy hat and bring it back to Parsley',
  weight: 1,
  cooldown: 260,
  duration: 120,
  anchor: 'walk',
  start(kit, at) {
    const parsley = kit.gnome({ x: at.x, z: at.z, name: 'Parsley Gumboot' });
    const h = kit.spot('walk', 25, 45) ?? { x: at.x + 30, z: at.z, yaw: 0 };
    const hat = kit.prop('pointy-hat', h.x, h.z, 0);
    let held = false;
    return {
      update(dt, k) {
        if (troubled([parsley], k)) return 'failed';
        if (!held) {
          hat.rotation.y += dt;
          if (k.near(hat.position.x, hat.position.z, 2.5)) {
            k.dropProp(hat);
            held = true;
            k.say(`${parsley.name}: "My good pointy hat! Bring it back here."`, parsley.x(), parsley.z());
          }
          return 'running';
        }
        if (k.near(parsley.x(), parsley.z(), 4)) {
          k.reward(50, 'Hat returned');
          k.say(`${parsley.name}: "Splendid. The hat and I are reunited."`, parsley.x(), parsley.z());
          return 'done';
        }
        return 'running';
      },
      blip: () => (held ? { x: parsley.x(), z: parsley.z() } : { x: hat.position.x, z: hat.position.z }),
    };
  },
};

const YARD_SALE: EventDef = {
  id: 'yard-sale',
  title: 'Yard Sale',
  category: 'scene',
  hint: 'Stand at the table and pay 20 Acorns for a mystery item',
  weight: 1,
  cooldown: 300,
  duration: 140,
  anchor: 'walk',
  when: (c) => c.biome === 'city' || c.biome === 'parkland' || c.biome === 'farmland',
  start(kit, at) {
    const f = fwd(at.yaw);
    const hyssop = kit.gnome({ x: at.x, z: at.z, name: 'Aunt Hyssop Crockery' });
    const tx = at.x + f.x * 2;
    const tz = at.z + f.z * 2;
    hyssop.face(tx, tz);
    kit.prop('table', tx, tz, at.yaw);
    kit.prop('crate', tx + 1.2, tz, 0);
    kit.prop('lamp', tx - 1.2, tz, 0);
    kit.prop('plant', tx, tz + 0.8, 0);
    let standT = 0;
    let refused = false;
    return {
      update(dt, k) {
        if (troubled([hyssop], k)) return 'failed';
        if (!k.inVehicle() && k.near(tx, tz, 3)) standT += dt;
        else standT = 0;
        if (standT < 2) return 'running';
        standT = 0;
        if (!k.charge(20, 'Yard sale')) {
          if (!refused) k.say(`${hyssop.name}: "Twenty Acorns for a look? Bold."`, at.x, at.z);
          refused = true;
          return 'running';
        }
        if (k.rand() < 0.5) {
          k.reward(40, 'Yard sale find');
          k.say(`${hyssop.name}: "Ooh, that one was in the back. Lucky you."`, at.x, at.z);
        } else {
          k.say(`${hyssop.name}: "A slightly used glaze brush. Treasure it."`, at.x, at.z);
        }
        return 'done';
      },
    };
  },
};

const CHANTS = ['Longer grass! Fewer blades!', 'What do we want? Seed heads!', 'Tall grass is a right!'];

const MOW_IN_PROTEST: EventDef = {
  id: 'mow-in-protest',
  title: 'Mow-In Protest',
  category: 'scene',
  hint: 'March along with the Long Grass League for 15 seconds',
  weight: 1,
  cooldown: 320,
  duration: 120,
  anchor: 'walk',
  when: (c) => c.biome === 'city',
  start(kit, at) {
    // A 16-unit square around the anchor, walked clockwise.
    const corners = [
      { x: at.x - 8, z: at.z - 8 },
      { x: at.x + 8, z: at.z - 8 },
      { x: at.x + 8, z: at.z + 8 },
      { x: at.x - 8, z: at.z + 8 },
    ];
    const leader = kit.gnome({ x: corners[0].x, z: corners[0].z, name: 'Sedge Trugg' });
    leader.walkTo(corners[1].x, corners[1].z);
    const marchers: Actor[] = [];
    for (let i = 1; i <= 4; i++) marchers.push(kit.gnome({ x: corners[0].x, z: corners[0].z - 2 * i }));
    const inspector = kit.gnome({
      x: at.x,
      z: at.z,
      look: { hat: WATCH.hoaHat, shirt: WATCH.hoaCoat },
    });
    const all: Actor[] = [leader, ...marchers, inspector];
    let li = 1;
    let chantT = 0;
    let walkT = 0;
    return {
      update(dt, k) {
        if (troubled(all, k)) return 'failed';
        if (leader.arrived(2)) {
          li = (li + 1) % corners.length;
          leader.walkTo(corners[li].x, corners[li].z);
        }
        // Each marcher keeps 2 units behind the one ahead of it, along that one's direction of travel.
        let px = leader.x();
        let pz = leader.z();
        let gx = corners[li].x;
        let gz = corners[li].z;
        for (const m of marchers) {
          const dx = gx - px;
          const dz = gz - pz;
          const d = Math.hypot(dx, dz);
          const bx = d > 0.01 ? px - (dx / d) * 2 : px;
          const bz = d > 0.01 ? pz - (dz / d) * 2 : pz;
          m.walkTo(bx, bz);
          gx = bx;
          gz = bz;
          px = m.x();
          pz = m.z();
        }
        inspector.face(leader.x(), leader.z());
        chantT += dt;
        if (chantT >= 7) {
          chantT = 0;
          k.say(`${leader.name}: "${k.pick(CHANTS)}"`, leader.x(), leader.z());
        }
        if (!k.inVehicle() && k.near(leader.x(), leader.z(), 6)) walkT += dt;
        if (walkT >= 15) {
          k.reward(25, 'Marched with the League');
          k.say(`${leader.name}: "Another one for the grass! Thank you, friend."`, leader.x(), leader.z());
          return 'done';
        }
        return 'running';
      },
      blip: () => ({ x: leader.x(), z: leader.z() }),
    };
  },
};

export const SCENE_EVENTS: readonly EventDef[] = [
  STREET_BUSKER,
  CLAY_WEDDING,
  LAWN_PICNIC,
  LOST_HAT,
  YARD_SALE,
  MOW_IN_PROTEST,
];
