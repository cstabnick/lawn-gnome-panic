// Pack raid-stations: the reforging anvils beside the smiths of Sodbury, Clippings, Flintdelve and Last Tuft (src/crafting.ts).
import type { ContentPack, WorldObjectSpec } from '../../config';

const EXAMINE = 'A smith\'s second anvil, kept for horn-marked gear. The notch in its horn matches the one on the straps.';

const anvil = (id: string, zone: WorldObjectSpec['zone'], x: number, z: number): [string, WorldObjectSpec] => [
  id,
  { id, zone, name: 'Reforging anvil', x, z, model: 'anvil', verb: 'Reforge', examine: EXAMINE, yaw: 0 },
];

export const PACK: ContentPack = {
  id: 'raid-stations',
  objects: Object.fromEntries([
    anvil('raid-anvil-sodbury', 'cloverfield', 10.5, 6),
    anvil('raid-anvil-clippings', 'hedgewood', 36.5, 44),
    anvil('raid-anvil-flintdelve', 'rockery', 8.5, 24),
    anvil('raid-anvil-last-tuft', 'verge', -3.5, 91),
  ]),
};
