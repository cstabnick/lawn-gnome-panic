// E24 workplace jobs (chef, mechanic, comedy stage): the job table, level titles, pay and achievement ids. Pure data and
// pure functions (tweak here). Runtimes live in src/workplaces/. Career records share 'gta-jobs-v1' (career.ts
// recordShift). Lore: docs/lore/entries/apocrypha/ (sage-ladle, route-south-acorn-diner, pay-n-glaze, le-petit-groan).
import { MAX_LEVEL } from './defs';
import type { PayResult, WorkJobId } from './types';

export interface WorkJobDef {
  id: WorkJobId;
  title: string;
  icon: string;
  employer: string;
  /** Who hands out the work (a lore character). */
  giver: string;
  blurb: string;
  /** Map/HUD colour. */
  color: string;
  /** Where the Jobs app routes the player ("Show me"), world x/z, and its name. */
  place: { name: string; x: number; z: number };
  /** Level titles, index 0 = level 1 (MAX_LEVEL entries). */
  levelTitles: readonly string[];
  /** The achievement whose reward is this job's uniform. */
  uniform: { achievement: string; prefab: string };
  /** What one pay unit is called on the shift card ("ticket", "car", "set"). */
  unit: string;
}

export const WORK_JOBS: Record<WorkJobId, WorkJobDef> = {
  chef: {
    id: 'chef', title: 'Chef', icon: '🍳', employer: 'Route South Acorn Diner', giver: 'Sage Ladle',
    blurb: 'Work the pass at the Acorn Diner on Route South: tickets in, chop, stir, plate, ring the bell.',
    color: '#ffb347', place: { name: 'Route South Acorn Diner', x: 9, z: 252 },
    levelTitles: ['Dishwasher', 'Line Cook', 'Fry Cook', 'Sous', 'Head Cook', 'Legend of the Pass'],
    uniform: { achievement: 'gta-job-chef', prefab: 'diner-chef-toque' },
    unit: 'ticket',
  },
  mechanic: {
    id: 'mechanic', title: 'Mechanic', icon: '🔧', employer: "Pay 'n' Glaze", giver: 'Chrome-Knuckle Cass',
    blurb: "Clients bring their mowers to Pay 'n' Glaze with a brief. Glaze it to the brief, inside their budget.",
    color: '#ff3b9a', place: { name: "Pay 'n' Glaze work-order board", x: 90, z: 132 },
    levelTitles: ['Tyre Gnome', 'Spanner Hand', 'Bay Tech', 'Customs Tech', 'Head of Glaze', 'Chrome Legend'],
    uniform: { achievement: 'gta-job-mechanic', prefab: 'glaze-shop-overalls-cap' },
    unit: 'car',
  },
  comedy: {
    id: 'comedy', title: 'Comedian', icon: '🎤', employer: 'Le Petit Groan', giver: 'Mireille Sans-Rire',
    blurb: 'Stand-up in a Pardonlin cellar. You do not tell the jokes. Your gnome does. Nobody laughs. It pays (barely).',
    color: '#c77dff', place: { name: 'Le Petit Groan (Grand Platz)', x: -1500, z: -200 },
    levelTitles: ['Open Mic', 'Opener', 'Feature Act', 'Headliner', 'Cult Disappointment', 'Legend of Silence'],
    uniform: { achievement: 'gta-job-comedian', prefab: 'open-mic-bowtie' },
    unit: 'set',
  },
  // E25 jobs III (docs/roadmaps/gta-batch-3/E25/). Places are the site anchors (sites.ts): bin-depot gate,
  // fire-station apron, gnomazon-fc door.
  garbage: {
    id: 'garbage', title: 'Bin Crew', icon: '🗑️', employer: 'Turfton Bin Depot', giver: 'Mags Wheelie',
    blurb: 'Drive the Bin Lorry down the kerbs, lift every bin, empty it, set it down neat. Spill nothing. The HOA is watching.',
    color: '#5bbf4a', place: { name: 'Turfton Bin Depot (by the Compost Heap)', x: -218, z: -89 },
    levelTitles: ['Bin Hopper', 'Kerb Runner', 'Lift-Arm Hand', 'Round Leader', 'Depot Chief', 'Lord of the Lids'],
    uniform: { achievement: 'gta-job-bin-day', prefab: 'bin-crew-cap' },
    unit: 'bin',
  },
  firefighter: {
    id: 'firefighter', title: 'Firefighter', icon: '🚒', employer: 'Turfton Fire Station No. 1', giver: 'Chief Hydra Pumpwell',
    blurb: 'Answer the bell in the Watering-Can Pumper. Bins, sheds, barbecues, the odd toadstool. Hose it, ladder it, go home damp.',
    color: '#e8432c', place: { name: 'Fire Station No. 1 (Mossy Wood edge)', x: -221, z: 135 },
    levelTitles: ['Probationer', 'Hose Hand', 'Pump Operator', 'Ladder Lead', 'Watch Captain', 'Chief of the Brigade'],
    uniform: { achievement: 'gta-job-hose-gnome', prefab: 'brass-fire-helmet' },
    unit: 'call',
  },
  gnomazon: {
    id: 'gnomazon', title: 'Gnomazon Associate', icon: '📦', employer: 'Gnomazon FC-1', giver: 'KPI-9 ("Kippy")',
    blurb: 'Pick it, box it, tape it, label it, send it. Beat the quota. Kippy the manager-bot believes in you, numerically.',
    color: '#f5a524', place: { name: 'Gnomazon Fulfilment Centre FC-1 (Dust Flats)', x: 283, z: 84 },
    levelTitles: ['Seasonal Associate', 'Associate', 'Associate II', 'Senior Associate', 'Associate Lead', 'Associate (Gold)'],
    uniform: { achievement: 'gta-job-fulfilled', prefab: 'gnomazon-lanyard' },
    unit: 'parcel',
  },
};

