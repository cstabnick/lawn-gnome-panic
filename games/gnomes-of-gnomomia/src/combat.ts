// Melee, spells, enemy attacks, statuses, regen and death: the fight rules that tie rules.ts to the world.
import * as THREE from 'three';
import { PLAYER_ID, TUNING, UI, type Attribute, type DamageType, type EnemyDef, type Entity, type ItemDef, type Rank, type School, type SkillId, type SpellId, type StatusId } from './config';
import { ENEMIES, ITEMS } from './content';
import { CLASSES } from './data/classes';
import { SPELLS } from './data/core';
import { allEntities, COMPANION_TARGET_BASE, forwardEnemyHit, forwardEnemyStatus, getEntity, isEntityAuthority, isTownFight, killEntity, notePlayerHit } from './entities';
import { inTown } from './towns';
import { bus, say } from './events';
import { bossDamageMultiplier } from './bossmoves';
import { player, standUp, teleportPlayer, type AttackKind } from './player';
import { weaponTipWorldPos } from './gear';
import { useSkill } from './progression';
import { accuracyFromSkill, attackRoll, weaponSkillFor, damageFromSkill, enemyStats, mitigation, power, typeMultiplier, weaponRange, weaponSwingSeconds } from './rules';
import { effectiveAttribute, equippedArmor, equippedStat, equippedWeapon, maxHp, maxMp, state } from './state';
import { talentBonus } from './abilities';
import { talentRank } from './talents';
import { currentZone } from './zones';

/** A short visual effect: runs for `duration` seconds, then the mesh is removed. */
interface Effect {
  mesh: THREE.Mesh;
  age: number;
  duration: number;
  /** Called every frame with progress 0..1. */
  step: (t: number) => void;
}

/** Options for dealDamage. `attacker` defaults to the player. */
export interface DamageOpts {
  crit?: boolean;
  spell?: boolean;
  noRoll?: boolean;
  attacker?: number;
}

/** One status on one target. `acc` collects fractional damage-over-time ticks. */
interface StatusEntry {
  left: number;
  power: number;
  acc: number;
}

const RESPAWN_SECONDS = 3;
/** Ranged weapons (sling, blowpipe, thrown) hit from this far. */
const RANGED_REACH = 12;
/** Inside this distance a ranged hit does 30% less. */
const RANGED_CLOSE = 2;
const RANGED_CLOSE_FACTOR = 0.7;
/** Melee reach in metres, a little past meleeRange so the swing starts as the player arrives. */
const MELEE_REACH = TUNING.meleeRange + 0.3;
/** Fists: 1-3 crush. */
const FISTS: [number, number] = [1, 3];
/** Seconds without a landed hit (either way) before out-of-combat regen starts. */
const OUT_OF_COMBAT_SECONDS = 5;
/** Out-of-combat regen: this fraction of max HP and max mana per second. */
const OUT_OF_COMBAT_RATE = 0.05;
/** Speed factor while slowed. */
const SLOWED_SPEED = 0.7;
/** Cracked: the target's armor is multiplied by this. */
const CRACKED_ARMOR = 0.75;
/** Soaked: rain damage taken is multiplied by this. */
const SOAKED_RAIN = 1.15;
/** Total mitigation is capped at this, toughness included. */
const MITIGATION_CAP = 0.6;
/** Defense is capped at this in the to-hit roll (also applied in attackRoll). */
const DEFENSE_CAP = 6;
/** Ward from rank, on top of the enemy's own ward. */
const WARD_BY_RANK: Partial<Record<Rank, number>> = { elite: 0.1, miniboss: 0.1, boss: 0.15, worldboss: 0.15, final: 0.15 };
/** Damage-over-time statuses and the damage type each one deals. */
const DOT_TYPE: Partial<Record<StatusId, DamageType>> = { chipped: 'slash', poisoned: 'pierce', burning: 'sun' };

let scene: THREE.Scene | null = null;
let combatRng: () => number = Math.random;
const effects: Effect[] = [];
/** Statuses by target id (PLAYER_ID for the player). */
const statuses = new Map<number, Map<StatusId, StatusEntry>>();
let deadTimer = 0;
/** Fractional regen accumulators: in combat (one point per interval) and out of combat (fraction of max per second). */
let hpAcc = 0;
let mpAcc = 0;
const oocAcc = { hp: 0, mp: 0 };
/** Seconds since the last landed hit, either way. */
let quietFor = 999;
/** Seconds until the player may swing again. */
let swingTimer = 0;
/** Seconds until the player may cast again. */
let cooldown = 0;

