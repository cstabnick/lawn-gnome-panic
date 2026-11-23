// Skills: XP per skill, levels, and the time and failure effects (roadmap 8.13). Skills grow by doing; the XP is kept
// in the player's record through the SimHost ('set-skills'), so it survives reloads and hand-offs.
import type { Bus } from './bus';
import type { SimHost, SkillSystem } from './types';
import { SKILL } from '../config';
import { SKILLS, type SkillId } from '../sim/types';

const SAVE_EVERY_MS = 10_000;
const WOOD_PIECES = new Set<string>(['plank-wall', 'barricade', 'door', 'ladder', 'chest', 'bed', 'workbench', 'spike-line']);
const STONE_PIECES = new Set<string>(['stone-wall', 'hearth', 'kiln', 'anvil']);

/** XP needed in total to reach level L: the sum of base x growth^l for l < L. */
function threshold(L: number): number {
  let sum = 0;
  for (let l = 0; l < L; l++) sum += SKILL.base * Math.pow(SKILL.growth, l);
  return sum;
}

export function createSkills(bus: Bus, host?: SimHost): SkillSystem {
  const xp = Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<SkillId, number>;
  const levelFns = new Set<(s: SkillId, level: number) => void>();
  let lastSave = 0;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const level = (s: SkillId): number => {
    let L = 0;
    while (L < SKILL.maxLevel && xp[s] >= threshold(L + 1)) L++;
    return L;
  };

  const load = (v: Partial<Record<SkillId, number>>): void => {
    for (const s of SKILLS) xp[s] = v[s] ?? 0;
  };

  const flush = (): void => {
    saveTimer = null;
    if (!host) return;
    lastSave = Date.now();
    host.apply({ kind: 'set-skills', skills: { ...xp } });
  };

  const scheduleSave = (): void => {
    if (!host || saveTimer !== null) return;
    const wait = Math.max(0, lastSave + SAVE_EVERY_MS - Date.now());
    saveTimer = setTimeout(flush, wait);
  };

  const gain = (s: SkillId, kind: 'easy' | 'hard' | 'fail', mul = 1): void => {
    const base = kind === 'easy' ? SKILL.xpEasy : kind === 'hard' ? SKILL.xpHard : SKILL.xpHard / 2;
    const before = level(s);
    xp[s] += base * mul;
    const after = level(s);
    for (let l = before + 1; l <= after; l++) {
      bus.emit('skill-up', { skill: s, level: l });
      for (const fn of [...levelFns]) fn(s, l);
    }
    scheduleSave();
  };

  const timeMul = (s: SkillId): number => 1 - SKILL.timePerLevel * level(s);
  const failChance = (s: SkillId, need: number): number => SKILL.failPerLevel * Math.max(0, need - level(s));

  const onLevel = (fn: (s: SkillId, level: number) => void): (() => void) => {
    levelFns.add(fn);
    return () => { levelFns.delete(fn); };
  };

  const sys: SkillSystem = { xp, level, gain, timeMul, failChance, load, onLevel };

  if (host) {
    load(host.world.players[host.me]?.skills ?? {});
    bus.on('world-loaded', () => load(host.world.players[host.me]?.skills ?? {}));
  }

  // Bus hooks (roadmap 8.13 table).
  bus.on('climbed', (e) => gain('climbing', e.height >= 9 ? 'hard' : 'easy'));
  bus.on('hatless-destroyed', () => gain('melee', 'easy'));
  bus.on('recipe-done', (e) => {
    if (e.recipe === 'boil-water') gain('cooking', e.ok ? 'easy' : 'fail');
    else if (e.recipe === 'salt-wash' || e.recipe === 'spirit-wash' || e.recipe === 'scrape-seal' || e.recipe === 'mend-glaze') {
      gain('glazing', e.ok ? 'easy' : 'fail');
    }
  });
  bus.on('container-opened', () => gain('foraging', 'easy'));
  bus.on('talked', (e) => { if (e.verb === 'trade' && e.ok) gain('bartering', 'easy'); });
  bus.on('piece-built', (e) => {
    const kind = String(e.kind);
    if (WOOD_PIECES.has(kind)) gain('carpentry', 'hard');
    else if (STONE_PIECES.has(kind)) gain('masonry', 'hard');
  });
  bus.on('harvested', () => gain('gardening', 'hard'));
  bus.on('trap-sprung', () => gain('trapping', 'easy'));
  bus.on('quest-done', () => {
    if (!host) return;
    const me = host.me;
    const player = host.world.players[me];
    const rank = player?.faction != null ? host.world.factions[player.faction]?.ranks[me] : undefined;
    if (rank === 'warden' || rank === 'voice') gain('leadership', 'easy');
  });

  return sys;
}
