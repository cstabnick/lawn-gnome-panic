import { canInteractWith, createSim, findNearestInteractable, INTERACT_RANGE, stepSim } from './engine';
import type { Interactable, SimInput, SimState } from './types';

export interface SimRunResult {
  seed: number;
  escaped: boolean;
  caught: boolean;
  seconds: number;
  obstaclesCleared: number;
  peakCount: number;
  maxDreamDrag: number;
  minDreamDragAfterPeak: number;
  phasesSeen: Set<string>;
}

function chooseGoal(state: SimState): { x: number; z: number } | null {
  const p = state.player;
  // 1. Collect shards if needed
  if (p.shards < p.shardsNeeded) {
    const shard = state.interactables.find((i) => i.kind === 'glaze_shard' && !i.collected);
    if (shard) return { x: shard.x, z: shard.z };
  }
  // 2. Shatter kiln ward
  if (!state.obstacleStatus.kilnCleared) {
    const kiln = state.interactables.find((i) => i.kind === 'kiln_ward' && !i.activated);
    if (kiln) return { x: kiln.x, z: kiln.z };
  }
  // 3. Collect heavy acorn
  if (!p.hasAcorn && !state.obstacleStatus.bridgeCleared) {
    const acorn = state.interactables.find((i) => i.kind === 'heavy_acorn' && !i.collected);
    if (acorn) return { x: acorn.x, z: acorn.z };
  }
  // 4. Spring snare bridge
  if (!state.obstacleStatus.bridgeCleared) {
    const snare = state.interactables.find((i) => i.kind === 'snare_bridge' && !i.activated);
    if (snare) return { x: snare.x, z: snare.z - 1.4 };
  }
  // 5. Ring 3 soul-bells
  if (!state.obstacleStatus.bellsCleared) {
    const bell = state.interactables.find((i) => i.kind === 'soul_bell' && !i.activated);
    if (bell) return { x: bell.x, z: bell.z };
  }
  // 6. Exit door
  const exit = state.interactables.find((i) => i.kind === 'exit_door');
  return exit ? { x: exit.x, z: exit.z } : null;
}

function nextWaypointToward(state: SimState, gx: number, gz: number): { x: number; z: number } {
  const p = state.player;
  const targetRoom = state.rooms.find(
    (r) => gx >= r.xMin - 0.5 && gx <= r.xMax + 0.5 && gz >= r.zMin - 0.5 && gz <= r.zMax + 0.5,
  );
  if (!targetRoom || targetRoom.id === p.roomId) {
    return { x: gx, z: gz };
  }
  // Step through the doorway toward targetRoom
  const dir = targetRoom.id > p.roomId ? 1 : -1;
  const door = state.doorways.find((d) =>
    dir > 0 ? d.roomA === p.roomId && d.roomB === p.roomId + 1 : d.roomB === p.roomId && d.roomA === p.roomId - 1,
  );
  if (door) {
    // Line up with the doorway X before crossing Z so we never clip the wall beside the door
    if (Math.abs(p.x - door.x) > 0.75 && Math.abs(p.z - door.z) < 2.2) {
      return { x: door.x, z: door.z - dir * 1.1 };
    }
    return { x: door.x, z: door.z + dir * 1.5 };
  }
  return { x: gx, z: gz };
}

