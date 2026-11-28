import type { GsrLevelId } from '../levels/loader';

export type ShopCategory = 'trail' | 'ride';

export interface ShopCosmeticItem {
  id: string;
  areaId: GsrLevelId;
  name: string;
  category: ShopCategory;
  cost: number;
  color: string;
  description: string;
  requiresTier9Clear?: boolean;
}

export const SHOP_ITEMS: readonly ShopCosmeticItem[] = [
  {
    id: 'ivory-notes',
    areaId: 'velvet-keys',
    name: 'Ivory Note Trail',
    category: 'trail',
    cost: 400,
    color: '#ffd740',
    description: 'Golden Dorian musical-note sparks & warm jazz ribbon trail.',
  },
  {
    id: 'solar-flame',
    areaId: 'bongo-basin',
    name: 'Solar Flame Skates',
    category: 'ride',
    cost: 600,
    color: '#ff6d00',
    description: 'Blazing amber inline wheels forged on Bongo Basin asphalt.',
  },
  {
    id: 'molten-acid',
    areaId: 'chrome-kiln',
    name: 'Molten Acid Trail',
    category: 'trail',
    cost: 800,
    color: '#76ff03',
    description: '900° lime-and-ember ceramic glaze boost particles.',
  },
  {
    id: 'prism-mist',
    areaId: 'neon-birdbath',
    name: 'Prism Mist Skates',
    category: 'ride',
    cost: 1000,
    color: '#00e5ff',
    description: 'Pressurized cyan mist bearings that shimmer above clouds.',
  },
  {
    id: 'pixel-8bit',
    areaId: 'mulch-alley',
    name: '8-Bit Pixel Trail',
    category: 'trail',
    cost: 1200,
    color: '#ff5252',
    description: 'Arcade-cabinet red & cyan chiptune boost bursts.',
  },
  {
    id: 'vapor-chrome',
    areaId: 'tupperware-mall',
    name: 'Vaporwave Chrome Skates',
    category: 'ride',
    cost: 1400,
    color: '#ff80ab',
    description: 'Pastel coral-chrome inline skates straight from Sky-Mall 97.',
  },
  {
    id: 'golden-bylaw',
    areaId: 'hoa-citadel',
    name: 'Golden Bylaw Aura',
    category: 'trail',
    cost: 1600,
    color: '#ffd740',
    description: 'Gold & neon-lawn sparks—100% non-compliant with Section 12-B.',
  },
  {
    id: 'subsoil-dub',
    areaId: 'subsoil-relay',
    name: 'Subsoil Dub-Ring Trail',
    category: 'trail',
    cost: 1800,
    color: '#b388ff',
    description: 'Deep violet 108.0 FM sub-bass shockwave particles.',
  },
  {
    id: 'aether-board',
    areaId: 'zero-hz-zenith',
    name: 'The Aether Board',
    category: 'ride',
    cost: 0,
    color: '#ffd740',
    description: 'Hovering cel-shaded Aether Board. Unlocked by beating Tier 9!',
    requiresTier9Clear: true,
  },
];

export function getShopItemById(id: string | null | undefined): ShopCosmeticItem | undefined {
  return SHOP_ITEMS.find((it) => it.id === id);
}

export function getShopItemForArea(areaId: GsrLevelId): ShopCosmeticItem {
  return SHOP_ITEMS.find((it) => it.areaId === areaId) ?? SHOP_ITEMS[0]!;
}
