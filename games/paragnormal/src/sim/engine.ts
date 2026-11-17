import { updateDirector } from './director';
import type {
  Doorway,
  Interactable,
  MonsterState,
  RoomDef,
  SimInput,
  SimState,
} from './types';
import { generateWorld } from './worldGen';

export const PLAYER_RADIUS = 0.28;
export const MONSTER_RADIUS = 0.55;
export const INTERACT_RANGE = 2.1;

export function createSim(seed = 1337): SimState {
  const gen = generateWorld(seed);
  return {
    seed,
    time: 0,
    rooms: gen.rooms,
    doorways: gen.doorways,
    furniture: gen.furniture,
    interactables: gen.interactables,
    waypoints: gen.waypoints,
    monsters: gen.monsters,
    director: {
      phase: 'calm',
      tension: 0.1,
      dreamDrag: 0,
      phaseTimer: 0,
      peakDuration: 0,
      reliefCooldown: 0,
      heartbeatRate: 62,
      peakCount: 0,
    },
    player: {
      x: gen.spawn.x,
      y: 0.42,
      z: gen.spawn.z,
      yaw: gen.spawn.yaw,
      pitch: 0,
      vx: 0,
      vz: 0,
      crouching: false,
      hiding: false,
      lanternOn: true,
      stamina: 1,
      hp: 3,
      maxHp: 3,
      stepPhase: 0,
      shards: 0,
      shardsNeeded: 2,
      hasAcorn: false,
      bellsRung: 0,
      bellsNeeded: 3,
      obstaclesCleared: 0,
      escaped: false,
      caught: false,
      roomId: 0,
      invulnTimer: 0,
    },
    obstacleStatus: {
      kilnCleared: false,
      bridgeCleared: false,
      bellsCleared: false,
    },
    message: 'Find 2 Soul-Glaze Shards to shatter the Kiln Ward.',
    messageTimer: 5.5,
    events: [],
  };
}

export function roomAt(rooms: RoomDef[], x: number, z: number): RoomDef | undefined {
  for (const r of rooms) {
    if (x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax) return r;
  }
  return undefined;
}

function doorwayPassable(d: Doorway, state: SimState): boolean {
  if (d.blockedBy === 'kiln_ward' && !state.obstacleStatus.kilnCleared) return false;
  return true;
}

function clampToHouse(
  x: number,
  z: number,
  radius: number,
  state: SimState,
  ignoreKiln = false,
): { x: number; z: number } {
  let nx = x;
  let nz = z;

  // Find current or nearest room
  let room = roomAt(state.rooms, nx, nz);
  if (!room) {
    let bestD = Infinity;
    for (const r of state.rooms) {
      const cx = Math.max(r.xMin, Math.min(r.xMax, nx));
      const cz = Math.max(r.zMin, Math.min(r.zMax, nz));
      const d = Math.hypot(nx - cx, nz - cz);
      if (d < bestD) {
        bestD = d;
        room = r;
      }
    }
  }
  if (!room) return { x: nx, z: nz };

  // Check if inside a passable doorway band
  let inDoorX = false;
  let activeDoor: Doorway | undefined;
  for (const d of state.doorways) {
    if (!ignoreKiln && !doorwayPassable(d, state)) continue;
    if (Math.abs(nx - d.x) <= d.width * 0.5 - radius && Math.abs(nz - d.z) <= 0.75) {
      inDoorX = true;
      activeDoor = d;
      break;
    }
  }

  if (inDoorX && activeDoor) {
    nx = Math.max(
      activeDoor.x - activeDoor.width * 0.5 + radius,
      Math.min(activeDoor.x + activeDoor.width * 0.5 - radius, nx),
    );
  } else {
    nx = Math.max(room.xMin + radius, Math.min(room.xMax - radius, nx));
    // Allow crossing zMin/zMax only if aligned with a passable doorway
    const nearNorthDoor = state.doorways.find(
      (d) =>
        (ignoreKiln || doorwayPassable(d, state)) &&
        Math.abs(d.z - room!.zMin) < 0.1 &&
        Math.abs(nx - d.x) <= d.width * 0.5 - radius,
    );
    const nearSouthDoor = state.doorways.find(
      (d) =>
        (ignoreKiln || doorwayPassable(d, state)) &&
        Math.abs(d.z - room!.zMax) < 0.1 &&
        Math.abs(nx - d.x) <= d.width * 0.5 - radius,
    );

    if (!nearNorthDoor && nz < room.zMin + radius) nz = room.zMin + radius;
    if (!nearSouthDoor && nz > room.zMax - radius) nz = room.zMax - radius;
  }

  // Push out of solid furniture
  for (const f of state.furniture) {
    if (!f.solid) continue;
    const minX = f.x - f.halfW - radius;
    const maxX = f.x + f.halfW + radius;
    const minZ = f.z - f.halfD - radius;
    const maxZ = f.z + f.halfD + radius;
    if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
      const dxLeft = nx - minX;
      const dxRight = maxX - nx;
      const dzTop = nz - minZ;
      const dzBot = maxZ - nz;
      const m = Math.min(dxLeft, dxRight, dzTop, dzBot);
      if (m === dxLeft) nx = minX;
      else if (m === dxRight) nx = maxX;
      else if (m === dzTop) nz = minZ;
      else nz = maxZ;
    }
  }

  return { x: nx, z: nz };
}

