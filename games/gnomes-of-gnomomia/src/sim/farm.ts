// Farm model: one player of a level grinds one enemy kill after kill, and the report says how long a level takes,
// how fast skills rise, and how much faster it gets when kills the player did not make are credited to them (AI
// gnomes nearby: the kill-credit bug). Pure: no DOM, no randomness, reads only the formulas in src/economy.ts.
import type { ClassId } from '../config';
import { ENEMIES } from '../content';
import { ECONOMY } from '../data/economy';
import { killXpAt, skillCapAt, skillUseValue, skillUsesToNext, xpToNextLevel } from '../economy';
import { DEFAULT_PLAYER } from './economy';

export interface FarmSpec {
  enemy: string;            // ENEMIES id
  level: number;            // player level at the start
  hours?: number;           // default 1
  killSeconds?: number;     // per own kill; default DEFAULT_PLAYER.killSeconds[enemy rank]
  assistKillsPerMinute?: number; // extra kills credited to the player without their hits; default 0
  classId?: ClassId;        // hits per kill: DEFAULT_PLAYER.hitsPerNormalKill[classId]; default 'warden'
  skillStart?: number;      // weapon skill at the start; default Math.floor(0.8 * skillCapAt(level))
}

export interface FarmReport {
  enemy: string; enemyLevel: number; levelStart: number; levelEnd: number; hours: number; kills: number;
  xpPerKillStart: number; killsToNextStart: number; minutesToNextStart: number; xpPerHourStart: number;
  skillStart: number; skillEnd: number; skillCapEnd: number; skillUpsPerHour: number;
}

export function runFarm(spec: FarmSpec): FarmReport {
  const def = ENEMIES[spec.enemy];
  if (!def) throw new Error(`Unknown enemy '${spec.enemy}'`);
  const classId: ClassId = spec.classId ?? 'warden';
  const hours = spec.hours ?? 1;
  const ownSeconds = spec.killSeconds ?? DEFAULT_PLAYER.killSeconds[def.rank];
  const assistPerMin = spec.assistKillsPerMinute ?? 0;
  const hitsPerKill = DEFAULT_PLAYER.hitsPerNormalKill[classId];
  const levelCap = ECONOMY.levelCap;
  const levelStart = spec.level;
  const skillStart = spec.skillStart ?? Math.floor(0.8 * skillCapAt(levelStart));

  // Time per kill at the start, own and assisted together (the first level's pace).
  const rateStart = 1 / ownSeconds + assistPerMin / 60;
  const secondsPerKillStart = 1 / rateStart;
  const xpPerKillStart = killXpAt(def.level, def.rank, levelStart);
  const xpNeededStart = xpToNextLevel(levelStart);
  const killsToNextStart = xpPerKillStart > 0 ? Math.ceil(xpNeededStart / xpPerKillStart) : Infinity;
  const minutesToNextStart = killsToNextStart * secondsPerKillStart / 60;
  const xpPerHourStart = xpPerKillStart * 3600 / secondsPerKillStart;

  // Kill by kill, own and assisted kills interleaved by time.
  const end = hours * 3600;
  let level = levelStart;
  let xp = 0;
  let skill = skillStart;
  let uses = 0;
  let skillUps = 0;
  let kills = 0;
  let ownKills = 0;
  let assistKills = 0;
  for (;;) {
    const tOwn = (ownKills + 1) * ownSeconds;
    const tAssist = assistPerMin > 0 ? (assistKills + 1) * 60 / assistPerMin : Infinity;
    const own = tOwn <= tAssist;
    const t = own ? tOwn : tAssist;
    if (t > end) break;
    if (own) ownKills++; else assistKills++;
    kills++;

    // Every kill pays the player: level up while the XP covers the next level (carry the remainder).
    xp += killXpAt(def.level, def.rank, level);
    while (level < levelCap && xp >= xpToNextLevel(level)) {
      xp -= xpToNextLevel(level);
      level++;
    }
    if (level >= levelCap) xp = 0;

    // Only own kills train the weapon skill.
    if (own) {
      const cap = skillCapAt(level);
      for (let i = 0; i < hitsPerKill; i++) {
        uses += skillUseValue(skill, cap);
        while (skill < cap && uses >= skillUsesToNext(skill)) {
          uses -= skillUsesToNext(skill);
          skill++;
          skillUps++;
        }
      }
    }
  }

  const levelEnd = level >= levelCap ? levelCap : level + xp / xpToNextLevel(level);
  return {
    enemy: spec.enemy,
    enemyLevel: def.level,
    levelStart,
    levelEnd: Math.round(levelEnd * 100) / 100,
    hours,
    kills,
    xpPerKillStart,
    killsToNextStart,
    minutesToNextStart: Math.round(minutesToNextStart * 10) / 10,
    xpPerHourStart: Math.round(xpPerHourStart),
    skillStart,
    skillEnd: skill,
    skillCapEnd: skillCapAt(level),
    skillUpsPerHour: Math.round((skillUps / hours) * 10) / 10,
  };
}
