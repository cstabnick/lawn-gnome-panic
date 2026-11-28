// The Double Pot (L92, E01 2B): two downtown block footprints joined over street x = 120 by a roof slab, so the road
// runs through a tunnel in one long 2x1 tower. The two halves are ordinary TowerSpecs (world.ts addTower, styled by
// src/towers/); this file adds the slab. Numbers match the `double-pot` site (src/sites.ts): x 69..171, z -111..-69.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { textPlate } from '../homes/pieces';
import { siteRect } from '../sites';
import { undersideMat } from '../undersides';

/** The Double Pot (L92 mega block): two block footprints joined over street x = 120 by a roof slab (the tunnel roof). */
export const MEGA_BLOCK = {
  /** The two building halves (world rectangles, the block footprints minus the usual inset). */
  west: { minX: 69, maxX: 111, minZ: -111, maxZ: -69 },
  east: { minX: 129, maxX: 171, minZ: -111, maxZ: -69 },
  /** The tunnel roof slab over the street: its rectangle and its top (walkable later, E05 rooftops). */
  roof: { minX: 111, maxX: 129, minZ: -111, maxZ: -69, y: 9, thickness: 1 },
  /** Clear height under the slab (vehicles, the bus). */
  clearance: 8,
} as const;

/** How far the slab reaches into each half, so it overlaps the tower boxes instead of sharing a face with them. */
const SLAB_OVERLAP = 0.2;

/** Throws when MEGA_BLOCK and the `double-pot` site disagree. */
export function assertMegaBlockMatchesSite(): void {
  const s = siteRect('double-pot');
  const m = MEGA_BLOCK;
  if (s.minX !== m.west.minX || s.maxX !== m.east.maxX || s.minZ !== m.west.minZ || s.maxZ !== m.west.maxZ) {
    throw new Error('MEGA_BLOCK does not match the double-pot site');
  }
}

/**
 * Adds the two halves through `addTower` (centre x, z, width, depth, height, slot 0 west / 1 east) and the roof slab to
 * the scene. The slab is not a collider (a box is solid from the ground up and would block the road); the rooftop epic
 * adds its collision.
 */
export function buildMegaBlock(
  scene: THREE.Scene,
  addTower: (x: number, z: number, w: number, d: number, h: number, slot: number) => void,
  height: number,
): void {
  assertMegaBlockMatchesSite();
  const { west, east, roof } = MEGA_BLOCK;
  [west, east].forEach((r, slot) => {
    addTower((r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2, r.maxX - r.minX, r.maxZ - r.minZ, height, slot);
  });
  const w = roof.maxX - roof.minX + 2 * SLAB_OVERLAP;
  // Inset 0.3 m at both ends so the slab's end faces never lie in the towers' facade planes (z-fight).
  const d = roof.maxZ - roof.minZ - 0.6;
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(w, roof.thickness, d),
    undersideMat(0x8d8f93, { roughness: 0.95 }),
  );
  slab.position.set((roof.minX + roof.maxX) / 2, roof.y - roof.thickness / 2, (roof.minZ + roof.maxZ) / 2);
  slab.castShadow = true;
  slab.receiveShadow = true;
  slab.name = 'double-pot-tunnel-roof';
  scene.add(slab);

  // Tunnel lamps: two rows hung under the slab (underside y = roof.y - thickness), no real lights.
  const lampY = roof.y - roof.thickness - 0.02;
  const lamps: { id: string; x: number; y: number; z: number; yaw: number }[] = [];
  for (const x of [116, 124]) {
    for (let z = -108; z <= -72; z += 6) lamps.push({ id: 'tunnel-lamp', x, y: lampY, z, yaw: Math.PI / 2 });
  }
  scene.add(buildStaticCells(lamps, { lights: false, name: 'double-pot-tunnel-lamps' }));

  // Portal plates on the slab's end faces (0.3 m inset), body y 8..9.
  const portal = 'DOUBLE POT TUNNEL\nHEADROOM 8 M';
  const portalOpts = { w: 6, h: 0.8, bg: 0x1d2a3a, fg: 0xf2c14e };
  const midX = (roof.minX + roof.maxX) / 2;
  scene.add(textPlate(portal, midX, 8.5, roof.minZ + 0.3 - 0.03, Math.PI, portalOpts));
  scene.add(textPlate(portal, midX, 8.5, roof.maxZ - 0.3 + 0.03, 0, portalOpts));

  // THORNE logo plates on the tunnel's inner facades, facing into the tunnel.
  const logo = { w: 2.4, h: 0.6, bg: 0x111111, fg: 0xd4af37 };
  scene.add(textPlate('THORNE', west.maxX + 0.03, 5.5, -90, Math.PI / 2, logo));
  scene.add(textPlate('THORNE', east.minX - 0.03, 5.5, -90, -Math.PI / 2, logo));
  // Sales floor sign by the door at (112.4, -84), on the west half's east facade.
  scene.add(textPlate('SALES FLOOR →', west.maxX + 0.03, 2.6, -84, Math.PI / 2, { w: 1.6, h: 0.45, bg: 0xf5f0e0, fg: 0x1d2a3a }));
}

/**
 * FX05 (D3): the HOA lockup's door (lore `hoa-lockup`: "entered by a door in the Double Pot Tunnel"), a permanent beige
 * door in the tunnel's west wall, a plate over it and a loudspeaker over that, each 0.05..0.3 m proud of x = 111. Built
 * by app.ts after the world (with the stage sets), so the golden layout stays pinned. #62's pen stands in front of it.
 */
export function buildHoaLockupDoor(scene: THREE.Scene): void {
  const doorZ = -98, wallX = MEGA_BLOCK.west.maxX;
  const door = buildPrefab('panelled-door', { tint: 0xd8c9a2, lights: false });
  door.position.set(wallX + 0.15, 0, doorZ);
  door.rotation.y = Math.PI / 2;
  door.scale.setScalar(1.2);
  door.name = 'hoa-lockup-door';
  scene.add(door);
  scene.add(textPlate('HOA HOLDING (WAIT HERE)', wallX + 0.05, 3.2, doorZ, Math.PI / 2, { w: 2.8, h: 0.4, bg: 0xd8c9a2, fg: 0x2b2a26 }));
  const speaker = buildPrefab('pl-horn-speaker', { lights: false });
  speaker.position.set(wallX + 0.3, 3.64, doorZ);
  speaker.rotation.y = Math.PI / 2;
  speaker.scale.setScalar(0.3);
  speaker.name = 'hoa-lockup-speaker';
  scene.add(speaker);
}