export function hasLineOfSight(
  state: SimState,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
): boolean {
  const dist = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.max(2, Math.ceil(dist / 0.45));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    const r = roomAt(state.rooms, px, pz);
    if (!r) {
      // Check if passing through a doorway
      const inDoor = state.doorways.some(
        (d) => Math.abs(px - d.x) <= d.width * 0.5 && Math.abs(pz - d.z) <= 0.5,
      );
      if (!inDoor) return false;
    }
    for (const f of state.furniture) {
      if (!f.solid || f.height < 1.8) continue;
      if (Math.abs(px - f.x) < f.halfW && Math.abs(pz - f.z) < f.halfD) {
        return false;
      }
    }
  }
  return true;
}

export function canInteractWith(item: Interactable, state: SimState): { ok: boolean; hint: string } {
  const p = state.player;
  switch (item.kind) {
    case 'glaze_shard':
      return item.collected ? { ok: false, hint: '' } : { ok: true, hint: '[E] Take Soul-Glaze Shard' };
    case 'kiln_ward':
      if (item.activated) return { ok: false, hint: '' };
      if (p.shards >= p.shardsNeeded) return { ok: true, hint: '[E] Shatter Porcelain Kiln Ward' };
      return { ok: false, hint: `Porcelain Kiln Ward (Need ${p.shardsNeeded - p.shards} more Soul-Glaze Shard)` };
    case 'heavy_acorn':
      return item.collected ? { ok: false, hint: '' } : { ok: true, hint: '[E] Pick up Heavy Garden Acorn' };
    case 'snare_bridge':
      if (item.activated) return { ok: false, hint: '' };
      if (p.hasAcorn) return { ok: true, hint: '[E] Toss Acorn onto Brass Snare-Trap' };
      return { ok: false, hint: 'Armed Brass Snare-Trap (Find Heavy Garden Acorn to spring safely)' };
    case 'soul_bell':
      return item.activated ? { ok: false, hint: '' } : { ok: true, hint: '[E] Ring Porcelain Soul-Bell' };
    case 'exit_door':
      if (state.obstacleStatus.bellsCleared) return { ok: true, hint: '[E] Escape through Garden Pet-Door!' };
      return {
        ok: false,
        hint: `Locked Garden Pet-Door (Ring ${p.bellsNeeded - p.bellsRung} more Soul-Bell${p.bellsNeeded - p.bellsRung === 1 ? '' : 's'})`,
      };
  }
}

export function findNearestInteractable(state: SimState): { item: Interactable; ok: boolean; hint: string } | null {
  const p = state.player;
  let best: { item: Interactable; ok: boolean; hint: string; dist: number } | null = null;
  for (const item of state.interactables) {
    if (item.collected || item.activated) continue;
    const d = Math.hypot(item.x - p.x, item.z - p.z);
    if (d <= INTERACT_RANGE) {
      const check = canInteractWith(item, state);
      if (!best || d < best.dist) {
        best = { item, ok: check.ok, hint: check.hint, dist: d };
      }
    }
  }
  return best ? { item: best.item, ok: best.ok, hint: best.hint } : null;
}

