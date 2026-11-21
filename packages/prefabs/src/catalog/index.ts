// Every catalog file, in gallery order. Add a new file here and nowhere else.
// Order matters for emoji: when several prefabs list the same emoji, the earliest is that emoji's default.
import type { PrefabDef } from '../types';
import { WEAPONS } from './weapons';
import { ARMOR } from './armor';
import { CONSUMABLES } from './consumables';
import { MATERIALS } from './materials';
import { TRINKETS } from './trinkets';
import { DOCUMENTS } from './documents';
import { TOOLS } from './tools';
import { FURNITURE } from './furniture';
import { PROPS } from './props';
import { BOWLING } from './bowling';
import { CASINO } from './casino';
import { GNOMEOKEMON } from './gnomeokemon';
import { MOWERS } from './mowers';
import { CRITTERS } from './critters';
import { GOLF } from './golf';
import { GOLF_CART } from './golf-cart';
import { FRONT } from './front';
import { FRONT_WEAPONS } from './front-weapons';

import { SAMPLE_3D_SCENERY } from './sample-3d-scenery';
import { SAMPLE_3D_WEAPONS } from './sample-3d-weapons';
import { GNAFT } from './gnaft';
import { LAWN_PRIX } from './lawn-prix';
import { GNOME_GOLF_PROPS } from './gnome-golf-props';
import { AETHER_BOARD } from './aether-board';
import { GIANT_PUP } from './giant-pup';
import { TRIBUTE_SCHEDULE } from './tribute-schedule';
import { GNOMEOKEMON_WORLD } from './gnomeokemon-world';
import { PARAGNORMAL } from './paragnormal';
import { GNOME_COMPANY } from './gnome-company';
import { GNOMYLPICS } from './gnomylpics';
import { GNOME_BOWLING_LANE } from './gnome-bowling-lane';
import { GNOME_BLACKJACK } from './gnome-blackjack';
import { GNOMES_OF_GNOMOMIA } from './gnomes-of-gnomomia';
import { GNOME_FRONT_BATTLE } from './gnome-front-battle';
import { GNOME_PARTY } from './gnome-party';
import { PEAK_CLIMB } from './peak-climb';
import { GNOME_THEFT_AUTO } from './gnome-theft-auto';
import { GTA_CRACKED } from './gta-cracked';
import { GTA_FACES } from './gta-faces';
import { GTA_WORLD } from './gta-world';
import { GTA_WORLD_GREEN } from './gta-world-green';
import { GTA_GUNS_AIR } from './gta-guns-air';
import { KITCHEN } from './kitchen';
import { GNOME_JAM } from './gnome-jam';
import { GNOMEOKEMON_LAB } from './gnomeokemon-lab';
import { SNIGMS } from './snigms';

export const CATALOG: readonly PrefabDef[] = [
  ...WEAPONS, ...ARMOR, ...CONSUMABLES, ...MATERIALS, ...TRINKETS, ...DOCUMENTS, ...TOOLS, ...FURNITURE, ...PROPS, ...BOWLING, ...CASINO, ...GNOMEOKEMON,
  ...MOWERS, ...CRITTERS, ...GOLF, ...GOLF_CART, ...FRONT, ...FRONT_WEAPONS,
  ...(SAMPLE_3D_SCENERY), ...(SAMPLE_3D_WEAPONS), ...(GNAFT), ...(LAWN_PRIX), ...(GNOME_GOLF_PROPS), ...(AETHER_BOARD), ...(GIANT_PUP), ...(TRIBUTE_SCHEDULE), ...(GNOMEOKEMON_WORLD), ...(PARAGNORMAL), ...(GNOME_COMPANY), ...(GNOMYLPICS), ...(GNOME_BOWLING_LANE), ...(GNOME_BLACKJACK), ...(GNOMES_OF_GNOMOMIA), ...(GNOME_FRONT_BATTLE), ...(GNOME_PARTY), ...(PEAK_CLIMB), ...(GNOME_THEFT_AUTO), ...(GTA_WORLD), ...(GTA_CRACKED), ...GTA_FACES, ...(GTA_WORLD_GREEN), ...(GTA_GUNS_AIR), ...KITCHEN, ...GNOME_JAM, ...GNOMEOKEMON_LAB, ...SNIGMS,
];
