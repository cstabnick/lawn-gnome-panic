import { describe, it, expect } from 'vitest';
import { TUNING } from '../config';
import {
  createCombat, jumpAway, moveCrew, setSystemPower, setWeaponTarget, stepCombat, toggleWeaponPower,
} from './combat';
import { weaponChargeTime } from './queries';
import { makeEnemyShip, makePlayerShip } from './ships';
import type { CombatState, Projectile, ShipState } from './types';

// Never dodges, never starts a fire, never fires on its own: a quiet rng for isolated tests.
const quiet = () => 0.99;

function setup(): { state: CombatState; player: ShipState; enemy: ShipState } {
  const player = makePlayerShip();
  const enemy = makeEnemyShip(1, () => 0.5);
  return { state: createCombat(player, enemy), player, enemy };
}

// Player rooms: 0 engines, 1 medbay, 2 shields, 3 weapons (Toadstool), 4 pilot (Bramble).
// Enemy rooms (tier 1): 0 pilot, 1 weapons, 2 shields, 3 engines, 4 corridor.
function blasterAt(enemyRoomId: number, travelMsLeft: number): Projectile {
  return { id: 99, from: 'player', defId: 'clippings', targetRoomId: enemyRoomId, travelMsLeft, travelMsTotal: travelMsLeft };
}

describe('setSystemPower', () => {
  it('clamps to free reactor power and to level minus damage', () => {
    const { player } = setup();
    expect(setSystemPower(player, 'engines', 0)).toBe(true); // frees 2 bars
    player.systems.engines.level = 4;
    expect(setSystemPower(player, 'engines', 10)).toBe(true);
    expect(player.systems.engines.power).toBe(2); // only 2 free bars
    player.systems.engines.damage = 3; // level - damage = 1
    expect(setSystemPower(player, 'engines', 4)).toBe(true);
    expect(player.systems.engines.power).toBe(1);
    expect(setSystemPower(player, 'engines', 1)).toBe(false); // no change
  });
});

describe('toggleWeaponPower', () => {
  it('powers then unpowers and updates systems.weapons.power', () => {
    const { player } = setup();
    expect(player.weapons[0].powered).toBe(true); // autoPower powers both guns
    expect(player.systems.weapons.power).toBe(2);
    expect(toggleWeaponPower(player, 0)).toBe(true);
    expect(player.weapons[0].powered).toBe(false);
    expect(player.systems.weapons.power).toBe(1);
    expect(toggleWeaponPower(player, 0)).toBe(true);
    expect(player.weapons[0].powered).toBe(true);
    expect(player.systems.weapons.power).toBe(2);
    expect(toggleWeaponPower(player, 9)).toBe(false);
  });
});

describe('moveCrew', () => {
  it('walks for crewMoveMsPerTile * dist ms, then stands in the new room', () => {
    const { state, player } = setup();
    const pip = player.crew.find((c) => c.name === 'Pip')!; // in room 0 (engines)
    moveCrew(player, pip.id, 4); // pilot room: dist |0-4| + |0-0| = 4
    expect(pip.roomId).toBe(4);
    expect(pip.fromRoomId).toBe(0);
    const walk = 4 * TUNING.crewMoveMsPerTile;
    expect(pip.moveMsLeft).toBe(walk);
    stepCombat(state, walk - 1, quiet);
    expect(pip.moveMsLeft).toBe(1);
    stepCombat(state, 1, quiet);
    expect(pip.moveMsLeft).toBe(0);
    expect(pip.fromRoomId).toBe(4);
  });
});

describe('weapon firing', () => {
  it('a powered, targeted weapon fires after its charge time and spawns shots', () => {
    const { state, player } = setup();
    const gun = player.weapons[0]; // clippings: 2 shots
    setWeaponTarget(player, 0, 0);
    const charge = weaponChargeTime(player, gun);
    stepCombat(state, charge - 1, quiet);
    expect(state.projectiles.length).toBe(0);
    stepCombat(state, 1, quiet);
    expect(state.projectiles.length).toBe(2);
    expect(state.projectiles.every((p) => p.defId === 'clippings' && p.targetRoomId === 0)).toBe(true);
    expect(state.projectiles[0].travelMsTotal).toBe(TUNING.projectileTravelMs);
    expect(state.projectiles[1].travelMsTotal).toBe(TUNING.projectileTravelMs + 150);
    expect(state.log.filter((e) => e.type === 'fired').length).toBe(2);
  });

  it('a lobber consumes a pinecone per volley', () => {
    const { state, player } = setup();
    const lobber = player.weapons[1]; // pinecone: 1 shot, costs 1 pinecone
    setWeaponTarget(player, 1, 0);
    const charge = weaponChargeTime(player, lobber);
    const before = player.pinecones;
    stepCombat(state, charge - 1, quiet);
    stepCombat(state, 1, quiet);
    expect(player.pinecones).toBe(before - 1);
    expect(state.projectiles.length).toBe(1);
    expect(state.projectiles[0].defId).toBe('pinecone');
  });
});