/** Pay per job: per unit by level (index 0 = level 1), tips per star over three, XP per unit. */
export const WORK_PAY: Record<WorkJobId, { perUnit: readonly number[]; tipPerStarOver3: number; xpPerUnit: number }> = {
  // The side-quest schedule: Dishwasher 8 ... Head Cook 26 a ticket, tips 0-6 per star over the third, 8 tickets a shift.
  chef: { perUnit: [8, 11, 15, 20, 26, 30], tipPerStarOver3: 3, xpPerUnit: 12 },
  mechanic: { perUnit: [40, 50, 62, 76, 92, 110], tipPerStarOver3: 12, xpPerUnit: 60 },
  // It pays (barely). Hazard pay per tomato comes in as `bonus`.
  comedy: { perUnit: [6, 7, 8, 9, 10, 12], tipPerStarOver3: 0, xpPerUnit: 70 },
  // A round is 6-14 bins: about 40-60 Acorns at level 1, 150+ at the top. Neat set-downs tip; spills come off as a fine.
  garbage: { perUnit: [4, 5, 6, 8, 10, 12], tipPerStarOver3: 1.5, xpPerUnit: 12 },
  // One call per shift card (1-3 fires and maybe a rescue). Rescue pay comes in as `bonus`.
  firefighter: { perUnit: [30, 38, 48, 60, 74, 90], tipPerStarOver3: 6, xpPerUnit: 70 },
  // Gnomazon does not tip. The quota bonus comes in as `bonus`.
  gnomazon: { perUnit: [3, 4, 5, 6, 7, 8], tipPerStarOver3: 0, xpPerUnit: 9 },
};

/** E25 garbage: Acorns of HOA litter citation per spilled bin (taken off as a negative bonus). */
export const SPILL_FINE = 5;
/** E25 firefighter: Acorns per gnome (or cat) brought down the ladder. */
export const RESCUE_PAY = 15;
/** E25 Gnomazon: Acorns for beating the shift quota. */
export const QUOTA_BONUS = 15;

/** Comedy hazard pay, Acorns per tomato taken on stage. */
export const TOMATO_HAZARD_PAY = 2;

/** Base pay multiplier by stars (index = stars). */
const STAR_MULT = [0, 0.5, 0.75, 1, 1.1, 1.25];

export type Stars = 1 | 2 | 3 | 4 | 5;

/** Clamp any number to 1..5 stars. */
export function toStars(n: number): Stars {
  return Math.max(1, Math.min(5, Math.round(Number.isFinite(n) ? n : 1))) as Stars;
}

/** Stars from a 0..100 score: >= 90 five, >= 75 four, >= 55 three, >= 35 two, else one. */
export function starsForScore(score: number): Stars {
  return score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;
}

/** The title of `job` at `level` (1..MAX_LEVEL). */
export function workTitle(job: WorkJobId, level: number): string {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return WORK_JOBS[job].levelTitles[l - 1];
}

/** Board perk lines at `level`. */
export function workPerkLines(job: WorkJobId, level: number): string[] {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const lines = [`${workTitle(job, l)}: ${WORK_PAY[job].perUnit[l - 1]} 🌰 a ${WORK_JOBS[job].unit}`];
  if (l >= 2) lines.push('Tips +10%');
  if (l >= 5) lines.push('Tips +20%');
  return lines;
}

