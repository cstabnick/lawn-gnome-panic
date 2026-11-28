// The Bathtub Queen (E11 issue 2C): Captain Samphire Bilge's toy pirate ship, moored south of Long Spoon Pier. A
// walkable deck (a rooftop, so it needs no collider to stand on), solid masts, cabin, cannons and hull, a gangplank
// from the pier bowl, and the captain's cabin as an interior with the sea chest the treasure quest opens.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { JobsDeps } from '../jobs/types';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { CAST } from '../cutscene/cast';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { defineInterior, interiorById } from '../interiors/registry';
import { COAST } from './config';
import { parseSavesJson } from '../quests/questSave';
import { lightPool, nightGlowMat } from './nightLights';
import { coastSign } from './sign';
import type { CoastPart } from './types';

export const QUEEN_CABIN_INTERIOR = 'bathtub-queen-cabin';
const S = 16;
const SHIP = COAST.ship;
const DECK_Y = SHIP.deckY;
const RAIL_H = DECK_Y + 1.1;
const RAIL_T = 1.2;
const CANNON_SCALE = 3;
const BEACH_ANCHOR = { x: 360, z: 1175 };

const plankMat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.9 });
const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc9b27a, roughness: 1 });

function shadowed<T extends THREE.Object3D>(g: T): T {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

function place(scene: THREE.Scene, id: string, x: number, y: number, z: number, yaw: number, scale: number): THREE.Group | null {
  if (!getPrefab(id)) return null;
  const obj = buildPrefab(id, { lights: false });
  obj.scale.setScalar(scale);
  obj.rotation.y = yaw;
  obj.position.set(x, y, z);
  scene.add(shadowed(obj));
  return obj;
}

function mesh(scene: THREE.Scene, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/** Build the moored ship: hull, masts, cannons, gangplank, the walkable deck rooftop and its colliders. */
export function buildPirateShip(scene: THREE.Scene, boxes: Box[]): void {
  const d = SHIP.deck;
  if (!rooftopById('bathtub-queen-deck')) addRooftop({ id: 'bathtub-queen-deck', name: 'The Bathtub Queen', ...d, y: DECK_Y, solid: false, parapet: false });
  if (!rooftopById('bathtub-queen-gangplank')) addRooftop({ id: 'bathtub-queen-gangplank', name: 'The Bathtub Queen', ...SHIP.gangplank, y: DECK_Y, solid: false, parapet: false });

  // The hull: bow to +x, deck top at DECK_Y. Centre the prefab's bounds on the ship's x, z.
  let cLocalZ = 0.1;
  const probe = getPrefab('bathtub-queen') ? buildPrefab('bathtub-queen', { lights: false }) : null;
  if (probe) {
    const pb = new THREE.Box3().setFromObject(probe);
    cLocalZ = (pb.min.z + pb.max.z) / 2;
  }
  const hullX = SHIP.x - cLocalZ * S;
  place(scene, 'bathtub-queen', hullX, DECK_Y - 0.4 * S, SHIP.z, Math.PI / 2, S);
  // local z maps to world x (rotation pi/2); local x maps to -z.
  const wx = (lz: number): number => hullX + lz * S;

  // The gangplank: a plank 0.25 thick, top just above the deck level, with two rope rails.
  const g = SHIP.gangplank;
  const gw = g.maxX - g.minX, gd = g.maxZ - g.minZ;
  const gcx = (g.minX + g.maxX) / 2, gcz = (g.minZ + g.maxZ) / 2;
  mesh(scene, new THREE.BoxGeometry(gw, 0.25, gd), plankMat, gcx, DECK_Y + 0.12 - 0.125, gcz);
  for (const sx of [g.minX + 0.1, g.maxX - 0.1]) {
    mesh(scene, new THREE.BoxGeometry(0.06, 0.06, gd), ropeMat, sx, DECK_Y + 0.9, gcz);
    for (const sz of [g.minZ + 0.2, g.maxZ - 0.2]) {
      mesh(scene, new THREE.BoxGeometry(0.1, 0.9, 0.1), plankMat, sx, DECK_Y + 0.45, sz);
    }
  }

  // Deck-edge rails, with the gap at the gangplank on the north edge.
  const rail = (minX: number, maxX: number, minZ: number, maxZ: number): void => {
    boxes.push({ minX, maxX, minZ, maxZ, h: RAIL_H });
  };
  rail(d.minX, g.minX, d.minZ, d.minZ + RAIL_T);
  rail(g.maxX, d.maxX, d.minZ, d.minZ + RAIL_T);
  rail(d.minX, d.maxX, d.maxZ - RAIL_T, d.maxZ);
  rail(d.minX, d.minX + RAIL_T, d.minZ, d.maxZ);
  rail(d.maxX - RAIL_T, d.maxX, d.minZ, d.maxZ);

  // The stern cabin (prefab local z -1.45..-0.85, beam +-0.45, 0.35 tall).
  boxes.push({ minX: wx(-1.45), maxX: wx(-0.85), minZ: SHIP.z - 0.45 * S, maxZ: SHIP.z + 0.45 * S, h: DECK_Y + 0.35 * S });
  // Masts: main (local z 0.2) and fore (local z 0.9), 1 x 1 m, tall.
  for (const lz of [0.2, 0.9]) {
    const mx = wx(lz);
    boxes.push({ minX: mx - 0.5, maxX: mx + 0.5, minZ: SHIP.z - 0.5, maxZ: SHIP.z + 0.5, h: DECK_Y + 30 });
  }
  // The hull below the deck, one box per side, so swimmers and boats bump it. Never reaches walking height.
  const hh = DECK_Y - 0.1;
  boxes.push({ minX: d.minX, maxX: d.maxX, minZ: d.minZ - 0.6, maxZ: d.minZ + 0.4, h: hh });
  boxes.push({ minX: d.minX, maxX: d.maxX, minZ: d.maxZ - 0.4, maxZ: d.maxZ + 0.6, h: hh });
  boxes.push({ minX: d.minX - 0.6, maxX: d.minX + 0.4, minZ: d.minZ, maxZ: d.maxZ, h: hh });
  boxes.push({ minX: d.maxX - 0.4, maxX: d.maxX + 0.6, minZ: d.minZ, maxZ: d.maxZ, h: hh });

  // Cannons, muzzle out to sea (+z).
  for (const c of SHIP.cannons) {
    place(scene, 'ship-cannon', c.x, DECK_Y, c.z, c.yaw ?? 0, CANNON_SCALE);
    boxes.push({ minX: c.x - 0.8, maxX: c.x + 0.8, minZ: c.z - 1, maxZ: c.z + 1, h: DECK_Y + 1 });
  }

  // The anchor hanging off the bow on a rope, and the one on the beach.
  const bowX = d.maxX + 0.8;
  const anchor = place(scene, 'ship-anchor', bowX, DECK_Y - 4.2, SHIP.z, 0, CANNON_SCALE);
  const ropeTop = DECK_Y + 0.4;
  let ropeBottom = DECK_Y - 3;
  if (anchor) {
    const ab = new THREE.Box3().setFromObject(anchor);
    ropeBottom = ab.max.y - 0.1;
  }
  const ropeLen = Math.max(0.5, ropeTop - ropeBottom);
  mesh(scene, new THREE.CylinderGeometry(0.05, 0.05, ropeLen, 6), ropeMat, bowX, ropeBottom + ropeLen / 2, SHIP.z);
  place(scene, 'ship-anchor', BEACH_ANCHOR.x, heightAt(BEACH_ANCHOR.x, BEACH_ANCHOR.z), BEACH_ANCHOR.z, 0.6, CANNON_SCALE);

  // Signs: on the bowl by the gangplank (facing the pier), and on the deck (facing the gangplank).
  const bowlSign = coastSign('PIRATE TOURS AT NOON\nCargo at midnight.\nDo not mix them up.', { w: 3.2, h: 1.4, post: 1.0 });
  bowlSign.position.set(g.minX - 3.5, COAST.pier.deckY + 0.07, COAST.pier.bowl.maxZ - 3);
  bowlSign.rotation.y = Math.PI;
  scene.add(bowlSign);
  const deckSign = coastSign('MIND THE RAIL\nIt is not a real rail.\nIt is mine. - Capt. S. Bilge', { w: 3, h: 1.2, post: 0.8 });
  deckSign.position.set(g.maxX + 3, DECK_Y, d.minZ + 2.2);
  deckSign.rotation.y = Math.PI;
  scene.add(deckSign);

  addNightLights(scene, hullX);
}

/**
 * The Queen after dusk (FX11, G3#12): glowing stern windows and lanterns, a masthead and a bow lantern, a string of rail
 * bulbs and warm pools on the deck. Emissive materials only; nightLights switches them on and off. Positions follow the
 * hull prefab's contract (stern windows at local x -0.25/0/0.25, y 0.55, z -1.47; lanterns at +-0.4, 0.82, -1.42).
 */
function addNightLights(scene: THREE.Scene, hullX: number): void {
  const d = SHIP.deck;
  const g = SHIP.gangplank;
  const glow = nightGlowMat(0xffc46b, 3.2);
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 1 });
  const hullY = DECK_Y - 0.4 * S;
  const ball = new THREE.SphereGeometry(1, 10, 8);
  const lantern = (x: number, y: number, z: number, r: number): void => {
    const m = new THREE.Mesh(ball, glow);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    scene.add(m);
  };

  // Stern windows: a thin pane just outside each one, on the stern face (world -x).
  const sternX = hullX - 1.47 * S - 0.04;
  const pane = new THREE.BoxGeometry(0.05, 1.7, 2.0);
  for (const lx of [-0.25, 0, 0.25]) {
    const m = new THREE.Mesh(pane, glow);
    m.position.set(sternX, hullY + 0.55 * S, SHIP.z - lx * S);
    scene.add(m);
  }
  // Stern lanterns, the masthead and the bow lantern.
  for (const lx of [-0.4, 0.4]) lantern(hullX - 1.42 * S, hullY + 0.84 * S, SHIP.z - lx * S, 0.75);
  lantern(hullX + 0.2 * S + 0.9, DECK_Y + 28.4, SHIP.z, 0.7);
  const bowX = d.maxX - 1.6;
  mesh(scene, new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), darkMat, bowX, DECK_Y + 1.1, SHIP.z);
  lantern(bowX, DECK_Y + 2.4, SHIP.z, 0.6);

  // Bulbs on a thin line along the north and south rails (a gap at the gangplank).
  const bulbs: THREE.Vector3[] = [];
  const bulbY = DECK_Y + 1.5;
  for (const [bz, gap] of [[d.minZ + 0.6, true], [d.maxZ - 0.6, false]] as const) {
    const runs: [number, number][] = gap ? [[d.minX + 1, g.minX - 0.3], [g.maxX + 0.3, d.maxX - 1]] : [[d.minX + 1, d.maxX - 1]];
    for (const [a, b] of runs) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(b - a, 0.03, 0.03), darkMat);
      line.position.set((a + b) / 2, bulbY, bz);
      scene.add(line);
      for (let x = a; x <= b + 0.01; x += 3) bulbs.push(new THREE.Vector3(x, bulbY - 0.12, bz));
    }
  }
  // Dressing lights: a sagging string of bulbs from the bow up over both mastheads and down to the stern, the classic
  // night picture of a moored ship (seen from the whole beach).
  const dress: [number, number][] = [
    [bowX, DECK_Y + 2.4], [hullX + 0.9 * S, DECK_Y + 19], [hullX + 0.2 * S + 0.9, DECK_Y + 27.5], [hullX - 1.42 * S, hullY + 0.84 * S],
  ];
  for (let k = 0; k + 1 < dress.length; k++) {
    const [ax, ay] = dress[k], [bx, by] = dress[k + 1];
    const len = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(len / 1.6));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      bulbs.push(new THREE.Vector3(ax + (bx - ax) * t, ay + (by - ay) * t - Math.sin(Math.PI * t) * len * 0.06, SHIP.z));
    }
  }
  const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.26, 8, 6), glow, bulbs.length);
  const mat4 = new THREE.Matrix4();
  bulbs.forEach((p, i) => bulbMesh.setMatrixAt(i, mat4.makeTranslation(p.x, p.y, p.z)));
  scene.add(bulbMesh);

  // Warm pools on the deck: aft under the stern lanterns, amidships, forward by the bow lantern.
  for (const px of [d.minX + 7, SHIP.x, bowX - 3]) scene.add(lightPool(px, DECK_Y, SHIP.z, 5.5, 0xffd08a, 0.75));
}