function setBanner(state: SimState, msg: string, dur = 4.2): void {
  state.message = msg;
  state.messageTimer = dur;
}

function alertNearbyMonsters(state: SimState, x: number, z: number, radius: number): void {
  for (const m of state.monsters) {
    const d = Math.hypot(m.x - x, m.z - z);
    if (d <= radius && m.state !== 'chase') {
      m.state = 'investigate';
      m.targetX = x;
      m.targetZ = z;
      m.investigateTimer = 5.5;
    }
  }
}

function performInteract(state: SimState): void {
  const found = findNearestInteractable(state);
  if (!found || !found.ok) return;
  const { item } = found;
  const p = state.player;

  switch (item.kind) {
    case 'glaze_shard':
      item.collected = true;
      p.shards++;
      state.events.push({ kind: 'shard_pickup', x: item.x, z: item.z });
      if (p.shards >= p.shardsNeeded) {
        setBanner(state, 'Both Soul-Glaze Shards found! Shatter the Kiln Ward ahead.');
      } else {
        setBanner(state, `Soul-Glaze Shard (${p.shards}/${p.shardsNeeded}) collected.`);
      }
      break;

    case 'kiln_ward':
      item.activated = true;
      state.obstacleStatus.kilnCleared = true;
      p.obstaclesCleared++;
      state.events.push({ kind: 'kiln_shatter', x: item.x, z: item.z });
      alertNearbyMonsters(state, item.x, item.z, 14);
      setBanner(state, 'Kiln Ward shattered! Watch for the Brass Snare-Trap ahead.');
      break;

    case 'heavy_acorn':
      item.collected = true;
      p.hasAcorn = true;
      state.events.push({ kind: 'acorn_pickup', x: item.x, z: item.z });
      setBanner(state, 'Heavy Garden Acorn taken! Toss it onto the Brass Snare-Trap.');
      break;

    case 'snare_bridge':
      item.activated = true;
      state.obstacleStatus.bridgeCleared = true;
      p.obstaclesCleared++;
      state.events.push({ kind: 'snare_sprung', x: item.x, z: item.z });
      alertNearbyMonsters(state, item.x, item.z, 16);
      setBanner(state, 'SNAP! The Snare-Trap is sprung into a safe bridge. Ring 3 Soul-Bells ahead!');
      break;

    case 'soul_bell':
      item.activated = true;
      p.bellsRung++;
      state.events.push({ kind: 'bell_rung', x: item.x, z: item.z });
      alertNearbyMonsters(state, item.x, item.z, 13);
      if (p.bellsRung >= p.bellsNeeded) {
        state.obstacleStatus.bellsCleared = true;
        p.obstaclesCleared++;
        state.events.push({ kind: 'exit_unlocked', x: item.x, z: item.z });
        setBanner(state, 'All 3 Soul-Bells rung! The Garden Pet-Door is unlocked — RUN!');
      } else {
        setBanner(state, `Soul-Bell rung (${p.bellsRung}/${p.bellsNeeded}) — hide or douse your lantern!`);
      }
      break;

    case 'exit_door':
      item.activated = true;
      p.escaped = true;
      state.events.push({ kind: 'escaped', x: item.x, z: item.z });
      setBanner(state, 'You escaped into the moonlit garden!');
      break;
  }
}

