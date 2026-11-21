import type { BestPhotoMap } from './storage';
import type { CourseId } from './types';

export const COURSE_ORDER: readonly CourseId[] = ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost'];

export const FINALE_POINTS = 80_000;

export const PROGRESSION_STORAGE_KEY = 'gnomeokemon.progression.v1';

export interface CourseStoryInfo {
  chapter: number;
  chapterTitle: string;
  unlockPts: number;
  unlockLine: string;
  lockedTeaser: string;
  fieldBriefing: string;
  storyBeat: string;
}

export const COURSE_STORY: Record<CourseId, CourseStoryInfo> = {
  lawn: {
    chapter: 1,
    chapterTitle: 'The Morning Round',
    unlockPts: 0,
    unlockLine:
      'Here is the Eye-Box. Twenty-four frames, and no, we cannot buy more at the corner shop. Climb onto Tag, hold still, and bring me something better than your thumb.',
    lockedTeaser: 'Always open. Tag is waiting by the front door.',
    fieldBriefing:
      "Tag's morning walk from Mossbottom Vale to the Verge. Toss Bait for the hungry ones, play the Flute to set Tag's tail wagging, and watch the far grass for bosses.",
    storyBeat:
      'Your trial roll. Tag walks his bright morning ribbon from Mossbottom Vale past Puddlemere, the Hose, the Spinning Fountains, and the Rockery up to the Verge.',
  },
  desert: {
    chapter: 2,
    chapterTitle: 'Down the Town Road',
    unlockPts: 10_000,
    unlockLine:
      'Ten thousand points! You actually have an eye, not just a finger. I have unpinned the town road into Turfton — take a hat with a brim, the Hat Watch is rude down there.',
    lockedTeaser: 'Prove you can frame a slug before I lend you film for the sun.',
    fieldBriefing:
      "Turfton's downtown at midday: brick blocks, parked push-mowers, lamp-posts humming over the crossings. Hold your aim steady for rolling Tumblewights and coax shy Armadillans out with Bait.",
    storyBeat:
      'Down the town road into Turfton, the grid where every brick is pressure-washed and every lamp-post has an opinion about the Hat Watch.',
  },
  depths: {
    chapter: 3,
    chapterTitle: 'Into the Gutters',
    unlockPts: 20_000,
    unlockLine:
      'Twenty thousand. Impressive. Wipe your lens and mind your boots — I am opening the Drainpipe Deeps beneath the Keep, and the pipes are leaking again.',
    lockedTeaser: 'Film hates puddles. Earn the points first, then we risk the gutters.',
    fieldBriefing:
      'The wet Gutters beneath Birdbath Keep, lit by algae glow and leaking brass fittings. Catch Rustcrabs hoarding scrap and coax Clogmaw out of the pipe arches.',
    storyBeat:
      'Straight down beneath Birdbath Keep into the Gutters wing — slick stone ledges, Pipewright chalk marks, algae lamps, and rising water.',
  },
  kiln: {
    chapter: 4,
    chapterTitle: 'Cold Brick, Warm Coals',
    unlockPts: 30_000,
    unlockLine:
      'Thirty thousand points! The Scale actually hummed. Take Tag down the Stopping Road at dusk — and for clay’s sake, do not throw a clod at the Kilnwarden.',
    lockedTeaser: 'Dusk light and stern creatures. Not for interns.',
    fieldBriefing:
      'The dusk road through the Rockery pass: a cave under the hill, lava pools in the rock, seven waystones on the road to the barred Shed door. The Kilnwarden respects patience over Pester clods.',
    storyBeat:
      'Through the Rockery pass toward the Verge — the dusk-hushed processional road lined with seven name-scratched waystones and the cold Kiln.',
  },
  ocean: {
    chapter: 5,
    chapterTitle: 'The Drowned Hall',
    unlockPts: 40_000,
    unlockLine:
      'Forty thousand. Even I am running out of polite ways to look unimpressed. The Cistern Reef is open — tell the Barnacle Knight his shift ended three centuries ago.',
    lockedTeaser: 'The drowned hall waits for a steady hand. Come back at forty thousand.',
    fieldBriefing:
      'The drowned Cistern hall below Birdbath Keep, where sunbeams drop from the Basin drain. Hold still for shy Cisterneels and watch the Old Pedestal for the rising Sea Mower.',
    storyBeat:
      'Deeper beneath Birdbath Keep lies the Cistern wing — sunken Pipewright barracks, swaying water-weed, and a bright shaft of daylight from the Basin drain.',
  },
  night: {
    chapter: 6,
    chapterTitle: 'Page Thirty-Six',
    unlockPts: 52_000,
    unlockLine:
      'Fifty-two thousand points. Very well. I am unlocking the Glasshouse out back — strictly for the Mooncaps and the Bonsai Titan, mind you. If you happen to see me, check the lighting first.',
    lockedTeaser: 'My private garden. Nobody enters with a wobbly wrist.',
    fieldBriefing:
      "Hyssop's own back-lot conservatory under midnight glass, mist, and cold tea. Steady your camera for shy nocturnal glow — and someone very specific waiting by the far shrine.",
    storyBeat:
      'Midnight in the Lab’s own Glasshouse, where the Eye-Box sleeps in the potting-bench drawer and Gnome Jesus (#036) stands waiting at the far end of the loop.',
  },
  frost: {
    chapter: 7,
    chapterTitle: 'The One Frozen Week',
    unlockPts: 65_000,
    unlockLine:
      'Sixty-five thousand! And right on cue, the Basin has frozen over. The Rime lasts one week — bundle up, pat Tag on the neck, and bring me the Frost King before it thaws.',
    lockedTeaser: 'The Basin only freezes once a season, and I am not wasting my last good winter rolls on guesswork.',
    fieldBriefing:
      "Birdbath Keep in its one week of hard frost — smoking chimneys, swept steps, and frozen ice tunnels. Track the racing Frosthound and frame the Frost King beneath the Keep's lit window.",
    storyBeat:
      'The Rime settles over Birdbath Keep. You have one frozen week — and the Lab’s finest remaining rolls — to finish the season’s census.',
  },
};

