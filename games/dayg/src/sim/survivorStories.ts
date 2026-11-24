// Persistent survivors and mutually exclusive branching story arcs (4 rival pairs = 16 unique outcome combinations).
import type { RegionId } from '../sim/types';

export type SurvivorStatus = 'alive' | 'recruited' | 'missing' | 'shattered';
export type DispositionTier = 'Rival' | 'Wary' | 'Stranger' | 'Ally' | 'Confidant';
export type StoryStage = 0 | 1 | 2 | 3;

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
  stages: readonly [string, string, string];
  locksOut: readonly string[];
  rewardAcorns: number;
  outcomeTag: string;
}

export function dispositionTier(disposition: number): DispositionTier {
  if (disposition <= -20) return 'Rival';
  if (disposition < 0) return 'Wary';
  if (disposition < 25) return 'Stranger';
  if (disposition < 60) return 'Ally';
  return 'Confidant';
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
    stages: [
      'Survey the Lychgate grain bins and clear out damp moss.',
      'Re-brick the waystation hearth flue so ovens burn through rain.',
      'Bake and distribute the first hundred loaves to the watch.',
    ],
    locksOut: ['story-tap-pipeworks'],
    rewardAcorns: 30,
    outcomeTag: 'Lychgate Waystation became a thriving bakery haven.',
  },
  {
    id: 'story-tap-pipeworks',
    survivorId: 'clod',
    title: 'The Tap Pipeworks',
    summary: 'Route clean water pressure to The Tap & Subsoil Radio. Locks out Bread for the Gate.',
    stages: [
      'Unbolt the rusted brass manifold beneath The Tap cellar.',
      'Patch the split lead cistern pipe with resin and hemp.',
      'Boost water pressure to power the Subsoil Rebel broadcast dynamo.',
    ],
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
    stages: [
      'Haul fallen limestone coping stones to the Masons Corner breach.',
      'Mix lime mortar and set the lower courses before nightfall.',
      'Key the final arch stone and bolt the iron reinforcement bar.',
    ],
    locksOut: ['story-hedge-path'],
    rewardAcorns: 35,
    outcomeTag: 'Masons Corner is walled off against midnight hordes.',
  },
  {
    id: 'story-hedge-path',
    survivorId: 'pip',
    title: 'Secret Hedge Path',
    summary: 'Carve a hidden scout tunnel through the Verge hedges. Locks out Seal the Masons Gate.',
    stages: [
      'Map the hollow root-gaps along the eastern Verge privet.',
      'Shore up the crawlway with hazel hurdles and moss mats.',
      'Mark the concealed exit lanterns for silent night crossings.',
    ],
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
    stages: [
      'String storm-lantern tripwires across the four square approaches.',
      'Rally the militia and test the brass horn signal from the plinth.',
      'Lead the sweeping push to clear Angel Square and lock the bollards.',
    ],
    locksOut: ['story-moss-truce'],
    rewardAcorns: 40,
    outcomeTag: 'Bram’s militia holds Angel Square under floodlights.',
  },
  {
    id: 'story-moss-truce',
    survivorId: 'fern',
    title: 'Moss-Ward Truce',
    summary: 'Spread calming herb smoke so the Hatless drift past Ivy Rows. Locks out Clear Angel Square.',
    stages: [
      'Gather dried yarrow, sage, and clean bog-moss from the rows.',
      'Steep the calming braziers along the windward ivy trellises.',
      'Light the dusk censers and guide the drifting Hatless harmlessly past.',
    ],
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
    stages: [
      'Winch open the jammed inspection hatch on the monument plinth.',
      'Unmesh the heavy escapement wheel without snapping the mainspring.',
      'Forge the salvaged brass into turret cams and camp mower belts.',
    ],
    locksOut: ['story-preserve-archive'],
    rewardAcorns: 45,
    outcomeTag: 'Alder’s workshop churns out heavy springs and belts.',
  },
  {
    id: 'story-preserve-archive',
    survivorId: 'moss',
    title: 'Preserve the Archive',
    summary: 'Restore the pre-breakout records instead of scrapping the monument. Locks out Strip the Clocktower.',
    stages: [
      'Recover the damp-sealed ledger tins from the Leaning Rows vault.',
      'Dry and press the vellum parish rolls over low charcoal warmth.',
      'Catalog the complete Mossgrave chronicle behind glazed oak doors.',
    ],
    locksOut: ['story-scrap-engine'],
    rewardAcorns: 45,
    outcomeTag: 'The Mossgrave Archive preserves the Yard’s true history.',
  },
];

