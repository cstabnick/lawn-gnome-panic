import type { GsrLevelId } from '../levels/loader';
import type { GsrEventDef, GsrLevelDoc } from '../levels/schema';

export interface ProgressState {
  completedAreas: GsrLevelId[];
  area3Teased: boolean;
  introSeen: boolean;
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
      };
    }
  } catch {
    // ignore storage errors
  }
  return { completedAreas: [], area3Teased: false, introSeen: false };
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
  bossUnlocked: boolean;
  levelCleared: boolean;
  activeBanner: { speaker: string; text: string; ttl: number } | null;
  bossHp: number;
  bossMaxHp: number;
  bossWavePhase: number;
}

export function createLevelSession(doc: GsrLevelDoc, levelId: GsrLevelId): LevelSession {
  const events = new Map<string, EventRuntime>();
  for (const ev of doc.data.events) {
    events.set(ev.id, {
      def: ev,
      progress: 0,
      completed: false,
      active: ev.kind === 'story', // main story events can be tackled immediately in any order!
      hitIds: new Set<string>(),
    });
  }
  return {
    levelId,
    events,
    bossUnlocked: false,
    levelCleared: false,
    activeBanner: {
      speaker: 'DJ Broadcast',
      text: `Welcome to ${doc.name}! Clear the ${doc.data.events.filter((e) => e.kind === 'story').length} gang events in any order!`,
      ttl: 5.5,
    },
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
): { completedNow: boolean; bossJustUnlocked: boolean; levelJustCleared: boolean; line: string | null } {
  const ev = session.events.get(eventId);
  if (!ev || ev.completed) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null };
  }
  if (targetId && ev.hitIds.has(targetId)) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null };
  }
  if (targetId) ev.hitIds.add(targetId);
  ev.active = true;
  ev.progress = Math.min(ev.def.targetCount, ev.progress + 1);

  if (ev.progress < ev.def.targetCount) {
    return { completedNow: false, bossJustUnlocked: false, levelJustCleared: false, line: null };
  }

  ev.completed = true;
  session.activeBanner = {
    speaker: ev.def.character,
    text: ev.def.completeLine,
    ttl: 5.5,
  };

  let bossJustUnlocked = false;
  let levelJustCleared = false;

  if (ev.def.kind === 'story') {
    bossJustUnlocked = checkBossUnlock(session);
  } else if (ev.def.kind === 'boss') {
    session.levelCleared = true;
    levelJustCleared = true;
  }

  return {
    completedNow: true,
    bossJustUnlocked,
    levelJustCleared,
    line: ev.def.completeLine,
  };
}
