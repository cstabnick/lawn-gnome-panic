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

export const CATALOG: readonly PrefabDef[] = [
  ...WEAPONS, ...ARMOR, ...CONSUMABLES, ...MATERIALS, ...TRINKETS, ...DOCUMENTS, ...TOOLS, ...FURNITURE, ...PROPS, ...BOWLING, ...CASINO, ...GNOMEOKEMON,
  ...MOWERS, ...CRITTERS, ...GOLF, ...GOLF_CART, ...FRONT, ...FRONT_WEAPONS,
];
