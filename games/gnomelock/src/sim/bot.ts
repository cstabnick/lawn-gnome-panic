// Smart 2v2 MOBA bot AI: last-hitting, Soul Acorn Orb confirm/deny, movement tech, 5-min Relic contest, and shopping.
import type { AbilitySlot } from './config';
import { HEROES } from './heroes';
import { ITEM_BY_ID } from './items';
import { isNearShop, RELIC_ALTAR } from './map';
import { tryBuyItem, type HeroActionInput, type MatchState } from './world';

export interface BotConfig {
  skill: number; // ~0.72..1.32
}

/** Bot reaction delay in seconds: 250ms on Easy (0.72) down to 150ms on Pro (1.32). */
export function botReactionDelayS(skill: number): number {
  const t = Math.max(0, Math.min(1, (skill - 0.72) / (1.32 - 0.72)));
  return 0.25 - t * 0.10;
}

/** Bot aim spread in radians: 0.16 on Easy (0.72) down to 0.042 on Pro (1.32). */
export function botAimSpreadRad(skill: number): number {
  const t = Math.max(0, Math.min(1, (skill - 0.72) / (1.32 - 0.72)));
  return 0.16 - t * 0.118;
}

function aimAt(
  ox: number,
  oy: number,
  oz: number,
  tx: number,
  ty: number,
  tz: number,
): { yaw: number; pitch: number } {
  const dx = tx - ox;
  const dy = ty - oy;
  const dz = tz - oz;
  const hDist = Math.hypot(dx, dz) || 1e-4;
  // yaw = 0 faces -Z, so fwdX = -sin(yaw), fwdZ = -cos(yaw)
  const yaw = Math.atan2(-dx, -dz);
  const pitch = Math.atan2(dy, hDist);
  return { yaw, pitch };
}

