// Level-document props: each PropDef in a zone's `props` is a prefab set on the ground at its world position.
// Positions are already world coordinates (content.ts moved the zone), and colliders for solidR come from terrainCore.ts,
// so this file only draws.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { PropDef } from '@lawn/level';

/** Prefab ids already reported as unknown, so a missing id warns once rather than once per prop. */
const warned = new Set<string>();

/** '#rrggbb' to the number buildPrefab takes; anything else is ignored (the prefab keeps its own tint). */
function tintNumber(tint: string | undefined): number | undefined {
  const m = tint ? /^#([0-9a-f]{6})$/i.exec(tint) : null;
  return m ? parseInt(m[1], 16) : undefined;
}

/** Builds each prop as a prefab group under `parent`, standing on `groundAt(x, z)`. Unknown prefab ids are skipped. */
export function buildLevelProps(parent: THREE.Object3D, props: readonly PropDef[], groundAt: (x: number, z: number) => number): THREE.Object3D[] {
  const groups: THREE.Object3D[] = [];
  for (const p of props) {
    const tint = tintNumber(p.tint);
    let g: THREE.Group;
    try {
      g = buildPrefab(p.prefab, { scale: p.scale ?? 1, ...(tint !== undefined ? { tint } : {}) });
    } catch (err) {
      if (!warned.has(p.prefab)) {
        warned.add(p.prefab);
        console.warn(`Level prop skipped: ${p.prefab} (${err instanceof Error ? err.message : String(err)})`);
      }
      continue;
    }
    g.position.set(p.x, groundAt(p.x, p.z), p.z);
    g.rotation.y = p.rot ?? 0;
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        // Glowing parts (lamp bulbs, candle flames) do not cast shadows: the prefab library keeps that choice.
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        const glows = m instanceof THREE.MeshStandardMaterial && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0;
        o.castShadow = !glows;
        o.receiveShadow = true;
      }
    });
    parent.add(g);
    groups.push(g);
  }
  return groups;
}
