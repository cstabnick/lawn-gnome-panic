import { ITEMS } from '../content';
import type {
  AgentPolicy,
  PolicyTraits,
  SimAction,
  SimEnemyView,
  SimObservation,
  SimTelegraph,
} from './types';

const CONE_HALF_ANGLE = Math.PI / 6;

function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function coversPoint(t: SimTelegraph, x: number, z: number): boolean {
  const dx = x - t.cx;
  const dz = z - t.cz;
  if (t.kind === 'ring' || t.kind === 'pool' || t.kind === 'vanish') {
    return dx * dx + dz * dz <= t.radius * t.radius;
  }
  if (t.kind === 'cone') {
    if (dx * dx + dz * dz > t.radius * t.radius) return false;
    if (dx === 0 && dz === 0) return true;
    return angleDiff(Math.atan2(dx, dz), t.dir) <= CONE_HALF_ANGLE;
  }
  const along = dx * Math.sin(t.dir) + dz * Math.cos(t.dir);
  const across = Math.abs(dx * Math.cos(t.dir) - dz * Math.sin(t.dir));
  return along >= 0 && along <= t.length && across <= t.width / 2;
}

function clampToDefend(pt: { x: number; z: number }, defendRadius?: number): { x: number; z: number } {
  if (defendRadius === undefined) return pt;
  const d = Math.hypot(pt.x, pt.z);
  const maxR = Math.max(1, defendRadius - 0.5);
  if (d <= maxR) return pt;
  return { x: (pt.x / d) * maxR, z: (pt.z / d) * maxR };
}

function safePointOutside(t: SimTelegraph, x: number, z: number, defendRadius?: number): { x: number; z: number } {
  let out: { x: number; z: number };
  if (t.kind === 'ring' || t.kind === 'pool' || t.kind === 'vanish') {
    const dx = x - t.cx;
    const dz = z - t.cz;
    const d = Math.hypot(dx, dz);
    const nx = d > 1e-3 ? dx / d : 1;
    const nz = d > 1e-3 ? dz / d : 0;
    const targetDist = t.radius + 1.2;
    out = { x: t.cx + nx * targetDist, z: t.cz + nz * targetDist };
  } else if (t.kind === 'cone') {
    // Step perpendicular to cone direction
    const perpX = Math.cos(t.dir);
    const perpZ = -Math.sin(t.dir);
    const side = (x - t.cx) * perpX + (z - t.cz) * perpZ >= 0 ? 1 : -1;
    out = { x: x + side * perpX * 4, z: z + side * perpZ * 4 };
  } else {
    // Lane: step perpendicular to lane direction
    const perpX = Math.cos(t.dir);
    const perpZ = -Math.sin(t.dir);
    const side = (x - t.cx) * perpX + (z - t.cz) * perpZ >= 0 ? 1 : -1;
    const dist = t.width / 2 + 1.5;
    out = { x: x + side * perpX * dist, z: z + side * perpZ * dist };
  }
  return clampToDefend(out, defendRadius);
}

function hasPotion(obs: SimObservation, kind: 'heal' | 'mana'): boolean {
  for (const slot of obs.state.inventory) {
    if (!slot || slot.count <= 0) continue;
    const def = ITEMS[slot.item];
    if (!def || def.kind !== 'potion') continue;
    if (kind === 'heal' && def.heal) return true;
    if (kind === 'mana' && def.mana) return true;
  }
  return false;
}

function isBossRank(e: SimEnemyView): boolean {
  return e.def.rank === 'boss' || e.def.rank === 'final' || e.def.rank === 'worldboss';
}