describe('projectile hits', () => {
  it('a blaster hit on a shielded ship removes a layer instead of hull', () => {
    const { state, enemy } = setup();
    enemy.shieldLayers = 1;
    const hull = enemy.hull;
    state.projectiles.push(blasterAt(0, 10));
    stepCombat(state, 20, quiet);
    expect(enemy.shieldLayers).toBe(0);
    expect(enemy.hull).toBe(hull);
    expect(state.log.some((e) => e.type === 'shieldBlock')).toBe(true);
  });

  it('with no shield layers a blaster hit removes hull and damages the room system', () => {
    const { state, enemy } = setup();
    enemy.shieldLayers = 0;
    enemy.systems.shields.power = 0; // no shield recharge during the test
    const hull = enemy.hull;
    state.projectiles.push(blasterAt(0, 10));
    stepCombat(state, 20, quiet);
    expect(enemy.hull).toBe(hull - 1);
    expect(enemy.systems.pilot.damage).toBe(1);
    const gnome = enemy.crew.find((c) => c.roomId === 0)!;
    expect(gnome.hp).toBe(TUNING.crewMaxHp - TUNING.crewDamagePerHit);
  });
});

describe('damage removes power', () => {
  it('power above level minus damage is cut, lowest-priority guns unpowered first', () => {
    const { state, player } = setup();
    player.systems.engines.damage = 1; // engines level 2, power 2 -> 1
    stepCombat(state, 1, quiet);
    expect(player.systems.engines.power).toBe(1);

    player.systems.weapons.damage = 2; // cap = 1, guns draw 2 -> last gun unpowered
    stepCombat(state, 1, quiet);
    expect(player.weapons[1].powered).toBe(false);
    expect(player.weapons[0].powered).toBe(true);
    expect(player.systems.weapons.power).toBe(1);
  });
});

describe('repair', () => {
  it('a standing crew repairs 1 damage in repairMsPerPoint ms', () => {
    const { state, player } = setup();
    player.systems.weapons.damage = 1; // room 3 has Toadstool standing in it
    stepCombat(state, TUNING.repairMsPerPoint - 1, quiet);
    expect(player.systems.weapons.damage).toBe(1);
    stepCombat(state, 1, quiet);
    expect(player.systems.weapons.damage).toBe(0);
    expect(state.log.some((e) => e.type === 'repaired')).toBe(true);
  });
});

describe('outcome', () => {
  it("enemy hull reaching 0 gives 'won', and stepCombat does nothing afterwards", () => {
    const { state, enemy } = setup();
    enemy.hull = 1;
    enemy.shieldLayers = 0;
    enemy.systems.shields.power = 0;
    state.projectiles.push(blasterAt(0, 10));
    stepCombat(state, 20, quiet);
    expect(state.outcome).toBe('won');
    const elapsed = state.elapsedMs;
    stepCombat(state, 100, quiet);
    expect(state.elapsedMs).toBe(elapsed);
    expect(state.outcome).toBe('won');
  });
});

describe('jumpAway', () => {
  it('is false before the jump charge is full and true after, with a manned seat', () => {
    const { state } = setup();
    expect(jumpAway(state)).toBe(false);
    stepCombat(state, TUNING.jumpChargeMs / 2, quiet);
    expect(jumpAway(state)).toBe(false);
    stepCombat(state, TUNING.jumpChargeMs / 2, quiet);
    expect(state.jumpChargeMs).toBe(TUNING.jumpChargeMs);
    expect(jumpAway(state)).toBe(true);
    expect(state.outcome).toBe('fled');
    expect(jumpAway(state)).toBe(false);
  });
});