export interface LabRank {
  level: number;
  minPts: number;
  title: string;
  note: string;
  promotionLine: string;
}

export const LAB_RANKS: readonly LabRank[] = [
  {
    level: 1,
    minPts: 0,
    title: 'Porch Intern',
    note: 'Has a hat, a carrier, and a thumb over the lens.',
    promotionLine: "Sign the ledger. Try not to drop the Eye-Box on Tag's ears.",
  },
  {
    level: 2,
    minPts: 10_000,
    title: 'Dewdrop Spotter',
    note: 'Knows which end of the camera faces the creature.',
    promotionLine: 'You have graduated from grass landscapes. Wear the title lightly.',
  },
  {
    level: 3,
    minPts: 25_000,
    title: 'Field Surveyor',
    note: 'Trusted with dry film in wet pipes.',
    promotionLine: 'Mud on the boots, focus on the subject. Field Surveyor, effective immediately.',
  },
  {
    level: 4,
    minPts: 40_000,
    title: 'Scale Apprentice',
    note: 'Can tell a Gold pose from a creature merely blinking.',
    promotionLine: 'You are beginning to hear what the Scale hears. Do not get smug; that is my job.',
  },
  {
    level: 5,
    minPts: 55_000,
    title: 'Glasshouse Fellow',
    note: 'Allowed near the potting bench. Not the drawer.',
    promotionLine: 'A Glasshouse Fellow! Help yourself to the tea. It has been cold since Tuesday.',
  },
  {
    level: 6,
    minPts: 80_000,
    title: 'Chief Gnomographer',
    note: 'Signed the census. Framed Page Thirty-Six.',
    promotionLine: 'Chief Gnomographer. I would give you the Lab, except I like owning it. Have a biscuit.',
  },
  {
    level: 7,
    minPts: 115_000,
    title: 'Keeper of the Eye-Box',
    note: 'Gold-average mastery across all 42 species.',
    promotionLine: 'The Scale hums when you walk up the stairs. Take whatever roll you want from the drawer.',
  },
];

export function computeTotalPoints(best: BestPhotoMap): number {
  let sum = 0;
  for (const photo of Object.values(best)) {
    sum += photo?.score?.total ?? 0;
  }
  return sum;
}

export function isCourseUnlocked(courseId: CourseId, totalPoints: number): boolean {
  return totalPoints >= COURSE_STORY[courseId].unlockPts;
}

export function getUnlockedCourses(totalPoints: number): CourseId[] {
  return COURSE_ORDER.filter((cid) => isCourseUnlocked(cid, totalPoints));
}

export function getNextLockedCourse(
  totalPoints: number,
): { courseId: CourseId; unlockPts: number; remainingPts: number } | null {
  for (const cid of COURSE_ORDER) {
    const unlockPts = COURSE_STORY[cid].unlockPts;
    if (totalPoints < unlockPts) {
      return { courseId: cid, unlockPts, remainingPts: unlockPts - totalPoints };
    }
  }
  return null;
}

export function getHighestUnlockedIncompleteCourse(
  best: BestPhotoMap,
  getSpeciesIds: (courseId: CourseId) => readonly string[],
): CourseId {
  const totalPoints = computeTotalPoints(best);
  const unlocked = getUnlockedCourses(totalPoints);
  for (let i = unlocked.length - 1; i >= 0; i--) {
    const cid = unlocked[i];
    const species = getSpeciesIds(cid);
    if (species.some((sid) => !best[sid])) {
      return cid;
    }
  }
  return unlocked[unlocked.length - 1] ?? 'lawn';
}

