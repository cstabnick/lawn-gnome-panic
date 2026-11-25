// E24 comedy: Le Petit Groan, the cellar club off Pardonlin's Grand Platz.
// Defines the interior at import; buildClubStreet places the street entrance once.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { World, Box } from '../../types';
import { defineInterior } from '../../interiors/registry';
import type { InteriorKit, InteriorTheme } from '../../interiors/types';
import { registerCull } from '../../cull';
import { circleClearOfStreets } from '../../parking';
import { heightAt, slopeAt, waterAt } from '../../terrain';
import { boxesBlocked, findSafeSpot } from '../../lockup/safeSpot';
import { CLUB, COMEDY_CLUB_ID, COMEDY_START_EVENT } from './types';

/** The stairs down, off the Grand Platz. yaw = facing out of the stairs (toward the square). */
export const CLUB_DOOR = { x: -1498, z: -209, yaw: 0 };

/** Cellar: dark brick-red walls, black floor, low warm light. */
const CELLAR_THEME: InteriorTheme = { floor: 0x141214, wall: 0x6b2a24, trim: 0x2a1614, ceiling: 0x1a1010, light: 0xffb878 };

/** The prompt sits 1 m in front of the stairs; the player lands 1.5 m further out. */
const DOOR_POSE = {
  x: CLUB_DOOR.x + Math.sin(CLUB_DOOR.yaw) * 1.0,
  z: CLUB_DOOR.z + Math.cos(CLUB_DOOR.yaw) * 1.0,
  yaw: CLUB_DOOR.yaw + Math.PI,
};
const EXIT_POSE = {
  x: CLUB_DOOR.x + Math.sin(CLUB_DOOR.yaw) * 2.5,
  z: CLUB_DOOR.z + Math.cos(CLUB_DOOR.yaw) * 2.5,
  yaw: CLUB_DOOR.yaw,
};

/** Prefabs added by another worker this epic: skipped (not thrown) while missing. */
function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: Parameters<InteriorKit['put']>[4]): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  return kit.put(id, x, z, yaw, opts);
}

const N = Math.PI; // facing north (the stage)

// Pardonlin crowd looks: berets, striped shirts, black polo necks.
const LOOKS = [
  { hat: 0x111111, shirt: 0x212121, beard: 0xbdbdbd },
  { hat: 0x8e1b2b, shirt: 0xf5f5f5, beard: 0x6d4c41 },
  { hat: 0x1a237e, shirt: 0x37474f, beard: 0xe0e0e0 },
  { hat: 0x212121, shirt: 0xeeeeee, beard: 0x9e9e9e },
  { hat: 0x4e342e, shirt: 0x212121, beard: 0x757575 },
  { hat: 0x111111, shirt: 0xb71c1c, beard: 0xcfcfcf },
  { hat: 0x37474f, shirt: 0xfafafa, beard: 0x5d4037 },
  { hat: 0x880e4f, shirt: 0x263238, beard: 0xbcaaa4 },
  { hat: 0x111111, shirt: 0x455a64, beard: 0xe0e0e0 },
  { hat: 0x3e2723, shirt: 0xeeeeee, beard: 0x9e9e9e },
];
/** Seats that talk when spoken to. */
const SEAT_TALK: Record<number, { name: string; line: string }> = {
  0: { name: 'Front Row (Ironic)', line: 'I am here ironically. Then again, so are you.' },
  3: { name: 'Regular, Table Four', line: 'I have seen every act since the cellar opened. I laughed once. I have not recovered.' },
  8: { name: 'Back Row Heckler', line: 'I paid for two drinks and a mood. Do not waste the mood.' },
};

