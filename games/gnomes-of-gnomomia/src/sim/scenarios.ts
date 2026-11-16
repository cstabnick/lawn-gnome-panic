import { ENEMIES } from '../content';
import type { ScenarioSpec } from './types';

function defineScenarios(list: readonly ScenarioSpec[]): {
  SCENARIOS: Record<string, ScenarioSpec>;
  SCENARIO_LIST: readonly ScenarioSpec[];
} {
  const map: Record<string, ScenarioSpec> = {};
  for (const sc of list) {
    for (const w of sc.waves) {
      if (!ENEMIES[w.enemyId]) {
        throw new Error(`Scenario '${sc.id}' references unknown enemy '${w.enemyId}'`);
      }
    }
    map[sc.id] = sc;
  }
  return { SCENARIOS: map, SCENARIO_LIST: list };
}

const RAW_SCENARIOS: readonly ScenarioSpec[] = [
  // Mossbottom (L1-6)
  {
    id: 'mb-slug-duel',
    name: 'Mossbottom: Slug Duel (L1)',
    kind: 'duel',
    zone: 'mossbottom',
    waves: [{ enemyId: 'slug', count: 1, distance: 4 }],
  },
  {
    id: 'mb-feral-duel',
    name: 'Mossbottom: Feral Gnome (L3)',
    kind: 'duel',
    zone: 'mossbottom',
    waves: [{ enemyId: 'feral-gnome', count: 1, distance: 5 }],
  },
  {
    id: 'mb-feral-pack',
    name: 'Mossbottom: Feral Pack (2x L3)',
    kind: 'pack',
    zone: 'mossbottom',
    waves: [{ enemyId: 'feral-gnome', count: 2, distance: 6, angleSpread: 1.2 }],
  },
  {
    id: 'mb-brute-elite',
    name: 'Mossbottom: Feral Brute (L4 Elite)',
    kind: 'duel',
    zone: 'mossbottom',
    waves: [{ enemyId: 'feral-brute', count: 1, distance: 7 }],
  },
  {
    id: 'mb-beetle-duel',
    name: 'Mossbottom: Garden Beetle (L4)',
    kind: 'duel',
    zone: 'mossbottom',
    waves: [{ enemyId: 'beetle', count: 1, distance: 5 }],
  },
  {
    id: 'boss-mole-king',
    name: 'Mossbottom Boss: Grubthorn (L6)',
    kind: 'boss',
    zone: 'mossbottom',
    waves: [{ enemyId: 'mole-king', count: 1, distance: 8 }],
  },

  // Thatchford (L6-11)
  {
    id: 'tf-ford-defend',
    name: 'Thatchford: Hold the Ford (Defend 60s)',
    kind: 'defend',
    zone: 'thatchford',
    defendRadius: 6,
    defendSeconds: 60,
    waves: [
      { enemyId: 'water-beetle', count: 2, distance: 9, spawnAtSeconds: 0 },
      { enemyId: 'water-beetle', count: 2, distance: 10, spawnAtSeconds: 20 },
      { enemyId: 'water-beetle', count: 2, distance: 10, spawnAtSeconds: 40 },
    ],
  },
  {
    id: 'tf-magpie-trial',
    name: 'Thatchford: Magpie Thief (L8)',
    kind: 'duel',
    zone: 'thatchford',
    mechanic: 'magpie-flee',
    waves: [{ enemyId: 'magpie-thief', count: 1, distance: 7 }],
  },
  {
    id: 'tf-sprite-trial',
    name: 'Thatchford: Muck Sprite (L7)',
    kind: 'duel',
    zone: 'thatchford',
    waves: [{ enemyId: 'muck-sprite', count: 1, distance: 6 }],
  },
  {
    id: 'boss-rotgut',
    name: 'Thatchford Boss: Rotgut (L11)',
    kind: 'boss',
    zone: 'thatchford',
    waves: [{ enemyId: 'rotgut', count: 1, distance: 8 }],
  },

  // Keep & Deeps (L10-12)
  {
    id: 'deeps-gutters-gauntlet',
    name: 'Deeps: Gutters Gauntlet (3 Waves)',
    kind: 'gauntlet',
    zone: 'deeps',
    restBetweenWavesSeconds: 8,
    waves: [
      { enemyId: 'gutter-rat', count: 2, distance: 6 },
      { enemyId: 'pipe-leech', count: 2, distance: 6 },
      { enemyId: 'gutter-rat', count: 3, distance: 7, angleSpread: 1.4 },
    ],
  },
  {
    id: 'boss-clogmaw',
    name: 'Deeps Boss: Clogmaw (L12)',
    kind: 'boss',
    zone: 'deeps',
    waves: [{ enemyId: 'clogmaw', count: 1, distance: 8 }],
  },

  // Cloverfield (L11-16)
  {
    id: 'cf-mouse-pack',
    name: 'Cloverfield: Field Mouse Pack (3x L12)',
    kind: 'pack',
    zone: 'cloverfield',
    waves: [{ enemyId: 'field-mouse', count: 3, distance: 7, angleSpread: 1.4 }],
  },
  {
    id: 'cf-ant-elite',
    name: 'Cloverfield: Red Ant Soldiers (2x L14)',
    kind: 'pack',
    zone: 'cloverfield',
    waves: [{ enemyId: 'red-ant-soldier', count: 2, distance: 7, angleSpread: 1.0 }],
  },
  {
    id: 'boss-old-gleaner',
    name: 'Cloverfield World Boss: Old Gleaner (L16)',
    kind: 'boss',
    zone: 'cloverfield',
    waves: [{ enemyId: 'old-gleaner', count: 1, distance: 9 }],
  },

  // Hedgewood & Cistern (L15-20)
  {
    id: 'hw-weaver-elite',
    name: 'Hedgewood: Weaver Below (L18 Elite)',
    kind: 'duel',
    zone: 'hedgewood',
    waves: [{ enemyId: 'weaver-below', count: 1, distance: 7 }],
  },
  {
    id: 'boss-mother-vesh',
    name: 'Hedgewood Boss: Mother Vesh (L20)',
    kind: 'boss',
    zone: 'hedgewood',
    mechanic: 'vesh-leeches',
    waves: [{ enemyId: 'mother-vesh', count: 1, distance: 9 }],
  },
  {
    id: 'boss-queen-vespa',
    name: 'Hedgewood Boss: Queen Vespa (L20)',
    kind: 'boss',
    zone: 'hedgewood',
    waves: [{ enemyId: 'queen-vespa', count: 1, distance: 9 }],
  },

  // Rockery & Backflow (L19-25)
  {
    id: 'rk-unfired-duel',
    name: 'Rockery: Unfired Clay (L23)',
    kind: 'duel',
    zone: 'rockery',
    waves: [{ enemyId: 'unfired', count: 1, distance: 6 }],
  },
  {
    id: 'boss-kiln-warden',
    name: 'Rockery Boss: Kiln Warden (L24)',
    kind: 'boss',
    zone: 'rockery',
    mechanic: 'kiln-kneel',
    waves: [{ enemyId: 'kiln-warden', count: 1, distance: 8 }],
  },
  {
    id: 'boss-gromwell',
    name: 'Rockery Boss: Gromwell (L25)',
    kind: 'boss',
    zone: 'rockery',
    mechanic: 'gromwell-flood',
    waves: [{ enemyId: 'gromwell', count: 1, distance: 8 }],
  },

  // Verge & Shed (L25-30)
  {
    id: 'vg-edger-elite',
    name: 'Verge: Edger-Knight (L27 Elite)',
    kind: 'duel',
    zone: 'verge',
    waves: [{ enemyId: 'edger-knight', count: 1, distance: 7 }],
  },
  {
    id: 'boss-sedgewick',
    name: 'Verge Boss: High Edger Sedgewick (L28)',
    kind: 'boss',
    zone: 'verge',
    waves: [{ enemyId: 'high-edger', count: 1, distance: 8 }],
  },
  {
    id: 'boss-mower-heartspark',
    name: 'Shed Finale: Heartspark & Rope (L30)',
    kind: 'boss',
    zone: 'verge',
    waves: [
      { enemyId: 'mower-heartspark', count: 1, distance: 8, spawnAtSeconds: 0 },
      { enemyId: 'mower-rope', count: 1, distance: 9, spawnAtSeconds: 15 },
    ],
  },
];

export const { SCENARIOS, SCENARIO_LIST } = defineScenarios(RAW_SCENARIOS);
