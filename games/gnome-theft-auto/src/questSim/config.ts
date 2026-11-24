// Quest sim limits. MAX_SIM_PLAYERS is a hard cap (user requirement): never more than 6 sim players (quest runs,
// headless browser pages, worker processes) alive at once, in either layer. `--parallel N` may only lower it.

export const MAX_SIM_PLAYERS = 6;

/** The parallelism to use for a requested `--parallel` value: 1..MAX_SIM_PLAYERS (missing / bad -> the cap). */
export function simParallel(requested?: number | string | null): number {
  const n = Math.floor(Number(requested));
  if (!Number.isFinite(n) || n < 1) return MAX_SIM_PLAYERS;
  return Math.min(n, MAX_SIM_PLAYERS);
}
