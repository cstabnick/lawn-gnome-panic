// Places from scores, as MinigameDef.result returns them: places[seat], 0 = 1st, ties share the better place.

/** null scores (a foul, no mark, DNF) come after every real score and share a place with each other. */
export function placesFrom(scores: readonly (number | null)[], higherIsBetter: boolean): number[] {
  const better = (a: number | null, b: number | null): boolean => {
    if (a === null) return false;
    if (b === null) return true;
    return higherIsBetter ? a > b : a < b;
  };
  return scores.map((v) => scores.filter((w) => better(w, v)).length);
}

/** The best real mark of a list (highest, or lowest when !higherIsBetter), or null if there is none. */
export function bestMark(marks: readonly (number | null)[], higherIsBetter = true): number | null {
  let best: number | null = null;
  for (const m of marks) if (m !== null && (best === null || (higherIsBetter ? m > best : m < best))) best = m;
  return best;
}
