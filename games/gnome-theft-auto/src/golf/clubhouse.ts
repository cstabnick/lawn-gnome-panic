// Hedgeworth's buildings: the clubhouse, Basil's cottage, Thrift's shed and the cart shelter outside, the clubhouse
// interior (E05 defineInterior), and the three homes (E10 registerHome).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { buildPieces, litWindow, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { homeOf, registerHome } from '../homes/data';
import { defineInterior, interiorById, leaveInterior } from '../interiors';
import {
  CART_SHELTER, CLUBHOUSE, CLUBHOUSE_INTERIOR, CLUBHOUSE_ROOM, COURSE_PAR, HOLES, PRO_COTTAGE, SHED, TERRACE,
  type GolfStore,
} from './types';

export interface ClubhouseDeps {
  store(): GolfStore;
  /** Start a round on hole `hole` (default 0): null = started, else why not. */
  startRound(hole?: number): string | null;
  toast(text: string): void;
}

interface Building { x: number; z: number; w: number; d: number; yaw: number }

/** The building's footprint as a collider, for when its prefab is missing (so nothing walks through the gap). */
function footprint(b: Building): Box {
  const c = Math.abs(Math.cos(b.yaw)), s = Math.abs(Math.sin(b.yaw));
  const hw = (b.w * c + b.d * s) / 2, hd = (b.w * s + b.d * c) / 2;
  return { minX: b.x - hw, maxX: b.x + hw, minZ: b.z - hd, maxZ: b.z + hd, h: 4 };
}

/** Distance from a building's centre to its front face (local +z), from the prefab when it exists. */
function frontOf(prefab: string, b: Building): number {
  if (!getPrefab(prefab)) return b.d / 2;
  const lb = prefabBox(prefab);
  const size = Math.max(lb.max.x - lb.min.x, lb.max.y - lb.min.y, lb.max.z - lb.min.z);
  return size > 0 ? (lb.max.z * b.w) / size : b.d / 2;
}

/** A point `fwd` in front of and `side` to the right of a building's door face, turned by its yaw. */
function onFace(b: Building, fwd: number, side: number): [number, number] {
  const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
  return [b.x + s * fwd + c * side, b.z + c * fwd - s * side];
}

export function buildHedgeworthBuildings(scene: THREE.Scene): { boxes: Box[] } {
  const pieces: HomePiece[] = [];
  const boxes: Box[] = [];
  const group = new THREE.Group();
  group.name = 'hedgeworth-buildings-extras';
  const building = (prefab: string, b: Building): void => {
    if (getPrefab(prefab)) pieces.push({ prefab, x: b.x, z: b.z, yaw: b.yaw, size: b.w });
    else boxes.push(footprint(b));
  };
  building('hedgeworth-clubhouse', CLUBHOUSE);
  building('pro-cottage', PRO_COTTAGE);
  building('groundskeeper-shed', SHED);
  building('cart-shelter', CART_SHELTER);

  // The terrace: flat paving in front of the clubhouse, tables with parasols, planters along the south edge (a gap
  // opposite the door), the tee-time board by the door.
  const tw = TERRACE.maxX - TERRACE.minX, td = TERRACE.maxZ - TERRACE.minZ;
  const tcx = (TERRACE.minX + TERRACE.maxX) / 2, tcz = (TERRACE.minZ + TERRACE.maxZ) / 2;
  const paveMat = new THREE.MeshBasicMaterial({ color: 0xb9ae98 });
  flatLayer(paveMat, LAYER.area);
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(tw, td), paveMat);
  pave.rotation.x = -Math.PI / 2;
  pave.position.set(tcx, heightAt(tcx, tcz) + 0.02, tcz);
  pave.name = 'hedgeworth-terrace';
  group.add(pave);

  for (const tx of [-1069, -1051]) {
    const tz = 460;
    pieces.push({ prefab: 'euro-cafe-table', x: tx, z: tz, yaw: 0, y: -0.02 }); // foot sunk: never level with the ground
    pieces.push({ prefab: 'pl-cafe-parasol', x: tx, z: tz, yaw: 0, solid: false });
    pieces.push({ prefab: 'chair', x: tx - 1.2, z: tz, yaw: Math.PI / 2, solid: false });
    pieces.push({ prefab: 'chair', x: tx + 1.2, z: tz, yaw: -Math.PI / 2, solid: false });
  }
  for (const px of [-1072, -1068, -1064, -1056, -1052, -1048]) {
    pieces.push({ prefab: 'stone-planter', x: px, z: TERRACE.maxZ - 0.5, yaw: 0 });
  }
  pieces.push({ prefab: 'tee-time-board', x: CLUBHOUSE.door.x + 3, z: CLUBHOUSE.door.z + 0.6, yaw: 0 });
  // On the way to the first tee, out of play.
  const tee = HOLES[0].tee;
  pieces.push({ prefab: 'scorecard-box', x: tee.x + 6, z: TERRACE.maxZ + 3, yaw: 0 });
  pieces.push({ prefab: 'ball-washer', x: tee.x + 3, z: TERRACE.maxZ + 3, yaw: 0 });

  boxes.push(...buildPieces(scene, pieces, 'hedgeworth-buildings'));

  // Text plates and lit windows (0.03 m in front of the face).
  const plate = (b: Building, prefab: string, text: string, y: number, w: number, h: number, side = 0): void => {
    const [x, z] = onFace(b, frontOf(prefab, b) + 0.03, side);
    group.add(textPlate(text, x, heightAt(x, z) + y, z, b.yaw, { w, h }));
  };
  const pane = (b: Building, prefab: string, y: number, side: number): void => {
    const [x, z] = onFace(b, frontOf(prefab, b) + 0.03, side);
    group.add(litWindow(x, heightAt(x, z) + y, z, b.yaw, 1.4, 1.1));
  };
  plate(CLUBHOUSE, 'hedgeworth-clubhouse', 'HEDGEWORTH LINKS\nEST. BEFORE THE HEDGES', 3.4, 4, 0.9);
  pane(CLUBHOUSE, 'hedgeworth-clubhouse', 5.2, -6);
  pane(CLUBHOUSE, 'hedgeworth-clubhouse', 5.2, 6);
  plate(PRO_COTTAGE, 'pro-cottage', 'PRO SHOP\nLESSONS · EXCUSES', 2.6, 2.6, 0.7, 2.5);
  pane(PRO_COTTAGE, 'pro-cottage', 1.6, -2.5);
  plate(SHED, 'groundskeeper-shed', 'GROUNDS. KNOCK.\nDO NOT WATER THE GROUNDSKEEPER', 2.4, 2.8, 0.7);
  plate(CART_SHELTER, 'cart-shelter', 'CARTS · CHARGE OVERNIGHT\nDO NOT RACE', 2.8, 3, 0.7);
  scene.add(group);
  return { boxes };
}