function stepMonster(m: MonsterState, state: SimState, dt: number): void {
  const p = state.player;
  if (m.cooldownTimer > 0) m.cooldownTimer = Math.max(0, m.cooldownTimer - dt);

  const dx = p.x - m.x;
  const dz = p.z - m.z;
  const dist = Math.hypot(dx, dz);

  // Detection range depends on player lantern, hiding under furniture, and crouching
  let sightRange = p.lanternOn ? 9.5 : 4.0;
  if (p.hiding) {
    sightRange = p.lanternOn ? 2.2 : 1.2;
  } else if (p.crouching) {
    sightRange *= 0.72;
  }

  const canSee =
    m.cooldownTimer <= 0 &&
    dist <= sightRange &&
    hasLineOfSight(state, m.x, m.z, p.x, p.z);

  if (canSee) {
    if (m.state !== 'chase') {
      state.events.push({ kind: 'monster_alert', x: m.x, z: m.z, detail: m.name });
    }
    m.state = 'chase';
    m.targetX = p.x;
    m.targetZ = p.z;
    m.alert = Math.min(1, m.alert + dt * 2.5);
  } else if (m.state === 'chase') {
    m.alert = Math.max(0, m.alert - dt * (p.hiding ? 1.3 : 0.55));
    if (m.alert <= 0) {
      m.state = 'investigate';
      m.investigateTimer = 3.5;
    }
  } else if (m.state === 'investigate') {
    m.investigateTimer -= dt;
    if (m.investigateTimer <= 0 || Math.hypot(m.targetX - m.x, m.targetZ - m.z) < 0.9) {
      m.state = 'patrol';
    }
  }

  // Pick next waypoint if patrolling and near target
  if (m.state === 'patrol') {
    const dTarget = Math.hypot(m.targetX - m.x, m.targetZ - m.z);
    if (dTarget < 1.1 && state.waypoints.length > 0) {
      // Monster 0 patrols front/middle waypoints, Monster 1 patrols middle/back waypoints
      const minIdx = m.id === 0 ? 1 : Math.floor(state.waypoints.length * 0.4);
      const maxIdx = m.id === 0 ? Math.max(2, Math.floor(state.waypoints.length * 0.7)) : state.waypoints.length - 1;
      m.waypointIdx = m.waypointIdx + 1;
      if (m.waypointIdx > maxIdx || m.waypointIdx < minIdx) m.waypointIdx = minIdx;
      const wp = state.waypoints[m.waypointIdx];
      m.targetX = wp.x;
      m.targetZ = wp.z;
    }
  }

  // Director relief eases monster speed slightly
  const reliefScale = state.director.phase === 'relief' ? 0.68 : state.director.phase === 'peak' ? 1.08 : 1.0;
  m.speed = (m.state === 'chase' ? m.baseSpeed * 1.28 : m.baseSpeed * 0.78) * reliefScale;

  const tx = m.targetX - m.x;
  const tz = m.targetZ - m.z;
  const td = Math.hypot(tx, tz);
  if (td > 0.1) {
    const step = Math.min(td, m.speed * dt);
    const nx = m.x + (tx / td) * step;
    const nz = m.z + (tz / td) * step;
    const clamped = clampToHouse(nx, nz, MONSTER_RADIUS, state, true);
    m.x = clamped.x;
    m.z = clamped.z;
    m.yaw = Math.atan2(tx, tz);
  }

  const mr = roomAt(state.rooms, m.x, m.z);
  if (mr) m.roomId = mr.id;

  // Catch / hit check (if crouched & hiding under furniture, monster cannot grab you unless you're exposed)
  const canHit = !(p.hiding && p.crouching);
  if (canHit && dist < 1.05 && p.invulnTimer <= 0 && !p.escaped && !p.caught) {
    p.hp--;
    p.invulnTimer = 2.8;
    m.cooldownTimer = 3.2;
    m.state = 'patrol';
    state.events.push({ kind: 'hurt', x: p.x, z: p.z });
    if (p.hp <= 0) {
      p.caught = true;
      state.events.push({ kind: 'caught', x: p.x, z: p.z });
      setBanner(state, `${m.name} claimed your porcelain soul...`, 6);
    } else {
      setBanner(state, `${m.name} grazed you! (${p.hp}/${p.maxHp} HP left) — Hide!`, 3.5);
    }
  }
}

