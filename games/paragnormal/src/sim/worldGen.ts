import { FIXED_KINDS, MONSTER_PROFILES, patrolWindow, SEEDED_KINDS } from './profiles';
import type {
  Doorway,
  FurniturePlacement,
  Interactable,
  MonsterKind,
  MonsterState,
  RoomDef,
  RoomKind,
  Waypoint,
} from './types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RoomTemplate {
  kind: RoomKind;
  name: string;
  floorTint: number;
  wallTint: number;
  prefabs: Array<{ id: string; scale: number; halfW: number; halfD: number; height: number; hideable: boolean; solid: boolean; tint?: number }>;
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    kind: 'foyer',
    name: 'Entry Parlor',
    floorTint: 0x221a14,
    wallTint: 0x262930,
    prefabs: [
      { id: 'table', scale: 3.6, halfW: 2.1, halfD: 1.4, height: 2.1, hideable: true, solid: false },
      { id: 'chair', scale: 3.6, halfW: 0.9, halfD: 0.9, height: 2.8, hideable: true, solid: false },
      { id: 'wardrobe', scale: 3.5, halfW: 1.4, halfD: 0.9, height: 4.5, hideable: false, solid: true },
      { id: 'lamp', scale: 3.4, halfW: 0.6, halfD: 0.6, height: 3.6, hideable: false, solid: true },
      { id: 'armchair', scale: 3.5, halfW: 1.6, halfD: 1.05, height: 2.9, hideable: true, solid: false },
      { id: 'grandfather-clock', scale: 3.5, halfW: 0.75, halfD: 0.6, height: 6.4, hideable: false, solid: true },
    ],
  },
  {
    kind: 'dining',
    name: 'Giant Dining Hall',
    floorTint: 0x251b13,
    wallTint: 0x2c2420,
    prefabs: [
      { id: 'table', scale: 4.0, halfW: 2.4, halfD: 1.6, height: 2.3, hideable: true, solid: false },
      { id: 'chair', scale: 3.8, halfW: 0.95, halfD: 0.95, height: 2.9, hideable: true, solid: false },
      { id: 'bench', scale: 3.8, halfW: 1.8, halfD: 0.75, height: 1.6, hideable: true, solid: false },
      { id: 'cupboard', scale: 3.5, halfW: 1.3, halfD: 0.85, height: 4.2, hideable: false, solid: true },
      { id: 'hearth', scale: 3.4, halfW: 1.6, halfD: 1.0, height: 4.4, hideable: false, solid: true },
      { id: 'side-table', scale: 3.5, halfW: 0.9, halfD: 0.9, height: 2.0, hideable: true, solid: false },
      { id: 'candelabra', scale: 3.5, halfW: 0.7, halfD: 0.45, height: 3.15, hideable: false, solid: true },
    ],
  },
  {
    kind: 'study',
    name: 'Hollow Study',
    floorTint: 0x1c1816,
    wallTint: 0x20262b,
    prefabs: [
      { id: 'bookshelf', scale: 3.6, halfW: 1.5, halfD: 0.7, height: 4.6, hideable: false, solid: true },
      { id: 'table', scale: 3.6, halfW: 2.1, halfD: 1.4, height: 2.1, hideable: true, solid: false },
      { id: 'chair', scale: 3.6, halfW: 0.9, halfD: 0.9, height: 2.8, hideable: true, solid: false },
      { id: 'lectern', scale: 3.4, halfW: 0.75, halfD: 0.75, height: 3.2, hideable: false, solid: true },
      { id: 'bed', scale: 3.4, halfW: 1.7, halfD: 3.2, height: 2.4, hideable: true, solid: false },
      { id: 'rocking-chair', scale: 3.5, halfW: 1.05, halfD: 1.26, height: 3.4, hideable: true, solid: false },
      { id: 'chest-of-drawers', scale: 3.5, halfW: 1.7, halfD: 1.0, height: 3.0, hideable: false, solid: true },
    ],
  },
  {
    kind: 'pantry',
    name: 'Cellar Pantry',
    floorTint: 0x1b1a18,
    wallTint: 0x252420,
    prefabs: [
      { id: 'barrel', scale: 3.4, halfW: 0.9, halfD: 0.9, height: 2.7, hideable: false, solid: true },
      { id: 'crate', scale: 3.4, halfW: 1.0, halfD: 1.0, height: 2.4, hideable: false, solid: true },
      { id: 'sack', scale: 3.4, halfW: 0.8, halfD: 0.8, height: 1.8, hideable: false, solid: true },
      { id: 'table', scale: 3.5, halfW: 2.0, halfD: 1.35, height: 2.0, hideable: true, solid: false },
      { id: 'cauldron', scale: 3.2, halfW: 1.0, halfD: 1.0, height: 2.2, hideable: false, solid: true },
      { id: 'chest-of-drawers', scale: 3.5, halfW: 1.7, halfD: 1.0, height: 3.0, hideable: false, solid: true },
      { id: 'side-table', scale: 3.5, halfW: 0.9, halfD: 0.9, height: 2.0, hideable: true, solid: false },
    ],
  },
  {
    kind: 'parlor',
    name: 'Porcelain Parlor',
    floorTint: 0x21191d,
    wallTint: 0x26202a,
    prefabs: [
      { id: 'bed', scale: 3.6, halfW: 1.8, halfD: 3.4, height: 2.5, hideable: true, solid: false },
      { id: 'table', scale: 3.6, halfW: 2.1, halfD: 1.4, height: 2.1, hideable: true, solid: false },
      { id: 'wardrobe', scale: 3.5, halfW: 1.4, halfD: 0.9, height: 4.5, hideable: false, solid: true },
      { id: 'pew', scale: 3.5, halfW: 1.8, halfD: 0.9, height: 2.4, hideable: false, solid: true },
      { id: 'mushroom-lamp', scale: 3.5, halfW: 0.7, halfD: 0.7, height: 2.6, hideable: false, solid: true },
      { id: 'armchair', scale: 3.5, halfW: 1.6, halfD: 1.05, height: 2.9, hideable: true, solid: false },
      { id: 'grandfather-clock', scale: 3.5, halfW: 0.75, halfD: 0.6, height: 6.4, hideable: false, solid: true },
    ],
  },
  {
    kind: 'conservatory',
    name: 'Moonlit Conservatory',
    floorTint: 0x181f1a,
    wallTint: 0x1d2723,
    prefabs: [
      { id: 'flower-pot', scale: 3.6, halfW: 0.9, halfD: 0.9, height: 2.8, hideable: false, solid: true },
      { id: 'bench', scale: 3.8, halfW: 1.8, halfD: 0.75, height: 1.6, hideable: true, solid: false },
      { id: 'table', scale: 3.6, halfW: 2.1, halfD: 1.4, height: 2.1, hideable: true, solid: false },
      { id: 'glaze-shrine', scale: 3.2, halfW: 1.0, halfD: 1.0, height: 3.4, hideable: false, solid: true },
      { id: 'wheelbarrow', scale: 3.2, halfW: 1.2, halfD: 0.9, height: 2.0, hideable: false, solid: true },
      { id: 'candelabra', scale: 3.5, halfW: 0.7, halfD: 0.45, height: 3.15, hideable: false, solid: true },
      { id: 'rocking-chair', scale: 3.5, halfW: 1.05, halfD: 1.26, height: 3.4, hideable: true, solid: false },
    ],
  },
];

