// Loot containers in the world: one Interactable per map container. Contents come from the sim's loot budget
// (rollContainer), the player takes what fits, and every stack taken is booked as removed by the player.
import type { Streams } from '../sim/rng';
import type { ItemStack, WorldState } from '../sim/types';
import { rollContainer } from '../sim/loot';
import { recordPlayerTake } from '../sim/world';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { ContainerSystem, InventoryPanel, InventorySystem, PlayerState, WorldView } from '../game/types';
import type { BlockoutMap } from '../world/types';
import { CONTAINER_NAME } from '../config';

export interface ContainerDeps { map: BlockoutMap; worldView: WorldView; interact: Interact; sim: { world: WorldState; streams: Streams };
  bus: Bus; panel: InventoryPanel; inv: InventorySystem; getPlayer: () => PlayerState }

const REACH = 1.6;
const SACRED_NOTE = ' (the Keeping frowns on this)';

export function createContainerSystem(deps: ContainerDeps): ContainerSystem {
  const { map, interact, sim, bus, panel, inv } = deps;

  for (const def of map.containers) {
    const name = CONTAINER_NAME[def.type];
    const sacred = (sim.world.graph.regions.find((r) => r.id === def.region)?.traits ?? []).includes('SACRED');
    const suffix = sacred ? SACRED_NOTE : '';
    interact.add({
      id: `container:${def.id}`,
      x: def.x, y: def.y, z: def.z,
      radius: REACH,
      label() {
        const state = sim.world.containers[def.id];
        if (!state || !state.opened) return `Search the ${name}${suffix}`;
        const n = state.contents.reduce((a, s) => a + s.count, 0);
        if (n === 0) return null;
        return `Look in the ${name} (${n} items)${suffix}`;
      },
      act() {
        const firstTime = !sim.world.containers[def.id]?.opened;
        const items = rollContainer(sim.world, def.id, sim.streams.loot);
        if (firstTime) {
          bus.emit('container-opened', {
            containerId: def.id,
            region: def.region,
            items: items.map((s) => ({ ...s })),
          });
          deps.worldView.setContainerOpened(def.id);
        }
        panel.showLoot(`The ${name}`, items, (index) => onTake(items, index));
      },
    });
  }

  function onTake(items: ItemStack[], index: number): void {
    const stack = items[index];
    if (!stack) return;
    const original = stack.count;
    const leftover = inv.add({ ...stack });
    const taken = original - (leftover?.count ?? 0);
    if (taken > 0) {
      recordPlayerTake(sim.world, { ...stack, count: taken });
      bus.emit('item-taken', { stack: { ...stack, count: taken } });
    }
    if (leftover) {
      items[index] = leftover;
      bus.emit('hint', { text: 'No room in your pack.' });
    } else {
      items.splice(index, 1);
    }
  }

  return { update() {} };
}
