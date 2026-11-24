// The five tower materials (one draw call each for the whole downtown) and the night switch for lit windows.
//
// The facade material samples one tile of a 4 x 4 atlas (facadeAtlas.ts) per vertex: the aTile attribute picks the
// tile, the uv (in tile repeats) wraps inside it with fract(). textureGrad with the unwrapped uv's derivatives keeps
// mipmaps right at the wrap (no seam lines). The emissive atlas has the same layout: lit windows on black, scaled by
// the night factor, so windows light up at dusk without swapping textures.
import * as THREE from 'three';

/** Tiles per side of the facade atlas. */
export const ATLAS_N = 4;

const materials: THREE.MeshStandardMaterial[] = [];
let nightUniform = 0;

/** How bright lit windows and signs are at full night (emissive intensity). */
const NIGHT_GLOW = 1.25;
/** Window glow at noon (a faint warm hint in the lit rooms). */
const DAY_GLOW = 0.06;

function patchAtlas(mat: THREE.MeshStandardMaterial): void {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aTile;\nvarying float vTile;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvTile = aTile;');
    const sample = (tex: string, uv: string): string => `
      vec2 tCell = vec2(mod(vTile, ${ATLAS_N}.0), ${ATLAS_N - 1}.0 - floor(vTile / ${ATLAS_N}.0 + 0.01));
      vec2 tUv = (tCell + clamp(fract(${uv}), 0.006, 0.994)) / ${ATLAS_N}.0;
      vec4 tTex = textureGrad(${tex}, tUv, dFdx(${uv}) / ${ATLAS_N}.0, dFdy(${uv}) / ${ATLAS_N}.0);`;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTile;')
      .replace('#include <map_fragment>', `#ifdef USE_MAP\n{${sample('map', 'vMapUv')}\n diffuseColor *= tTex; }\n#endif`)
      .replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP\n{${sample('emissiveMap', 'vEmissiveMapUv')}\n totalEmissiveRadiance *= tTex.rgb; }\n#endif`);
  };
  mat.customProgramCacheKey = () => 'gta-tower-atlas';
}

export interface TowerMaterials {
  facade: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glow: THREE.MeshBasicMaterial;
  sign: THREE.MeshStandardMaterial;
}

/** The materials, built once per world. `facadeMap` / `facadeGlow` from facadeAtlas.ts, `signMap` from signAtlas.ts. */
export function createTowerMaterials(facadeMap: THREE.Texture, facadeGlow: THREE.Texture, signMap: THREE.Texture): TowerMaterials {
  for (const t of [facadeMap, facadeGlow]) {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 4;
  }
  const facade = new THREE.MeshStandardMaterial({
    map: facadeMap, emissiveMap: facadeGlow, emissive: 0xffffff, emissiveIntensity: DAY_GLOW,
    vertexColors: true, roughness: 0.62, metalness: 0.08,
  });
  facade.name = 'tower-facade';
  patchAtlas(facade);
  const trim = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.05 });
  trim.name = 'tower-trim';
  const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.65 });
  metal.name = 'tower-metal';
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true });
  glow.name = 'tower-glow';
  // Signs hang a little proud of walls; the polygon offset keeps them in front at any distance.
  const sign = new THREE.MeshStandardMaterial({
    map: signMap, emissiveMap: signMap, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.5,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide,
  });
  sign.name = 'tower-sign';
  materials.length = 0;
  materials.push(facade, sign);
  setTowerNight(nightUniform);
  return { facade, trim, metal, glow, sign };
}

/** 0 = day, 1 = full night (atmosphere nightFactor). Lights the windows and the signs. Cheap: call every frame. */
export function setTowerNight(f: number): void {
  const n = Math.max(0, Math.min(1, f));
  if (Math.abs(n - nightUniform) < 0.01 && materials.length && materials[0].userData.lit === true) return;
  nightUniform = n;
  const [facade, sign] = materials;
  if (facade) {
    facade.emissiveIntensity = DAY_GLOW + (NIGHT_GLOW - DAY_GLOW) * n;
    facade.userData.lit = true;
  }
  if (sign) sign.emissiveIntensity = 0.15 + 0.85 * n;
}
