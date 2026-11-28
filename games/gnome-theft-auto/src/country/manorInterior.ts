// Brassknock Manor's interior (E16 issue C3): the tasting hall, entered by the BACK door (E05 defineInterior at import
// time), and the homes of the Countess, Chicory and Chard (E10 registerHome). Called once by index.ts installCountryside.
import { getPrefab } from '@lawn/prefabs';
import { defineInterior } from '../interiors/registry';
import type { InteriorKit, InteriorTheme } from '../interiors/types';
import { homeOf, registerHome } from '../homes/data';
import { MANOR } from './types';

const PI = Math.PI;

/** Cream walls, oxblood trim, a warm candle light. */
const HALL_THEME: InteriorTheme = { floor: 0x6b4a3a, wall: 0xeadcc2, trim: 0x6e1e2a, ceiling: 0xf4ecdc, light: 0xffe6c0 };
const STONE = 0x8a7f72;
const SOOT = 0x120d0b;

/** Prefabs added by another worker this epic: skipped (not thrown) while missing. */
function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: Parameters<InteriorKit['put']>[4]): void {
  if (getPrefab(id)) kit.put(id, x, z, yaw, opts);
}

function say(name: string, line: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
  }
}

/**
 * A fireplace in a wall: the edge point (ex, ez) is on the inner face of the wall, (ix, iz) points into the room.
 * A stone surround stands against the wall and a dark opening sits in front of it.
 */
function hearth(kit: InteriorKit, ex: number, ez: number, ix: number, iz: number, lit = false): void {
  const across = ix !== 0; // a wall along z (west or east) runs across x
  const sx = ex + ix * 0.4;
  const sz = ez + iz * 0.4;
  kit.block(across ? 0.8 : 2.0, 1.1, across ? 2.0 : 0.8, sx, sz, { color: STONE });
  const ox = ex + ix * 0.86;
  const oz = ez + iz * 0.86;
  kit.block(across ? 0.04 : 1.2, 0.6, across ? 1.2 : 0.04, ox, oz, { y: 0.25, color: SOOT, solid: false });
  if (lit) putIf(kit, 'campfire', ex + ix * 1.4, ez + iz * 1.4, 0, { solid: false });
}

defineInterior({
  id: MANOR.interior,
  name: 'Brassknock Manor',
  // The BACK door: the south wall of the house, the spot 1.5 m outside it, facing south.
  door: { x: -1150, z: 41.5, yaw: 0 },
  exit: { x: -1150, z: 43, yaw: 0 },
  size: { w: 26, d: 16, h: 6 },
  theme: HALL_THEME,
  prompt: 'Go in round the back',
  build(kit) {
    kit.room();
    kit.door(0, 8, PI);

    // The tasting hall: a long rug, the tasting table and two urns.
    kit.block(16, 0.02, 3.4, 0, -1, { y: 0.02, color: 0x6e1e2a, solid: false });
    putIf(kit, 'tasting-table', 0, -1, 0);
    putIf(kit, 'manor-urn', -4.5, -2.6, 0);
    putIf(kit, 'manor-urn', 4.5, -2.6, 0);
    kit.spot({ id: 'manor-grape-dew', x: 1.6, z: 0.4, prompt: 'Admire the grape-dew', run: () => say('Brassknock Manor', 'Brass caps, thimble glasses. Chicory says the cap is the only part that is for show.') });

    // Seven hearths: three on the west wall (the Countess lights the middle one), two on the south wall, two on the north.
    hearth(kit, -13, -5, 1, 0);
    hearth(kit, -13, 0, 1, 0, true);
    hearth(kit, -13, 5, 1, 0);
    hearth(kit, -9, 8, 0, -1);
    hearth(kit, 9, 8, 0, -1);
    hearth(kit, -11, -8, 0, 1);
    hearth(kit, -1, -8, 0, 1);

    // Three windows on the north wall, over the vines.
    kit.window(3, -7.95, 0, 1.6, 1.8, 1.5);
    kit.window(7, -7.95, 0, 1.6, 1.8, 1.5);
    kit.window(11, -7.95, 0, 1.6, 1.8, 1.5);

    // Framed portraits, with dry captions.
    kit.sign('THE FIRST BRASSKNOCK\nWHO PLANTED A VINE', -4.5, 2.4, 7.95, PI, { w: 1.8, h: 1.2, bg: 0x5a3a2a, fg: 0xf4ecdc });
    kit.sign('THE SECOND BRASSKNOCK\nWHO SIGNED THE CHARTER', 4.5, 2.4, 7.95, PI, { w: 1.8, h: 1.2, bg: 0x5a3a2a, fg: 0xf4ecdc });
    kit.sign('THE COUNTESS\nWHO SMILES AT EVERYONE\nTHE SAME DISTANCE', -6, 3.6, -7.95, 0, { w: 2.0, h: 1.3, bg: 0x6e1e2a, fg: 0xf4ecdc });

    // A bookcase under the Countess's portrait.
    putIf(kit, 'bookshelf', -6, -7.1, 0, { size: 2.2 });

    // The footman, by the back door.
    kit.npc({
      id: 'brassknock-footman', name: 'Footman Pell', x: 3.2, z: 5.6, yaw: PI,
      look: { hat: 0x1d1d1d, shirt: 0x2b2b2b, beard: 0xd9d4c8 },
      line: 'Round the back was correct. The knocker is for the charter. Nobody has used it since.',
    });

    // A corridor of shut doors along the east wall.
    const doors: { z: number; plate: string; line: string }[] = [
      { z: -5, plate: 'MORNING ROOM\n(UNUSED)', line: 'Shut. The plate says MORNING ROOM (UNUSED).' },
      { z: -1.5, plate: 'SECOND\nMORNING ROOM', line: 'Shut. The plate says SECOND MORNING ROOM.' },
      { z: 2, plate: 'LEDGERS', line: 'Shut. Somebody has written LEDGERS on the plate and then rubbed it out, not very hard.' },
    ];
    for (const d of doors) {
      kit.block(0.2, 2.2, 1.4, 12.85, d.z, { color: 0x4a2a22 });
      kit.sign(d.plate, 12.7, 1.7, d.z, -PI / 2, { w: 0.9, h: 0.5, bg: 0xf4ecdc, fg: 0x3a1a16 });
      kit.spot({ id: `manor-door-${d.z}`, x: 11.4, z: d.z, prompt: 'Try the door', run: () => say('Brassknock Manor', d.line) });
    }
  },
});

/** Registers the E10 home doors for wisteria, chicory and chard. Called once by index.ts installCountryside. */
export function registerCountryHomes(): void {
  const wisteria = homeOf('wisteria');
  if (wisteria) registerHome({ ...wisteria, door: [MANOR.door.x, 41.5, 0], kind: 'interior', interiorId: MANOR.interior });
  // The lodge's front door, facing south.
  const chicory = homeOf('chicory');
  if (chicory) registerHome({ ...chicory, door: [-1172, -73.5, 0] });
  // The caravan door on its east side.
  const chard = homeOf('chard');
  if (chard) registerHome({ ...chard, door: [-309, -102, PI / 2] });
}
