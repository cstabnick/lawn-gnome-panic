import { BASE_STATS, META_UPGRADES, PASSIVE_DEFS, type MetaSave, type MetaUpgradeId, type PassiveId, type PlayerStats, type RunState } from './config';

/** Combines base stats, meta upgrades and (if given) the run's passives. Pure. */
export function computeStats(save: MetaSave, run: RunState | null): PlayerStats {
  const base = BASE_STATS;
  const up = (id: MetaUpgradeId): number => {
    const def = META_UPGRADES.find((d) => d.id === id);
    return def ? save.upgrades[id] * def.perLevel : 0;
  };
  const pas = (id: PassiveId): number => (run?.passives[id] ?? 0) * PASSIVE_DEFS[id].perLevel;

  const moveSpeed = (base.moveSpeed + up('moveSpeed')) * (1 + pas('comfyBoots') + pas('pricklyPear'));
  const lvl = (id: PassiveId): number => run?.passives[id] ?? 0;

  return {
    ...base,
    moveSpeed,
    staminaMax: base.staminaMax + up('sprintDuration') + pas('sneakers') + 0.4 * lvl('pricklyPear'),
    staminaRegenPerSec: base.staminaRegenPerSec + up('sprintRecharge'),
    staminaRegenDelayS: Math.max(0.2, base.staminaRegenDelayS - 0.15 * save.upgrades.sprintRecharge),
    jumpSpeed: base.jumpSpeed + up('jumpHeight'),
    maxHearts: base.maxHearts + up('hearts') + pas('thickBeard'),
    magnetRadius: base.magnetRadius + up('magnet') + pas('rake') + 0.5 * lvl('boloTie'),
    xpMultiplier: base.xpMultiplier + up('wisdom'),
    rerolls: base.rerolls + up('luck'),
    damageMult: base.damageMult + pas('fertilizer') + pas('boloTie'),
    cooldownMult: Math.max(0.5, base.cooldownMult - pas('compost')),
    acornLuck: base.acornLuck + pas('luckyClover'),
    invulnBonusS: base.invulnBonusS + pas('mulchArmor'),
  };
}