/** Sets the PRNG used for combat rolls (used by deterministic simulations). */
export function setCombatRng(rng: () => number): void {
  combatRng = rng;
}

/** Next deterministic or live random number in [0, 1). */
export function combatRandom(): number {
  return combatRng();
}

/** Resets transient combat state between headless simulation runs. */
export function resetCombatState(): void {
  statuses.clear();
  effects.length = 0;
  deadTimer = 0;
  hpAcc = 0;
  mpAcc = 0;
  oocAcc.hp = 0;
  oocAcc.mp = 0;
  quietFor = 999;
  swingTimer = 0;
  cooldown = 0;
}

/** Keeps the scene for spell effects (fireball, heal sparkle). Call once. */
export function initCombat(s: THREE.Scene): void {
  scene = s;
}

export function updateCombat(dt: number): void {
  updateEffects(dt);
  tickStatuses(dt);

  // Dead: wait for the respawn at the current zone's shrine. Nothing else happens meanwhile.
  if (player.dead) {
    deadTimer += dt;
    if (deadTimer >= RESPAWN_SECONDS) {
      deadTimer = 0;
      player.dead = false;
      const shrine = currentZone().shrine;
      teleportPlayer(shrine.x, shrine.z);
      state.hp = maxHp();
      state.mp = maxMp();
      say(`You are glued back together at ${shrine.name}.`, UI.quest);
      bus.emit('changed', {});
    }
    return;
  }

  quietFor += dt;
  regen(dt);

  swingTimer = Math.max(0, swingTimer - dt * speedFactor(PLAYER_ID));
  cooldown = Math.max(0, cooldown - dt);

  // Auto-attack: swing at the target when it is in reach and the swing timer is ready.
  const act = player.action;
  if (act?.type === 'attack' && swingTimer <= 0 && canAct(PLAYER_ID)) {
    const e = getEntity(act.target);
    if (e && e.kind === 'enemy' && !e.dead && distanceTo(e) <= weaponReach()) swing(e);
  }
}

/** Hit points and mana come back: one point per regen interval in combat, 5% of max per second after 5 quiet seconds. */
function regen(dt: number): void {
  let changed = false;
  const hpMax = maxHp();
  const mpMax = maxMp();

  const resting = player.sitting?.kind === 'rest' && quietFor >= 1;
  if (quietFor >= OUT_OF_COMBAT_SECONDS || resting) {
    const rate = OUT_OF_COMBAT_RATE * (resting ? 3 : 1);
    if (state.hp < hpMax) {
      oocAcc.hp += hpMax * rate * dt;
      const n = Math.floor(oocAcc.hp);
      oocAcc.hp -= n;
      if (n > 0) {
        state.hp = Math.min(hpMax, state.hp + n);
        changed = true;
      }
    }
    if (state.hp >= hpMax) oocAcc.hp = 0;
    if (state.mp < mpMax) {
      oocAcc.mp += mpMax * rate * dt;
      const n = Math.floor(oocAcc.mp);
      oocAcc.mp -= n;
      if (n > 0) {
        state.mp = Math.min(mpMax, state.mp + n);
        changed = true;
      }
    }
    if (state.mp >= mpMax) oocAcc.mp = 0;
  } else {
    oocAcc.hp = 0;
    oocAcc.mp = 0;
    if (state.hp < hpMax) {
      hpAcc += dt;
      while (hpAcc >= TUNING.hpRegenSeconds && state.hp < maxHp()) {
        hpAcc -= TUNING.hpRegenSeconds;
        state.hp++;
        changed = true;
      }
      if (state.hp >= maxHp()) hpAcc = 0;
    } else {
      hpAcc = 0;
    }
    if (state.mp < mpMax) {
      const intBonus = Math.max(0, effectiveAttribute('intelligence') - 10) / 4;
      const mpInterval = TUNING.mpRegenSeconds / (1 + intBonus);
      mpAcc += dt;
      while (mpAcc >= mpInterval && state.mp < maxMp()) {
        mpAcc -= mpInterval;
        state.mp++;
        changed = true;
      }
      if (state.mp >= maxMp()) mpAcc = 0;
    } else {
      mpAcc = 0;
    }
  }
  if (changed) bus.emit('changed', {});
}

