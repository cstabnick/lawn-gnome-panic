// Rootwell University's thirteen buildings (E13 issue A11): the prefabs on their footprints with exact colliders, name
// plates beside the front doors, the Clod's pitch between its two grandstands, and the Dean's home at his lodge.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPieces, textPlate, type HomePiece } from '../homes/pieces';
import { homeOf, registerHome } from '../homes/data';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { CAMPUS, CAMPUS_BUILDINGS, type CampusBuilding } from './types';

/** The prefabs are authored at half size. */
const SCALE = 2;
const PLATE_W = 2.4, PLATE_H = 0.8;
const PLATE_BG = 0x2b2a33, PLATE_FG = 0xefe3c8;
/** The plate sits this far right of the door (as seen from outside), on the front face. */
const PLATE_LATERAL = 2.8;
const LINE_W = 0.25;

/** The world rectangle a building covers: w along x (and d along z) at yaw 0 or PI, swapped at +-PI/2. */
export function buildingFootprint(b: CampusBuilding): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const turned = Math.abs(Math.sin(b.yaw)) > 0.5;
  const hx = (turned ? b.d : b.w) / 2, hz = (turned ? b.w : b.d) / 2;
  return { minX: b.x - hx, maxX: b.x + hx, minZ: b.z - hz, maxZ: b.z + hz };
}

/** A flat rectangle or ring lying on the ground, on the marking layer (white lines on the pitch). */
function flatLine(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

/** The Clod's pitch: green grass on the area layer, white lines on the marking layer, lying on the ground. */
function buildPitch(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'the-clod-pitch';
  const { x: cx, z: cz } = CAMPUS.pitch;
  const gy = heightAt(cx, cz);
  const minX = 1013, maxX = 1067, minZ = -104, maxZ = -86;
  const grass = flatLayer(new THREE.MeshLambertMaterial({ color: 0x4f9a3c }), LAYER.area);
  g.add(flatLine(new THREE.PlaneGeometry(maxX - minX, maxZ - minZ), grass, cx, gy + 0.03, cz));
  const white = flatLayer(new THREE.MeshBasicMaterial({ color: 0xf4f4ec, side: THREE.DoubleSide }), LAYER.marking);
  const ly = gy + 0.05;
  g.add(flatLine(new THREE.PlaneGeometry(maxX - minX, LINE_W), white, cx, ly, minZ + LINE_W));
  g.add(flatLine(new THREE.PlaneGeometry(maxX - minX, LINE_W), white, cx, ly, maxZ - LINE_W));
  g.add(flatLine(new THREE.PlaneGeometry(LINE_W, maxZ - minZ), white, minX + LINE_W, ly, cz));
  g.add(flatLine(new THREE.PlaneGeometry(LINE_W, maxZ - minZ), white, maxX - LINE_W, ly, cz));
  g.add(flatLine(new THREE.PlaneGeometry(LINE_W, maxZ - minZ), white, cx, ly, cz));
  g.add(flatLine(new THREE.RingGeometry(3.8, 4.05, 48), white, cx, ly, cz));
  return g;
}

/** Stand every CAMPUS_BUILDINGS prefab, push its colliders into `boxes`, add name plates and the Clod's pitch. */
export function buildCampusBuildings(scene: THREE.Scene, boxes: Box[]): void {
  const group = new THREE.Group();
  group.name = 'rootwell-buildings';
  scene.add(group);

  const pieces: HomePiece[] = [];
  for (const b of CAMPUS_BUILDINGS) {
    if (b.id === 'the-clod') continue;
    pieces.push({ prefab: b.prefab, x: b.x, z: b.z, yaw: b.yaw, scale: SCALE, solid: false });
    boxes.push({ ...buildingFootprint(b), h: heightAt(b.x, b.z) + b.h });
  }

  // The Clod: two grandstands facing the pitch, a corner flag at each corner, and a signpost on the north side.
  const clod = CAMPUS_BUILDINGS.find((b) => b.id === 'the-clod');
  if (clod) {
    const cy = heightAt(clod.x, clod.z);
    pieces.push({ prefab: clod.prefab, x: clod.x, z: -111, yaw: 0, scale: SCALE, solid: false });
    pieces.push({ prefab: clod.prefab, x: clod.x, z: -79, yaw: Math.PI, scale: SCALE, solid: false });
    for (const [x, z] of [[1013, -104], [1067, -104], [1013, -86], [1067, -86]] as const) {
      pieces.push({ prefab: 'slalom-flag', x, z, yaw: 0, solid: false });
    }
    pieces.push({ prefab: 'signpost', x: clod.x, z: -119, yaw: Math.PI, solid: false });
    boxes.push({ minX: 1015, maxX: 1065, minZ: -115, maxZ: -107, h: cy + 8 });
    boxes.push({ minX: 1015, maxX: 1065, minZ: -83, maxZ: -75, h: cy + 8 });
    const sign = textPlate('THE CLOD', clod.x, cy + 1.9, -119.6, Math.PI, { w: 1.6, h: 0.45, bg: PLATE_BG, fg: PLATE_FG });
    group.add(sign);
  }

  buildPieces(scene, pieces, 'rootwell-buildings');

  // Name plates beside every front door (the Clod has its signpost plate instead).
  for (const b of CAMPUS_BUILDINGS) {
    if (b.id === 'the-clod') continue;
    const sn = Math.sin(b.yaw), cs = Math.cos(b.yaw);
    const front = b.d / 2 + 0.25; // the half-size prefabs' doors and trim stand 0.06-0.08 off the wall
    const x = b.x + sn * front + cs * PLATE_LATERAL;
    const z = b.z + cs * front - sn * PLATE_LATERAL;
    const text = `${b.name.toUpperCase()}\n${b.role.toUpperCase()}`;
    group.add(textPlate(text, x, heightAt(b.x, b.z) + 2.2, z, b.yaw, { w: PLATE_W, h: PLATE_H, bg: PLATE_BG, fg: PLATE_FG }));
  }

  group.add(buildPitch());

  // The Dean's home is his lodge's front door.
  const lodge = CAMPUS_BUILDINGS.find((b) => b.id === 'deans-lodge');
  const home = homeOf('lovage');
  if (lodge && home) registerHome({ ...home, door: [lodge.door.x, lodge.door.z, lodge.door.yaw] });
}
