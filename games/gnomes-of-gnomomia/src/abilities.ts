// Abilities and the hotbar: what the player can use, its cooldowns and the resource bar.
// Slots 0-1 stay on Flare and Mend (castSpell). Other slots hold class ability ids.
import { PLAYER_ID, TUNING, UI, type AbilityDef, type Attribute, type DamageType, type Entity, type ItemDef, type School, type SkillId } from './config';
import { ENEMIES } from './content';
import { CLASSES } from './data/classes';
import { applyStatus, castSpell, combatRandom, dealDamage, enemyMitigation, hasStatus, healPlayer, isRangedWeapon, spellRank, wardOf, weaponReach } from './combat';
import { allEntities, getEntity } from './entities';
import { bus, say } from './events';
import { player, teleportPlayer } from './player';
import { damageFromSkill, power, typeMultiplier, weaponRange } from './rules';
import { effectiveAttribute, equippedStat, equippedWeapon, maxHp, maxMp, state } from './state';
import { talentRank } from './talents';

const RESOURCE_MAX = 100;
const GRIT_PER_HIT_DEALT = 8;
const GRIT_PER_HIT_TAKEN = 5;
const GRIT_DRAIN_PER_SECOND = 5;
/** Seconds without a hit before Grit starts to drain. */
const GRIT_DRAIN_DELAY = 5;
const FOCUS_REGEN_PER_SECOND = 14;
/** Burr Trap: arms after 1 s, catches the nearest enemy within 6 m, and lasts 20 s if nothing comes. */
const TRAP_ARM_SECONDS = 1;
const TRAP_RANGE = 6;
const TRAP_LIFE_SECONDS = 20;
const TRAP_STATUS_SECONDS = 4;

const GCD_SECONDS = 1.0;

let grit = 0;
let focus = 0;
let steadyBreathTimer = 0;
/** Seconds since the player last hit or was hit. */
let sinceCombat = Infinity;
/** Shared global cooldown between active class abilities (seconds). */
let gcdTimer = 0;
/** Ability id -> seconds left on its cooldown. Ready abilities are absent. */
const cooldowns: Record<string, number> = {};

interface Trap { x: number; z: number; age: number }
const traps: Trap[] = [];

/** Resets transient ability state (resources, cooldowns, traps) between headless simulation runs. */
export function resetAbilitiesState(): void {
  grit = 0;
  focus = 0;
  steadyBreathTimer = 0;
  sinceCombat = Infinity;
  gcdTimer = 0;
  for (const k of Object.keys(cooldowns)) delete cooldowns[k];
  traps.length = 0;
}

// Grit builds on hits dealt and taken. Listened to once, when this module loads.
bus.on('hit', (h) => {
  if (h.attacker === PLAYER_ID && h.target !== PLAYER_ID) {
    grit = Math.min(RESOURCE_MAX, grit + GRIT_PER_HIT_DEALT);
    sinceCombat = 0;
  }
  if (h.target === PLAYER_ID) {
    grit = Math.min(RESOURCE_MAX, grit + GRIT_PER_HIT_TAKEN);
    sinceCombat = 0;
  }
});

/** Abilities the player knows right now: class abilities by level, and talent-granted ones once their talent has a rank. Classless: none. */
export function knownAbilities(): AbilityDef[] {
  if (state.classId === null) return [];
  return CLASSES[state.classId].abilities.filter((a) =>
    a.fromTalent ? talentRank(a.fromTalent) >= 1 : a.level <= state.level,
  );
}