/** Ranged weapons (sling, blowpipe, thrown) attack from a distance. */
export function isRangedWeapon(weapon: ItemDef | null): boolean {
  const c = weapon?.weaponClass;
  return c === 'sling' || c === 'blowpipe' || c === 'thrown';
}

/** How far the player's current weapon reaches, in metres. */
export function weaponReach(): number {
  return isRangedWeapon(equippedWeapon())
    ? RANGED_REACH + 1.5 * talentRank('slinger-long-shot')
    : MELEE_REACH;
}

/** Skill trained by hitting with this weapon (rules.weaponSkillFor; the economy sim uses the same rule). */
function weaponSkill(weapon: ItemDef | null): SkillId {
  return weaponSkillFor(weapon);
}

/** Attribute that scales the player's physical damage: agility for ranged, the class primary otherwise (strength if classless). */
function primaryAttribute(ranged: boolean): Attribute {
  if (ranged) return 'agility';
  return state.classId ? CLASSES[state.classId].primary : 'strength';
}

/** One swing at an enemy: roll to hit, deal damage, train the weapon skill on a hit. */
function swing(e: Entity): void {
  const weapon = equippedWeapon();
  const ranged = isRangedWeapon(weapon);
  const swingMult = 1 + talentBonus('swingPct', { twoHanded: weapon?.hands === 2, weaponClass: weapon?.weaponClass }) / 100;
  swingTimer = weaponSwingSeconds(weapon) * Math.max(0.4, swingMult);
  player.swing = 0.35;
  player.attackKind = attackKindForWeapon(weapon);
  player.facing = Math.atan2(e.position.x - player.position.x, e.position.z - player.position.z);
  spawnWeaponEffect(weapon, e.position);
  e.inCombat = true;

  const type: DamageType = weapon?.damageType ?? 'crush';
  const skill = weaponSkill(weapon);
  const [lo, hi] = weapon ? weaponRange(weapon) : FISTS;
  const def = ENEMIES[e.defId];
  const st = enemyStats(def);

  const accuracy = accuracyFromSkill(state.skills[skill].level)
    + clamp(state.level - def.level, -5, 3)
    + equippedStat('accuracy')
    + (hasStatus(PLAYER_ID, 'smoking') ? 1 : 0)
    - (hasStatus(PLAYER_ID, 'tipsy') ? 1 : 0);
  const critRange = Math.max(15, 20 - Math.floor(Math.max(0, effectiveAttribute('agility') - 10) / 25) - talentRank('slinger-knockout'));
  const { hit, crit } = attackRoll(accuracy, st.defense, critRange, combatRng);

  if (!hit) {
    bus.emit('miss', { attacker: PLAYER_ID, target: e.id, at: e.position.clone() });
    return;
  }

  const rolled = lo + Math.floor(combatRng() * (hi - lo + 1));
  const tipsyBonus = hasStatus(PLAYER_ID, 'tipsy') ? 1 : 0;
  let dmg = rolled * power(effectiveAttribute(primaryAttribute(ranged)) + tipsyBonus);
  dmg *= 1 + damageFromSkill(state.skills[skill].level);
  dmg *= 1 + talentBonus('damagePct', { type, twoHanded: weapon?.hands === 2, ranged, weaponClass: weapon?.weaponClass }) / 100;
  dmg *= typeMultiplier(type, def.family);
  dmg *= 1 - enemyMitigation(def, e.id);
  if (hasStatus(e.id, 'marked')) dmg *= 1.1;
  if (talentRank('warden-bedrock') > 0 && (hasStatus(e.id, 'staggered') || hasStatus(e.id, 'stunned') || hasStatus(e.id, 'slowed'))) {
    dmg *= 1 + 0.08 * talentRank('warden-bedrock');
  }
  if (ranged && distanceTo(e) < RANGED_CLOSE) dmg *= RANGED_CLOSE_FACTOR;
  if (ranged && talentRank('slinger-long-shot') > 0 && distanceTo(e) > 8) {
    dmg *= 1 + 0.05 * talentRank('slinger-long-shot');
  }
  if (ranged && talentRank('slinger-hemlock') > 0 && hasStatus(e.id, 'poisoned') && e.hp / e.maxHp < 0.3) {
    dmg *= 2;
  }
  if (crit) dmg *= 2 + (talentBonus('critDamagePct') + equippedStat('critDamage')) / 100;

  dealDamage(e.id, dmg, type, { crit });
  if (ranged && talentRank('slinger-nettle-darts') > 0 && combatRng() < 0.08 * talentRank('slinger-nettle-darts')) {
    const dotPower = (((lo + hi) / 2) * 0.4 * power(effectiveAttribute('agility')) * (1 + 0.15 * talentRank('slinger-creeping-rot'))) / 6;
    applyStatus(e.id, 'poisoned', 6, dotPower);
  }
  useSkill(skill, 1);
}