function pickTarget(enemies: readonly SimEnemyView[], priority: PolicyTraits['targetPriority']): SimEnemyView | undefined {
  if (enemies.length === 0) return undefined;
  const sorted = [...enemies];
  if (priority === 'adds-first') {
    sorted.sort((a, b) => {
      const ab = isBossRank(a) ? 1 : 0;
      const bb = isBossRank(b) ? 1 : 0;
      if (ab !== bb) return ab - bb;
      return a.hp - b.hp;
    });
  } else if (priority === 'boss-first') {
    sorted.sort((a, b) => {
      const ab = isBossRank(a) ? 0 : 1;
      const bb = isBossRank(b) ? 0 : 1;
      if (ab !== bb) return ab - bb;
      return a.dist - b.dist;
    });
  } else if (priority === 'lowest-hp') {
    sorted.sort((a, b) => a.hp - b.hp);
  } else {
    sorted.sort((a, b) => a.dist - b.dist);
  }
  return sorted[0];
}

export function makePolicy(overrides: Partial<PolicyTraits> & { id: string; name: string }): AgentPolicy {
  const traits: PolicyTraits = {
    posture: 'melee',
    telegraphDodge: 0.85,
    reactionSeconds: 0.35,
    healThreshold: 0.45,
    potionThreshold: 0.25,
    rotation: 'tactical',
    targetPriority: 'adds-first',
    respectObjectives: true,
    ...overrides,
  };

  return {
    id: traits.id,
    name: traits.name,
    traits,
    decide(obs: SimObservation): SimAction {
      const defendCap = traits.respectObjectives ? obs.defendRadius : undefined;

      // 1. Telegraph Evasion
      let dodgeMove: { x: number; z: number } | undefined;
      for (const t of obs.telegraphs) {
        if (t.age < traits.reactionSeconds) continue;
        if (!coversPoint(t, obs.x, obs.z)) continue;
        const roll = ((t.id * 2654435761) >>> 0) / 4294967296;
        if (roll < traits.telegraphDodge) {
          dodgeMove = safePointOutside(t, obs.x, obs.z, defendCap);
          break;
        }
      }

      // 2. Emergency Potion
      const hpFrac = obs.maxHp > 0 ? obs.hp / obs.maxHp : 1;
      const mpFrac = obs.maxMp > 0 ? obs.mp / obs.maxMp : 1;
      if (hpFrac < traits.potionThreshold && hasPotion(obs, 'heal')) {
        return { type: 'potion', kind: 'heal', move: dodgeMove };
      }
      if (obs.resource.kind === 'mana' && mpFrac < Math.max(traits.potionThreshold, 0.3) && hasPotion(obs, 'mana')) {
        return { type: 'potion', kind: 'mana', move: dodgeMove };
      }

      // 3. Self-Heal / Mitigation
      const readyMap = new Map(obs.readyAbilities.map((a) => [a.id, a]));
      if (hpFrac < traits.healThreshold) {
        for (const id of ['second-wind', 'last-stand', 'thick-glaze', 'thin-glaze', 'fairy-ring']) {
          if (readyMap.has(id)) {
            return { type: 'ability', abilityId: id, move: dodgeMove };
          }
        }
        if (obs.spellReady && obs.mp >= 7) {
          return { type: 'cast', spell: 'mend', move: dodgeMove };
        }
      }

      // 4. Target Selection
      const target = pickTarget(obs.enemies, traits.targetPriority);
      if (!target) {
        return dodgeMove ? { type: 'move', x: dodgeMove.x, z: dodgeMove.z } : { type: 'wait' };
      }

      // 5. Positioning
      let move = dodgeMove;
      const effectivePosture =
        traits.id === 'tactical' && (obs.isRanged || obs.state.classId === 'mage') ? 'kite' : traits.posture;

      const nearest = obs.enemies.reduce((a, b) => (b.dist < a.dist ? b : a), obs.enemies[0]);
      if (!move) {
        if (effectivePosture === 'kite') {
          const tooClose = obs.isRanged ? 3.2 : 3.2;
          if (nearest.dist < tooClose) {
            if (traits.rotation === 'tactical') {
              for (const kId of ['scramble', 'puddle-step', 'pinning-shot', 'root-snare', 'burr-trap']) {
                if (readyMap.has(kId)) {
                  return { type: 'ability', abilityId: kId, targetId: nearest.id };
                }
              }
            }
            const dx = obs.x - nearest.x;
            const dz = obs.z - nearest.z;
            const d = Math.hypot(dx, dz) || 1;
            const desiredRange = Math.min(obs.weaponReach - 1, 10);
            const raw = { x: nearest.x + (dx / d) * desiredRange, z: nearest.z + (dz / d) * desiredRange };
            move = clampToDefend(raw, defendCap);
          } else if (target.dist > obs.weaponReach - 0.5) {
            move = clampToDefend({ x: target.x, z: target.z }, defendCap);
          }
        } else if (effectivePosture === 'cautious') {
          if (hpFrac < traits.healThreshold) {
            const dx = obs.x - nearest.x;
            const dz = obs.z - nearest.z;
            const d = Math.hypot(dx, dz) || 1;
            move = clampToDefend({ x: obs.x + (dx / d) * 4, z: obs.z + (dz / d) * 4 }, defendCap);
          } else if (target.dist > obs.weaponReach - 0.2) {
            move = clampToDefend({ x: target.x, z: target.z }, defendCap);
          }
        } else if (effectivePosture === 'melee' || target.dist > obs.weaponReach - 0.2) {
          if (target.dist > obs.weaponReach - 0.2) {
            move = clampToDefend({ x: target.x, z: target.z }, defendCap);
          }
        }
      }

      // If dodging a telegraph and melee out of reach, prioritize moving out first
      if (dodgeMove && target.dist > obs.weaponReach) {
        return { type: 'move', x: dodgeMove.x, z: dodgeMove.z };
      }

      // 6. Rotation
      const isMage = obs.state.classId === 'mage';
      const inAbilityRange = target.dist <= Math.max(12, obs.weaponReach);

      if (traits.rotation === 'auto-only') {
        if (isMage && obs.spellReady && obs.mp >= 6 && inAbilityRange) {
          return { type: 'cast', spell: 'flare', targetId: target.id, move };
        }
        return { type: 'attack', targetId: target.id, move };
      }

      if (traits.rotation === 'defensive-first') {
        for (const dId of ['shield-slam', 'challenge', 'sod-buster', 'hailstone', 'root-snare', 'thin-glaze', 'thick-glaze']) {
          if (readyMap.has(dId) && inAbilityRange) {
            return { type: 'ability', abilityId: dId, targetId: target.id, move };
          }
        }
        if (obs.resource.max > 0 && obs.resource.value / obs.resource.max > 0.7) {
          if (isMage && obs.spellReady && obs.mp >= 7 && inAbilityRange) {
            return { type: 'cast', spell: 'flare', targetId: target.id, move };
          }
          const off = obs.readyAbilities.find((a) => a.kind === 'attack' || a.kind === 'spell');
          if (off && inAbilityRange) {
            return { type: 'ability', abilityId: off.id, targetId: target.id, move };
          }
        }
        return { type: 'attack', targetId: target.id, move };
      }

      if (traits.rotation === 'greedy-dps') {
        const greedyOrder = [
          'gnome-smash', 'topiary', 'bash', 'trim',
          'bullseye', 'aimed-shot', 'pebble-spray', 'volley', 'thistle-volley',
          'heatwave', 'sunbeam', 'hailstone', 'downpour',
        ];
        if (inAbilityRange) {
          for (const id of greedyOrder) {
            if (readyMap.has(id)) {
              return { type: 'ability', abilityId: id, targetId: target.id, move };
            }
          }
          if (isMage && obs.spellReady && obs.mp >= 6) {
            return { type: 'cast', spell: 'flare', targetId: target.id, move };
          }
        }
        return { type: 'attack', targetId: target.id, move };
      }

      // 'tactical' rotation
      if (inAbilityRange) {
        if (readyMap.has('steady-breath') && obs.resource.kind === 'focus' && obs.resource.value < 75) {
          return { type: 'ability', abilityId: 'steady-breath', targetId: target.id, move };
        }
        if (readyMap.has('sunder') && !target.statuses.has('cracked')) {
          return { type: 'ability', abilityId: 'sunder', targetId: target.id, move };
        }
        if (readyMap.has('mark-quarry') && !target.statuses.has('marked')) {
          return { type: 'ability', abilityId: 'mark-quarry', targetId: target.id, move };
        }
        if (isMage && mpFrac >= 0.25 && !target.statuses.has('soaked')) {
          if (readyMap.has('downpour') && obs.enemies.length >= 2) {
            return { type: 'ability', abilityId: 'downpour', targetId: target.id, move };
          }
          if (readyMap.has('drizzle')) {
            return { type: 'ability', abilityId: 'drizzle', targetId: target.id, move };
          }
        }
        const nearbyCount = obs.enemies.filter((e) => Math.hypot(e.x - target.x, e.z - target.z) <= 5).length;
        if (nearbyCount >= 2 && (!isMage || mpFrac >= 0.25)) {
          for (const aoeId of ['topiary', 'sod-buster', 'volley', 'thistle-volley', 'pebble-spray', 'downpour', 'heatwave']) {
            if (readyMap.has(aoeId)) {
              return { type: 'ability', abilityId: aoeId, targetId: target.id, move };
            }
          }
        }
        const tacticalOrder = [
          'shield-slam', 'bash', 'sod-buster', 'gnome-smash', 'topiary', 'trim',
          'bullseye', 'aimed-shot', 'thistle-volley', 'pebble-spray', 'volley',
          'hailstone', 'heatwave', 'sunbeam',
        ];
        if (!isMage || mpFrac >= 0.25) {
          for (const id of tacticalOrder) {
            if (readyMap.has(id)) {
              return { type: 'ability', abilityId: id, targetId: target.id, move };
            }
          }
        }
        if (isMage && obs.spellReady && mpFrac >= 0.22 && obs.mp >= 6) {
          return { type: 'cast', spell: 'flare', targetId: target.id, move };
        }
      }

      return { type: 'attack', targetId: target.id, move };
    },
  };
}

