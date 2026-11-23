// Fishing: rods (upgrades) and baits sold at The Bent Pin. Data only (docs/roadmaps/gta-fishing.md).
import type { BaitDef, RodDef } from './types';

export const RODS: readonly RodDef[] = [
  {
    id: 'twig', name: 'Bent-Pin Twig Rod', tier: 0, price: 20, prefab: 'fishing-rod', tip: [0, 0.83, -0.068],
    castRange: 9, strength: 1, reelSpeed: 2.4, blurb: 'A hazel twig, a bit of string and a bent pin. Every angler starts here.',
  },
  {
    id: 'cane', name: 'Split-Cane Rod', tier: 1, price: 150, prefab: 'fish-rod-cane', tip: [0, 0.95, 0],
    castRange: 12, strength: 1.25, reelSpeed: 2.8, blurb: 'Springy, honey-coloured cane. Casts further and bends without a creak.',
  },
  {
    id: 'brass', name: 'Brass-Reel Rod', tier: 2, price: 450, prefab: 'fish-rod-brass', tip: [0, 0.95, 0],
    castRange: 15, strength: 1.55, reelSpeed: 3.3, blurb: 'A proper brass reel that clicks like a cricket. Holds the big canal fish.',
  },
  {
    id: 'moonline', name: 'Moonline Rod', tier: 3, price: 1200, prefab: 'fish-rod-moonline', tip: [0, 0.95, 0],
    castRange: 18, strength: 1.9, reelSpeed: 3.8, blurb: 'Silver line that glows at night. Wenna says it was spun from a moonbeam; it was not.',
  },
];

export const BAITS: readonly BaitDef[] = [
  {
    id: 'dough', name: 'Dough Ball', prefab: 'bait-dough', emoji: '🍞', price: 0, pack: 0, consumed: false,
    biteSpeed: 1, rareBonus: 1, blurb: 'Free with every rod. Everything eats bread, eventually.',
  },
  {
    id: 'cheese-rind', name: 'Cheese Rind', prefab: 'bait-cheese-rind', emoji: '🧀', price: 12, pack: 10, consumed: true,
    biteSpeed: 0.85, rareBonus: 1.2, blurb: 'Smelly. Carp, catfish and eels cannot resist it.',
  },
  {
    id: 'acorn-crumb', name: 'Acorn Crumb', prefab: 'bait-acorn-crumb', emoji: '🌰', price: 8, pack: 10, consumed: true,
    biteSpeed: 0.7, rareBonus: 1, blurb: 'Quick bites from small canal fish. Do not tell the squirrels.',
  },
  {
    id: 'sock-fly', name: 'Sock-Fluff Fly', prefab: 'bait-sock-fly', emoji: '🪰', price: 20, pack: 8, consumed: true,
    biteSpeed: 0.9, rareBonus: 1.3, blurb: 'Tied from the fluff in a sock drawer. River trout think it is a mayfly.',
  },
  {
    id: 'glitter-spinner', name: 'Glitter Spinner', prefab: 'bait-glitter-spinner', emoji: '✨', price: 90, pack: 1,
    consumed: false, biteSpeed: 1.1, rareBonus: 1.5, blurb: 'A spinning lure that is never used up. Pike and bass chase anything shiny.',
  },
  {
    id: 'moon-jig', name: 'Moon Jig', prefab: 'bait-moon-jig', emoji: '🌙', price: 60, pack: 3, consumed: true,
    biteSpeed: 1.3, rareBonus: 3, blurb: 'A glowing jig for the deep spots. Slow bites, but the big ones come to it.',
  },
];

export function rodById(id: string): RodDef | undefined {
  return RODS.find((r) => r.id === id);
}

export function baitById(id: string): BaitDef | undefined {
  return BAITS.find((b) => b.id === id);
}

/** The free bait every rod comes with. */
export const DEFAULT_BAIT = 'dough';
