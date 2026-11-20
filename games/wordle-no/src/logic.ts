// Pure rules. The answer never changes.
export const ANSWER = 'NO';
export const COLS = ANSWER.length;
export const ROWS = 6;
export type Mark = 'correct' | 'present' | 'absent';

/** Standard Wordle marking, duplicates handled (greens first, then yellows while letters remain). */
export function scoreGuess(guess: string, answer = ANSWER): Mark[] {
  const g = guess.toUpperCase(); const a = answer.toUpperCase();
  const out: Mark[] = Array(g.length).fill('absent');
  const left: Record<string, number> = {};
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) out[i] = 'correct';
    else left[a[i]] = (left[a[i]] ?? 0) + 1;
  }
  for (let i = 0; i < g.length; i++) {
    if (out[i] === 'absent' && (left[g[i]] ?? 0) > 0) { out[i] = 'present'; left[g[i]]--; }
  }
  return out;
}

export const isWin = (marks: Mark[]) => marks.length === COLS && marks.every((m) => m === 'correct');

const EMOJI: Record<Mark, string> = { correct: '🟩', present: '🟨', absent: '⬛' };
export function shareText(day: number, rows: Mark[][], won: boolean): string {
  return `Wordle ${day} ${won ? rows.length : 'X'}/${ROWS}\n\n${rows.map((r) => r.map((m) => EMOJI[m]).join('')).join('\n')}`;
}

/** Wordle's own "praise" by guess count, plus a loss line. */
export function verdict(guesses: number, won: boolean): string {
  if (!won) return 'The answer was NO. It was always NO.';
  return ['Genius. It was NO.', 'Magnificent. No.', 'Impressive. No.', 'Splendid. No.', 'Great. No.', 'Phew. No.'][guesses - 1] ?? 'No.';
}
export const dayNumber = (now: Date) => Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000) - 18797;
