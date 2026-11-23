// Notice boards in the world (quests.md). One notice-board prefab per `board` spot in the map (district maps included),
// each with an Interactable that opens the board panel for that spot's region.
import type * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { BOARD, PREFAB_SCALE } from '../config';
import type { Bus } from '../game/bus';
import type { Interact, Interactable } from '../game/interact';
import type { BoardPanel, BoardsInWorld, SimHost, Vec3 } from '../game/types';
import type { BoardId } from '../sim/types';
import type { BlockoutMap, SpotDef } from '../world/types';

export function createBoards(deps: { scene: THREE.Scene; map: BlockoutMap; interact: Interact; host: SimHost; panel: BoardPanel; bus: Bus }): BoardsInWorld {
  const { scene, map, interact, panel, bus } = deps;
  const spots = map.spots.filter((s) => s.kind === 'board');

  for (const spot of spots) {
    const dir = facingFor(map, spot);
    const group = buildPrefab('notice-board', { scale: PREFAB_SCALE });
    group.position.set(spot.x, spot.y, spot.z);
    group.rotation.y = Math.atan2(dir[0], dir[1]);   // the prefab's front is +z
    scene.add(group);
    const boardId: BoardId = `board:${spot.region}`;
    const item: Interactable = {
      id: `board:${spot.id}`,
      x: spot.x, y: spot.y, z: spot.z,
      radius: BOARD.radius,
      label: () => 'Read the notice board',
      act() {
        panel.open(boardId);
        bus.emit('board-opened', { board: boardId });
      },
    };
    interact.add(item);
  }

  return {
    boardNear(pos: Vec3): BoardId | null {
      let best: SpotDef | null = null;
      let bestD = BOARD.radius * BOARD.radius;
      for (const s of spots) {
        const d = (s.x - pos.x) ** 2 + (s.y - pos.y) ** 2 + (s.z - pos.z) ** 2;
        if (d <= bestD) { bestD = d; best = s; }
      }
      return best ? `board:${best.region}` : null;
    },
  };
}

const DIRS: readonly [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const STEP = 0.5;
const REACH = 4;

/** Horizontal facing for a board on a spot: the side with the longest open run (walls of blocks taller than the spot stop it). */
function facingFor(map: BlockoutMap, spot: SpotDef): [number, number] {
  let best: [number, number] = DIRS[0];
  let bestRun = -1;
  for (const d of DIRS) {
    let run = 0;
    for (let t = STEP; t <= REACH; t += STEP) {
      const x = spot.x + d[0] * t;
      const z = spot.z + d[1] * t;
      const walled = map.blocks.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && b.y + b.h > spot.y + 0.5);
      if (walled) break;
      run = t;
    }
    if (run > bestRun) { bestRun = run; best = d; }
  }
  return best;
}
