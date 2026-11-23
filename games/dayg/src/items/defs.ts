import type { ItemId, Resource } from '../sim/types';
export type Tag =
  | 'FOOD' | 'DRINK' | 'HOLD_LIQUID' | 'COOK_VESSEL' | 'MEDICINE' | 'SALT' | 'SPIRIT' | 'ADHESIVE' | 'GLAZE'
  | 'FUEL' | 'KINDLING' | 'TINDER' | 'FIRESTARTER' | 'LIGHT' | 'CUT' | 'PRY' | 'DIG' | 'BLUNT' | 'PIERCE'
  | 'ROPE' | 'LADDER' | 'BINDING' | 'CONTAINER' | 'WEAR' | 'VALUABLE' | 'MATERIAL' | 'MOSS';
export type WornSlot = 'head' | 'back' | 'neck' | 'body';
export interface ItemDef {
  id: ItemId; prefab: string; name: string; tags: readonly Tag[]; resource: Resource;
  weight: number; bulk: number; maxCondition: number; stack: number;   // kg, litres, uses, max per stack
  props?: { damage?: number; reach?: number; capacity?: number; liquidCap?: number; food?: number; water?: number;
            warmth?: number; armour?: number; burnHours?: number; light?: number };
  wear?: WornSlot;
}
const d = (id: string, name: string, resource: Resource, tags: Tag[], weight: number, bulk: number, stack: number,
           props: ItemDef['props'] = {}, extra: Partial<ItemDef> = {}): ItemDef =>
  ({ id, prefab: id, name, resource, tags, weight, bulk, stack, maxCondition: 1, props, ...extra });
export const ITEM_LIST: readonly ItemDef[] = [
  d('bread-loaf', 'Bread loaf', 'food', ['FOOD'], 0.3, 1, 4, { food: 20 }),
  d('crab-apple', 'Crab apple', 'food', ['FOOD'], 0.1, 0.3, 8, { food: 8 }),
  d('blackberry', 'Blackberry', 'food', ['FOOD'], 0.05, 0.1, 12, { food: 4 }),
  d('cheese-wedge', 'Cheese wedge', 'food', ['FOOD'], 0.2, 0.5, 4, { food: 15 }),
  d('red-mushroom', 'Red mushroom', 'food', ['FOOD'], 0.1, 0.3, 8, { food: 6 }),
  d('seed-cake', 'Seed cake', 'food', ['FOOD'], 0.2, 0.5, 4, { food: 18 }),
  d('spigot-water', 'Bottle of water', 'water', ['DRINK'], 0.5, 0.5, 4, { water: 30 }),
  d('tin-pail', 'Tin pail', 'tools', ['HOLD_LIQUID', 'COOK_VESSEL'], 0.4, 2, 1, { liquidCap: 2 }),
  d('clay-jar', 'Clay jar', 'tools', ['HOLD_LIQUID'], 0.5, 1, 1, { liquidCap: 1 }),
  d('salt-pinch', 'Pinch of salt', 'medicine', ['MEDICINE', 'SALT'], 0.05, 0.1, 10),
  d('stout-tankard', 'Tankard of stout', 'medicine', ['SPIRIT'], 0.4, 0.5, 2),
  d('slug-slime', 'Slug slime', 'medicine', ['ADHESIVE'], 0.1, 0.2, 6),
  d('glaze-pot', 'Glaze pot', 'medicine', ['GLAZE', 'MEDICINE'], 0.3, 0.4, 2),
  d('twig-bundle', 'Twig bundle', 'fuel', ['FUEL', 'KINDLING', 'TINDER'], 0.3, 1, 6, { burnHours: 1 }),
  d('timber-log', 'Timber log', 'fuel', ['FUEL'], 1.2, 3, 2, { burnHours: 3 }),
  d('candle', 'Candle', 'fuel', ['LIGHT', 'FUEL'], 0.1, 0.2, 6, { light: 6, burnHours: 0.5 }),
  d('flint-striker', 'Flint striker', 'tools', ['FIRESTARTER'], 0.1, 0.1, 1, {}, { maxCondition: 30 }),
  d('torch', 'Torch', 'tools', ['LIGHT', 'FIRESTARTER', 'BLUNT'], 0.4, 1, 1, { damage: 0.6, reach: 1.2, light: 10 }),
  d('old-trowel', 'Old trowel', 'tools', ['DIG', 'PRY', 'BLUNT'], 0.5, 1, 1, { damage: 1, reach: 1.1 }),
  d('thorn-dagger', 'Thorn dagger', 'tools', ['CUT', 'PIERCE'], 0.2, 0.4, 1, { damage: 1.2, reach: 0.9 }),
  d('acorn-club', 'Acorn club', 'tools', ['BLUNT'], 0.8, 1.5, 1, { damage: 1.6, reach: 1.3 }),
  d('hand-fork', 'Hand fork', 'tools', ['PRY', 'PIERCE', 'DIG'], 0.5, 1, 1, { damage: 1.1, reach: 1.2 }),
  d('rope-coil', 'Rope coil', 'tools', ['ROPE', 'BINDING'], 0.8, 2, 1),
  d('ladder', 'Ladder', 'tools', ['LADDER'], 2.5, 6, 1),
  d('spider-silk', 'Spider silk', 'materials', ['BINDING', 'MATERIAL'], 0.05, 0.2, 10),
  d('stone-chunk', 'Stone chunk', 'materials', ['MATERIAL'], 0.6, 0.5, 6),
  d('clay-chunk', 'Clay chunk', 'materials', ['MATERIAL'], 0.5, 0.5, 6),
  d('moss-clump', 'Moss clump', 'materials', ['MATERIAL', 'MOSS'], 0.1, 0.3, 10),
  d('button', 'Button', 'valuables', ['VALUABLE'], 0.02, 0.05, 20),
  d('gold-coins', 'Gold coins', 'valuables', ['VALUABLE'], 0.1, 0.1, 10),
  d('loot-sack', 'Loot sack', 'tools', ['CONTAINER', 'WEAR'], 0.3, 1, 1, { capacity: 12 }, { wear: 'back' }),
  d('wool-scarf', 'Wool scarf', 'materials', ['WEAR'], 0.1, 0.3, 1, { warmth: 10 }, { wear: 'neck' }),
  d('bucket-helm', 'Bucket helm', 'tools', ['WEAR'], 0.4, 1, 1, { armour: 0.3 }, { wear: 'head' }),
];
export const ITEMS: Readonly<Record<ItemId, ItemDef>> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]));
export function getItem(id: ItemId): ItemDef { const i = ITEMS[id]; if (!i) throw new Error(`unknown item ${id}`); return i; }
export function hasTag(id: ItemId, tag: Tag): boolean { return getItem(id).tags.includes(tag); }
export function itemsWith(resource: Resource): ItemDef[] { return ITEM_LIST.filter((i) => i.resource === resource); }
