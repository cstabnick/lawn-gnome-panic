// Persistent survivors and mutually exclusive branching story arcs (4 rival pairs = 16 unique outcome combinations).
import type { RegionId } from '../sim/types';

export type SurvivorStatus = 'alive' | 'recruited' | 'missing' | 'shattered';

export interface NamedSurvivor {
  id: string;
  name: string;
  role: string;
  home: RegionId;
  blurb: string;
}

export interface BranchStory {
  id: string;
  survivorId: string;
  title: string;
  summary: string;
  locksOut: readonly string[];
  rewardAcorns: number;
  outcomeTag: string;
}

export const NAMED_SURVIVORS: readonly NamedSurvivor[] = [
  { id: 'maren', name: 'Maren the Mason', role: 'Fortifier', home: 'masons-corner', blurb: 'Repairs stone kerbs and distrusts outsiders.' },
  { id: 'barnaby', name: 'Barnaby the Baker', role: 'Cook', home: 'gate-roof', blurb: 'Keeps the waystation ovens warm with seed-flour.' },
  { id: 'pip', name: 'Warden Pip', role: 'Scout', home: 'verge-path', blurb: 'Knows every gap in the iron railings.' },
  { id: 'fern', name: 'Whispering Fern', role: 'Herbalist', home: 'ivy-rows', blurb: 'Brews moss-ward salves among the overgrown rows.' },
  { id: 'alder', name: 'Alder the Tinker', role: 'Mechanic', home: 'bin-corner', blurb: 'Salvages mower belts, springs, and brass fittings.' },
  { id: 'bram', name: 'Captain Bram', role: 'Militia Lead', home: 'angel-square', blurb: 'Drills survivors to hold the square at night.' },
  { id: 'clod', name: 'DJ Clod', role: 'Broadcaster', home: 'the-tap', blurb: 'Runs 101.7 FM Subsoil Rebel from a cellar pipe.' },
  { id: 'moss', name: 'Archivist Moss', role: 'Chronicler', home: 'leaning-rows', blurb: 'Collects pre-breakout ledgers and porcelain seals.' },
];

export const BRANCH_STORIES: readonly BranchStory[] = [
  // Pair 1: Lychgate vs The Tap Water Pact
  {
    id: 'story-gate-ration',
    survivorId: 'barnaby',
    title: 'Bread for the Gate',
    summary: 'Divert surplus grain to fortify Lychgate Waystation. Locks out The Tap Pipeworks.',
    locksOut: ['story-tap-pipeworks'],
    rewardAcorns: 30,
    outcomeTag: 'Lychgate Waystation became a thriving bakery haven.',
  },
  {
    id: 'story-tap-pipeworks',
    survivorId: 'clod',
    title: 'The Tap Pipeworks',
    summary: 'Route clean water pressure to The Tap & Subsoil Radio. Locks out Bread for the Gate.',
    locksOut: ['story-gate-ration'],
    rewardAcorns: 30,
    outcomeTag: 'The Tap pumps clean water and broadcasts across Mossgrave.',
  },
  // Pair 2: Iron Perimeter vs Quiet Sanctuary
  {
    id: 'story-iron-barricade',
    survivorId: 'maren',
    title: 'Seal the Masons Gate',
    summary: 'Brick up the south breach with heavy limestone. Locks out Secret Hedge Path.',
    locksOut: ['story-hedge-path'],
    rewardAcorns: 35,
    outcomeTag: 'Masons Corner is walled off against midnight hordes.',
  },
  {
    id: 'story-hedge-path',
    survivorId: 'pip',
    title: 'Secret Hedge Path',
    summary: 'Carve a hidden scout tunnel through the Verge hedges. Locks out Seal the Masons Gate.',
    locksOut: ['story-iron-barricade'],
    rewardAcorns: 35,
    outcomeTag: 'Scouts slip silently beneath the Verge hedges.',
  },
  // Pair 3: Militant Purge vs Herbal Truce
  {
    id: 'story-angel-purge',
    survivorId: 'bram',
    title: 'Clear Angel Square',
    summary: 'Sound the war horn and drive every Hatless out of the square. Locks out Moss-Ward Truce.',
    locksOut: ['story-moss-truce'],
    rewardAcorns: 40,
    outcomeTag: 'Bram’s militia holds Angel Square under floodlights.',
  },
  {
    id: 'story-moss-truce',
    survivorId: 'fern',
    title: 'Moss-Ward Truce',
    summary: 'Spread calming herb smoke so the Hatless drift past Ivy Rows. Locks out Clear Angel Square.',
    locksOut: ['story-angel-purge'],
    rewardAcorns: 40,
    outcomeTag: 'Ivy Rows sleeps undisturbed behind fragrant herb smoke.',
  },
  // Pair 4: Salvage Engine vs Archive Preservation
  {
    id: 'story-scrap-engine',
    survivorId: 'alder',
    title: 'Strip the Clocktower',
    summary: 'Harvest brass gears from the old monument for vehicle & turret parts. Locks out Preserve the Archive.',
    locksOut: ['story-preserve-archive'],
    rewardAcorns: 45,
    outcomeTag: 'Alder’s workshop churns out heavy springs and belts.',
  },
  {
    id: 'story-preserve-archive',
    survivorId: 'moss',
    title: 'Preserve the Archive',
    summary: 'Restore the pre-breakout records instead of scrapping the monument. Locks out Strip the Clocktower.',
    locksOut: ['story-scrap-engine'],
    rewardAcorns: 45,
    outcomeTag: 'The Mossgrave Archive preserves the Yard’s true history.',
  },
];