/** Armor reduction of an enemy against the player's attacks: its family armor, cracked, against the player's level. */
export function enemyMitigation(def: EnemyDef, id: number): number {
  const armor = enemyStats(def).armor * (hasStatus(id, 'cracked') ? CRACKED_ARMOR : 1);
  return mitigation(armor, state.level);
}

/** Kill an enemy whose hp reached zero; the player's attack ends with it. */
function finishIfDead(e: Entity, killerId: number): void {
  if (e.hp > 0) return;
  e.hp = 0;
  killEntity(e.id, killerId);
  if (player.action?.target === e.id) player.action = null;
}

/** Whether a shield is equipped in the offhand. */
function shieldEquipped(): boolean {
  const id = state.equipment.offhand;
  return !!id && ITEMS[id]?.armorType === 'shield';
}

/** The player's defense in the to-hit roll: shield floor(block / 20) + floor((agility - 10) / 30) + item/talent defense, capped at 6. */
export function playerDefense(): number {
  const block = shieldEquipped() ? Math.floor(state.skills.block.level / 20) : 0;
  const agility = Math.floor((effectiveAttribute('agility') - 10) / 30);
  const bonus = equippedStat('defense') + talentBonus('defense', { shield: shieldEquipped() });
  return Math.min(DEFENSE_CAP, block + agility + bonus);
}

/** The player's total armor: the sum of armorValue over everything equipped. */
export function playerArmor(): number {
  return equippedArmor();
}

/** The player's physical mitigation against an attacker of `attackerLevel`: armor plus toughness plus talents, capped at 60%. */
export function playerMitigation(attackerLevel: number): number {
  const armor = playerArmor() * (hasStatus(PLAYER_ID, 'cracked') ? CRACKED_ARMOR : 1);
  const m = mitigation(armor, attackerLevel) + state.skills.toughness.level * 0.001 + talentBonus('reductionPct') / 100;
  return Math.min(MITIGATION_CAP, m);
}

function isPhysical(type: DamageType): boolean {
  return type === 'slash' || type === 'crush' || type === 'pierce';
}

/** An enemy strikes the player. Also makes the player fight back and handles death. */
export function enemyAttack(e: Entity): void {
  if (player.dead || !canAct(e.id)) return;
  // The Bound-Peace (towns.ts): no blow lands on a gnome in town unless this enemy is part of a called fight.
  if (inTown(player.position.x, player.position.z) && !isTownFight(e.id)) return;
  const def = ENEMIES[e.defId];
  const st = enemyStats(def);
  const accuracy = st.accuracy + clamp(def.level - state.level, -5, 3);
  const { hit, crit } = attackRoll(accuracy, playerDefense(), 20, combatRng);

  if (hit) {
    const [lo, hi] = st.damage;
    let dmg = lo + Math.floor(combatRng() * (hi - lo + 1));
    if (isPhysical(def.damageType)) dmg *= 1 - playerMitigation(def.level);
    if (crit) dmg *= 2;
    dmg *= bossDamageMultiplier(e.id);
    dealDamage(PLAYER_ID, dmg, def.damageType, { crit, attacker: e.id });
    useSkill('toughness', 1);
  } else {
    bus.emit('miss', { attacker: e.id, target: PLAYER_ID, at: player.position.clone() });
    if (shieldEquipped()) {
      player.block = 0.3;
      spawnBlockSpark();
      useSkill('block', 1);
      const spiked = talentRank('warden-spiked-lid');
      if (spiked > 0) {
        const w = equippedWeapon();
        const [wlo, whi] = w ? weaponRange(w) : FISTS;
        dealDamage(e.id, ((wlo + whi) / 2) * 0.15 * spiked, 'crush', { attacker: PLAYER_ID });
      }
    }
  }

  // Fight back when the player is idle.
  if (!player.dead && player.action === null && player.path.length === 0) player.action = { type: 'attack', target: e.id };
  bus.emit('changed', {});
}

