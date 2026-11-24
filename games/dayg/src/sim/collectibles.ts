// Unique Mossgrave collectibles & turn-in milestone unlocks.
import type { RegionId } from '../sim/types';

export interface CollectibleDef {
  id: string;
  name: string;
  region: RegionId;
  offset: [number, number];
  prefab: string;
  blurb: string;
}

export const COLLECTIBLES: readonly CollectibleDef[] = [
  { id: 'col-brass-key', name: 'Sexton’s Brass Key', region: 'gate-roof', offset: [12, 6], prefab: 'brass-key', blurb: 'Opens nothing now, but gleams like pre-breakout gold.' },
  { id: 'col-porcelain-owl', name: 'Porcelain Owl', region: 'forecourt', offset: [16, -12], prefab: 'flower-pot', blurb: 'A prized mantel ornament from the Gatehouse.' },
  { id: 'col-tin-horn', name: 'Verge Scout Horn', region: 'verge-path', offset: [-12, 4], prefab: 'horn', blurb: 'Used to signal shifts across the iron railings.' },
  { id: 'col-copper-gear', name: 'Clockwork Escapement', region: 'bin-corner', offset: [6, 6], prefab: 'scrap-gear', blurb: 'Precision brass gear from the cemetery sundial.' },
  { id: 'col-silver-trowel', name: 'Guildmaster Trowel', region: 'masons-corner', offset: [-8, -6], prefab: 'old-trowel', blurb: 'Engraved with the Masons’ compass mark.' },
  { id: 'col-painted-mug', name: 'Taproom Tankard', region: 'the-tap', offset: [-6, -6], prefab: 'stout-tankard', blurb: 'Stamped "Best Cider in Fescue, 1994".' },
  { id: 'col-glass-lantern', name: 'Amber Storm Lantern', region: 'ivy-rows', offset: [-10, -8], prefab: 'lantern', blurb: 'Its amber glass still warms the fog.' },
  { id: 'col-ivory-dice', name: 'Gnomecino Pair', region: 'leaning-rows', offset: [10, -6], prefab: 'gold-coins', blurb: 'Lucky loaded dice carried by a traveling tinker.' },
  { id: 'col-sunken-compass', name: 'Sunken Brass Compass', region: 'the-sinks', offset: [-8, 10], prefab: 'gnomeps', blurb: 'Always points toward the Lychgate.' },
  { id: 'col-angel-feather', name: 'Carved Stone Feather', region: 'angel-square', offset: [10, 10], prefab: 'stone-chunk', blurb: 'Chipped from the great monument in the square.' },
  { id: 'col-child-pinwheel', name: 'Tin Pinwheel', region: 'child-graves', offset: [6, -6], prefab: 'button', blurb: 'Spins softly whenever a storm rolls in.' },
  { id: 'col-yew-crown', name: 'Woven Yew Circlet', region: 'yew-edge', offset: [-6, 8], prefab: 'wool-scarf', blurb: 'Braided evergreen twigs that never wilt.' },
];

export interface CollectibleMilestone {
  count: number;
  title: string;
  acorns: number;
}

export const COLLECTIBLE_MILESTONES: readonly CollectibleMilestone[] = [
  { count: 3, title: 'Scout’s Eye (+25 Acorns)', acorns: 25 },
  { count: 6, title: 'Hearth Curio (+50 Acorns)', acorns: 50 },
  { count: 9, title: 'Master Scavenger (+75 Acorns)', acorns: 75 },
  { count: 12, title: 'Crown of Mossgrave (+150 Acorns)', acorns: 150 },
];

export interface CollectibleSave {
  found: string[];
  claimedMilestones: number[];
}

const STORAGE_KEY = 'dayg_collectibles_v1';

export function loadCollectibles(): CollectibleSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { found: [], claimedMilestones: [] };
    const parsed = JSON.parse(raw) as Partial<CollectibleSave>;
    return {
      found: Array.isArray(parsed.found) ? parsed.found : [],
      claimedMilestones: Array.isArray(parsed.claimedMilestones) ? parsed.claimedMilestones : [],
    };
  } catch {
    return { found: [], claimedMilestones: [] };
  }
}

export function saveCollectibles(s: CollectibleSave): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function collectItem(id: string): { fresh: boolean; total: number } {
  const s = loadCollectibles();
  if (s.found.includes(id)) return { fresh: false, total: s.found.length };
  s.found.push(id);
  saveCollectibles(s);
  return { fresh: true, total: s.found.length };
}

export function turnInCollectibles(): { acorns: number; unlocked: string[] } {
  const s = loadCollectibles();
  let acorns = 0;
  const unlocked: string[] = [];
  for (const m of COLLECTIBLE_MILESTONES) {
    if (s.found.length >= m.count && !s.claimedMilestones.includes(m.count)) {
      s.claimedMilestones.push(m.count);
      acorns += m.acorns;
      unlocked.push(m.title);
    }
  }
  if (unlocked.length > 0) saveCollectibles(s);
  return { acorns, unlocked };
}