export type StoryStatus = 'available' | 'active' | 'completed' | 'locked';

export interface StoryState {
  stories: Record<string, StoryStatus>;
  survivors: Record<string, { met: boolean; disposition: number; status: SurvivorStatus; lastRegion: RegionId }>;
}

const STORAGE_KEY = 'dayg_stories_v1';

export function createInitialStoryState(): StoryState {
  const stories: Record<string, StoryStatus> = {};
  for (const st of BRANCH_STORIES) stories[st.id] = 'available';
  const survivors: StoryState['survivors'] = {};
  for (const s of NAMED_SURVIVORS) {
    survivors[s.id] = { met: false, disposition: 0, status: 'alive', lastRegion: s.home };
  }
  return { stories, survivors };
}

export function loadStoryState(): StoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialStoryState();
    const parsed = JSON.parse(raw) as Partial<StoryState>;
    const base = createInitialStoryState();
    if (parsed.stories) Object.assign(base.stories, parsed.stories);
    if (parsed.survivors) {
      for (const [k, v] of Object.entries(parsed.survivors)) {
        if (base.survivors[k]) base.survivors[k] = { ...base.survivors[k], ...v };
      }
    }
    return base;
  } catch {
    return createInitialStoryState();
  }
}

export function saveStoryState(s: StoryState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function acceptStory(s: StoryState, storyId: string): boolean {
  const cur = s.stories[storyId];
  if (cur !== 'available') return false;
  const def = BRANCH_STORIES.find((x) => x.id === storyId);
  if (!def) return false;
  s.stories[storyId] = 'active';
  if (s.survivors[def.survivorId]) s.survivors[def.survivorId].met = true;
  return true;
}

export function completeStory(s: StoryState, storyId: string): { ok: boolean; locked: string[]; rewardAcorns: number; outcomeTag: string } {
  const cur = s.stories[storyId];
  const def = BRANCH_STORIES.find((x) => x.id === storyId);
  if (!def || cur === 'locked' || cur === 'completed') {
    return { ok: false, locked: [], rewardAcorns: 0, outcomeTag: '' };
  }
  s.stories[storyId] = 'completed';
  const surv = s.survivors[def.survivorId];
  if (surv) {
    surv.met = true;
    surv.disposition = Math.min(100, surv.disposition + 35);
  }
  const locked: string[] = [];
  for (const rivalId of def.locksOut) {
    if (s.stories[rivalId] !== 'completed') {
      s.stories[rivalId] = 'locked';
      locked.push(rivalId);
      const rivalDef = BRANCH_STORIES.find((x) => x.id === rivalId);
      if (rivalDef && s.survivors[rivalDef.survivorId]) {
        s.survivors[rivalDef.survivorId].met = true;
        s.survivors[rivalDef.survivorId].disposition = Math.max(-100, s.survivors[rivalDef.survivorId].disposition - 25);
      }
    }
  }
  return { ok: true, locked, rewardAcorns: def.rewardAcorns, outcomeTag: def.outcomeTag };
}

export function setSurvivorStatus(s: StoryState, survivorId: string, status: SurvivorStatus, region?: RegionId): void {
  const rec = s.survivors[survivorId];
  if (!rec) return;
  rec.met = true;
  rec.status = status;
  if (region) rec.lastRegion = region;
}

export function outcomeSummary(s: StoryState): string[] {
  const out: string[] = [];
  for (const def of BRANCH_STORIES) {
    if (s.stories[def.id] === 'completed') out.push(def.outcomeTag);
  }
  return out;
}