/** The player dies once hit points run out: the respawn timer starts, statuses clear and the chat says so. */
function checkPlayerDeath(): void {
  if (state.hp > 0) return;
  state.hp = 0;
  player.dead = true;
  deadTimer = 0;
  player.action = null;
  player.path = [];
  statuses.delete(PLAYER_ID);
  bus.emit('player-died', {});
  say('Oh dear, you are dead!', UI.bad);
}

/**
 * Deals damage of `type` to the target. `base` is rounded, at least 1. Soaked targets take +15% rain damage,
 * glazed targets absorb damage first. Returns the amount dealt, or 0 when the target is missing, dead or fully absorbed.
 */
export function dealDamage(targetId: number, base: number, type: DamageType, opts?: DamageOpts): number {
  const isPlayer = targetId === PLAYER_ID;
  const e = isPlayer ? undefined : getEntity(targetId);
  if (!isPlayer && (!e || e.dead)) return 0;
  const attacker = opts?.attacker ?? PLAYER_ID;
  const at = isPlayer ? player.position.clone() : e!.position.clone();

  let amount = base;
  if (type === 'rain' && hasStatus(targetId, 'soaked')) amount *= SOAKED_RAIN;
  amount = absorbWithGlaze(targetId, Math.max(1, Math.round(amount)));
  if (amount <= 0) {
    bus.emit('miss', { attacker, target: targetId, at });
    return 0;
  }

  quietFor = 0;
  if (isPlayer) {
    if (amount > 0) standUp();
    state.hp -= amount;
    bus.emit('hit', { attacker, target: PLAYER_ID, damage: amount, at, damageType: type, crit: opts?.crit, spell: opts?.spell });
    checkPlayerDeath();
    bus.emit('changed', {});
    return amount;
  }
  // The player, their spells, pets and remote players all have ids above COMPANION_TARGET_BASE; only AI gnomes are at or below.
  if (attacker > COMPANION_TARGET_BASE) notePlayerHit(e!.id);
  if (!isEntityAuthority(e!.id)) {
    e!.hp = Math.max(1, e!.hp - amount);
    e!.sinceHit = 0;
    bus.emit('hit', { attacker, target: targetId, damage: amount, at, damageType: type, crit: opts?.crit, spell: opts?.spell });
    forwardEnemyHit(e!.id, amount, type, opts?.crit, opts?.spell);
    return amount;
  }
  e!.hp -= amount;
  e!.sinceHit = 0;
  bus.emit('hit', { attacker, target: targetId, damage: amount, at, damageType: type, crit: opts?.crit, spell: opts?.spell });
  finishIfDead(e!, attacker);
  return amount;
}

/** Glazed absorbs its power in damage; returns what gets through. */
function absorbWithGlaze(targetId: number, amount: number): number {
  const map = statuses.get(targetId);
  const g = map?.get('glazed');
  if (!map || !g || g.power <= 0) return amount;
  const absorbed = Math.min(g.power, amount);
  g.power -= absorbed;
  if (g.power <= 0) map.delete('glazed');
  return amount - absorbed;
}

/**
 * Puts a status on a target for `seconds`. Re-applying refreshes the duration; power is kept at the larger value,
 * except glazed, whose power adds up. Emits a `status` event.
 */
export function applyStatus(targetId: number, status: StatusId, seconds: number, power = 0): void {
  if (targetId !== PLAYER_ID) {
    const e = getEntity(targetId);
    if (!e || e.dead) return;
  }
  let map = statuses.get(targetId);
  if (!map) {
    map = new Map();
    statuses.set(targetId, map);
  }
  const cur = map.get(status);
  if (cur) {
    cur.left = Math.max(cur.left, seconds);
    cur.power = status === 'glazed' ? cur.power + power : Math.max(cur.power, power);
  } else {
    map.set(status, { left: seconds, power, acc: 0 });
  }
  bus.emit('status', { target: targetId, status, seconds });
  if (targetId !== PLAYER_ID && !isEntityAuthority(targetId)) {
    forwardEnemyStatus(targetId, status, seconds, power);
  }
}