export interface GeneratedWorld {
  rooms: RoomDef[];
  doorways: Doorway[];
  furniture: FurniturePlacement[];
  interactables: Interactable[];
  waypoints: Waypoint[];
  monsters: MonsterState[];
  spawn: { x: number; z: number; yaw: number };
}

export function generateWorld(seed: number): GeneratedWorld {
  const rng = mulberry32(seed);
  const rooms: RoomDef[] = [];
  const doorways: Doorway[] = [];
  const furniture: FurniturePlacement[] = [];
  const interactables: Interactable[] = [];
  const waypoints: Waypoint[] = [];

  // Shuffle middle room templates (keep foyer first, conservatory last)
  const middle = [ROOM_TEMPLATES[1], ROOM_TEMPLATES[2], ROOM_TEMPLATES[3], ROOM_TEMPLATES[4]];
  for (let i = middle.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [middle[i], middle[j]] = [middle[j], middle[i]];
  }
  const sequence = [ROOM_TEMPLATES[0], ...middle, ROOM_TEMPLATES[5]];

  let curZ = 0;
  let prevCenterX = 0;

  for (let i = 0; i < sequence.length; i++) {
    const tpl = sequence[i];
    const w = 11 + Math.floor(rng() * 4); // 11..14m
    const d = 10 + Math.floor(rng() * 4); // 10..13m
    const offset = i === 0 ? 0 : (rng() - 0.5) * 6.5;
    const centerX = prevCenterX + offset;

    const room: RoomDef = {
      id: i,
      kind: tpl.kind,
      name: tpl.name,
      xMin: centerX - w / 2,
      xMax: centerX + w / 2,
      zMin: curZ,
      zMax: curZ + d,
      wallH: 5.4,
      floorTint: tpl.floorTint,
      wallTint: tpl.wallTint,
    };

    if (tpl.kind === 'dining' || tpl.kind === 'parlor') {
      room.hearthX = room.xMin + 1.2;
      room.hearthZ = (room.zMin + room.zMax) / 2;
    }

    rooms.push(room);

    if (i > 0) {
      const prev = rooms[i - 1];
      const overlapMin = Math.max(prev.xMin, room.xMin) + 2.2;
      const overlapMax = Math.min(prev.xMax, room.xMax) - 2.2;
      const doorX = overlapMax > overlapMin
        ? overlapMin + rng() * (overlapMax - overlapMin)
        : (Math.max(prev.xMin, room.xMin) + Math.min(prev.xMax, room.xMax)) / 2;

      let blockedBy: Doorway['blockedBy'];
      if (i === 2) blockedBy = 'kiln_ward';
      if (i === 4) blockedBy = 'snare_bridge';

      doorways.push({
        id: `door-${i - 1}-${i}`,
        x: doorX,
        z: room.zMin,
        axis: 'z',
        width: 3.2,
        roomA: i - 1,
        roomB: i,
        blockedBy,
      });
    }

    curZ += d;
    prevCenterX = centerX;
  }

  // Helper to check if a point is too close to any doorway or spawn
  const spawn = {
    x: (rooms[0].xMin + rooms[0].xMax) / 2,
    z: rooms[0].zMin + 2.2,
    yaw: Math.PI, // facing +Z (three.js camera looks down -Z when yaw=0, so yaw=PI looks +Z)
  };

  function isClearOfDoors(x: number, z: number, pad: number): boolean {
    if (Math.hypot(x - spawn.x, z - spawn.z) < pad + 1.5) return false;
    for (const d of doorways) {
      if (Math.hypot(x - d.x, z - d.z) < pad + 2.3) return false;
    }
    return true;
  }

  // Populate furniture in each room
  for (let rIdx = 0; rIdx < rooms.length; rIdx++) {
    const room = rooms[rIdx];
    const tpl = sequence[rIdx];
    const targetCount = 4 + Math.floor(rng() * 3); // 4..6 giant furniture items per room
    let placed = 0;

    // Guarantee at least 1 hideable furniture piece (table/bed/bench) in every room after foyer
    const hideablePrefabs = tpl.prefabs.filter((p) => p.hideable);
    for (let attempt = 0; attempt < 36 && placed < targetCount; attempt++) {
      const pick =
        placed === 0 && hideablePrefabs.length > 0
          ? hideablePrefabs[Math.floor(rng() * hideablePrefabs.length)]
          : tpl.prefabs[Math.floor(rng() * tpl.prefabs.length)];

      const rotQuarter = Math.floor(rng() * 4);
      const rotY = rotQuarter * (Math.PI / 2);
      const hw = rotQuarter % 2 === 0 ? pick.halfW : pick.halfD;
      const hd = rotQuarter % 2 === 0 ? pick.halfD : pick.halfW;

      const marginX = hw + 0.85;
      const marginZ = hd + 0.85;
      if (room.xMax - room.xMin <= marginX * 2 || room.zMax - room.zMin <= marginZ * 2) continue;

      const x = room.xMin + marginX + rng() * (room.xMax - room.xMin - marginX * 2);
      const z = room.zMin + marginZ + rng() * (room.zMax - room.zMin - marginZ * 2);

      if (!isClearOfDoors(x, z, Math.max(hw, hd))) continue;

      let overlaps = false;
      for (const f of furniture) {
        if (f.roomId !== room.id) continue;
        if (Math.abs(x - f.x) < hw + f.halfW + 0.9 && Math.abs(z - f.z) < hd + f.halfD + 0.9) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      furniture.push({
        id: `furn-${room.id}-${placed}`,
        prefabId: pick.id,
        roomId: room.id,
        x,
        z,
        rotY,
        scale: pick.scale,
        tint: pick.tint,
        halfW: hw,
        halfD: hd,
        height: pick.height,
        hideable: pick.hideable,
        solid: pick.solid,
      });
      placed++;
    }
  }

  // Helper to pick a walkable spot in a room
  function findSpotInRoom(roomId: number, preferUnderHideable = false): { x: number; z: number } {
    const room = rooms[roomId];
    if (preferUnderHideable) {
      const hideables = furniture.filter((f) => f.roomId === roomId && f.hideable);
      if (hideables.length > 0) {
        const h = hideables[Math.floor(rng() * hideables.length)];
        return { x: h.x, z: h.z };
      }
    }
    for (let i = 0; i < 30; i++) {
      const x = room.xMin + 1.8 + rng() * (room.xMax - room.xMin - 3.6);
      const z = room.zMin + 1.8 + rng() * (room.zMax - room.zMin - 3.6);
      const blocked = furniture.some(
        (f) => f.roomId === roomId && f.solid && Math.abs(x - f.x) < f.halfW + 0.7 && Math.abs(z - f.z) < f.halfD + 0.7,
      );
      if (!blocked && isClearOfDoors(x, z, 0.8)) return { x, z };
    }
    return { x: (room.xMin + room.xMax) / 2, z: (room.zMin + room.zMax) / 2 };
  }

  // Obstacle 1: 2 Soul-Glaze Shards in Rooms 0 & 1 + Kiln Ward at door-1-2
  const s1 = findSpotInRoom(0, true);
  const s2 = findSpotInRoom(1, true);
  interactables.push(
    {
      id: 'shard-1',
      kind: 'glaze_shard',
      roomId: 0,
      x: s1.x,
      y: 0.25,
      z: s1.z,
      collected: false,
      activated: false,
      label: 'Soul-Glaze Shard',
    },
    {
      id: 'shard-2',
      kind: 'glaze_shard',
      roomId: 1,
      x: s2.x,
      y: 0.25,
      z: s2.z,
      collected: false,
      activated: false,
      label: 'Soul-Glaze Shard',
    },
  );

  const kilnDoor = doorways.find((d) => d.blockedBy === 'kiln_ward')!;
  interactables.push({
    id: 'kiln-ward',
    kind: 'kiln_ward',
    roomId: 1,
    x: kilnDoor.x,
    y: 0.8,
    z: kilnDoor.z - 0.5,
    collected: false,
    activated: false,
    label: 'Porcelain Kiln Ward',
  });

  // Obstacle 2: Heavy Acorn in Room 2 or 3 + Snare Bridge at door-3-4
  const acornRoomId = 2 + Math.floor(rng() * 2);
  const acornSpot = findSpotInRoom(acornRoomId, false);
  const snareDoor = doorways.find((d) => d.blockedBy === 'snare_bridge')!;
  interactables.push(
    {
      id: 'heavy-acorn',
      kind: 'heavy_acorn',
      roomId: acornRoomId,
      x: acornSpot.x,
      y: 0.28,
      z: acornSpot.z,
      collected: false,
      activated: false,
      label: 'Heavy Garden Acorn',
    },
    {
      id: 'snare-bridge',
      kind: 'snare_bridge',
      roomId: 3,
      x: snareDoor.x,
      y: 0.35,
      z: snareDoor.z - 0.65,
      collected: false,
      activated: false,
      label: 'Giant Brass Snare-Trap',
    },
  );

  // Obstacle 3: 3 Porcelain Soul-Bells in Rooms 4 & 5 + Exit Garden Pet-Door
  const bellSpots = [
    { roomId: 4, pos: findSpotInRoom(4, false) },
    { roomId: 4, pos: findSpotInRoom(4, true) },
    { roomId: 5, pos: findSpotInRoom(5, false) },
  ];
  bellSpots.forEach((b, idx) => {
    interactables.push({
      id: `soul-bell-${idx + 1}`,
      kind: 'soul_bell',
      roomId: b.roomId,
      x: b.pos.x,
      y: 0.45,
      z: b.pos.z,
      collected: false,
      activated: false,
      label: `Porcelain Soul-Bell ${idx + 1}`,
    });
  });

  const lastRoom = rooms[rooms.length - 1];
  interactables.push({
    id: 'exit-door',
    kind: 'exit_door',
    roomId: lastRoom.id,
    x: (lastRoom.xMin + lastRoom.xMax) / 2,
    y: 0.6,
    z: lastRoom.zMax - 0.35,
    collected: false,
    activated: false,
    label: 'Garden Pet-Door (Exit)',
  });

  // Patrol waypoints through room centers and doorways
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    waypoints.push({ x: (r.xMin + r.xMax) / 2, z: (r.zMin + r.zMax) / 2, roomId: r.id });
    if (i < doorways.length) {
      const d = doorways[i];
      waypoints.push({ x: d.x, z: d.z, roomId: r.id });
    }
  }

  // Gnome-Souls: the two that every house has, plus one drawn from the three seeded kinds (see profiles.ts)
  const kinds: MonsterKind[] = [...FIXED_KINDS, SEEDED_KINDS[Math.floor(rng() * SEEDED_KINDS.length)]];
  const monsters: MonsterState[] = kinds.map((kind, id) => {
    const prof = MONSTER_PROFILES[kind];
    const room = rooms[prof.startRoom];
    const back = rooms[prof.startRoom > 0 ? prof.startRoom - 1 : 1];
    return {
      id,
      kind,
      name: prof.name,
      x: (room.xMin + room.xMax) / 2,
      z: (room.zMin + room.zMax) / 2,
      yaw: id % 2 === 0 ? 0 : Math.PI,
      state: 'patrol',
      targetX: (back.xMin + back.xMax) / 2,
      targetZ: (back.zMin + back.zMax) / 2,
      waypointIdx: patrolWindow(prof, waypoints.length)[0],
      roomId: room.id,
      alert: 0,
      baseSpeed: prof.baseSpeed,
      speed: prof.baseSpeed,
      investigateTimer: 0,
      cooldownTimer: 0,
      brushTimer: 0,
    };
  });

  return { rooms, doorways, furniture, interactables, waypoints, monsters, spawn };
}
