// The music's tension (music-ui-and-tech.md 1.3): one number from what the player can sense (horde proximity, Calm and a
// recent fight), mapped to four levels with hysteresis, so a flicker never swaps layers. Pure.

export const LEVEL_ENTER = [0, 0.2, 0.45, 0.7] as const;
export const LEVEL_LEAVE = [0, 0.12, 0.37, 0.62] as const;
export const LEVEL_HOLD_S = 6;   // a level holds at least this long before it changes again

export type Level = 0 | 1 | 2 | 3;

export interface TensionInputs {
  hatlessNear: number;   // Hatless within 15 gm (the sim's count)
  calm: number;          // 0..100, 100 = fine
  fight: boolean;        // a hit or an attack in the last few seconds
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** target = max(0.9 * threat, 0.6 * fear, fight). threat is horde proximity; fear rises as Calm falls below 100. */
export function tensionTarget(i: TensionInputs): number {
  const threat = clamp01(i.hatlessNear / 3);
  const fear = clamp01((100 - i.calm) / 60);
  return Math.max(0.9 * threat, 0.6 * fear, i.fight ? 1 : 0);
}

/** The next level for a target: climb while the target clears the enter line, drop while it sits under the leave line. */
export function nextLevel(current: Level, target: number): Level {
  let level = current;
  while (level < 3 && target >= LEVEL_ENTER[level + 1]) level = (level + 1) as Level;
  while (level > 0 && target < LEVEL_LEAVE[level]) level = (level - 1) as Level;
  return level;
}

/** Per-key cooldowns on a clock the caller supplies (seconds). */
export interface Cooldowns {
  ready(key: string, now: number, seconds: number): boolean;
  mark(key: string, now: number): void;
}

export function createCooldowns(): Cooldowns {
  const last = new Map<string, number>();
  return {
    ready(key, now, seconds) {
      const t = last.get(key);
      return t === undefined || now - t >= seconds;
    },
    mark(key, now) { last.set(key, now); },
  };
}
