// The Double Pot (L92, E01 2B): two downtown block footprints joined over street x = 120 by a roof slab, so the road
// runs through a tunnel in one long 2x1 tower. The two halves are ordinary TowerSpecs (world.ts addTower, styled by
// src/towers/); this file adds the slab. Numbers match the `double-pot` site (src/sites.ts): x 69..171, z -111..-69.
import * as THREE from 'three';
import { siteRect } from '../sites';

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
    new THREE.MeshStandardMaterial({ color: 0x8d8f93, roughness: 0.95 }),
  );
  slab.position.set((roof.minX + roof.maxX) / 2, roof.y - roof.thickness / 2, (roof.minZ + roof.maxZ) / 2);
  slab.castShadow = true;
  slab.receiveShadow = true;
  slab.name = 'double-pot-tunnel-roof';
  scene.add(slab);
}
