// E24 chef: the diner menu, tickets and star rules (STUB: filled by its E24 issue). Pure: no DOM, no three.js.
import type { TimeLabel } from '../../atmosphere';
import type { Stars } from '../../jobs/workDefs';
import type { Dish, DishId, Ticket } from './types';

/** The eight dishes (side-quest-schedule.md section 4). */
export const DISHES = {} as Record<DishId, Dish>;

/** Sage Ladle's lines (she says little). */
export const SAGE_LINES: { start: string[]; good: string[]; walkout: string[]; rush: string[]; end: string[] } = {
  start: ['Tickets on the rail. Bell when it is up.'], good: ['Good.'], walkout: ['They left.'], rush: ['Coach is in.'], end: ['Off you go.'],
};

/** Dishes unlocked at a chef level (dish.level <= level), in DISH_IDS order. */
export function dishesForLevel(level: number): DishId[] { void level; return []; }

/** A shift's tickets: 8 (12 when rush), seeded and deterministic. */
export function makeTickets(level: number, rush: boolean, seed: number): Ticket[] { void level; void rush; void seed; return []; }

/** Stars for a served ticket: the mean step score (0..100) less a wait penalty. */
export function ticketStars(stepScores: readonly number[], waited: number, patience: number): Stars {
  void stepScores; void waited; void patience; return 3;
}

/** Rush hour: Noon and Dusk. */
export function isRush(label: TimeLabel | null): boolean { return label === 'Noon' || label === 'Dusk'; }
