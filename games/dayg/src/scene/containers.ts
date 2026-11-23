// Loot containers in the world: one Interactable per map container. Opening and taking go through the sim host as actions
// (open-container, player-take); the host rolls the contents, and every stack taken is booked as removed by the player.
// A guest's open result arrives later through host.onAction.
import type { Streams } from '../sim/rng';
import type { ContainerDef, ItemStack, WorldState } from '../sim/types';
import { LOCAL_PLAYER } from '../sim/world';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { ContainerSystem, InventoryPanel, InventorySystem, PlayerState, SimHost, WorldView } from '../game/types';
import type { BlockoutMap } from '../world/types';
import { CONTAINER_NAME } from '../config';
import { createSimHost } from '../net/simHost';

export interface ContainerDeps { map: BlockoutMap; worldView: WorldView; interact: Interact; sim: { world: WorldState; streams: Streams };
  bus: Bus; panel: InventoryPanel; inv: InventorySystem; getPlayer: () => PlayerState; host?: SimHost }

const REACH = 1.6;
const SACRED_NOTE = ' (the Keeping frowns on this)';

export function createContainerSystem(deps: ContainerDeps): ContainerSystem {
  const { map, interact, sim, bus, panel, inv } = deps;
  const host: SimHost = deps.host ?? createSimHost({ world: sim.world, streams: sim.streams, worker: false, me: LOCAL_PLAYER });
  const world = host.world;
  const defs = new Map<string, ContainerDef>();
  // Guest: the container asked for, and whether it was unopened when asked (its items arrive through onAction).
  let pending: { id: string; firstTime: boolean } | null = null;

  const showLoot = (def: ContainerDef, firstTime: boolean, items: ItemStack[]): void => {
    if (firstTime) {
      bus.emit('container-opened', {
        containerId: def.id,
        region: def.region,
        items: items.map((s) => ({ ...s })),
      });
      deps.worldView.setContainerOpened(def.id);
    }
    panel.showLoot(`The ${CONTAINER_NAME[def.type]}`, items, (index) => onTake(items, index));
  };

  for (const def of map.containers) {
    defs.set(def.id, def);
    const name = CONTAINER_NAME[def.type];
    const sacred = (world.graph.regions.find((r) => r.id === def.region)?.traits ?? []).includes('SACRED');
    const suffix = sacred ? SACRED_NOTE : '';
    interact.add({
      id: `container:${def.id}`,
      x: def.x, y: def.y, z: def.z,
      radius: REACH,
      label() {
        const state = world.containers[def.id];
        if (!state || !state.opened) return `Search the ${name}${suffix}`;
        const n = state.contents.reduce((a, s) => a + s.count, 0);
        if (n === 0) return null;
        return `Look in the ${name} (${n} items)${suffix}`;
      },
      act() {
        const firstTime = !world.containers[def.id]?.opened;
        if (host.role === 'guest') {
          pending = { id: def.id, firstTime };
          host.apply({ kind: 'open-container', id: def.id });
          return;
        }
        const r = host.apply({ kind: 'open-container', id: def.id });
        showLoot(def, firstTime, r?.items ?? []);
      },
    });
  }

  host.onAction((env, r) => {
    if (env.action.kind !== 'open-container' || !pending || pending.id !== env.action.id) return;
    const { id, firstTime } = pending;
    pending = null;
    const def = defs.get(id);
    if (def) showLoot(def, firstTime, r.items ?? []);
  });

  function onTake(items: ItemStack[], index: number): void {
    const stack = items[index];
    if (!stack) return;
    const original = stack.count;
    const leftover = inv.add({ ...stack });
    const taken = original - (leftover?.count ?? 0);
    if (taken > 0) {
      host.apply({ kind: 'player-take', stack: { ...stack, count: taken } });
      bus.emit('item-taken', { stack: { ...stack, count: taken } });
    }
    if (leftover) {
      items[index] = leftover;
      bus.emit('hint', { text: 'No room in your pack.' });
    } else {
      items.splice(index, 1);
    }
  }

  // Re-read every container's opened state after the world was replaced (a snapshot load).
  bus.on('world-loaded', () => {
    for (const id of Object.keys(world.containers)) if (world.containers[id]?.opened) deps.worldView.setContainerOpened(id);
  });

  return { update() {} };
}
