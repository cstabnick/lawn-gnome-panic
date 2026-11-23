// Dialogue text speed (Options > Dialogue): how fast subtitles type out, kept per browser. Reading hold: 238 words per
// minute (an average adult silent-reading speed) with a 1.5 s minimum. Changing it fires `gta:text-speed`.
import type { LineTiming } from './script';

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export const TEXT_SPEEDS: readonly TextSpeed[] = ['slow', 'normal', 'fast', 'instant'];

const KEY = 'gta.textSpeed';
/** Characters typed per second at each setting. */
export const CHARS_PER_SECOND: Record<TextSpeed, number> = { slow: 22, normal: 40, fast: 75, instant: Infinity };
export const READING_WPM = 238;
export const MIN_HOLD_S = 1.5;

export function getTextSpeed(): TextSpeed {
  try {
    const v = localStorage.getItem(KEY);
    if (v && (TEXT_SPEEDS as readonly string[]).includes(v)) return v as TextSpeed;
  } catch {
    /* storage blocked */
  }
  return 'normal';
}

export function setTextSpeed(s: TextSpeed): void {
  try {
    localStorage.setItem(KEY, s);
  } catch {
    /* per-session only */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gta:text-speed'));
}

/** Words in a line (runs of non-space characters). */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Reading hold after a line has typed out: words at 238 wpm, at least 1.5 s. */
export function holdSeconds(text: string): number {
  return Math.max(MIN_HOLD_S, (wordCount(text) * 60) / READING_WPM);
}

/** Seconds the typing takes at a speed (0 for 'instant'). */
export function typeSeconds(text: string, speed: TextSpeed = getTextSpeed()): number {
  const cps = CHARS_PER_SECOND[speed];
  return Number.isFinite(cps) ? text.length / cps : 0;
}

/** The LineTiming the timeline compiles with. */
export function lineTiming(speed: TextSpeed = getTextSpeed()): LineTiming {
  return { charsPerSecond: CHARS_PER_SECOND[speed], holdSeconds };
}