/** Uses the hotbar slot (0-based). Slot 0 is Flare, slot 1 is Mend. */
export function useHotbar(slot: number): void {
  if (slot === 0) {
    castSpell('flare');
    return;
  }
  if (slot === 1) {
    castSpell('mend');
    return;
  }
  if (player.dead) return;
  const id = state.hotbar[slot];
  if (!id) return;
  const ab = knownAbilities().find((a) => a.id === id);
  if (!ab) return;
  if (abilityCooldown(ab.id) > 0) {
    say(`${ab.name} is not ready yet.`, UI.bad);
    return;
  }
  if (ab.kind === 'summon') {
    say('Your beetle is still in Barkhollow.', UI.textDim);
    return;
  }
  if (ab.kind === 'passive') return;

  const target = currentTarget();
  const needsTarget = ab.kind === 'attack' || ab.kind === 'spell';
  const maxRange = Math.max(TUNING.spellRange, weaponReach());
  if (needsTarget && (!target || distanceToPlayer(target) > maxRange)) {
    say('Pick an enemy in range first.', UI.bad);
    return;
  }

  const res = resource();
  if (!spend(res.kind, ab.cost)) {
    say(`Not enough ${RESOURCE_LABEL[res.kind]}.`, UI.bad);
    return;
  }
  cooldowns[ab.id] = ab.cooldown;
  gcdTimer = GCD_SECONDS;

  switch (ab.kind) {
    case 'attack':
    case 'spell':
      if (target) strike(ab, target);
      break;
    case 'buff':
      if (ab.id === 'steady-breath') steadyBreathTimer = 10;
      else if (ab.status === 'marked' && target) applyStatus(target.id, ab.status, ab.statusSeconds ?? 20);
      else if (ab.status) applyStatus(PLAYER_ID, ab.status, ab.statusSeconds ?? 1);
      say(`${ab.name}!`, UI.good);
      break;
    case 'heal':
      // power is the fraction of max HP healed or absorbed (default 0).
      if (ab.status === 'glazed') {
        applyStatus(PLAYER_ID, 'glazed', ab.statusSeconds ?? 10, Math.round(maxHp() * (ab.power ?? 0)));
      } else {
        healPlayer(maxHp() * (ab.power ?? 0));
      }
      break;
    case 'move':
      dash(ab, target);
      break;
    case 'trap':
      traps.push({ x: player.position.x, z: player.position.z, age: 0 });
      say(`${ab.name} is set.`, UI.good);
      break;
  }
  bus.emit('changed', {});
}

/** Seconds left on an ability's cooldown (0 = ready). Includes shared GCD. */
export function abilityCooldown(id: string): number {
  return Math.max(cooldowns[id] ?? 0, gcdTimer);
}

/** The resource bar: the class's resource (mana while classless). */
export function resource(): { kind: 'grit' | 'focus' | 'mana'; value: number; max: number } {
  const kind = state.classId === null ? 'mana' : CLASSES[state.classId].resource;
  if (kind === 'grit') return { kind, value: grit, max: RESOURCE_MAX };
  if (kind === 'focus') return { kind, value: focus, max: RESOURCE_MAX };
  return { kind: 'mana', value: state.mp, max: maxMp() };
}

