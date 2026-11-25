// Life in the Underspan (E17 issue B3): Hogweed and the Underspanners, the Roost arrival (Updraft rides), the Chute.
import type { AmbientGnomeDef } from '../../ambientGnomes';
import { createAmbientGnomes } from '../../ambientGnomes';
import { addInteractSpot } from '../../interactables';
import { currentInterior } from '../../interiors';
import { homeOf, registerHome } from '../../homes/data';
import { playAt } from '../../sound/bus';
import { SOCIETY_CAST, SOCIETY_EVENTS, SOCIETY_INTERIORS, UNDERSPAN, type SocietyDeps, type SocietyPart } from '../config';
import { updateSocietySave } from '../save';

const FAR_AWAY = 250;
const SOUND_RANGE = 60;
const GENERATOR = { x: 568, z: -24 };
const SITE_CENTRE = { x: (UNDERSPAN.site.minX + UNDERSPAN.site.maxX) / 2, z: (UNDERSPAN.site.minZ + UNDERSPAN.site.maxZ) / 2 };
const SHED_CENTRE = { x: (UNDERSPAN.shed.minX + UNDERSPAN.shed.maxX) / 2, z: (UNDERSPAN.shed.minZ + UNDERSPAN.shed.maxZ) / 2 };

/** True when a point stands on the Roost deck (inside its rectangle and at deck height, not on the ground below). */
export function onRoost(x: number, y: number, z: number): boolean {
  const r = UNDERSPAN.roost;
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ && y >= UNDERSPAN.roostY - 0.6;
}

const PEOPLE: readonly AmbientGnomeDef[] = [
  {
    id: 'us-hogweed', name: SOCIETY_CAST.hogweed, x: UNDERSPAN.hogweed.x, z: UNDERSPAN.hogweed.z, yaw: UNDERSPAN.hogweed.yaw,
    idle: 'think',
    look: { hat: 0x6b4a2e, shirt: 0x8a5a3a, beard: 0xd2691e, glasses: true },
    bubble: 'It works! Probably! Stand over there. Further.',
  },
  {
    id: 'us-burdock', name: SOCIETY_CAST.burdock, x: GENERATOR.x - 2, z: GENERATOR.z, yaw: Math.PI / 2,
    idle: 'tap-foot',
    look: { hat: 0x3a3a3a, shirt: 0x6b4a2e, beard: 0x888888, glasses: false },
    bubble: 'If I stop pedalling the kettle goes cold and so does the revolution.',
  },
  {
    id: 'us-nettle', name: SOCIETY_CAST.nettle, x: 574, z: -40, yaw: 0,
    idle: 'sleep',
    look: { hat: 0x2f4f4f, shirt: 0xb0b7bd, beard: 0x5c4b3a, glasses: true },
    bubble: 'Upside down is just right side up with better ideas.',
  },
  {
    id: 'us-chalker', name: 'An Underspanner', x: 565, z: -26, yaw: -Math.PI / 2,
    idle: 'read',
    look: { hat: 0x8a5a3a, shirt: 0x3a3a3a, glasses: false },
    bubble: 'Lift equals hose times umbrella over permit. The permit is zero. So: infinite lift.',
  },
  {
    id: 'us-sweeper', name: 'An Underspanner', x: 590, z: -10, yaw: 0,
    idle: 'sweep',
    look: { hat: 0x2f4f4f, shirt: 0x6b4a2e, beard: null, glasses: false },
    bubble: 'We file them by colour. Pink ones are the angry ones.',
  },
];

export function installUnderspanLife(deps: SocietyDeps): SocietyPart {
  const people = createAmbientGnomes(deps.scene, PEOPLE);

  const door = homeOf('hogweed');
  if (door) {
    registerHome({
      ...door,
      door: [UNDERSPAN.workshopDoor.x, UNDERSPAN.workshopDoor.z, UNDERSPAN.workshopDoor.yaw],
      interiorId: SOCIETY_INTERIORS.workshop,
    });
  }

  addInteractSpot({
    x: UNDERSPAN.chuteTop.x,
    z: UNDERSPAN.chuteTop.z,
    y: UNDERSPAN.roostY,
    prompt: 'Slide down the Chute',
    run: () => {
      deps.teleport(UNDERSPAN.chuteBottom.x, UNDERSPAN.chuteBottom.z, UNDERSPAN.chuteBottom.yaw);
      playAt('metal-clang', { x: UNDERSPAN.chuteBottom.x, z: UNDERSPAN.chuteBottom.z });
      return true;
    },
  });

  let weldIn = 6 + Math.random() * 4;
  let whirrIn = 9 + Math.random() * 5;
  let wasOnRoost = false;

  return {
    update(dt: number): void {
      const p = deps.player;
      if (Math.hypot(p.x - SITE_CENTRE.x, p.z - SITE_CENTRE.z) > FAR_AWAY) {
        wasOnRoost = false;
        return;
      }
      people.update(dt, p.x, p.z);

      const near = Math.hypot(p.x - SHED_CENTRE.x, p.z - SHED_CENTRE.z) <= SOUND_RANGE;
      if (near) {
        weldIn -= dt;
        if (weldIn <= 0) {
          weldIn = 6 + Math.random() * 4;
          playAt('weld-crackle', SHED_CENTRE);
        }
        whirrIn -= dt;
        if (whirrIn <= 0) {
          whirrIn = 9 + Math.random() * 5;
          playAt('pedal-whirr', GENERATOR);
        }
      }

      const onDeck = currentInterior() === null && onRoost(p.x, p.y, p.z);
      if (onDeck && !wasOnRoost) {
        updateSocietySave((s) => { s.updraftRides++; });
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SOCIETY_EVENTS.updraft));
        deps.hud.toast('The Roost. Unauthorised verticality achieved.');
      }
      wasOnRoost = onDeck;
    },
  };
}