defineInterior({
  id: COMEDY_CLUB_ID,
  name: 'Le Petit Groan',
  prompt: 'Go down to Le Petit Groan',
  door: DOOR_POSE,
  exit: EXIT_POSE,
  size: CLUB.size,
  theme: CELLAR_THEME,
  ambience: 'continental',
  build(kit) {
    const { w, d } = CLUB.size;
    const south = d / 2 - 0.2;
    const north = -d / 2;
    kit.room();
    // Stairs down on the south wall: the crowd's back.
    kit.door(0, south, N);

    // --- The stage: a low dais, the brick wall, the mic, a stool, a light ------------------------------------
    kit.block(6, 0.4, 2.8, CLUB.stage.x, -4.2, { color: 0x3a2418 });
    // Steps at the east end, where the player goes up (walkable).
    kit.block(1.2, 0.2, 0.6, CLUB.stageSteps.x, -2.6, { color: 0x4a2f20, solid: false });
    putIf(kit, 'groan-brick-backdrop', 0, north + 0.1, 0);
    kit.sign('LE PETIT GROAN', 0, 3.1, north + 0.05, 0, { w: 3.6, h: 0.8, bg: 0x1a0c10, fg: 0xff8a5c });
    putIf(kit, 'groan-mic-stand', CLUB.stage.x, CLUB.stage.z + 0.5, 0, { y: 0.4, solid: false });
    putIf(kit, 'groan-spotlight', CLUB.stage.x, CLUB.stage.z, 0, { y: 3.0, solid: false });

    // --- Vignette 1: the last act's exit ---------------------------------------------------------------------
    const stool = putIf(kit, 'groan-stage-stool', 1.4, -4.0, 0.6, { y: 0.4, solid: false });
    if (stool) {
      // Knocked on its side.
      stool.rotation.z = Math.PI / 2;
      stool.position.y += 0.2;
    }
    putIf(kit, 'groan-setlist', -0.9, -3.2, 0.4, { y: 0.41, solid: false });
    // A dried tomato stain at the brick wall's foot: a flat red slab, lifted off the dais.
    kit.block(0.55, 0.01, 0.45, -1.6, -5.5, { y: 0.412, color: 0x9b1c1c, solid: false });
    kit.sign('NO HECKLING BEFORE THE FIRST JOKE', -4.6, 2.0, north + 0.05, 0, { w: 2.2, h: 0.5, bg: 0x1a0c10, fg: 0xf5e6b8 });

    // --- Mireille Sans-Rire, by the steps --------------------------------------------------------------------
    kit.npc({
      id: 'mireille-sans-rire',
      name: 'Mireille Sans-Rire',
      x: CLUB.stageSteps.x + 1.4,
      z: -2.2,
      yaw: -Math.PI / 2,
      look: { hat: 0x111111, shirt: 0x546e7a, beard: 0x9e9e9e },
      line: 'You want to perform? Everyone wants to perform. Sit there. No, there. Fine. Go up.',
    });
    kit.spot({
      id: 'comedy-stage',
      x: CLUB.stageSteps.x,
      z: CLUB.stageSteps.z,
      prompt: 'Go on stage (comedian)',
      run() { window.dispatchEvent(new CustomEvent(COMEDY_START_EVENT)); },
    });

    // --- The crowd: ten seated gnomes, small tables between -------------------------------------------------
    CLUB.seats.forEach((s, i) => {
      const talk = SEAT_TALK[i];
      kit.npc({ id: `groan-crowd-${i}`, name: talk?.name, x: s.x, z: s.z, yaw: N, sit: true, look: LOOKS[i], line: talk?.line });
    });
    const tables: [number, number][] = [[-3, 0.5], [0, 0.5], [3, 0.5], [-3.7, 2.5], [0, 2.5], [3.7, 2.5], [0, 4.4]];
    for (const [x, z] of tables) {
      if (getPrefab('groan-cafe-table-small')) kit.put('groan-cafe-table-small', x, z, 0);
      else kit.put('cocktail-table', x, z, 0, { solid: false });
    }

    // --- Vignette 2: the bar and its tip jar ------------------------------------------------------------------
    kit.block(0.8, 1.0, 3.2, w / 2 - 0.6, 3.6, { color: 0x2b1a12 });
    putIf(kit, 'groan-tip-jar', w / 2 - 0.6, 3.6, 0, { y: 1.0, solid: false });
    kit.sign('TWO-DRINK MINIMUM.\nONE-LAUGH MAXIMUM.', w / 2 - 0.05, 2.0, 3.6, -Math.PI / 2, { w: 2.0, h: 0.7, bg: 0x1a0c10, fg: 0xf5e6b8 });

    // --- Vignette 3: the critics' table, laid out like evidence ---------------------------------------------
    const cx = -w / 2 + 1.3;
    const cz = -1.0;
    const crit = kit.put('cocktail-table', cx, cz, 0, { solid: false });
    const top = new THREE.Box3().setFromObject(crit).max.y;
    [[-0.18, -0.1], [0.12, -0.18], [0.0, 0.2]].forEach(([dx, dz], i) => {
      putIf(kit, 'espresso-cup', cx + dx, cz + dz, i * 1.3, { y: top, solid: false });
    });
    putIf(kit, 'red-book', cx - 0.15, cz + 0.05, 0.3, { y: top, solid: false, size: 0.22 });
    putIf(kit, 'tall-one-pencil', cx + 0.2, cz + 0.12, 1.2, { y: top, solid: false, size: 0.25 });
    kit.sign('RESERVED: THE CRITICS\n(THEY WILL NOT LAUGH)', -w / 2 + 0.05, 2.0, cz, Math.PI / 2, { w: 1.9, h: 0.6, bg: 0x1a0c10, fg: 0xf5e6b8 });

    // --- Signs ----------------------------------------------------------------------------------------------
    kit.sign('TONIGHT: YOU', -4.6, 2.7, north + 0.05, 0, { w: 1.8, h: 0.6, bg: 0xf5e6b8, fg: 0x1a0c10 });
    kit.sign('PLEASE DO NOT\nFEED THE COMEDIANS', -w / 2 + 0.05, 2.0, 3.0, Math.PI / 2, { w: 1.9, h: 0.7, bg: 0x1a0c10, fg: 0xf5e6b8 });
  },
});