/** Per-frame ability timers: cooldowns, Grit drain, Focus regen and armed traps. */
export function updateAbilities(dt: number): void {
  gcdTimer = Math.max(0, gcdTimer - dt);
  for (const id of Object.keys(cooldowns)) {
    cooldowns[id] = Math.max(0, cooldowns[id] - dt);
    if (cooldowns[id] <= 0) delete cooldowns[id];
  }

  sinceCombat += dt;
  steadyBreathTimer = Math.max(0, steadyBreathTimer - dt);
  if (sinceCombat > GRIT_DRAIN_DELAY) grit = Math.max(0, grit - GRIT_DRAIN_PER_SECOND * dt);
  focus = Math.min(RESOURCE_MAX, focus + FOCUS_REGEN_PER_SECOND * (steadyBreathTimer > 0 ? 2 : 1) * dt);

  for (let i = traps.length - 1; i >= 0; i--) {
    const t = traps[i];
    t.age += dt;
    if (t.age < TRAP_ARM_SECONDS) continue;
    const victim = nearestEnemy(t.x, t.z, TRAP_RANGE);
    if (victim) {
      const w = weaponAverage();
      const dotPower = (w.avg * 0.8 * power(effectiveAttribute('agility')) * (1 + 0.15 * talentRank('warden-deep-cuts'))) / 6;
      applyStatus(victim.id, 'rooted', TRAP_STATUS_SECONDS);
      applyStatus(victim.id, 'chipped', TRAP_STATUS_SECONDS, dotPower);
      traps.splice(i, 1);
    } else if (t.age >= TRAP_LIFE_SECONDS) {
      traps.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------- passive talents

export type PassiveKind = 'damagePct' | 'hpPct' | 'reductionPct' | 'swingPct' | 'defense' | 'critRange' | 'critDamagePct' | 'healingPct';
export interface PassiveCtx { type?: DamageType; twoHanded?: boolean; shield?: boolean; ranged?: boolean; weaponClass?: ItemDef['weaponClass'] }
interface PassiveRule { kind: PassiveKind; perRank: number; when?: (c: PassiveCtx) => boolean; cap?: number }

/** Simple numeric passives, keyed by talent id. perRank is in percent points (swingPct is the change in swing time), defense is flat. */
const PASSIVES: Record<string, PassiveRule> = {
  'warden-thick-clay': { kind: 'hpPct', perRank: 4 },
  'warden-pot-lid-practice': { kind: 'defense', perRank: 1, when: (c) => c.shield === true, cap: 6 },
  'warden-glazed-over': { kind: 'reductionPct', perRank: 3 },
  'warden-keen-edge': { kind: 'damagePct', perRank: 3, when: (c) => c.type === 'slash' },
  'warden-quick-snips': { kind: 'swingPct', perRank: -4 },
  'warden-heavy-hands': { kind: 'damagePct', perRank: 4, when: (c) => c.twoHanded === true },
  'slinger-hard-acorns': { kind: 'damagePct', perRank: 3, when: (c) => c.ranged === true },
  'slinger-hawk-eye': { kind: 'critDamagePct', perRank: 15 },
  'mage-kindling': { kind: 'damagePct', perRank: 3, when: (c) => c.type === 'sun' },
  'mage-cold-snap': { kind: 'damagePct', perRank: 3, when: (c) => c.type === 'rain' },
  'slinger-quick-breath': { kind: 'swingPct', perRank: -5, when: (c) => c.weaponClass === 'blowpipe' },
  'mage-green-thumb': { kind: 'healingPct', perRank: 6 },
};

/** Sum of the learned simple passives of one kind, given the context of the hit or swing. */
export function talentBonus(kind: PassiveKind, ctx: PassiveCtx = {}): number {
  let total = 0;
  for (const [id, rule] of Object.entries(PASSIVES)) {
    const rank = talentRank(id);
    if (rule.kind !== kind || rank <= 0) continue;
    if (rule.when && !rule.when(ctx)) continue;
    const value = rule.perRank * rank;
    total += rule.cap !== undefined ? Math.min(value, rule.cap) : value;
  }
  return total;
}

// ---------------------------------------------------------------- helpers

const RESOURCE_LABEL = { grit: 'Grit', focus: 'Focus', mana: 'mana' } as const;

function spend(kind: 'grit' | 'focus' | 'mana', cost: number): boolean {
  if (kind === 'grit') {
    if (grit < cost) return false;
    grit -= cost;
  } else if (kind === 'focus') {
    if (focus < cost) return false;
    focus -= cost;
  } else {
    if (state.mp < cost) return false;
    state.mp -= cost;
  }
  return true;
}

function currentTarget(): Entity | undefined {
  const act = player.action;
  if (!act || act.type !== 'attack') return undefined;
  const e = getEntity(act.target);
  return e && e.kind === 'enemy' && !e.dead ? e : undefined;
}

function distanceToPlayer(e: Entity): number {
  return Math.hypot(e.position.x - player.position.x, e.position.z - player.position.z);
}

function liveEnemiesWithin(x: number, z: number, r: number): Entity[] {
  return allEntities().filter(
    (e) => e.kind === 'enemy' && !e.dead && Math.hypot(e.position.x - x, e.position.z - z) <= r,
  );
}

function nearestEnemy(x: number, z: number, r: number): Entity | undefined {
  let best: Entity | undefined;
  let bestDist = r;
  for (const e of liveEnemiesWithin(x, z, r)) {
    const d = Math.hypot(e.position.x - x, e.position.z - z);
    if (d <= bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

/** Weapon average and its damage type (fists are crush). */
function weaponAverage(): { avg: number; type: DamageType } {
  const w = equippedWeapon();
  const [lo, hi] = w ? weaponRange(w) : [1, 2];
  return { avg: (lo + hi) / 2, type: w?.damageType ?? 'crush' };
}

/** Attack or spell: scales with attributes, skills, passives, type table, and mitigation, then applies status/DoT. */
function strike(ab: AbilityDef, target: Entity): void {
  const victims = ab.radius !== undefined ? liveEnemiesWithin(target.position.x, target.position.z, ab.radius) : [target];
  const weapon = equippedWeapon();
  const w = weaponAverage();
  const ranged = isRangedWeapon(weapon);
  const isSpell = ab.kind === 'spell' || state.classId === 'mage';
  const flareBase = 1.5 * (3 + 2 * spellRank('flare'));

  if (ab.power !== undefined) {
    for (const v of victims) {
      const def = ENEMIES[v.defId];
      if (!def) continue;
      if (isSpell) {
        const type = ab.damageType ?? 'sun';
        const school: School = type === 'sun' || type === 'rain' || type === 'bloom' ? type : 'sun';
        const statBonus = type === 'sun' ? equippedStat('sunDamage') : type === 'rain' ? equippedStat('rainDamage') : 0;
        let dmg = flareBase * ab.power * power(effectiveAttribute('intelligence'));
        dmg *= 1 + damageFromSkill(state.skills[school].level);
        dmg *= 1 + (talentBonus('damagePct', { type }) + statBonus) / 100;
        dmg *= typeMultiplier(type, def.family) * (1 - wardOf(def, school));
        dealDamage(v.id, dmg, type, { spell: true });
      } else {
        const type = ab.damageType ?? w.type;
        const skill: SkillId = ranged ? 'marksmanship' : type === 'slash' || type === 'pierce' ? 'blade' : 'blunt';
        const primaryAttr: Attribute = ranged ? 'agility' : (state.classId ? CLASSES[state.classId].primary : 'strength');
        const ctx: PassiveCtx = { type, twoHanded: weapon?.hands === 2, ranged, weaponClass: weapon?.weaponClass };
        let abPower = ab.power;
        if (ab.id === 'aimed-shot') {
          if (state.level >= 12) abPower += 0.2;
          if (state.level >= 20) abPower += 0.2;
        } else if (ab.id === 'bash') {
          if (state.level >= 12) abPower += 0.2;
          if (state.level >= 20) abPower += 0.2;
        }
        let dmg = w.avg * abPower * power(effectiveAttribute(primaryAttr));
        dmg *= 1 + damageFromSkill(state.skills[skill].level);
        dmg *= 1 + talentBonus('damagePct', ctx) / 100;
        dmg *= typeMultiplier(type, def.family) * (1 - enemyMitigation(def, v.id));
        if (hasStatus(v.id, 'marked')) dmg *= 1.1;
        if (talentRank('warden-bedrock') > 0 && (hasStatus(v.id, 'staggered') || hasStatus(v.id, 'stunned') || hasStatus(v.id, 'slowed'))) {
          dmg *= 1 + 0.08 * talentRank('warden-bedrock');
        }
        if (ranged && talentRank('slinger-long-shot') > 0 && distanceToPlayer(v) > 8) {
          dmg *= 1 + 0.05 * talentRank('slinger-long-shot');
        }
        if (ranged && talentRank('slinger-hemlock') > 0 && hasStatus(v.id, 'poisoned') && v.hp / v.maxHp < 0.3) {
          dmg *= 2;
        }
        const critRange = Math.max(15, 20 - Math.floor(Math.max(0, effectiveAttribute('agility') - 10) / 25) - talentRank('slinger-knockout'));
        const isCrit = ab.id === 'bullseye' || (1 + Math.floor(combatRandom() * 20)) >= critRange;
        if (isCrit) {
          dmg *= 2 + (talentBonus('critDamagePct') + equippedStat('critDamage')) / 100;
          if (ab.id === 'aimed-shot' && talentRank('slinger-knockout') > 0) {
            applyStatus(v.id, 'stunned', 2);
            delete cooldowns['bullseye'];
          }
        }
        dealDamage(v.id, dmg, type, { spell: false, crit: isCrit });
      }
    }
  }
  if (ab.status) {
    let dotPower = 0;
    if (ab.status === 'chipped') {
      dotPower = (w.avg * 0.8 * power(effectiveAttribute('strength')) * (1 + 0.15 * talentRank('warden-deep-cuts'))) / 6;
    } else if (ab.status === 'poisoned') {
      dotPower = (w.avg * 0.4 * power(effectiveAttribute('agility')) * (1 + 0.15 * talentRank('slinger-creeping-rot'))) / 6;
    } else if (ab.status === 'burning') {
      dotPower = (flareBase * 0.4) / 4;
    }
    for (const v of victims) applyStatus(v.id, ab.status, ab.statusSeconds ?? 4, dotPower);
  }
}

/** Distance in metres from the ability's text, e.g. "Leap back 6 m" gives 6. */
function distanceFromAbout(about: string): number | undefined {
  const m = /(\d+(?:\.\d+)?)\s*m\b/.exec(about);
  return m ? Number(m[1]) : undefined;
}

/** Moves the player toward the target, away from it, or forward (facing) when there is no target. The current action is kept. */
function dash(ab: AbilityDef, target: Entity | undefined): void {
  const dist = distanceFromAbout(ab.about) ?? 6;
  const from = player.position;
  const fwd = { x: Math.sin(player.facing), z: Math.cos(player.facing) };
  const toward = /rush|toward|to the target/i.test(ab.about);
  const back = /\bback\b|away/i.test(ab.about);

  let dir = fwd;
  let step = dist;
  if (target && (toward || back)) {
    const dx = target.position.x - from.x;
    const dz = target.position.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    if (toward) {
      dir = { x: dx / d, z: dz / d };
      step = Math.min(dist, Math.max(0, d - TUNING.meleeRange));
    } else {
      dir = { x: -dx / d, z: -dz / d };
    }
  } else if (back) {
    dir = { x: -fwd.x, z: -fwd.z };
  }
  if (step <= 0) return;

  const kept = player.action;
  teleportPlayer(from.x + dir.x * step, from.z + dir.z * step);
  player.action = kept;
}
