// Life at Wader's Rest (E17 issue B6): the Flock on one leg about their rota, the reeds, the hum at the circle, and the
// Tuesday rule. Nobody here is mean; the rules are gentle and absurd (docs/lore/entries/apocrypha/flock-of-the-one-leg.md).
import type { AmbientGnomeDef } from '../../ambientGnomes';
import { createAmbientGnomes } from '../../ambientGnomes';
import { playAt } from '../../sound/bus';
import { homeOf, registerHome } from '../../homes/data';
import { SOCIETY_CAST, SOCIETY_INTERIORS, WADERS_REST, type SocietyDeps, type SocietyPart } from '../config';

const N = Math.PI;
const E = Math.PI / 2;
const W = -Math.PI / 2;

/** Everyone in the Flock wears grey (the Flock keeps pink for the Lady only). */
const GREY = { shirt: 0x8d9096, pants: 0x6f7378, hat: 0x9aa0a8 } as const;

/** Where the Flock stands about, in the ring and round the camp. */
const CX = WADERS_REST.circle.x;
const CZ = WADERS_REST.circle.z;
const RING_R = 6;

/** Facing from (x, z) toward the Standing Lady. */
function towardLady(x: number, z: number): number {
  return Math.atan2(WADERS_REST.lady.x - x, WADERS_REST.lady.z - z);
}

/** Five Flock members on the circle's ring, facing the Lady, with bubbles of their own. */
const RING_FIVE: readonly { name: string; bubble: string; angle: number }[] = [
  { name: 'Brother Crake', bubble: 'Nine cups owed by me. Eleven if you count the one I spilled on Thursday.', angle: -80 },
  { name: 'Sister Avocet', bubble: 'Balance is not standing still. It is standing still with feelings.', angle: -40 },
  { name: 'Sister Spoonbill', bubble: 'I was told the Lady is a flamingo. I was told that by a flamingo. It did not look at me.', angle: 0 },
  { name: 'Brother Snipe', bubble: 'If you hop, it is a prayer. If you walk, it is a shortcut. Walk in the shade.', angle: 40 },
  { name: 'Sister Rail', bubble: 'Two legs are for sitting, and sitting is for Tuesday, and it is not Tuesday.', angle: 80 },
];

const ringPose = (angleDeg: number): { x: number; z: number; yaw: number } => {
  const a = (angleDeg * Math.PI) / 180;
  const x = CX + RING_R * Math.sin(a);
  const z = CZ - RING_R * Math.cos(a);
  return { x, z, yaw: towardLady(x, z) };
};

/** The Flock's ambient people (one-leg unless said otherwise). Exported for the placement test. */
export const FLOCK_PEOPLE: readonly AmbientGnomeDef[] = [
  {
    id: 'flock-saxifrage', name: SOCIETY_CAST.saxifrage, x: WADERS_REST.saxifrage.x, z: WADERS_REST.saxifrage.z,
    yaw: WADERS_REST.saxifrage.yaw, idle: 'one-leg',
    look: { ...GREY, hat: 0xb8b8c0, beard: 0xd8d8dc },
    bubble: 'Stand with me. Not both feet. One is plenty, so it is stood.',
  },
  {
    id: 'flock-sedge', name: SOCIETY_CAST.sedge, x: WADERS_REST.teaUrn.x + 2, z: WADERS_REST.teaUrn.z - 2, yaw: E, idle: 'one-leg',
    look: { ...GREY },
    bubble: 'A wobble is a thought. A thought is a cup. You look thoughtful.',
  },
  {
    id: 'flock-bulrush', name: SOCIETY_CAST.bulrush, x: WADERS_REST.washingLine.x, z: WADERS_REST.washingLine.z - 2, yaw: N,
    idle: 'hands-on-hips', look: { ...GREY },
    bubble: 'Grey, grey, grey, grey... who did this sock?',
  },
  {
    id: 'flock-plover', name: SOCIETY_CAST.plover, x: WADERS_REST.rotaBoard.x + 2, z: WADERS_REST.rotaBoard.z + 2, yaw: N,
    idle: 'read', look: { ...GREY },
    bubble: 'Tuesday says no sitting. Tuesday is very firm.',
  },
  {
    id: 'flock-godwit', name: SOCIETY_CAST.godwit, x: CX - 8, z: CZ - 7, yaw: E, idle: 'stretch',
    look: { ...GREY },
    bubble: 'I wobbled. Twice. I owe the Flock nine cups.',
  },
  {
    id: 'flock-pipit', name: SOCIETY_CAST.pipit, x: CX + 2, z: CZ + 1.5, yaw: N, idle: 'one-leg',
    look: { ...GREY },
    bubble: 'Which leg? Either? Which either?',
  },
  ...RING_FIVE.map((m, i): AmbientGnomeDef => {
    const p = ringPose(m.angle);
    return {
      id: `flock-ring-${i}`, name: m.name, x: p.x, z: p.z, yaw: p.yaw, idle: 'one-leg',
      look: { ...GREY }, bubble: m.bubble,
    };
  }),
];