/** Set at install: leaving the cabin stands this player back on the deck. */
let cabinPlayer: { y: number } | null = null;

/** The treasure quest's save entry, or undefined (no save, no storage, bad JSON). */
function treasureQuest(): { state: string; step: number } | undefined {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('gta-quests-v1') : null;
    return parseSavesJson(raw)['coast-queens-treasure'];
  } catch {
    return undefined;
  }
}

/** Defined at import time (E05 rule), so quests that give from the cabin find it before the coast installs. */
function defineCabin(): void {
  if (interiorById(QUEEN_CABIN_INTERIOR)) return;
  const door = SHIP.cabinDoor;
  const [tx, tz] = SHIP.treasureLocal;
  defineInterior({
    id: QUEEN_CABIN_INTERIOR,
    name: "Captain Bilge's Cabin",
    door: { x: door.x, z: door.z, yaw: door.yaw ?? 0 },
    exit: { x: door.x + 2, z: door.z, yaw: door.yaw ?? 0 },
    size: { w: 14, d: 10, h: 4 },
    theme: { floor: 0x6b4a2f, wall: 0x8a5a38, trim: 0xc9a227, ceiling: 0x5a3a24, light: 0xffc98a },
    ambience: 'coast', // the sea, heard through the walls
    // Leaving puts the player on the deck, not on the sea bed below it.
    onLeave: () => { if (cabinPlayer) cabinPlayer.y = DECK_Y; },
    build(kit) {
      kit.room();
      kit.door(0, -4.8, 0);
      kit.put('rug', 0, 0.5, 0, { solid: false, size: 5, tint: 0xa33a2c });
      kit.put('table', -2, 0.5, 0);
      kit.put('chair', -3.2, 0.5, Math.PI / 2);
      kit.put('chair', -0.8, 0.5, -Math.PI / 2);
      kit.put('bed', -5.6, 2.8, Math.PI / 2);
      kit.put('barrel', 6.0, 3.6, 0);
      kit.put('barrel', 6.0, 4.4, 0);
      kit.put('rope-coil', -5.8, -3.8, 0, { solid: false });
      kit.put('wooden-chest', tx, tz, 0);
      kit.sign('CHART OF THE SALTWATER\nX marks the Queen.\nThe Queen marks the X.', -3, 2.2, 4.95, Math.PI, { w: 2.6, h: 1.1, bg: 0xe8d9b0, fg: 0x5a3a24 });
      kit.sign('TOURS: NOON\nCARGO: MIDNIGHT\nBOTH: HONEST', 3, 2.2, 4.95, Math.PI, { w: 2.2, h: 1.0, bg: 0xe8d9b0, fg: 0x5a3a24 });
      kit.window(-6.95, -1, Math.PI / 2);
      kit.npc({
        id: 'samphire',
        name: 'Captain Samphire Bilge',
        x: 1.2,
        z: 2.4,
        yaw: Math.PI,
        look: CAST.samphire.look,
        line: 'Every cargo is honest. Some of it was just not yet yours.',
      });
      kit.spot({
        id: 'queen-treasure',
        // On the floor side of the chest (towards the room's middle), clear of the bed.
        x: tx + 1.1,
        z: tz,
        prompt: 'Open the sea chest',
        run: () => {
          window.dispatchEvent(new CustomEvent('gta:queen-chest'));
          const q = treasureQuest();
          if (q?.state === 'active' && q.step === 1) return; // the quest's own "You found it." follows
          const line = q?.state === 'done' ? 'Empty. I spent it on rope. Good rope, mind.' : 'Not that one. That one is for the tourists.';
          window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name: 'Captain Samphire Bilge', line } }));
        },
      });
    },
  });
}

/** Runtime: the cabin interior, deck spots, the crew. */
defineCabin();

export function installPirateShip(deps: JobsDeps): CoastPart {
  cabinPlayer = deps.player;
  return {
    blips: () => [{ x: SHIP.x, z: SHIP.z, color: '#d8342c', label: 'The Bathtub Queen' }],
  };
}
