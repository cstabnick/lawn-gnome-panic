// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E7). Keep the exported signature.
import type { Plugin } from 'vite';

export interface LevelApiOptions {
  /** Absolute path of the repo root. */
  repo: string;
  /** Absolute path of games/gnomes-of-gnomomia/src/data/levels. */
  levelsDir: string;
}

export function levelApi(_opts: LevelApiOptions): Plugin {
  return { name: 'level-api' };
}