/**
 * Pay for one shift: one entry of `units` per ticket served / car handed back / set finished, each with its stars.
 * base = sum(perUnit[level-1] * STAR_MULT[stars]); tip = sum(max(0, stars - 3) * tipPerStarOver3) * tipMult
 * (1, +0.1 at level >= 2, +0.1 at level >= 5); bonus is added as given (rush, hazard pay); xp = sum(xpPerUnit + 2 * stars).
 * stars = the rounded mean (1 when there are no units). total = max(0, round(base + tip + bonus)).
 */
export function workPay(job: WorkJobId, level: number, units: readonly { stars: number }[], bonus = 0, bonusNote?: string): PayResult {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const p = WORK_PAY[job];
  const tipMult = 1 + (l >= 2 ? 0.1 : 0) + (l >= 5 ? 0.1 : 0);
  let base = 0;
  let tip = 0;
  let xp = 0;
  let starSum = 0;
  for (const u of units) {
    const s = toStars(u.stars);
    base += p.perUnit[l - 1] * STAR_MULT[s];
    tip += Math.max(0, s - 3) * p.tipPerStarOver3;
    xp += p.xpPerUnit + 2 * s;
    starSum += s;
  }
  tip *= tipMult;
  const stars = units.length ? toStars(starSum / units.length) : 1;
  const notes: string[] = [];
  const unit = WORK_JOBS[job].unit;
  notes.push(`${units.length} ${unit}${units.length === 1 ? '' : 's'} +${Math.round(base)}`);
  if (tip > 0) notes.push(`Tips +${Math.round(tip)}`);
  if (bonus !== 0) notes.push(`${bonusNote ?? 'Bonus'} ${bonus > 0 ? '+' : ''}${Math.round(bonus)}`);
  return {
    base: Math.round(base), time: 0, tip: Math.round(tip), bonus: Math.round(bonus),
    total: Math.max(0, Math.round(base + tip + bonus)), stars, xp: Math.round(xp), notes,
  };
}

/** Achievement ids (packages/achievements/src/catalog.ts), each with its own wearable reward. */
export const WORK_ACHIEVEMENTS = {
  /** 25 dishes served (target 25) -> head 'diner-chef-toque'. */
  chef: 'gta-job-chef',
  /** A whole shift (>= 6 tickets) with every ticket five stars -> neck 'pass-bell-medal'. */
  fiveStarRush: 'gta-job-five-star-rush',
  /** Serve every one of the eight dishes at least once -> hand 'golden-ladle'. */
  fullMenu: 'gta-job-full-menu',
  /** 5 client cars handed back (target 5) -> head 'glaze-shop-overalls-cap'. */
  mechanic: 'gta-job-mechanic',
  /** A client rates a car five stars -> hand 'torque-wrench-chrome'. */
  nailedBrief: 'gta-job-nailed-the-brief',
  /** Hand a car back that matches nothing in the brief (score < 20) -> hand 'paint-swatch-fan'. */
  creativeDifferences: 'gta-job-creative-differences',
  /** 3 sets performed to the end (target 3) -> neck 'open-mic-bowtie'. */
  comedian: 'gta-job-comedian',
  /** 10 tomatoes taken on stage in total (target 10) -> head 'tomato-splat-beret'. */
  tomatoes: 'gta-job-tomato-catcher',
  /** Double Down five times in one set -> hand 'squeaky-rubber-chicken'. */
  doubleDown: 'gta-job-double-down',
  // ---- E25 ----
  /** 50 bins emptied (target 50) -> head 'bin-crew-cap'. */
  binDay: 'gta-job-bin-day',
  /** A whole round of 8+ bins with no spill -> hand 'golden-bin-lid'. */
  notADrop: 'gta-job-not-a-drop',
  /** 25 bins set down perfectly neat (target 25) -> back 'bin-bag-backpack'. */
  kerbAppeal: 'gta-job-kerb-appeal',
  /** 20 fires put out (target 20) -> head 'brass-fire-helmet'. */
  hoseGnome: 'gta-job-hose-gnome',
  /** 5 rescues down the ladder (target 5) -> neck 'ladder-rescue-medal'. */
  ladderGnome: 'gta-job-ladder-gnome',
  /** Put out every kind of fire: bin, shed, barbecue, toadstool (target 4) -> hand 'brass-hose-nozzle'. */
  bbqSeason: 'gta-job-barbecue-season',
  /** 100 parcels packed (target 100) -> neck 'gnomazon-lanyard'. */
  fulfilled: 'gta-job-fulfilled',
  /** Beat the quota on a shift with every box the right size -> hand 'gnomazon-scanner'. */
  beatTheBot: 'gta-job-beat-the-bot',
  /** Stand idle at the packing station for 20 s during a shift while Kippy watches -> head 'cardboard-box-hat'. */
  timeOffTask: 'gta-job-time-off-task',
} as const;