let streetBuilt = false;

/** Build the street entrance props (stairs down, sign, chalkboard) once (idempotent). Pushes colliders into world.boxes. */
export function buildClubStreet(scene: THREE.Scene, world: World): void {
  if (streetBuilt) return;
  streetBuilt = true;
  const blockedBy = boxesBlocked(world.boxes, world.half);
  const probe = {
    ground: heightAt,
    water: (x: number, z: number) => waterAt(x, z)?.depth ?? 0,
    slope: slopeAt,
    blocked: (x: number, z: number, r: number) => blockedBy(x, z, r) || !circleClearOfStreets(x, z, r),
  };
  const place = (id: string, x: number, z: number, yaw: number): void => {
    if (!getPrefab(id)) return;
    const obj = buildPrefab(id);
    obj.position.set(x, heightAt(x, z), z);
    obj.rotation.y = yaw;
    scene.add(obj);
    registerCull(obj, 'prop');
  };
  const addBox = (x: number, z: number, hx: number, hz: number, h: number): void => {
    const b: Box = { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz, h };
    world.boxes.push(b);
  };

  // The stairs: the opening faces out along CLUB_DOOR.yaw; the stone surround sits 1.2 m behind the door spot.
  const sx = Math.sin(CLUB_DOOR.yaw);
  const sz = Math.cos(CLUB_DOOR.yaw);
  place('groan-cellar-entrance', CLUB_DOOR.x, CLUB_DOOR.z, CLUB_DOOR.yaw);
  if (getPrefab('groan-cellar-entrance')) addBox(CLUB_DOOR.x - sx * 1.2, CLUB_DOOR.z - sz * 1.2, 1.0, 1.0, 1.2);

  // Chalkboard and poster column beside it, on clear ground.
  const sideX = Math.cos(CLUB_DOOR.yaw);
  const sideZ = -Math.sin(CLUB_DOOR.yaw);
  const opts = { radius: 0.8, minDist: 0, maxDist: 12, maxSlope: 0.25, maxWater: 0 };
  const board = findSafeSpot(CLUB_DOOR.x + sideX * 3.0 + sx, CLUB_DOOR.z + sideZ * 3.0 + sz, probe, opts);
  if (board && getPrefab('groan-chalkboard-sign')) place('groan-chalkboard-sign', board.x, board.z, CLUB_DOOR.yaw);
  const column = findSafeSpot(CLUB_DOOR.x - sideX * 3.5, CLUB_DOOR.z - sideZ * 3.5, probe, { ...opts, radius: 1.0 });
  if (column && getPrefab('groan-poster-column')) {
    place('groan-poster-column', column.x, column.z, CLUB_DOOR.yaw);
    addBox(column.x, column.z, 0.45, 0.45, 3);
  }
}
