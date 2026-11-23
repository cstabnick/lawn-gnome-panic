// Dialogue phrases (quests.md). Step 0 stub: one line; roadmap 7.4 fills the table.
import type { PhraseLine } from './types';

export const PHRASES: Record<string, readonly string[]> = { 'greet.neutral': ['{name} nods.'] };

export function renderLine(line: PhraseLine, pick: number): string {
  const options = PHRASES[line.key] ?? [line.key];
  const text = options[Math.abs(pick) % options.length];
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in line.vars ? String(line.vars[k]) : m));
}
export function renderLines(lines: readonly PhraseLine[], seed: number): string[] {
  return lines.map((l, i) => renderLine(l, seed + i));
}