// ---- The clubhouse interior ---------------------------------------------------------------------------------------

function say(name: string, line: string): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
}

function topOf(obj: THREE.Object3D): number {
  return new THREE.Box3().setFromObject(obj).max.y;
}

export function defineClubhouseInterior(deps: ClubhouseDeps): void {
  if (interiorById(CLUBHOUSE_INTERIOR)) return;
  defineInterior({
    id: CLUBHOUSE_INTERIOR,
    name: 'Hedgeworth Clubhouse',
    door: { x: CLUBHOUSE.door.x, z: CLUBHOUSE.door.z + 1, yaw: Math.PI },
    exit: { ...CLUBHOUSE.doorOut, yaw: 0 },
    size: CLUBHOUSE_ROOM,
    theme: 'club',
    ambience: 'silent',
    prompt: 'Enter the clubhouse',
    build(kit) {
      kit.room();
      kit.door(0, 6.8, Math.PI);
      kit.window(-4.5, 6.95, Math.PI);
      kit.window(4.5, 6.95, Math.PI);

      // Pro shop corner (west): clubs, bags, Basil's counter. Basil is out on the first tee.
      kit.put('club-rack', -10.2, -4.5, Math.PI / 2);
      kit.put('round-rug', -9, -4.5, 0, { solid: false, size: 1.4, tint: 0x3a2a1f }); // the mole-shaped dent
      kit.put('golf-bag', -10.2, -2.4, Math.PI / 2);
      kit.put('golf-bag', -10.2, -1.5, Math.PI / 2, { tint: 0xc9b458 });
      kit.put('golf-bag', -9.2, 0.6, Math.PI / 2);
      kit.block(3.2, 1, 0.8, -7.5, 1.5, { color: 0x5b3e2b });
      kit.sign('CLUBS · BALLS · LUCK\n(NOT SOLD)', -7.5, 0.55, 1.93, 0, { w: 1.6, h: 0.5 });
      kit.sign('BACK IN FIVE STROKES', -7.5, 1.35, 1.5, 0, { w: 1.0, h: 0.35, bg: 0xf5f0e1, fg: 0x263238 });

      // Bar (east): counter, stools, bottle shelves, Old Ferrule.
      kit.put('bar-counter', 8, -1, Math.PI / 2);
      for (const z of [-2, -1, 0]) kit.put('bar-stool', 6.6, z, 0);
      kit.put('bookshelf', 10.5, -3.6, -Math.PI / 2, { tint: 0x6d4c41 });
      kit.put('bookshelf', 10.5, 2.4, -Math.PI / 2, { tint: 0x6d4c41 });
      kit.npc({
        id: 'ferrule', name: 'Old Ferrule', x: 9.7, z: -1, yaw: -Math.PI / 2,
        look: { hat: 0x4b3621, shirt: 0xf2efe6, beard: 0xcfcfcf },
        line: "The usual, member? There's only the usual.",
      });

      // Lounge (middle, north): rug, armchairs, the honours board and the trophy cabinet.
      kit.put('round-rug', 0, -3.2, 0, { solid: false, size: 4, tint: 0x7a2e2e });
      kit.put('armchair', -2, -2.8, Math.PI);
      kit.put('armchair', 2, -2.8, Math.PI);
      kit.put('lamp', 4, -5.8, 0);
      kit.put('honours-board', -3, -6.8, 0);
      kit.sign('CLUB CHAMPIONS', -3, 3.2, -6.85, 0, { w: 2.2, h: 0.45, bg: 0x2e4a2e, fg: 0xf0d878 });
      kit.sign('P. GRAVELRAKE ×9 · B. DIVOT ×1\nA MOLE (DISPUTED)', -3, 1.9, -6.75, 0, { w: 2.4, h: 0.7, bg: 0x2e4a2e, fg: 0xf0d878 });
      kit.put('trophy-cabinet', 1.2, -6.5, 0);
      kit.put('trophy-cup', 1.2, -6.5, 0, { y: 2.0, solid: false, size: 0.4 });

      // Stairs (north-east) to Peony's rooms.
      kit.block(2, 0.2, 0.8, 8.5, -5.6, { color: 0x6d4c41, solid: false });
      kit.block(2, 0.4, 0.8, 8.5, -6.4, { color: 0x6d4c41, solid: false });
      kit.sign("PRIVATE\nDAME PEONY'S ROOMS", 8.5, 1.8, -6.9, 0, { w: 1.6, h: 0.5 });
      kit.spot({
        id: 'peony-stairs', x: 8.5, z: -4.7, prompt: "Private: Dame Peony's rooms",
        run: () => say('Peony (upstairs)', 'Members only past the third stair, my dear. You are on the second.'),
      });

      // The tee-time board inside: starts a round.
      kit.put('tee-time-board', -2, 6.5, Math.PI);
      kit.spot({
        id: 'tee-time', x: -2, z: 5.2, prompt: 'Book a tee time (start a round)',
        run: () => {
          leaveInterior();
          setTimeout(() => {
            const why = deps.startRound(0);
            if (why) deps.toast(why);
          }, 700);
        },
      });

      // The honours board.
      kit.spot({
        id: 'honours', x: -3, z: -5.2, prompt: 'Read the honours board',
        run: () => {
          const best = deps.store().data().bestRound;
          if (best === null || best === undefined) { say('Honours board', 'Your name is not on the board.'); return; }
          const d = best - COURSE_PAR;
          say('Honours board', `Your best: ${best} (${d === 0 ? 'E' : d > 0 ? `+${d}` : d}). Not on the board. Yet.`);
        },
      });

      // Vignette: Peony's half-finished letter and Vesper's reminder, on a desk in the north-west corner.
      const desk = kit.put('office-desk', -6.5, -6.0, 0);
      const top = topOf(desk);
      kit.put('folded-map', -6.8, -6.0, 0.15, { y: top, solid: false, size: 0.55 });
      kit.put('tall-one-pencil', -6.2, -5.8, 1.2, { y: top, solid: false, size: 1.1, by: 'h' });
      kit.sign('THORNE & CO.\nFINAL REMINDER', -5.6, top + 0.18, -5.9, 0, { w: 0.45, h: 0.3, bg: 0xf5f0e1, fg: 0xb71c1c });

      // Vignette: a golf umbrella drying open by the door.
      kit.put('glaze-canopy-umbrella', 2.2, 6.0, 0, { solid: false, size: 1.2, by: 'h', tint: 0x2e4a7a });
    },
  });
}

// ---- Homes ---------------------------------------------------------------------------------------------------------

/** Peony lives upstairs at the clubhouse, Basil in his cottage, Thrift in his shed. Safe to call twice. */
export function registerHedgeworthHomes(): void {
  const rows: [string, [number, number, number]][] = [
    ['peony', [CLUBHOUSE.door.x, CLUBHOUSE.door.z, 0]],
    ['basil', [PRO_COTTAGE.door.x, PRO_COTTAGE.door.z, 0]],
    ['thrift', [SHED.door.x, SHED.door.z, -Math.PI / 2]],
  ];
  for (const [key, door] of rows) {
    const home = homeOf(key);
    if (home) registerHome({ ...home, door });
  }
}
