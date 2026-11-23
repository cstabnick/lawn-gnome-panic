// Base building numbers (docs/design/dayg/crafting.md "Building pieces"). Game-side constants, like src/config.ts.
import type { ItemStack } from '../sim/types';
import type { ItemId } from '../sim/types';
import type { Tag } from '../items/defs';
import type { Cost, PieceDef, PieceKind } from './types';

export const PLOT = { tiles: 3, tile: 4, snap: 2, thickness: 0.4, inset: 0.25, flatTolerance: 0.3 } as const;
export const PLOT_SIZE = PLOT.tiles * PLOT.tile;      // 12 gm
export const BUILD_REACH = 3;                           // the aim point is this far ahead of the player, gm
export const BUILD_RANGE = 6;                           // build mode works within this margin around the plot, gm
export const BUILD_NOISE = 20;                          // noise radius when a piece goes up, gm
export const PUSH = { radius: 2.4, hpPerHatlessSunMinute: 1, doorBurstPushers: 3, doorBurstSeconds: 5 } as const;
export const SPIKE = { everySec: 1, reach: 2.2, damage: 0.5, wearPerHit: 2 } as const;
export const HIT = { hpPerDamage: 10 } as const;        // a weapon's damage x this = HP off a piece
export const REPAIR = { costShare: 1 / 3, seconds: 10 } as const;
export const DISMANTLE = { refundShare: 0.5, seconds: 8 } as const;
export const REINFORCE = { cost: [{ tag: 'PLANK', count: 3 }] as readonly Cost[], hp: 200, seconds: 30 } as const;
export const LOCK = { cost: [{ tag: 'IRON', count: 1 }, { tag: 'SPRING', count: 1 }] as readonly Cost[], tools: ['HAMMER'] as readonly Tag[], seconds: 30, key: 'brass-key' } as const;
export const LADDER_PULL_SECONDS = 2;
export const SAW_PLANKS = { input: { tag: 'TIMBER', count: 1 } as Cost, tool: 'SAW' as Tag, out: 'plank' as ItemId, outCount: 2, seconds: 30 } as const;
export const FIRE_RING = { burnHours: 2, seconds: 20 } as const;
export const CHEST_BULK = 30;
export const BED = { hatlessRadius: 15, sleepRate: 30, restRate: 10, restSunHours: 1 } as const;
export const SAVE = { prefix: 'dayg.base.v1.', lastSeedKey: 'dayg.base.last', debounceSec: 1 } as const;
export const BASE_DOM = { build: 'dayg-build', chest: 'dayg-chest' } as const;
/** The item a refund or an output of each cost tag becomes. */
export const TAG_ITEM: Partial<Record<Tag, ItemId>> = {
  PLANK: 'plank', NAIL: 'nails', HINGE: 'iron-hinge', BINDING: 'spider-silk', KINDLING: 'twig-bundle',
  MOSS: 'moss-clump', TIMBER: 'timber-log', STONE: 'stone-chunk', IRON: 'iron-bar', SPRING: 'scrap-gear',
};
const p = (kind: PieceKind, name: string, slot: PieceDef['slot'], prefab: string, cost: Cost[], tools: Tag[],
           hp: number, seconds: number, height: number, solid: boolean): PieceDef =>
  ({ kind, name, slot, prefab, cost, tools, hp, seconds, height, solid });
export const PIECES: Readonly<Record<PieceKind, PieceDef>> = {
  'plank-wall': p('plank-wall', 'Plank wall', 'edge', 'plank-wall', [{ tag: 'PLANK', count: 3 }, { tag: 'NAIL', count: 6 }], ['HAMMER'], 120, 45, 3.2, true),
  barricade: p('barricade', 'Barricade', 'edge', 'barricade', [{ tag: 'PLANK', count: 3 }, { tag: 'NAIL', count: 6 }], ['HAMMER'], 80, 45, 2.0, true),
  door: p('door', 'Door', 'edge', 'plank-door', [{ tag: 'PLANK', count: 6 }, { tag: 'HINGE', count: 2 }], ['HAMMER', 'SAW'], 150, 60, 3.2, true),
  ladder: p('ladder', 'Ladder', 'ladder', 'ladder', [{ tag: 'PLANK', count: 4 }, { tag: 'BINDING', count: 4 }], ['HAMMER'], 40, 30, 0, false),
  'spike-line': p('spike-line', 'Spike line', 'cell', 'spike-line', [{ tag: 'KINDLING', count: 3 }], ['CUT'], 60, 25, 0, false),
  chest: p('chest', 'Storage chest', 'cell', 'wooden-chest', [{ tag: 'PLANK', count: 4 }, { tag: 'NAIL', count: 4 }], ['HAMMER'], 100, 40, 0, false),
  bed: p('bed', 'Bed', 'cell', 'bedroll', [{ tag: 'MOSS', count: 4 }, { tag: 'BINDING', count: 2 }], [], 30, 20, 0, false),
  workbench: p('workbench', 'Workbench', 'cell', 'workbench', [{ tag: 'TIMBER', count: 2 }, { tag: 'NAIL', count: 4 }], ['HAMMER'], 100, 40, 0, false),
  'fire-ring': p('fire-ring', 'Fire ring', 'cell', 'fire-ring', [{ tag: 'STONE', count: 4 }], [], 60, 20, 0, false),
};
/** ?kit=build adds this to the start kit (items that do not fit are dropped; that is fine for testing). */
export const BUILD_KIT: readonly ItemStack[] = [
  { def: 'garden-mallet', count: 1, condition: 1 }, { def: 'hand-saw', count: 1, condition: 1 },
  { def: 'plank', count: 12, condition: 1 }, { def: 'nails', count: 24, condition: 1 },
  { def: 'iron-hinge', count: 2, condition: 1 }, { def: 'iron-bar', count: 1, condition: 1 },
  { def: 'scrap-gear', count: 1, condition: 1 }, { def: 'stone-chunk', count: 4, condition: 1 },
  { def: 'moss-clump', count: 4, condition: 1 }, { def: 'spider-silk', count: 6, condition: 1 },
];