export type StoryStatus = 'available' | 'active' | 'completed' | 'locked';

export interface StoryState {
  stories: Record<string, StoryStatus>;
  storyStages: Record<string, StoryStage>;
  survivors: Record<string, { met: boolean; disposition: number; status: SurvivorStatus; lastRegion: RegionId }>;
}

const STORAGE_KEY = 'dayg_stories_v1';

export function createInitialStoryState(): StoryState {
  const stories: Record<string, StoryStatus> = {};
  const storyStages: Record<string, StoryStage> = {};
  for (const st of BRANCH_STORIES) {
    stories[st.id] = 'available';
    storyStages[st.id] = 0;
  }
  const survivors: StoryState['survivors'] = {};
  for (const s of NAMED_SURVIVORS) {
    survivors[s.id] = { met: false, disposition: 0, status: 'alive', lastRegion: s.home };
  }
  return { stories, storyStages, survivors };
}

export function loadStoryState(): StoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialStoryState();
    const parsed = JSON.parse(raw) as Partial<StoryState>;
    const base = createInitialStoryState();
    if (parsed.stories) Object.assign(base.stories, parsed.stories);
    if (parsed.storyStages) Object.assign(base.storyStages, parsed.storyStages);
    for (const st of BRANCH_STORIES) {
      if (base.stories[st.id] === 'completed') base.storyStages[st.id] = 3;
      else if (base.stories[st.id] === 'active' && !base.storyStages[st.id]) base.storyStages[st.id] = 1;
    }
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

export function getStoryStage(s: StoryState, storyId: string): StoryStage {
  if (s.storyStages && storyId in s.storyStages) return s.storyStages[storyId];
  const st = s.stories[storyId];
  if (st === 'completed') return 3;
  if (st === 'active') return 1;
  return 0;
}

export function acceptStory(s: StoryState, storyId: string): boolean {
  const cur = s.stories[storyId];
  if (cur !== 'available') return false;
  const def = BRANCH_STORIES.find((x) => x.id === storyId);
  if (!def) return false;
  s.stories[storyId] = 'active';
  if (!s.storyStages) s.storyStages = {};
  s.storyStages[storyId] = 1;
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
  if (!s.storyStages) s.storyStages = {};
  s.storyStages[storyId] = 3;
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

export function advanceStory(
  s: StoryState,
  storyId: string,
): { ok: boolean; stage: StoryStage; completed: boolean; locked: string[]; rewardAcorns: number; outcomeTag: string } {
  const curStatus = s.stories[storyId];
  const def = BRANCH_STORIES.find((x) => x.id === storyId);
  if (!def || curStatus === 'locked' || curStatus === 'completed') {
    return { ok: false, stage: getStoryStage(s, storyId), completed: false, locked: [], rewardAcorns: 0, outcomeTag: '' };
  }
  if (!s.storyStages) s.storyStages = {};
  const stage = getStoryStage(s, storyId);
  if (stage === 0) {
    acceptStory(s, storyId);
    return { ok: true, stage: 1, completed: false, locked: [], rewardAcorns: 0, outcomeTag: '' };
  }
  if (stage === 1 || stage === 2) {
    const next = (stage + 1) as StoryStage;
    s.stories[storyId] = 'active';
    s.storyStages[storyId] = next;
    if (s.survivors[def.survivorId]) s.survivors[def.survivorId].met = true;
    return { ok: true, stage: next, completed: false, locked: [], rewardAcorns: 0, outcomeTag: '' };
  }
  // Stage 3 -> complete the story
  const res = completeStory(s, storyId);
  return { ok: res.ok, stage: 3, completed: res.ok, locked: res.locked, rewardAcorns: res.rewardAcorns, outcomeTag: res.outcomeTag };
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