export const TacticalPlayer = makePolicy({
  id: 'tactical',
  name: 'TacticalPlayer',
  posture: 'melee',
  telegraphDodge: 0.85,
  reactionSeconds: 0.35,
  healThreshold: 0.45,
  potionThreshold: 0.25,
  rotation: 'tactical',
  targetPriority: 'adds-first',
  respectObjectives: true,
});

export const GreedyBerserker = makePolicy({
  id: 'greedy-berserker',
  name: 'GreedyBerserker',
  posture: 'melee',
  telegraphDodge: 0,
  reactionSeconds: 1,
  healThreshold: 0,
  potionThreshold: 0,
  rotation: 'greedy-dps',
  targetPriority: 'boss-first',
  respectObjectives: false,
});

export const PassiveTurtler = makePolicy({
  id: 'passive-turtler',
  name: 'PassiveTurtler',
  posture: 'cautious',
  telegraphDodge: 0.9,
  reactionSeconds: 0.35,
  healThreshold: 0.78,
  potionThreshold: 0.5,
  rotation: 'defensive-first',
  targetPriority: 'nearest',
  respectObjectives: true,
});

export const FaceTanker = makePolicy({
  id: 'face-tanker',
  name: 'FaceTanker',
  posture: 'stand',
  telegraphDodge: 0.2,
  reactionSeconds: 0.6,
  healThreshold: 0.35,
  potionThreshold: 0.2,
  rotation: 'greedy-dps',
  targetPriority: 'nearest',
  respectObjectives: true,
});

export const KitingRanger = makePolicy({
  id: 'kiting-ranger',
  name: 'KitingRanger',
  posture: 'kite',
  telegraphDodge: 0.9,
  reactionSeconds: 0.3,
  healThreshold: 0.4,
  potionThreshold: 0.25,
  rotation: 'tactical',
  targetPriority: 'adds-first',
  respectObjectives: true,
});

export const POLICIES: Record<string, AgentPolicy> = {
  [TacticalPlayer.id]: TacticalPlayer,
  [GreedyBerserker.id]: GreedyBerserker,
  [PassiveTurtler.id]: PassiveTurtler,
  [FaceTanker.id]: FaceTanker,
  [KitingRanger.id]: KitingRanger,
};