export function getLabRank(totalPoints: number): { current: LabRank; next: LabRank | null; progressFrac: number } {
  let idx = 0;
  for (let i = 0; i < LAB_RANKS.length; i++) {
    if (totalPoints >= LAB_RANKS[i].minPts) idx = i;
  }
  const current = LAB_RANKS[idx];
  const next = LAB_RANKS[idx + 1] ?? null;
  if (!next) return { current, next: null, progressFrac: 1 };
  const span = Math.max(1, next.minPts - current.minPts);
  const progressFrac = Math.min(1, Math.max(0, (totalPoints - current.minPts) / span));
  return { current, next, progressFrac };
}

export type MilestoneAnnouncement =
  | { kind: 'course'; courseId: CourseId; chapter: number; chapterTitle: string; unlockPts: number; quote: string }
  | { kind: 'rank'; title: string; minPts: number; quote: string }
  | { kind: 'finale'; points: number; quote: string; page036Note: string };

interface StoredProgressionState {
  announcedCourses: CourseId[];
  announcedRankPts: number;
  finaleSeen: boolean;
}

function defaultState(): StoredProgressionState {
  return { announcedCourses: ['lawn'], announcedRankPts: 0, finaleSeen: false };
}

function getStorage(override?: Pick<Storage, 'getItem' | 'setItem'>): Pick<Storage, 'getItem' | 'setItem'> | null {
  if (override) return override;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadProgressionState(storageOverride?: Pick<Storage, 'getItem' | 'setItem'>): StoredProgressionState {
  const store = getStorage(storageOverride);
  if (!store) return defaultState();
  try {
    const raw = store.getItem(PROGRESSION_STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<StoredProgressionState>;
    const announcedCourses: CourseId[] = Array.isArray(parsed.announcedCourses)
      ? parsed.announcedCourses.filter((c): c is CourseId => COURSE_ORDER.includes(c as CourseId))
      : ['lawn'];
    if (!announcedCourses.includes('lawn')) announcedCourses.unshift('lawn');
    return {
      announcedCourses,
      announcedRankPts: typeof parsed.announcedRankPts === 'number' ? parsed.announcedRankPts : 0,
      finaleSeen: Boolean(parsed.finaleSeen),
    };
  } catch {
    return defaultState();
  }
}

export function collectNewMilestones(
  totalPoints: number,
  best: BestPhotoMap,
  storageOverride?: Pick<Storage, 'getItem' | 'setItem'>,
): MilestoneAnnouncement[] {
  const state = loadProgressionState(storageOverride);
  const out: MilestoneAnnouncement[] = [];

  for (const cid of COURSE_ORDER) {
    const story = COURSE_STORY[cid];
    if (totalPoints >= story.unlockPts && !state.announcedCourses.includes(cid)) {
      state.announcedCourses.push(cid);
      out.push({
        kind: 'course',
        courseId: cid,
        chapter: story.chapter,
        chapterTitle: story.chapterTitle,
        unlockPts: story.unlockPts,
        quote: story.unlockLine,
      });
    }
  }

  const { current } = getLabRank(totalPoints);
  if (current.minPts > state.announcedRankPts) {
    state.announcedRankPts = current.minPts;
    out.push({
      kind: 'rank',
      title: current.title,
      minPts: current.minPts,
      quote: current.promotionLine,
    });
  }

  if (totalPoints >= FINALE_POINTS && !state.finaleSeen) {
    state.finaleSeen = true;
    const jesusPhoto = best['gnomejesus'];
    const good036 = jesusPhoto && (jesusPhoto.score.grade === 'Gold' || jesusPhoto.score.grade === 'Divine');
    out.push({
      kind: 'finale',
      points: totalPoints,
      quote:
        'Eighty thousand points across the lawn, the pipes, the road, the glass, and the frost. Thirty years of sketching, and you did it in one season with a dog and a camera.',
      page036Note: good036
        ? 'Every page full. Even thirty-six. Especially thirty-six. Do not look so pleased; I only stood there because the bench needed dusting.'
        : 'Nearly every page worthy of the shelf. Page thirty-six could still use a kinder hand, mind you. The Glasshouse door is unlocked whenever you fancy another try.',
    });
  }

  if (out.length > 0) {
    const store = getStorage(storageOverride);
    try {
      store?.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }

  return out;
}

export function clearProgressionState(storageOverride?: Pick<Storage, 'removeItem'>): void {
  try {
    const store = storageOverride ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    store?.removeItem(PROGRESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
