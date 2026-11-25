// E24 comedy: the pure show clock (STUB: filled by its E24 issue).
import type { Stars } from '../../jobs/workDefs';
import type { ComedySet, Heckler, ShowEvent } from './types';

export interface Show {
  /** Advance by dt seconds; returns the events that happened, in order. */
  step(dt: number): ShowEvent[];
  /** The player pressed Double Down: true when it was allowed now. */
  doubleDown(): boolean;
  /** Double Down is allowed now (right after a bad reaction, before the next line). */
  canDoubleDown(): boolean;
  cringe(): number;
  tomatoes(): number;
  doubleDowns(): number;
  done(): boolean;
  /** Stars for the set (commitment: finishing, doubling down, taking tomatoes). */
  stars(): Stars;
}

export function createShow(set: ComedySet, opts: { heckles: readonly string[]; hecklers: readonly Heckler[]; doubleDownLines: readonly string[]; seed: number }): Show {
  void set; void opts;
  return { step: () => [{ t: 'end' }], doubleDown: () => false, canDoubleDown: () => false, cringe: () => 0, tomatoes: () => 0, doubleDowns: () => 0, done: () => true, stars: () => 1 };
}