export function computeBotInput(
  state: MatchState,
  slot: number,
  cfg: BotConfig = { skill: 1.0 },
): HeroActionInput {
  const h = state.heroes[slot];
  const empty: HeroActionInput = {
    move: { forward: 0, right: 0, yaw: h.yaw, jumpPressed: false, dashPressed: false, slideHeld: false },
    pitch: 0,
    fireHeld: false,
    reloadPressed: false,
    abilityPressed: null,
  };
  if (!h || !h.alive) return empty;

  const def = HEROES[h.heroId];
  // Shop automatically when near base or mid-lane shed
  if (isNearShop(h.move.pos.x, h.move.pos.z, h.team)) {
    for (const itemId of def.recommendedItems) {
      if (!h.items.includes(itemId)) {
        const item = ITEM_BY_ID.get(itemId);
        if (item && h.acorns >= item.cost) {
          tryBuyItem(state, slot, itemId);
        }
        break;
      }
    }
  }

  const px = h.move.pos.x;
  const py = h.move.pos.y + 0.9;
  const pz = h.move.pos.z;
  const homeDir = h.team === 0 ? -1 : 1; // -Z for Amber, +Z for Sapphire
  const hpFrac = h.hp / h.maxHp;

  // Check if taking tower aggro or very low HP -> retreat!
  const underEnemyTower = state.structures.some(
    (st) => st.team !== h.team && st.hp > 0 && Math.hypot(st.x - px, st.z - pz) < st.range + 1.5 && st.aggroHeroSlot === slot,
  );
  const retreating = hpFrac < 0.28 || underEnemyTower;

  // 1. Target selection priority:
  // (a) Soul Acorn Orbs (confirm own or deny enemy) based on bot skill + reaction delay
  const reactDelay = botReactionDelayS(cfg.skill);
  let targetX = 0;
  let targetY = 1.0;
  let targetZ = -homeDir * 30;
  let hasTarget = false;
  let targetKind: 'orb' | 'creep' | 'hero' | 'tower' | 'relic' | 'none' = 'none';
  let targetKey = 'none';
  let targetSpeed = 0;

  const orbChance = Math.max(0.22, Math.min(0.92, (cfg.skill - 0.4) * 0.85));
  if (state.orbs.length > 0 && state.rng() < orbChance) {
    let bestOrb = null;
    let bestDist = def.weapon.range * 0.95;
    for (const orb of state.orbs) {
      if (orb.ageS < reactDelay) continue;
      const d = Math.hypot(orb.x - px, orb.z - pz);
      if (d < bestDist) {
        bestDist = d;
        bestOrb = orb;
      }
    }
    if (bestOrb) {
      targetX = bestOrb.x;
      targetY = bestOrb.y;
      targetZ = bestOrb.z;
      hasTarget = true;
      targetKind = 'orb';
      targetKey = `orb:${bestOrb.id}`;
    }
  }

  // (b) 5:00 Gilded Relic contest
  if (!hasTarget && state.relic.alive && state.relic.hp > 0) {
    const dRelic = Math.hypot(RELIC_ALTAR.x - px, RELIC_ALTAR.z - pz);
    if (dRelic < 42) {
      targetX = RELIC_ALTAR.x;
      targetY = 1.4;
      targetZ = RELIC_ALTAR.z;
      hasTarget = true;
      targetKind = 'relic';
      targetKey = 'relic';
    }
  }

  // (c) Low-HP creep for last-hit
  if (!hasTarget) {
    let bestCreep = null;
    let bestScore = Infinity;
    for (const cr of state.creeps) {
      if (cr.team === h.team || cr.hp <= 0) continue;
      const d = Math.hypot(cr.x - px, cr.z - pz);
      if (d <= def.weapon.range) {
        const score = cr.hp * 0.35 + d;
        if (score < bestScore) {
          bestScore = score;
          bestCreep = cr;
        }
      }
    }
    if (bestCreep) {
      targetX = bestCreep.x;
      targetY = bestCreep.y + 0.55;
      targetZ = bestCreep.z;
      hasTarget = true;
      targetKind = 'creep';
      targetKey = `creep:${bestCreep.id}`;
    }
  }

  // (d) Enemy tower when creeps are tanking (priority after 6:00)
  if (!hasTarget && state.timeS >= 360) {
    for (const st of state.structures) {
      if (st.team === h.team || st.hp <= 0 || st.invulnerable) continue;
      const d = Math.hypot(st.x - px, st.z - pz);
      const creepsNearTower = state.creeps.some(
        (cr) => cr.team === h.team && Math.hypot(cr.x - st.x, cr.z - st.z) < st.range - 1,
      );
      if (d <= def.weapon.range && (creepsNearTower || st.hp < 500)) {
        targetX = st.x;
        targetY = st.y + 2.0;
        targetZ = st.z;
        hasTarget = true;
        targetKind = 'tower';
        targetKey = `tower:${st.id}`;
        break;
      }
    }
  }

  // (e) Enemy hero
  if (!hasTarget) {
    let bestHero = null;
    let bestD = def.weapon.range;
    for (const e of state.heroes) {
      if (e.team === h.team || !e.alive || e.stealthTimer > 0) continue;
      const d = Math.hypot(e.move.pos.x - px, e.move.pos.z - pz);
      if (d < bestD) {
        bestD = d;
        bestHero = e;
      }
    }
    if (bestHero) {
      targetX = bestHero.move.pos.x;
      targetY = bestHero.move.pos.y + 0.7;
      targetZ = bestHero.move.pos.z;
      targetSpeed = Math.hypot(bestHero.move.vel.x, bestHero.move.vel.z);
      hasTarget = true;
      targetKind = 'hero';
      targetKey = `hero:${bestHero.slot}`;
    }
  }

  // (e) Enemy tower (only if friendly creeps are tanking or tower is low!)
  if (!hasTarget) {
    for (const st of state.structures) {
      if (st.team === h.team || st.hp <= 0 || st.invulnerable) continue;
      const d = Math.hypot(st.x - px, st.z - pz);
      const creepsNearTower = state.creeps.some(
        (cr) => cr.team === h.team && Math.hypot(cr.x - st.x, cr.z - st.z) < st.range - 1,
      );
      if (d <= def.weapon.range && (creepsNearTower || st.hp < 450)) {
        targetX = st.x;
        targetY = st.y + 2.0;
        targetZ = st.z;
        hasTarget = true;
        targetKind = 'tower';
        targetKey = `tower:${st.id}`;
        break;
      }
    }
  }

  if (targetKey !== h.botTargetKey) {
    h.botTargetKey = targetKey;
    h.botTargetSinceS = state.timeS;
  }
  const reacted = targetKind === 'orb' || (state.timeS - h.botTargetSinceS >= reactDelay);

  // Movement goal
  let moveX = 0;
  let moveZ = 0;
  if (retreating) {
    moveZ = homeDir * 114;
    moveX = slot % 2 === 0 ? -3 : 3;
  } else if (state.relic.alive && state.relic.hp > 0) {
    moveX = (slot % 2 === 0 ? -4 : 4);
    moveZ = homeDir * 10;
  } else {
    // Push behind frontmost allied creep, or contest center
    let frontCreepZ = homeDir * 25;
    for (const cr of state.creeps) {
      if (cr.team === h.team) {
        if ((h.team === 0 && cr.z > frontCreepZ) || (h.team === 1 && cr.z < frontCreepZ)) {
          frontCreepZ = cr.z;
        }
      }
    }
    const desiredDistFromFront = def.id === 'bramble' ? 5 : 10;
    moveZ = frontCreepZ + homeDir * desiredDistFromFront;
    moveX = (slot % 2 === 0 ? -4.5 : 4.5) + Math.sin(state.timeS * 0.7 + slot) * 2.5;
  }

  // Aim
  let yaw = h.yaw;
  let pitch = 0;
  if (hasTarget) {
    const aimed = aimAt(px, py, pz, targetX, targetY, targetZ);
    const baseSpread = botAimSpreadRad(cfg.skill);
    const kindMult = targetKind === 'tower' || targetKind === 'relic' ? 0.55 : 1.0;
    const movingPenalty = targetKind === 'hero' && targetSpeed > 7 ? 0.045 : 0;
    const spread = baseSpread * kindMult + movingPenalty;
    yaw = aimed.yaw + (state.rng() - 0.5) * spread;
    pitch = aimed.pitch + (state.rng() - 0.5) * spread * 0.65;
  } else {
    const aimed = aimAt(px, py, pz, moveX, py, moveZ);
    yaw = aimed.yaw;
    pitch = 0;
  }

  // Convert world move direction into local forward/right relative to yaw
  const toGoalX = moveX - px;
  const toGoalZ = moveZ - pz;
  const distGoal = Math.hypot(toGoalX, toGoalZ);
  let forward = 0;
  let right = 0;
  if (distGoal > 1.5) {
    const dirX = toGoalX / distGoal;
    const dirZ = toGoalZ / distGoal;
    const fwdX = -Math.sin(yaw);
    const fwdZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    forward = dirX * fwdX + dirZ * fwdZ;
    right = dirX * rightX + dirZ * rightZ;
  }

  // Movement tech: dash-jump when returning to lane, slide downhill (scaled by difficulty)
  const techRate = Math.max(0.2, cfg.skill);
  const dashPressed =
    (distGoal > 24 && h.move.stamina >= 2.1 && h.move.dashTimer <= 0 && state.rng() < 0.08 * techRate) ||
    (retreating && h.move.stamina >= 1.2 && state.rng() < 0.15 * techRate);
  const jumpPressed =
    (h.move.dashTimer > 0 && h.move.dashTimer < 0.16 && h.move.grounded) ||
    (targetKind === 'hero' && h.move.grounded && state.rng() < 0.03 * techRate);
  const slideHeld = cfg.skill >= 0.9 && Math.hypot(h.move.vel.x, h.move.vel.z) > 10.5 && distGoal > 12;

  // Abilities
  let abilityPressed: AbilitySlot | null = null;
  if (reacted && (targetKind === 'hero' || targetKind === 'relic')) {
    const castChance = h.heroId === 'thistle' ? 0.36 : 0.14;
    for (const ab of ['X', 'Q', 'E', 'F'] as const) {
      if (h.cooldowns[ab] <= 0 && state.rng() < castChance * cfg.skill) {
        abilityPressed = ab;
        break;
      }
    }
  } else if (retreating && h.cooldowns.F <= 0) {
    abilityPressed = 'F';
  }

  const fireHeld = reacted && hasTarget && !retreating && state.rng() < 0.92 * Math.min(1.08, cfg.skill);

  return {
    move: { forward, right, yaw, jumpPressed, dashPressed, slideHeld },
    pitch,
    fireHeld,
    reloadPressed: !fireHeld && h.ammo < Math.ceil(h.stats.magSize * 0.4),
    abilityPressed,
  };
}
