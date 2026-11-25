import { describe, expect, it } from 'vitest';
import { createWorld, hashWorld, runDays } from './world';
import { rollContainer } from './loot';

describe('toggleable loot respawn', () => {
  it('leaves emptied containers closed/empty by default (lootRespawn off)', () => {
    const { world, streams } = createWorld(42);
    const firstId = Object.keys(world.containers)[0];
    expect(firstId).toBeDefined();
    rollContainer(world, firstId, streams.loot);
    world.containers[firstId].contents.length = 0;

    runDays(world, streams, 5);
    expect(world.lootRespawn).toBeUndefined();
    expect(world.containers[firstId].opened).toBe(true);
    expect(world.containers[firstId].contents).toHaveLength(0);

    // Default world hash matches a fresh run with no lootRespawn field set.
    const a = createWorld(99);
    const b = createWorld(99);
    runDays(a.world, a.streams, 3);
    runDays(b.world, b.streams, 3);
    expect(hashWorld(a.world)).toBe(hashWorld(b.world));
  });

  it('respawns emptied containers after interval days when lootRespawn is enabled and region is unoccupied', () => {
    const { world, streams } = createWorld(42);
    world.lootRespawn = true;
    world.lootRespawnDays = 2;

    const ids = Object.keys(world.containers);
    const freeId = ids[0];
    const occupiedId = ids.find((id) => world.containers[id].region !== world.containers[freeId].region) ?? ids[1];

    rollContainer(world, freeId, streams.loot);
    world.containers[freeId].contents.length = 0;
    rollContainer(world, occupiedId, streams.loot);
    world.containers[occupiedId].contents.length = 0;

    // Occupy the second container's region with a player bubble.
    world.bubbles.push({ owner: 'local', region: world.containers[occupiedId].region, hatless: 0, viewers: [] });

    runDays(world, streams, 2);
    expect(world.containers[freeId].opened).toBe(false);
    expect(world.containers[occupiedId].opened).toBe(true);
  });
});
