import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dealDamage, resetCombatState } from '../combat';
import {
  allEntities,
  applyRemoteEnemyHit,
  applyRemoteEnemyKill,
  applyZoneEnemySync,
  exportZoneEnemies,
  isEntityAuthority,
  removeEntity,
  setEnemyNet,
  spawnEnemyAt,
  spawnRemoteEnemy,
  type EnemyNetBridge,
} from '../entities';
import { bus } from '../events';
import { readDamageType, readEnemySyncList, readStatusId } from './protocol';

function makeBridge(overrides: Partial<EnemyNetBridge> = {}): EnemyNetBridge {
  return {
    isOnline: () => true,
    myId: () => 2,
    isZoneAuthority: () => false,
    remoteTargets: () => [],
    sendEnemyHit: vi.fn(),
    sendEnemyStatus: vi.fn(),
    sendEnemyAttack: vi.fn(),
    sendEnemyKill: vi.fn(),
    sendDynamicSpawn: vi.fn(),
    ...overrides,
  };
}

describe('enemy sync protocol validators', () => {
  it('validates enemy sync tuples and rejects malformed entries', () => {
    const valid = [['s:0:0', 10.5, -20.25, 1.2, 40, 0, 1, 3, 0]];
    expect(readEnemySyncList(valid)).toEqual(valid);
    expect(readEnemySyncList([['', 0, 0, 0, 10, 0, 0, 0, 0]])).toBeNull();
    expect(readEnemySyncList([['s:0:0', 0, 0, 0, -5, 0, 0, 0, 0]])).toBeNull();
    expect(readEnemySyncList([['s:0:0', 0, 0]])).toBeNull();
    expect(readEnemySyncList('not-an-array')).toBeNull();
  });

  it('validates damage types and status ids', () => {
    expect(readDamageType('slash')).toBe('slash');
    expect(readDamageType('bloom')).toBe('bloom');
    expect(readDamageType('laser')).toBeNull();
    expect(readStatusId('poisoned')).toBe('poisoned');
    expect(readStatusId('flying')).toBeNull();
  });
});

describe('enemy sync entity behavior', () => {
  const createdIds: number[] = [];

  beforeEach(() => {
    resetCombatState();
  });

  afterEach(() => {
    setEnemyNet(null);
    for (const id of createdIds.splice(0)) removeEntity(id);
    for (const e of allEntities()) removeEntity(e.id);
  });

  it('forwards hits from non-authority without prematurely killing locally', () => {
    const bridge = makeBridge({ isZoneAuthority: () => false, myId: () => 2 });
    setEnemyNet(bridge);

    const e = spawnEnemyAt('slug', 10, 10)!;
    expect(e).not.toBeNull();
    createdIds.push(e.id);
    expect(isEntityAuthority(e.id)).toBe(false);

    const killedSpy = vi.fn();
    bus.on('enemy-killed', killedSpy);
    dealDamage(e.id, 9999, 'crush');
    bus.off('enemy-killed', killedSpy);

    expect(e.dead).toBe(false);
    expect(e.hp).toBe(1);
    expect(killedSpy).not.toHaveBeenCalled();
    expect(bridge.sendEnemyHit).toHaveBeenCalledTimes(1);
  });

  it('grants kill credit only to the player who landed the killing blow', () => {
    const bridge = makeBridge({ isZoneAuthority: () => false, myId: () => 2 });
    setEnemyNet(bridge);

    spawnRemoteEnemy('d:1:1', 'slug', 5, 5, 'mossbottom');
    spawnRemoteEnemy('d:1:2', 'slug', 8, 8, 'mossbottom');
    // Note: spawnRemoteEnemy requires liveZones to contain 'mossbottom'; if no zone is loaded in Node,
    // use spawnEnemyAt which assigns a syncKey when online.
    const e1 = spawnEnemyAt('slug', 12, 12)!;
    const e2 = spawnEnemyAt('slug', 14, 14)!;
    createdIds.push(e1.id, e2.id);

    const exported = exportZoneEnemies('mossbottom');
    const key1 = exported.find((row) => row[1] === 12)?.[0];
    const key2 = exported.find((row) => row[1] === 14)?.[0];
    expect(key1).toBeTruthy();
    expect(key2).toBeTruthy();

    const killedSpy = vi.fn();
    bus.on('enemy-killed', killedSpy);

    // Another player (id 1) got the kill on e1 -> e1 dies locally without awarding local kill credit.
    applyRemoteEnemyKill(key1!, 1);
    expect(e1.dead).toBe(true);
    expect(killedSpy).not.toHaveBeenCalled();

    // Local player (id 2) got the kill on e2 -> e2 dies and emits enemy-killed.
    applyRemoteEnemyKill(key2!, 2);
    expect(e2.dead).toBe(true);
    expect(killedSpy).toHaveBeenCalledTimes(1);
    bus.off('enemy-killed', killedSpy);
  });

  it('authority applies remote hits, kills, and broadcasts killer id', () => {
    const bridge = makeBridge({ isZoneAuthority: () => true, myId: () => 1 });
    setEnemyNet(bridge);

    const e = spawnEnemyAt('slug', 20, 20)!;
    createdIds.push(e.id);
    const key = exportZoneEnemies(
      // Find whichever zone (20, 20) resolves to
      'mossbottom',
    ).find((row) => row[1] === 20)?.[0];
    expect(key).toBeTruthy();

    applyRemoteEnemyHit(key!, 3, 9999, 'slash', true, false);
    expect(e.dead).toBe(true);
    expect(bridge.sendEnemyKill).toHaveBeenCalledWith('mossbottom', key, 3);
  });

  it('applies sync snapshots for HP, death, and respawn', () => {
    const bridge = makeBridge({ isZoneAuthority: () => false, myId: () => 2 });
    setEnemyNet(bridge);

    const e = spawnEnemyAt('slug', 25, 25)!;
    createdIds.push(e.id);
    const key = exportZoneEnemies('mossbottom').find((row) => row[1] === 25)![0];

    applyZoneEnemySync('mossbottom', [[key, 26, 27, 1.5, 5, 0, 1, 2, 0]], undefined, true);
    expect(e.hp).toBe(5);
    expect(e.inCombat).toBe(true);
    expect(e.position.x).toBe(26);
    expect(e.position.z).toBe(27);

    applyZoneEnemySync('mossbottom', [[key, 26, 27, 1.5, 0, 1, 0, 2, 0]], undefined, true);
    expect(e.dead).toBe(true);

    applyZoneEnemySync('mossbottom', [[key, 25, 25, 0, e.maxHp, 0, 0, 2, 0]], undefined, true);
    expect(e.dead).toBe(false);
    expect(e.hp).toBe(e.maxHp);
  });
});
