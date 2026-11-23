// Quest runner (roadmap 8.4): quests advance and finish from play, and report done, failed and progress.
import { describe, it, expect, vi } from 'vitest';
import { createWorld, LOCAL_PLAYER } from '../sim/world';
import { createSimHost } from '../net/simHost';
import { createBus } from './bus';
import { createQuestRunner } from './questRunner';
import { postQuest } from '../sim/quests';
import type { InventorySystem, PlayerState } from './types';
import type { Quest, RegionId, WorldState } from '../sim/types';

function fakeInv(): InventorySystem {
  const state = { hands: [null, null] as [null, null], worn: {}, pack: [] as never[] };
  return {
    state, add: () => null, get: () => null, take: () => null, move: () => false, findTag: () => null,
    countTag: () => 0, consumeTag: () => false, held: () => null, weight: () => 0, carryCapacity: () => 0,
    bulkUsed: () => 0, bulkCapacity: () => 0, cleanWater: () => 0, useWater: () => 0, fillLiquid: () => 0, onChange: () => () => {},
  } as unknown as InventorySystem;
}

function setup(): { world: WorldState; host: ReturnType<typeof createSimHost>; bus: ReturnType<typeof createBus>; runner: ReturnType<typeof createQuestRunner> } {
  const { world, streams } = createWorld(3);
  const host = createSimHost({ world, streams, worker: false, me: LOCAL_PLAYER });
  host.apply({ kind: 'player-join', name: 'Test', look: '', userId: null, region: null });
  const bus = createBus();
  const runner = createQuestRunner({ host, bus, inv: fakeInv(), getPlayer: () => ({} as PlayerState) });
  return { world, host, bus, runner };
}

function visitQuest(world: WorldState, region: RegionId): number {
  return postQuest(world, {
    template: 'sabotage', title: 'Walk the Tap', poster: 'f:0', board: null, region,
    goal: { kind: 'visit', region, item: null }, reward: { acorns: 0, items: [], trust: 0 },
    postedTick: world.tick, deadline: world.tick + 500, rival: null,
  });
}

describe('quest runner', () => {
  it('completes a visit quest when entered-region fires with the player in its region', () => {
    const { world, host, bus, runner } = setup();
    const id = visitQuest(world, 'the-tap');
    const done = vi.fn();
    bus.on('quest-done', done);
    expect(host.apply({ kind: 'take-quest', quest: id })?.ok).toBe(true);
    expect(runner.active().map((q) => q.id)).toEqual([id]);
    expect(runner.tracked()?.id).toBe(id);

    world.players[host.me].region = 'the-tap';
    bus.emit('entered-region', { region: 'the-tap' });

    expect(world.quests[id].state).toBe('done');
    expect(done).toHaveBeenCalledWith({ quest: id, template: 'sabotage' });
    expect(runner.active()).toEqual([]);
  });

  it('does not complete while the player is elsewhere', () => {
    const { world, host, bus, runner } = setup();
    const id = visitQuest(world, 'the-tap');
    host.apply({ kind: 'take-quest', quest: id });
    world.players[host.me].region = 'gate-roof';
    bus.emit('entered-region', { region: 'gate-roof' });
    expect(world.quests[id].state).toBe('taken');
    expect(runner.active().length).toBe(1);
  });

  it('reports a failed quest once with quest-failed and a hint', () => {
    const { world, host, bus, runner } = setup();
    const id = visitQuest(world, 'the-tap');
    host.apply({ kind: 'take-quest', quest: id });
    runner.update(0);
    const failed = vi.fn();
    const hint = vi.fn();
    bus.on('quest-failed', failed);
    bus.on('hint', hint);

    const q = world.quests[id] as Quest;
    q.state = 'failed';
    world.players[host.me].quests = world.players[host.me].quests.filter((x) => x !== id);
    runner.update(0);
    runner.update(0);

    expect(failed).toHaveBeenCalledTimes(1);
    expect(failed).toHaveBeenCalledWith({ quest: id });
    expect(hint).toHaveBeenCalledWith({ text: 'Walk the Tap: too late.' });
  });
});