/** Heals the player, capped at max hit points. */
export function healPlayer(amount: number): void {
  state.hp = Math.min(maxHp(), state.hp + amount);
  bus.emit('heal', { amount });
  bus.emit('changed', {});
}

/** Whether the target currently has the status. */
export function hasStatus(targetId: number, status: StatusId): boolean {
  const s = statuses.get(targetId)?.get(status);
  return !!s && s.left > 0;
}

/** Remaining seconds on a status for the target (0 if inactive). */
export function statusSecondsLeft(targetId: number, status: StatusId): number {
  const s = statuses.get(targetId)?.get(status);
  return s && s.left > 0 ? s.left : 0;
}

/** Movement and attack speed factor: 0 when rooted or stunned, 0.7 when slowed, 1 otherwise. */
export function speedFactor(targetId: number): number {
  if (hasStatus(targetId, 'rooted') || hasStatus(targetId, 'stunned')) return 0;
  if (hasStatus(targetId, 'slowed')) return SLOWED_SPEED;
  return 1;
}

/** False while rooted, stunned or staggered. */
export function canAct(targetId: number): boolean {
  return !(hasStatus(targetId, 'rooted') || hasStatus(targetId, 'stunned') || hasStatus(targetId, 'staggered'));
}

/** Ticks statuses: damage-over-time, then expiry. Entries of dead or missing targets are dropped. */
function tickStatuses(dt: number): void {
  for (const [targetId, map] of statuses) {
    if (targetId !== PLAYER_ID) {
      const e = getEntity(targetId);
      if (!e || e.dead) {
        statuses.delete(targetId);
        continue;
      }
    }
    for (const [status, entry] of map) {
      entry.left -= dt;
      const type = DOT_TYPE[status];
      if (type && entry.left > 0 && (targetId === PLAYER_ID || isEntityAuthority(targetId))) {
        entry.acc += entry.power * dt;
        const whole = Math.floor(entry.acc);
        if (whole > 0) {
          entry.acc -= whole;
          dealDamage(targetId, whole, type);
        }
      }
      if (entry.left <= 0) map.delete(status);
    }
    if (map.size === 0) statuses.delete(targetId);
  }
}

/** The rank of a spell in use: mages get the highest rank at or below their level; everyone else stays on rank 1. */
export function spellRank(spell: SpellId): number {
  const ranks = SPELLS[spell].ranks;
  if (state.classId !== 'mage') return ranks[0];
  let best = ranks[0];
  for (const r of ranks) if (r <= state.level) best = r;
  return best;
}

/** Staff bonus: +1.5% spell power per staff item level. */
function staffBonus(): number {
  const w = equippedWeapon();
  return w?.weaponClass === 'staff' ? 0.015 * (w.ilvl ?? 0) : 0;
}

/** Ward against a school: the enemy's own ward plus its rank ward. */
export function wardOf(def: EnemyDef, school: School): number {
  return Math.min(0.9, (def.ward?.[school] ?? 0) + (WARD_BY_RANK[def.rank] ?? 0));
}

