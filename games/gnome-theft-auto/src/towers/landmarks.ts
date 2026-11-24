// Downtown Turfton's named towers: who owns each one and how it looks. One row per landmark; the tower is found by the
// block it stands in and its slot there (world.ts placeTowers), never by build order. Each id has a lore entry at
// docs/lore/entries/apocrypha/<id>.md. Thorne Tower is built by world.ts (buildThorneTower) and is not listed here.
import { FACADE } from './facadeAtlas';
import { SIGN } from './signAtlas';
import type { LandmarkTower, TowerSpec } from './types';

export const LANDMARKS: readonly LandmarkTower[] = [
  {
    id: 'kiln-shield-plaza', name: 'Kiln-Shield Plaza', owner: 'Kiln-Shield Insurance', blockX: -90, blockZ: -30, slot: 0, poi: true,
    style: {
      silhouette: 'taper', facade: FACADE.DECO_CREAM, facadeTint: 0xf2f7f6, trim: 0x00695c, band: 0x00897b, ribs: true,
      balconies: false, crown: 'crown-ring', accent: 0xc9d6d4, lobby: 'lobby', awning: 0x00897b, weathering: 'scaffold',
      sign: SIGN.KILN_SHIELD, mural: -1,
    },
  },
  {
    id: 'snail-mail-sorting-tower', name: 'Snail-Mail Sorting Tower', owner: 'Snail-Mail Express', blockX: -90, blockZ: -30, slot: 1, poi: false,
    style: {
      silhouette: 'setback', facade: FACADE.BRICK, facadeTint: 0xffffff, trim: 0xf2e4c6, band: 0x2c5e7a, ribs: false,
      balconies: false, crown: 'clock', accent: 0x2c5e7a, lobby: 'shops', awning: 0x2c5e7a, weathering: 'none',
      sign: SIGN.SNAIL_MAIL, mural: -1,
    },
  },
  {
    id: 'tattler-building', name: 'The Tattler Building', owner: 'The Turfton Tattler', blockX: -90, blockZ: 30, slot: 0, poi: true,
    style: {
      silhouette: 'box', facade: FACADE.BRICK_WEATHERED, facadeTint: 0xffffff, trim: 0xd8cbb0, band: 0, ribs: false,
      balconies: false, crown: 'water-tank', accent: 0x6b4a2e, lobby: 'shops', awning: 0x2f5d3a, weathering: 'stains',
      sign: SIGN.TATTLER, mural: SIGN.MURAL_MOWER,
    },
  },
  {
    id: 'acorn-cola-drum', name: 'The Acorn-Cola Drum', owner: 'Acorn-Cola', blockX: -90, blockZ: 30, slot: 1, poi: true,
    style: {
      silhouette: 'drum', facade: FACADE.CHECKER, facadeTint: 0xffffff, trim: 0xfafafa, band: 0xc62828, ribs: false,
      balconies: false, crown: 'crown-ring', accent: 0xc62828, lobby: 'lobby', awning: 0xc62828, weathering: 'none',
      sign: SIGN.ACORN_COLA, mural: -1,
    },
  },
  {
    id: 'razor-back-tower', name: 'Razor-Back Tower', owner: 'Razor-Back', blockX: -30, blockZ: -90, slot: 0, poi: false,
    style: {
      silhouette: 'slab', facade: FACADE.OBSIDIAN, facadeTint: 0xe8e8ec, trim: 0x1e1e22, band: 0xf05a24, ribs: true,
      balconies: false, crown: 'sail', accent: 0xf05a24, lobby: 'lobby', awning: 0xf05a24, weathering: 'none',
      sign: SIGN.RAZOR_BACK, mural: -1,
    },
  },
  {
    id: 'husky-blade-tower', name: 'Husky-Blade Tower', owner: 'Husky-Blade', blockX: -30, blockZ: -90, slot: 1, poi: false,
    style: {
      silhouette: 'box', facade: FACADE.BLUE_GLASS, facadeTint: 0xf4f8ff, trim: 0xc8d0d8, band: 0x1f6feb, ribs: false,
      balconies: false, crown: 'pyramid', accent: 0x1f6feb, lobby: 'lobby', awning: 0x1f6feb, weathering: 'none',
      sign: SIGN.HUSKY_BLADE, mural: -1,
    },
  },
  {
    id: 'stink-gro-step-garden', name: 'The Stink-Gro Step Garden', owner: 'Stink-Gro', blockX: -30, blockZ: 90, slot: 0, poi: true,
    style: {
      silhouette: 'ziggurat', facade: FACADE.TERRACOTTA, facadeTint: 0xffffff, trim: 0x7b1fa2, band: 0x76e01c, ribs: false,
      balconies: true, crown: 'water-tank', accent: 0x76e01c, lobby: 'shops', awning: 0x7b1fa2, weathering: 'none',
      sign: SIGN.STINK_GRO, mural: SIGN.MURAL_SLUG,
    },
  },
  {
    id: 'buck-iron-tower', name: 'Buck-Iron Tower', owner: 'Buck-Iron', blockX: 30, blockZ: -90, slot: 0, poi: true,
    style: {
      silhouette: 'setback', facade: FACADE.GREEN_GLASS, facadeTint: 0xffffff, trim: 0xd4af37, band: 0xd4af37, ribs: true,
      balconies: false, crown: 'spire', accent: 0xd4af37, lobby: 'lobby', awning: 0x2e7d32, weathering: 'none',
      sign: SIGN.BUCK_IRON, mural: -1,
    },
  },
  {
    id: 'pigeon-drop-depot', name: 'Pigeon-Drop Depot', owner: 'Pigeon-Drop Couriers', blockX: 30, blockZ: 90, slot: 0, poi: false,
    style: {
      silhouette: 'hblock', facade: FACADE.CONCRETE_BANDS, facadeTint: 0xf0f0f0, trim: 0x607d8b, band: 0xff7043, ribs: false,
      balconies: false, crown: 'helipad', accent: 0xff7043, lobby: 'shops', awning: 0xff7043, weathering: 'none',
      sign: SIGN.PIGEON_DROP, mural: -1,
    },
  },
  {
    id: 'turfton-fm-twin-masts', name: 'Turfton FM Twin Masts', owner: 'Turfton FM', blockX: 90, blockZ: -90, slot: 0, poi: true,
    style: {
      silhouette: 'twin', facade: FACADE.WHITE_GRID, facadeTint: 0xffffff, trim: 0x3a3d42, band: 0xffc400, ribs: false,
      balconies: false, crown: 'antenna-farm', accent: 0xffc400, lobby: 'lobby', awning: 0x3a3d42, weathering: 'none',
      sign: SIGN.TURFTON_FM, mural: -1,
    },
  },
  {
    id: 'pure-loam-glasshouse', name: 'The Pure-Loam Glasshouse', owner: 'Pure-Loam Co-op', blockX: 90, blockZ: 30, slot: 0, poi: false,
    style: {
      silhouette: 'setback', facade: FACADE.SANDSTONE, facadeTint: 0xfff6e6, trim: 0x6d4c2f, band: 0x5a8f3c, ribs: false,
      balconies: true, crown: 'garden', accent: 0x6d4c2f, lobby: 'shops', awning: 0x5a8f3c, weathering: 'none',
      sign: -1, mural: SIGN.MURAL_FLOWERS,
    },
  },
  {
    id: 'leaning-fizz', name: 'The Leaning Fizz', owner: 'Dandelion Fizz', blockX: 90, blockZ: 30, slot: 1, poi: true,
    style: {
      silhouette: 'lean', facade: FACADE.WHITE_GRID, facadeTint: 0xfff0a8, trim: 0x245c1b, band: 0xf7e61c, ribs: false,
      balconies: true, crown: 'sail', accent: 0xf7e61c, lobby: 'shops', awning: 0x245c1b, weathering: 'none',
      sign: SIGN.DANDELION_FIZZ, mural: -1,
    },
  },
  {
    id: 'first-kiln-bank', name: 'First Kiln Bank', owner: 'First Kiln Bank', blockX: 90, blockZ: 90, slot: 1, poi: true,
    style: {
      silhouette: 'taper', facade: FACADE.GOLD_MIRROR, facadeTint: 0xffffff, trim: 0x3b2f22, band: 0xc62828, ribs: true,
      balconies: false, crown: 'gnome-hat', accent: 0xc62828, lobby: 'lobby', awning: 0x3b2f22, weathering: 'none',
      sign: SIGN.FIRST_KILN_BANK, mural: SIGN.MURAL_HAT,
    },
  },
];

/** The landmark standing on this spec, if any. */
export function landmarkFor(spec: TowerSpec): LandmarkTower | undefined {
  return LANDMARKS.find((l) => l.blockX === spec.blockX && l.blockZ === spec.blockZ && l.slot === spec.slot);
}