const REED_RANGE = 80;
const HUM_RANGE = 25;
const TUESDAY_RANGE = 60;
const TUESDAY = 2;

/** A random point on the edge of the camp site. */
function siteEdgePoint(out: { x: number; z: number }): void {
  const s = WADERS_REST.site;
  const u = Math.random();
  switch (Math.floor(Math.random() * 4)) {
    case 0: out.x = s.minX + (s.maxX - s.minX) * u; out.z = s.minZ; break;
    case 1: out.x = s.minX + (s.maxX - s.minX) * u; out.z = s.maxZ; break;
    case 2: out.x = s.minX; out.z = s.minZ + (s.maxZ - s.minZ) * u; break;
    default: out.x = s.maxX; out.z = s.minZ + (s.maxZ - s.minZ) * u; break;
  }
}

export function installFlockLife(deps: SocietyDeps): SocietyPart {
  const people = createAmbientGnomes(deps.scene, FLOCK_PEOPLE);
  const scratch = { x: 0, z: 0 };

  // The home: Saxifrage's tent is walk-in (the big tent interior).
  const saxi = homeOf('saxifrage');
  if (saxi) {
    registerHome({
      ...saxi,
      door: [WADERS_REST.tentDoor.x, WADERS_REST.tentDoor.z, WADERS_REST.tentDoor.yaw],
      interiorId: SOCIETY_INTERIORS.tent,
    });
  }

  let reedT = 7 + Math.random() * 5;
  let humT = 12 + Math.random() * 4;
  let nearCamp = false;

  const centre = WADERS_REST.centre;

  return {
    update(dt: number): void {
      const p = deps.player;
      const dCentre = Math.hypot(p.x - centre.x, p.z - centre.z);
      if (dCentre > 300) return;

      people.update(dt, p.x, p.z);

      // Tuesday: the first time the player comes near the camp this session.
      if (dCentre <= TUESDAY_RANGE && !nearCamp) {
        nearCamp = true;
        if (new Date().getDay() === TUESDAY) {
          deps.hud.toast('It is Tuesday at Wader\'s Rest. Nobody is sitting. Do not start.', 4500);
        }
      }

      if (dCentre <= REED_RANGE) {
        reedT -= dt;
        if (reedT <= 0) {
          reedT = 7 + Math.random() * 5;
          siteEdgePoint(scratch);
          playAt('reed-rustle', scratch);
        }
      }

      const dCircle = Math.hypot(p.x - CX, p.z - CZ);
      if (dCircle <= HUM_RANGE) {
        humT -= dt;
        if (humT <= 0) {
          humT = 12 + Math.random() * 4;
          playAt('flock-hum', { x: CX, z: CZ });
        }
      }
    },
  };
}