export function castSpell(spell: SpellId): void {
  if (player.dead || cooldown > 0 || !canAct(PLAYER_ID)) return;
  const sp = SPELLS[spell];
  const lr = spellRank(spell);
  let cost = Math.round(4 + 0.6 * lr);
  if (spell === 'flare') cost = Math.max(1, Math.round(cost * (1 - 0.05 * talentRank('mage-dry-spell'))));
  if (state.mp < cost) {
    say('You do not have enough mana.', UI.bad);
    return;
  }

  let to: THREE.Vector3 | null = null;

  if (spell === 'flare') {
    const e = pickFlareTarget();
    if (!e) {
      say('There is nothing to target.', UI.bad);
      return;
    }
    const def = ENEMIES[e.defId];
    let dmg = 1.5 * (3 + 2 * lr) * (0.75 + combatRng() * 0.5);
    dmg *= power(effectiveAttribute('intelligence'));
    dmg *= 1 + damageFromSkill(state.skills[sp.school].level);
    dmg *= 1 + staffBonus();
    dmg *= 1 + (talentBonus('damagePct', { type: sp.school }) + equippedStat('sunDamage')) / 100;
    dmg *= typeMultiplier(sp.school, def.family);
    dmg *= 1 - wardOf(def, sp.school);
    e.inCombat = true;
    dealDamage(e.id, dmg, sp.school, { spell: true });
    useSkill(sp.school, 1);
    if (e.hp > 0 && !player.action) player.action = { type: 'attack', target: e.id };
    to = e.position.clone();
    spawnFireball(to);
  } else {
    // Mend: heal yourself. 2.0 x (3 + 2 Lr), +-20%, times INT power and Bloom / 200.
    let amount = 2 * (3 + 2 * lr) * (0.8 + combatRng() * 0.4) * power(effectiveAttribute('intelligence')) * (1 + state.skills.bloom.level / 200);
    amount *= 1 + (talentBonus('healingPct') + equippedStat('bloomHealing')) / 100;
    healPlayer(Math.round(amount));
    useSkill('bloom', 1);
    spawnHealRing();
  }

  state.mp -= cost;
  cooldown = spell === 'flare' ? Math.max(0.4, TUNING.spellCooldownSeconds - 0.2 * talentRank('mage-long-day')) : TUNING.spellCooldownSeconds;
  player.swing = 0.35;
  player.attackKind = 'cast';
  bus.emit('cast', { spell, from: player.position.clone(), to: to ? to.clone() : null });
  bus.emit('changed', {});
}

/** Seconds until the next spell may be cast (0 = ready). */
export function spellCooldown(): number {
  return Math.max(0, cooldown);
}

/** Seconds until the next weapon swing may occur (0 = ready). */
export function swingCooldown(): number {
  return Math.max(0, swingTimer);
}

