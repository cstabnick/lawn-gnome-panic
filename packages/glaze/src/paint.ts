// Body paint: the finish (gloss, matte, metallic, pearl, candy, chameleon, primer) as a material, painted onto the body's tint meshes.
import * as THREE from 'three';
import type { FinishId, Loadout } from './types';

const cache = new Map<string, THREE.Material>();
const PRIMER_TINT = 0x8a8d90;

/**
 * A material for a finish and colour, cached by (finish, colour, vertexColors) and shared between vehicles (never dispose it).
 * `vertexColors` true for the body's baked tint bucket (its vertex colours are white, so the material colour is the paint), false for a plain tint part.
 */
export function finishMaterial(finish: FinishId, color: number, vertexColors: boolean): THREE.Material {
  const key = `${finish}:${color}:${vertexColors}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const mat = buildFinish(finish, color, vertexColors);
  cache.set(key, mat);
  return mat;
}

function buildFinish(finish: FinishId, color: number, vertexColors: boolean): THREE.Material {
  const paint = new THREE.Color(color);
  switch (finish) {
    case 'gloss':
      return new THREE.MeshPhysicalMaterial({
        color: paint, vertexColors, roughness: 0.32, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.2,
      });
    case 'matte':
      return new THREE.MeshStandardMaterial({ color: paint, vertexColors, roughness: 0.96, metalness: 0 });
    case 'metallic':
      return new THREE.MeshPhysicalMaterial({
        color: paint, vertexColors, roughness: 0.38, metalness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.3,
      });
    case 'pearl':
      return new THREE.MeshPhysicalMaterial({
        color: paint, vertexColors, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1,
        sheen: 1, sheenRoughness: 0.4, sheenColor: paint.clone().lerp(new THREE.Color(0xffffff), 0.6),
      });
    case 'candy': {
      const hsl = { h: 0, s: 0, l: 0 };
      paint.getHSL(hsl);
      const candy = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s + 0.15), Math.max(0, hsl.l - 0.04));
      return new THREE.MeshPhysicalMaterial({
        color: candy, vertexColors, roughness: 0.22, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04,
      });
    }
    case 'primer':
      return new THREE.MeshStandardMaterial({
        color: paint.clone().lerp(new THREE.Color(PRIMER_TINT), 0.65), vertexColors, roughness: 1, metalness: 0,
      });
    case 'chameleon': {
      const mat = new THREE.MeshStandardMaterial({ color: paint, vertexColors, roughness: 0.3, metalness: 0.25 });
      mat.onBeforeCompile = (shader) => {
        const include = '#include <normal_fragment_maps>';
        if (!shader.fragmentShader.includes(include)) return;
        shader.fragmentShader = shader.fragmentShader.replace(include, `${include}
      float gzFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.0);
      float gzA = gzFres * 3.4;
      vec3 gzK = vec3(0.57735);
      diffuseColor.rgb = diffuseColor.rgb * cos(gzA) + cross(gzK, diffuseColor.rgb) * sin(gzA) + gzK * dot(gzK, diffuseColor.rgb) * (1.0 - cos(gzA));
`);
      };
      mat.customProgramCacheKey = () => 'glaze-chameleon';
      return mat;
    }
  }
}

function hasVertexColors(material: THREE.Material | THREE.Material[]): boolean {
  return !Array.isArray(material) && material.vertexColors === true;
}

/** Give every mesh under `root` with `userData.tint === true` the material for loadout.paint + loadout.finish. Idempotent. */
export function paintBody(root: THREE.Object3D, loadout: Loadout): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || obj.userData.tint !== true) return;
    const stored: unknown = obj.userData.glazeVertexColors;
    const vertexColors = typeof stored === 'boolean' ? stored : hasVertexColors(obj.material);
    obj.userData.glazeVertexColors = vertexColors;
    obj.material = finishMaterial(loadout.finish, loadout.paint, vertexColors);
  });
}
