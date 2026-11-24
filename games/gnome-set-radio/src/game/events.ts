import type { GsrLevelId } from '../levels/loader';
import type { GsrEventDef, GsrLevelDoc } from '../levels/schema';

export type StyleRank = 'S' | 'A' | 'B' | 'C';

export interface ProgressState {
  completedAreas: GsrLevelId[];
  area3Teased: boolean;
  introSeen: boolean;
  bestScores: Partial<Record<GsrLevelId, number>>;
  bestRanks: Partial<Record<GsrLevelId, StyleRank>>;
  collectedVinyls: string[];
}

export function computeStyleRank(score: number, maxCombo: number, _sideCleared: number): StyleRank {
  if (score >= 6000 || (score >= 4000 && maxCombo >= 6)) return 'S';
  if (score >= 3000) return 'A';
  if (score >= 1200) return 'B';
  return 'C';
}

const PROGRESS_KEY = 'gsr.progress.v1';

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      return {
        completedAreas: Array.isArray(parsed.completedAreas) ? parsed.completedAreas : [],
        area3Teased: !!parsed.area3Teased,
        introSeen: !!parsed.introSeen,
        bestScores: parsed.bestScores && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
        bestRanks: parsed.bestRanks && typeof parsed.bestRanks === 'object' ? parsed.bestRanks : {},
        collectedVinyls: Array.isArray(parsed.collectedVinyls) ? parsed.collectedVinyls : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return { completedAreas: [], area3Teased: false, introSeen: false, bestScores: {}, bestRanks: {}, collectedVinyls: [] };
}

export function saveProgress(p: ProgressState): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // ignore storage errors
  }
}

export interface EventRuntime {
  def: GsrEventDef;
  progress: number;
  completed: boolean;
  active: boolean;
  hitIds: Set<string>;
}

export interface LevelSession {
  levelId: GsrLevelId;
  events: Map<string, EventRuntime>;
  storyOrder: string[];
  activeStoryIndex: number;
  bossUnlocked: boolean;
  levelCleared: boolean;
  activeBanner: { speaker: string; text: string; ttl: number } | null;
  bossHp: number;
  bossMaxHp: number;
  bossWavePhase: number;
}

export function createLevelSession(doc: GsrLevelDoc, levelId: GsrLevelId): LevelSession {
  const events = new Map<string, EventRuntime>();
  const storyOrder: string[] = [];
  for (const ev of doc.data.events) {
    if (ev.kind === 'story') {
      storyOrder.push(ev.id);
    }
    events.set(ev.id, {
      def: ev,
      progress: 0,
      completed: false,
      active: false,
      hitIds: new Set<string>(),
    });
  }
  if (storyOrder.length > 0) {
    const firstStory = events.get(storyOrder[0]!);
    if (firstStory) firstStory.active = true;
  }
  return {
    levelId,
    events,
    storyOrder,
    activeStoryIndex: 0,
    bossUnlocked: false,
    levelCleared: false,
    activeBanner: null,
    bossHp: 3,
    bossMaxHp: 3,
    bossWavePhase: 0,
  };
}

export function checkBossUnlock(session: LevelSession): boolean {
  if (session.bossUnlocked) return false;
  for (const ev of session.events.values()) {
    if (ev.def.kind === 'story' && !ev.completed) return false;
  }
  session.bossUnlocked = true;
  for (const ev of session.events.values()) {
    if (ev.def.kind === 'boss') {
      ev.active = true;
      session.activeBanner = {
        speaker: ev.def.character,
        text: ev.def.introLine,
        ttl: 6.5,
      };
    }
  }
  return true;
}

export function advanceEvent(
  session: LevelSession,
  eventId: string,
  targetId?: string,
): {
  completedNow: boolean;
  bossJustUnlocked: boolean;
  levelJustCleared: boolean;
  line: string | null;
  nextStoryEventId: string | null;
} {
  const ev = session.events.get(eventId);
  if (!ev || ev.completed) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null, nextStoryEventId: null };
  }
  if (ev.def.kind === 'story' && !ev.active) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null, nextStoryEventId: null };
  }
  if (targetId && ev.hitIds.has(targetId)) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null, nextStoryEventId: null };
  }
  if (targetId) ev.hitIds.add(targetId);
  ev.active = true;
  ev.progress = Math.min(ev.def.targetCount, ev.progress + 1);

  if (ev.progress < ev.def.targetCount) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null, nextStoryEventId: null };
  }

  ev.completed = true;
  session.activeBanner = {
    speaker: ev.def.character,
    text: ev.def.completeLine,
    ttl: 5.5,
  };

  let bossJustUnlocked = false;
  let levelJustCleared = false;
  let nextStoryEventId: string | null = null;

  if (ev.def.kind === 'story') {
    let nextIdx = -1;
    for (let i = session.activeStoryIndex + 1; i < session.storyOrder.length; i++) {
      const candidate = session.events.get(session.storyOrder[i]!);
      if (candidate && !candidate.completed) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx === -1) {
      for (let i = 0; i < session.storyOrder.length; i++) {
        const candidate = session.events.get(session.storyOrder[i]!);
        if (candidate && !candidate.completed) {
          nextIdx = i;
          break;
        }
      }
    }
    if (nextIdx !== -1) {
      session.activeStoryIndex = nextIdx;
      const nextEv = session.events.get(session.storyOrder[nextIdx]!)!;
      nextEv.active = true;
      nextStoryEventId = nextEv.def.id;
    } else {
      session.activeStoryIndex = session.storyOrder.length;
      bossJustUnlocked = checkBossUnlock(session);
    }
  } else if (ev.def.kind === 'boss') {
    session.levelCleared = true;
    levelJustCleared = true;
  }

  return {
    completedNow: true,
    bossJustUnlocked,
    levelJustCleared,
    line: ev.def.completeLine,
    nextStoryEventId,
  };
}