export function stepSim(state: SimState, input: SimInput, dt: number): void {
  state.events.length = 0;
  if (state.player.escaped || state.player.caught) return;

  const p = state.player;
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer = Math.max(0, state.messageTimer - dt);
  if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);

  if (input.toggleLantern) {
    p.lanternOn = !p.lanternOn;
    state.events.push({ kind: 'lantern_toggle', x: p.x, z: p.z, detail: p.lanternOn ? 'on' : 'off' });
  }

  // Look rotation
  p.yaw += input.yawDelta;
  p.pitch = Math.max(-1.25, Math.min(1.25, p.pitch + input.pitchDelta));
  p.crouching = input.crouch;

  // Check if player is currently under a hideable piece of furniture
  p.hiding = state.furniture.some(
    (f) => f.hideable && Math.abs(p.x - f.x) < f.halfW + 0.1 && Math.abs(p.z - f.z) < f.halfD + 0.1,
  );

  // Stamina & Sprint
  const moving = Math.abs(input.moveForward) > 0.05 || Math.abs(input.moveRight) > 0.05;
  const sprinting = input.sprint && moving && !p.crouching && p.stamina > 0.08;
  if (sprinting) {
    p.stamina = Math.max(0, p.stamina - dt * 0.34);
    alertNearbyMonsters(state, p.x, p.z, 9.0);
  } else {
    p.stamina = Math.min(1, p.stamina + dt * 0.22);
  }

  // Sluggish Dream Drag movement penalty during Director peaks (heavy, yet still escapable)
  const dragMultiplier = 1 - state.director.dreamDrag * 0.45;
  const baseSpeed = p.crouching ? 1.75 : sprinting ? 3.55 : 2.45;
  const maxSpeed = baseSpeed * dragMultiplier;

  // Forward in Three.js camera space is (-sin(yaw), -cos(yaw)); Right is (cos(yaw), -sin(yaw))
  const fwdX = -Math.sin(p.yaw);
  const fwdZ = -Math.cos(p.yaw);
  const rightX = Math.cos(p.yaw);
  const rightZ = -Math.sin(p.yaw);

  let wishX = fwdX * input.moveForward + rightX * input.moveRight;
  let wishZ = fwdZ * input.moveForward + rightZ * input.moveRight;
  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 1) {
    wishX /= wishLen;
    wishZ /= wishLen;
  }

  // Heavy inertia during Dream Drag so legs feel like wet clay
  const accel = state.director.dreamDrag > 0.25 ? 5.5 : 16.0;
  const targetVx = wishX * maxSpeed;
  const targetVz = wishZ * maxSpeed;
  p.vx += (targetVx - p.vx) * Math.min(1, accel * dt);
  p.vz += (targetVz - p.vz) * Math.min(1, accel * dt);

  const clamped = clampToHouse(p.x + p.vx * dt, p.z + p.vz * dt, PLAYER_RADIUS, state, false);
  p.x = clamped.x;
  p.z = clamped.z;

  // Eye height & headbob phase
  const targetY = p.crouching ? 0.24 : 0.42;
  p.y += (targetY - p.y) * Math.min(1, 10 * dt);
  const speed = Math.hypot(p.vx, p.vz);
  if (speed > 0.25) {
    p.stepPhase += speed * dt * 2.8;
  }

  const curRoom = roomAt(state.rooms, p.x, p.z);
  if (curRoom) p.roomId = curRoom.id;

  // Armed Brass Snare-Trap hazard check (Obstacle 2)
  const snare = state.interactables.find((i) => i.kind === 'snare_bridge');
  if (snare && !snare.activated && Math.hypot(p.x - snare.x, p.z - snare.z) < 0.75) {
    // Knock player back along -Z and deal 1 damage if not invuln
    p.z = snare.z - 1.5;
    p.vz = -2.5;
    state.events.push({ kind: 'snare_hurt', x: snare.x, z: snare.z });
    alertNearbyMonsters(state, snare.x, snare.z, 15);
    if (p.invulnTimer <= 0) {
      p.hp = Math.max(1, p.hp - 1);
      p.invulnTimer = 1.6;
    }
    setBanner(state, 'SNAP! The Brass Snare-Trap bit you! Find the Heavy Acorn to spring it safely.', 4);
  }

  if (input.interact) {
    performInteract(state);
  }

  // Update monsters & AI Director
  for (const m of state.monsters) {
    stepMonster(m, state, dt);
  }
  updateDirector(state, dt);
}
