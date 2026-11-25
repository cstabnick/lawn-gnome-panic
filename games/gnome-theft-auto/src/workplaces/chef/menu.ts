// E24 chef: the diner menu, tickets and star rules. Pure: no DOM, no three.js.
import type { TimeLabel } from '../../atmosphere';
import { starsForScore, type Stars } from '../../jobs/workDefs';
import type { CookStep, Dish, DishId, Ticket } from './types';
import { DISH_IDS } from './types';

// Step helpers: the seconds allowance follows the widget rules (chop 0.6 s a tap + 1, stir 2.2 s a circle, pour 4,
// heat 4, flip 3 a flip, plate 1.5 a item + 1).
const chop = (label: string, n: number, emoji: string): CookStep => ({ kind: 'chop', label, target: n, seconds: 0.6 * n + 1, emoji });
const stir = (label: string, n: number, emoji: string): CookStep => ({ kind: 'stir', label, target: n, seconds: 2.2 * n, emoji });
const pour = (label: string, fill: number, emoji: string): CookStep => ({ kind: 'pour', label, target: fill, seconds: 4, emoji });
const heat = (label: string, at: number, emoji: string): CookStep => ({ kind: 'heat', label, target: at, seconds: 4, emoji });
const flip = (label: string, n: number, emoji: string): CookStep => ({ kind: 'flip', label, target: n, seconds: 3 * n, emoji });
const plate = (label: string, n: number, emoji: string): CookStep => ({ kind: 'plate', label, target: n, seconds: 1.5 * n + 1, emoji });

/** The eight dishes (side-quest-schedule.md section 4). */
export const DISHES: Record<DishId, Dish> = {
  'acorn-cake': {
    id: 'acorn-cake', name: 'Acorn-Flour Cake', emoji: '🍰', prefab: 'diner-acorn-cake', level: 1, heal: 0.35,
    blurb: 'Two layers, one acorn each. Sage says the second acorn is for luck.',
    steps: [
      pour('Pour the flour', 0.6, '🌾'),
      stir('Stir the batter', 3, '🥣'),
      heat('Bake it, not too long', 0.55, '🔥'),
      plate('Plate the cake', 3, '🌰'),
    ],
  },
  'dew-clover': {
    id: 'dew-clover', name: 'Dew-Poached Clover', emoji: '🍀', prefab: 'diner-dew-clover', level: 1, heal: 0.15,
    blurb: 'Light, green, and it does not ask where the dew came from.',
    steps: [
      chop('Chop the clover', 5, '🍀'),
      pour('Pour the dew', 0.4, '💧'),
      plate('Plate the clover', 3, '🍀'),
    ],
  },
  'root-stew': {
    id: 'root-stew', name: 'Grub-Free Root Stew', emoji: '🍲', prefab: 'diner-root-stew', level: 2, heal: 0.45,
    blurb: 'GRUB-FREE. Do not ask.',
    steps: [
      chop('Chop the roots', 8, '🥕'),
      stir('Stir the pot', 4, '🥣'),
      heat('Bring it to a simmer', 0.7, '🔥'),
    ],
  },
  'acorn-toastie': {
    id: 'acorn-toastie', name: 'Toasted Acorn Toastie', emoji: '🥪', prefab: 'diner-acorn-toastie', level: 2, heal: 0.3,
    blurb: 'Cracked acorn, pressed flat, toasted on both sides. Mind the crunch.',
    steps: [
      chop('Chop the acorns', 4, '🌰'),
      flip('Flip the toastie', 2, '🥪'),
      plate('Plate the toastie', 2, '🥪'),
    ],
  },
  'dandelion-fritters': {
    id: 'dandelion-fritters', name: 'Dandelion Fritters', emoji: '🌼', prefab: 'diner-dandelion-fritters', level: 3, heal: 0.3,
    blurb: 'Golden, crisp, and the seeds stay in the lawn where they belong.',
    steps: [
      chop('Chop the dandelions', 6, '🌼'),
      pour('Pour the batter', 0.5, '🥣'),
      flip('Flip the fritters', 3, '🍳'),
      plate('Plate the fritters', 4, '🌼'),
    ],
  },
  'mushroom-coffee': {
    id: 'mushroom-coffee', name: 'Mushroom Coffee', emoji: '☕', prefab: 'diner-mushroom-coffee', level: 3, heal: 0.2,
    blurb: 'Strong. Earthy. Keeps the eyes open through the whole shift.',
    steps: [
      heat('Warm the brew', 0.4, '🔥'),
      pour('Pour the coffee', 0.85, '☕'),
    ],
  },
  'mulch-chilli': {
    id: 'mulch-chilli', name: 'Mulch-Bean Chilli', emoji: '🌶️', prefab: 'diner-mulch-chilli', level: 4, heal: 0.5,
    blurb: 'Hot enough that the mulch stops being an argument.',
    steps: [
      chop('Chop the peppers', 6, '🌶️'),
      stir('Stir the mulch beans', 5, '🥣'),
      heat('Simmer it hard', 0.8, '🔥'),
      plate('Plate the chilli', 2, '🌶️'),
    ],
  },
  'pie-of-the-day': {
    id: 'pie-of-the-day', name: 'Pie of the Day', emoji: '🥧', prefab: 'diner-pie-of-the-day', level: 5, heal: 0.6,
    blurb: 'Whatever is ripe. Sage will not say what it is until you have eaten it.',
    steps: [
      pour('Pour the filling', 0.7, '🫐'),
      plate('Plate the pie', 5, '🥧'),
      heat('Bake the crust', 0.6, '🔥'),
      chop('Slice it', 4, '🥧'),
    ],
  },
};