export function runSimulatedPlaythrough(
  seed: number,
  policy: 'cautious' | 'reckless',
  maxSeconds = 120,
  noMonsters = false,
): SimRunResult {
  const state = createSim(seed);
  if (noMonsters) state.monsters.length = 0;
  const dt = 1 / 20;
  const maxSteps = Math.floor(maxSeconds / dt);
  const phasesSeen = new Set<string>([state.director.phase]);
  let maxDreamDrag = 0;
  let minDreamDragAfterPeak = 1;
  let sawPeak = false;
  let stuckTimer = 0;
  let lastX = state.player.x;
  let lastZ = state.player.z;
  let strafeSign = 1;

  for (let step = 0; step < maxSteps; step++) {
    if (state.player.escaped || state.player.caught) break;

    const p = state.player;
    let nearestMonsterDist = Infinity;
    for (const m of state.monsters) {
      const d = Math.hypot(m.x - p.x, m.z - p.z);
      if (d < nearestMonsterDist) nearestMonsterDist = d;
    }

    const goal = chooseGoal(state);
    let nav = goal ? nextWaypointToward(state, goal.x, goal.z) : { x: p.x, z: p.z };
    // Cautious steps away from a monster that is close but has not spotted it, instead of walking into its reach
    if (policy === 'cautious' && nearestMonsterDist < 3.2) {
      const near = state.monsters.reduce((best, m) => (Math.hypot(m.x - p.x, m.z - p.z) < Math.hypot(best.x - p.x, best.z - p.z) ? m : best));
      if (near.state !== 'chase') {
        const ax = p.x - near.x;
        const az = p.z - near.z;
        const len = Math.hypot(ax, az) || 1;
        nav = { x: p.x + (ax / len) * 4, z: p.z + (az / len) * 4 };
      }
    }

    const activeChase = state.monsters.some(
      (m) => m.state === 'chase' && Math.hypot(m.x - p.x, m.z - p.z) < 7.0,
    );

    // Cautious policy: douse lantern near monsters, crouch under furniture if chased, sprint when moving
    let wantLantern = policy === 'reckless' ? true : nearestMonsterDist > 9.5;
    let crouch = policy === 'cautious' && p.hiding && activeChase;
    // Cautious walks near monsters: a sprint carries farther than any of them can see, and the Hush hears it from across a room
    let sprint = policy === 'reckless' || (!crouch && p.stamina > 0.25 && nearestMonsterDist > 15);

    // Steer yaw toward nav target
    const dx = nav.x - p.x;
    const dz = nav.z - p.z;
    const desiredYaw = Math.atan2(-dx, -dz);
    let yawDiff = desiredYaw - p.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    const nearItem = findNearestInteractable(state);
    const shouldInteract = !!nearItem && nearItem.ok;

    // Pause movement while hiding under furniture if monster is actively chasing nearby
    const holdPosition = policy === 'cautious' && p.hiding && activeChase && nearestMonsterDist < 4.0 && !shouldInteract;

    // Obstacle avoidance nudge if stuck against solid furniture
    if (Math.hypot(p.x - lastX, p.z - lastZ) < 0.025 && !holdPosition) {
      stuckTimer += dt;
      if (stuckTimer > 1.2) {
        strafeSign = -strafeSign;
        stuckTimer = 0.25;
      }
    } else {
      stuckTimer = Math.max(0, stuckTimer - dt * 0.5);
    }
    lastX = p.x;
    lastZ = p.z;

    const input: SimInput = {
      moveForward: holdPosition ? 0 : 1,
      moveRight: stuckTimer > 0.2 ? strafeSign * 0.95 : 0,
      yawDelta: Math.max(-0.25, Math.min(0.25, yawDiff)),
      pitchDelta: 0,
      sprint: sprint && !holdPosition,
      crouch,
      interact: shouldInteract,
      toggleLantern: p.lanternOn !== wantLantern,
    };

    stepSim(state, input, dt);

    phasesSeen.add(state.director.phase);
    if (state.director.dreamDrag > maxDreamDrag) maxDreamDrag = state.director.dreamDrag;
    if (state.director.phase === 'peak') sawPeak = true;
    if (sawPeak && state.director.phase === 'relief') {
      minDreamDragAfterPeak = Math.min(minDreamDragAfterPeak, state.director.dreamDrag);
    }
  }

  return {
    seed,
    escaped: state.player.escaped,
    caught: state.player.caught,
    seconds: Number(state.time.toFixed(2)),
    obstaclesCleared: state.player.obstaclesCleared,
    peakCount: state.director.peakCount,
    maxDreamDrag,
    minDreamDragAfterPeak,
    phasesSeen,
  };
}

export function verifyInteractableReachable(item: Interactable, state: SimState): boolean {
  const r = state.rooms[item.roomId];
  if (!r) return false;
  return item.x >= r.xMin && item.x <= r.xMax && item.z >= r.zMin && item.z <= r.zMax;
}

export { canInteractWith, INTERACT_RANGE };
