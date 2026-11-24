// Street events: Pebblewick, the town at the end of Route East (roadmap docs/roadmaps/gta-outskirts-town.md).
// A pepper cart spills on Main Street; a convoy of Fizz Cup fans heads for the Speedway gate.
import type * as THREE from 'three';
import { inTown } from '../../outskirts/town';
import type { Car, EventDef } from '../types';

const WORT_WAITING = [
  '"Five crates. Five. The peppers are not going to walk."',
  '"Mind the red ones, they bruise if you look at them."',
  '"Marigold needs these for the pie. Well, the other pie."',
];
const WORT_PICKED = ['"That is one."', '"Lovely. Keep going."', '"Careful, that one is spicy."', '"Nearly there."'];

const PEPPER_SPILL: EventDef = {
  id: 'pebblewick-pepper-spill',
  title: 'Pepper Cart Spill',
  category: 'scene',
  hint: 'Pick up the five crates of peppers',
  weight: 1,
  cooldown: 300,
  duration: 120,
  anchor: 'road',
  roadScene: true,
  when: (c) => inTown(c.px, c.pz) && !c.inVehicle,
  start(kit, at) {
    const wort = kit.gnome({ x: at.x + 2, z: at.z + 1.5, name: 'Wort Barrowby', look: { hat: 0x7a8a3a, shirt: 0xc0392b } });
    const cart = kit.prop('wheelbarrow', at.x, at.z, at.yaw, 1.4);
    cart.rotation.z = 1.2;
    const crates: THREE.Object3D[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + kit.rand() * 0.8;
      const d = 3 + kit.rand() * 6;
      crates.push(kit.prop('crate', at.x + Math.cos(a) * d, at.z + Math.sin(a) * d, kit.rand() * Math.PI, 1.2));
    }
    let picked = 0;
    let nextLine = 2;
    return {
      update() {
        wort.face(kit.px(), kit.pz());
        for (let i = crates.length - 1; i >= 0; i--) {
          const c = crates[i];
          if (!kit.near(c.position.x, c.position.z, 1.6)) continue;
          kit.dropProp(c);
          crates.splice(i, 1);
          picked++;
          kit.sfx('shutter');
          kit.say(`Wort Barrowby: ${WORT_PICKED[Math.min(picked - 1, WORT_PICKED.length - 1)]}`, wort.x(), wort.z());
        }
        if (picked >= 5) {
          kit.say('Wort Barrowby: "Every crate. The Dry Spoon owes you a slice."', wort.x(), wort.z());
          kit.reward(30, 'Pepper Cart Spill');
          return 'done';
        }
        if (kit.t >= nextLine) {
          nextLine = kit.t + 8;
          kit.say(`Wort Barrowby: ${kit.pick(WORT_WAITING)}`, wort.x(), wort.z());
        }
        return 'running';
      },
    };
  },
};

/** The Speedway's north gate, at the end of the dirt road from the east-outer highway. */
const GATE = { x: 790, z: -60 };
const FAN_KINDS = ['ride-on', 'zero-turn', 'lowrider'] as const;

const FAN_CONVOY: EventDef = {
  id: 'pebblewick-fan-convoy',
  title: 'Fizz Fan Convoy',
  category: 'traffic',
  hint: 'Beat the fans to the Speedway gate',
  weight: 1,
  cooldown: 400,
  duration: 150,
  anchor: 'road',
  when: (c) => inTown(c.px, c.pz) && c.inVehicle,
  start(kit, at) {
    const from = kit.spot('road', 10, 40) ?? at;
    const fx = Math.sin(from.yaw), fz = Math.cos(from.yaw);
    const cars: Car[] = FAN_KINDS.map((kind, i) => kit.car({
      kind, x: from.x - fx * i * 7, z: from.z - fz * i * 7, yaw: from.yaw, tint: 0xf2d22e,
      driver: { hat: 0xf2d22e, shirt: 0xffffff },
    }));
    const started = [false, false, false];
    kit.say('"FIZZ CUP! FIZZ CUP!" A convoy of fans honks out of Pebblewick.', from.x, from.z);
    return {
      update() {
        cars.forEach((c, i) => {
          if (!started[i] && kit.t >= i) {
            started[i] = true;
            c.driveTo(GATE.x, GATE.z, 0.85);
          }
        });
        if (kit.near(GATE.x, GATE.z, 12)) {
          kit.reward(40, 'Fizz Fan Convoy');
          kit.tell('You beat the Fizz fans to the gate.');
          return 'done';
        }
        if (cars.some((c) => !c.lost() && c.arrived(12))) {
          kit.tell('The fans get there first. They honk about it.');
          return 'failed';
        }
        return 'running';
      },
      blip: () => GATE,
    };
  },
};

export const PEBBLEWICK_EVENTS: readonly EventDef[] = [PEPPER_SPILL, FAN_CONVOY];
