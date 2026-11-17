// Descent perks (attributes): what each one is, and how the owned levels change the board's tuning.
import { ASSIST, TUNE } from '../config';
import type { PerkDef, PerkId } from './types';

export const PERKS: Record<PerkId, PerkDef> = {
  quickFeet: { name: 'Quick Feet', desc: '+15% push acceleration, +10% top push speed per level', max: 3 },
  bigPop: { name: 'Big Pop', desc: '+8% ollie height per level', max: 3 },
  whirlwind: { name: 'Whirlwind', desc: '+10% spin and flip speed per level', max: 3 },
  stickyBoots: { name: 'Sticky Boots', desc: '+12% landing tolerance, tricks finish sooner per level', max: 3 },
  aetherLungs: { name: 'Aether Lungs', desc: '-20% boost drain, +10% boost push per level', max: 3 },
  bounceBack: { name: 'Bounce Back', desc: '-20% bail time, +15% speed kept on a bail per level', max: 3 },
  grindWax: { name: 'Grind Wax', desc: '+20% grind snap and ley push, +8% ley top speed per level', max: 3 },
  showboat: { name: 'Showboat', desc: '+15% banked hill score per level', max: 3 },
  luckyHat: { name: 'Lucky Hat', desc: 'A crash shield at the start of every hill per level', max: 2 },
  thickSkull: { name: 'Thick Skull', desc: '+1 max life and +1 life', max: 1 },
  // Landing perks (ASSIST in config.ts; effects filled in by the landing-perks issue).
  guardianGnome: { name: 'Guardian Gnome', desc: 'Once per hill per level, a landing that would bail is saved', max: 2 },
  softKnees: { name: 'Soft Knees', desc: '+15% landing tolerance on big airs (1 s+) per level', max: 3 },
  daredevil: { name: 'Daredevil', desc: '+50% Close Call points per level (clean landings right by a hazard)', max: 3 },
};

/** Every perk id, in a fixed order (for seeded picks). */
export const PERK_IDS = Object.keys(PERKS) as PerkId[];

// The tuning as it was when this module loaded. applyPerks restores it before applying the owned levels.
const BASE: Record<string, number> = { ...TUNE };
const T = TUNE as unknown as Record<string, number>;

/** Set config.ts TUNE from its base values and the owned perk levels. applyPerks({}) restores the base values. */
export function applyPerks(perks: Partial<Record<PerkId, number>>): void {
  for (const key of Object.keys(BASE)) T[key] = BASE[key];
  const lv = (id: PerkId): number => perks[id] ?? 0;
  const mul = (key: string, factor: number): void => {
    T[key] *= factor;
  };

  const quick = lv('quickFeet');
  mul('pushAccel', 1 + 0.15 * quick);
  mul('pushMax', 1 + 0.10 * quick);

  const pop = lv('bigPop');
  mul('ollieMin', 1 + 0.08 * pop);
  mul('ollieMax', 1 + 0.08 * pop);

  const whirl = lv('whirlwind');
  mul('spinRate', 1 + 0.10 * whirl);
  mul('flipRate', 1 + 0.10 * whirl);

  const sticky = lv('stickyBoots');
  mul('landYawTol', 1 + 0.12 * sticky);
  mul('landFlipTol', 1 + 0.12 * sticky);
  mul('landTrickDone', 1 - 0.06 * sticky);

  const lungs = lv('aetherLungs');
  mul('boostDrain', 1 - 0.20 * lungs);
  mul('boostAccel', 1 + 0.10 * lungs);

  const back = lv('bounceBack');
  mul('bailTime', 1 - 0.20 * back);
  T.bailKeep += 0.15 * back;

  const wax = lv('grindWax');
  mul('grindSnap', 1 + 0.20 * wax);
  mul('leyAccel', 1 + 0.20 * wax);
  mul('leyMax', 1 + 0.08 * wax);

  // Landing perks. ASSIST.landSaves is not set here: the app refills it per hill from guardianGnome.
  ASSIST.bigAirTol = 1 + 0.15 * lv('softKnees');
  ASSIST.closeCall = 1 + 0.5 * lv('daredevil');
}