function distanceTo(e: Entity): number {
  return Math.hypot(e.position.x - player.position.x, e.position.z - player.position.z);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function isLiveEnemyInRange(e: Entity, range: number): boolean {
  return e.kind === 'enemy' && !e.dead && distanceTo(e) <= range;
}

/** Flare target: the current attack target if it is in range, else the nearest enemy (preferring ones already fighting you). */
function pickFlareTarget(): Entity | undefined {
  const act = player.action;
  if (act?.type === 'attack') {
    const cur = getEntity(act.target);
    if (cur && isLiveEnemyInRange(cur, TUNING.spellRange)) return cur;
  }
  let best: Entity | undefined;
  let bestDist = Infinity;
  for (const e of allEntities()) {
    if (!isLiveEnemyInRange(e, TUNING.spellRange)) continue;
    const d = distanceTo(e);
    const better = !best || (e.inCombat !== best.inCombat ? e.inCombat : d < bestDist);
    if (better) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

/** Picks the swing animation kind from the equipped weapon (or spell). */
export function attackKindForWeapon(weapon: ItemDef | null, isSpell = false): AttackKind {
  if (isSpell || weapon?.weaponClass === 'staff' || weapon?.weaponClass === 'wand') return 'cast';
  if (isRangedWeapon(weapon)) return 'ranged';
  if (weapon?.damageType === 'pierce') return 'thrust';
  return 'chop';
}

/** Spawns a projectile, magic bolt, or melee slash arc matching the equipped weapon. */
export function spawnWeaponEffect(weapon: ItemDef | null, target: THREE.Vector3, isSpell = false): void {
  if (!scene) return;
  const from = weaponTipWorldPos(player.model, player.position);
  const to = new THREE.Vector3(target.x, target.y + 0.65, target.z);

  if (isSpell || weapon?.weaponClass === 'staff' || weapon?.weaponClass === 'wand') {
    const color = weapon?.damageType === 'rain' ? 0x62b6ff : weapon?.damageType === 'bloom' ? 0x7dff8a : 0xffaa33;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(from);
    addEffect(mesh, 0.24, (t) => mesh.position.lerpVectors(from, to, t));
    return;
  }

  if (isRangedWeapon(weapon)) {
    const isBlowpipe = weapon?.weaponClass === 'blowpipe';
    const isThrown = weapon?.weaponClass === 'thrown';
    const geo = isBlowpipe
      ? new THREE.ConeGeometry(0.05, 0.26, 6)
      : isThrown
        ? new THREE.OctahedronGeometry(0.11, 0)
        : new THREE.SphereGeometry(0.09, 6, 5);
    const color = isBlowpipe ? 0x8ad65a : isThrown ? 0xd8dce0 : 0x8b6f47;
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(from);
    if (isBlowpipe) {
      mesh.lookAt(to);
      mesh.rotateX(Math.PI / 2);
    }
    addEffect(mesh, 0.22, (t) => {
      mesh.position.lerpVectors(from, to, t);
      if (!isBlowpipe) mesh.position.y += Math.sin(Math.PI * t) * 0.45;
      if (isThrown) mesh.rotation.x += 0.35;
    });
    return;
  }

  // Melee slash or thrust arc right in front of the gnome.
  const isThrust = weapon?.damageType === 'pierce';
  const mat = new THREE.MeshBasicMaterial({ color: 0xf4f1de, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const geo = isThrust ? new THREE.ConeGeometry(0.12, 0.48, 6) : new THREE.RingGeometry(0.45, 0.75, 14, 1, -Math.PI * 0.4, Math.PI * 0.8);
  const mesh = new THREE.Mesh(geo, mat);
  const angle = Math.atan2(target.x - player.position.x, target.z - player.position.z);
  mesh.position.set(player.position.x + Math.sin(angle) * 0.65, player.position.y + 0.65, player.position.z + Math.cos(angle) * 0.65);
  mesh.rotation.y = angle;
  if (isThrust) mesh.rotation.x = Math.PI / 2;
  else mesh.rotation.x = -Math.PI / 2 + 0.35;
  addEffect(mesh, 0.18, (t) => {
    mat.opacity = 0.75 * (1 - t);
    if (isThrust) mesh.position.addScaledVector(new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)), 0.03);
    else mesh.rotation.z = (t - 0.5) * 1.4;
  });
}

/** Brief metallic ring when a shield blocks an incoming blow. */
function spawnBlockSpark(): void {
  if (!scene) return;
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.3, 14), mat);
  const pos = player.model
    ? player.model.arms.left.localToWorld(new THREE.Vector3(0.08, -0.24, 0.14))
    : new THREE.Vector3(player.position.x, player.position.y + 0.6, player.position.z);
  mesh.position.copy(pos);
  mesh.rotation.y = player.facing;
  addEffect(mesh, 0.22, (t) => {
    mesh.scale.setScalar(1 + t * 0.8);
    mat.opacity = 0.9 * (1 - t);
  });
}

/** Orange ball flying from the player's wand/staff/hand to the target over 0.3 s. */
function spawnFireball(target: THREE.Vector3): void {
  if (!scene) return;
  const from = weaponTipWorldPos(player.model, player.position);
  const to = new THREE.Vector3(target.x, target.y + 0.8, target.z);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  mesh.position.copy(from);
  addEffect(mesh, 0.3, (t) => mesh.position.lerpVectors(from, to, t));
}

/** Green ring at the feet that rises to head height while fading, over 0.6 s. */
function spawnHealRing(): void {
  if (!scene) return;
  const material = new THREE.MeshBasicMaterial({ color: 0x6dff8a, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 24), material);
  mesh.rotation.x = -Math.PI / 2;
  const baseY = player.position.y + 0.1;
  mesh.position.set(player.position.x, baseY, player.position.z);
  addEffect(mesh, 0.6, (t) => {
    mesh.position.y = baseY + 2 * t;
    material.opacity = 1 - t;
  });
}

function addEffect(mesh: THREE.Mesh, duration: number, step: (t: number) => void): void {
  if (!scene) return;
  scene.add(mesh);
  effects.push({ mesh, age: 0, duration, step });
}

function updateEffects(dt: number): void {
  for (let i = effects.length - 1; i >= 0; i--) {
    const fx = effects[i];
    fx.age += dt;
    const t = Math.min(1, fx.age / fx.duration);
    fx.step(t);
    if (t >= 1) {
      scene?.remove(fx.mesh);
      fx.mesh.geometry.dispose();
      (fx.mesh.material as THREE.Material).dispose();
      effects.splice(i, 1);
    }
  }
}