/** Sage Ladle's lines (she says little). */
export const SAGE_LINES: { start: string[]; good: string[]; walkout: string[]; rush: string[]; end: string[] } = {
  start: [
    'Tickets on the rail. Bell when it is up.',
    'Bell\'s there. Use it.',
    'Hands clean. Knife sharp. Go.',
    'Orders come in, orders go out. That is the whole job.',
    'Watch the pass.',
  ],
  good: ['Good.', 'Hot and on the pass. That is how it goes.', 'Frank says thanks. Frank does not say thanks.', 'Plate it like you mean it.', 'Again.'],
  walkout: [
    'They walked. Soup does not wait and neither do they.',
    'Lost that one. Next.',
    'Too slow. Eyes on the rail.',
    'Not every order survives the wait. Keep moving.',
  ],
  rush: [
    'Coach is in. Coach always wants it yesterday.',
    'Rush. Stay on the board.',
    'Everybody wants it now. Everything takes as long as it takes.',
    'Frank wants it hot. Frank always wants it hot.',
  ],
  end: ['Off you go.', 'Clean pass. Get some rest.', 'Your apron goes on the hook. Same time tomorrow.', 'Soup\'s on the house.'],
};

/** Dishes unlocked at a chef level (dish.level <= level), in DISH_IDS order. */
export function dishesForLevel(level: number): DishId[] {
  return DISH_IDS.filter((id) => DISHES[id].level <= level);
}

/** Small seeded PRNG (mulberry32): a float in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUSTOMERS = ['Fence-Post Frank', 'Booth 1', 'Booth 2', 'Booth 3', 'the counter', 'a trucker', 'a gnome in a hurry', 'a regular'];

/** A shift's tickets: 8 (12 when rush), seeded and deterministic. */
export function makeTickets(level: number, rush: boolean, seed: number): Ticket[] {
  const rand = mulberry32(seed);
  const pool = dishesForLevel(level);
  const count = rush ? 12 : 8;
  const from = rush ? [...CUSTOMERS, 'the coach'] : CUSTOMERS;
  const tickets: Ticket[] = [];
  let arrive = 0;
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      // Rush tickets come every 7 s, normal ones every 14 s, with +-2 s jitter; never earlier than the last one.
      const gap = (rush ? 7 : 14) + (rand() * 4 - 2);
      arrive = Math.max(arrive, arrive + gap);
    }
    const roll = rand();
    const dishCount = roll < 0.6 ? 1 : roll < 0.9 ? 2 : level >= 3 ? 3 : 2;
    const dishes: DishId[] = [];
    for (let d = 0; d < dishCount; d++) {
      // At most one pie per ticket.
      const choices = dishes.includes('pie-of-the-day') ? pool.filter((id) => id !== 'pie-of-the-day') : pool;
      dishes.push(choices[Math.floor(rand() * choices.length)]);
    }
    const patience = (45 + 15 * dishCount) * (rush ? 0.8 : 1);
    tickets.push({
      id: i + 1,
      dishes,
      from: from[Math.floor(rand() * from.length)],
      patience,
      arriveAt: arrive,
    });
  }
  return tickets;
}

/** Stars for a served ticket: the mean step score (0..100) less a wait penalty. */
export function ticketStars(stepScores: readonly number[], waited: number, patience: number): Stars {
  const mean = stepScores.length ? stepScores.reduce((s, v) => s + v, 0) / stepScores.length : 0;
  const late = patience > 0 ? waited / patience : 0;
  const penalty = Math.max(0, late - 0.5) * 40;
  return starsForScore(mean - penalty);
}

/** Rush hour: Noon and Dusk. */
export function isRush(label: TimeLabel | null): boolean { return label === 'Noon' || label === 'Dusk'; }
