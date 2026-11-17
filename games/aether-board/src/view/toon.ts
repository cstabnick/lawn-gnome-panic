// Cel shading, Jet Set Radio style: flat 3-band toon materials and thick ink outlines (inverted hull).
// Every view module builds its materials through these, so the whole world shares one look.
import * as THREE from 'three';
import { PALETTE } from '../config';

/** Three hard bands: shadow, mid, lit. */
export const GRADIENT: THREE.DataTexture = (() => {
  const data = new Uint8Array([90, 90, 90, 255, 180, 180, 180, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

export interface ToonOpts {
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  vertexColors?: boolean;
}

/** A cel-shaded material. Cached by its options, so reuse is free. */
const cache = new Map<string, THREE.MeshToonMaterial>();
export function toonMat(color: number, o: ToonOpts = {}): THREE.MeshToonMaterial {
  const key = `${color}|${o.emissive ?? 0}|${o.emissiveIntensity ?? 0}|${o.transparent ? 1 : 0}|${o.opacity ?? 1}|${o.side ?? 0}|${o.vertexColors ? 1 : 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({
      color, gradientMap: GRADIENT,
      emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissiveIntensity ?? 1,
      transparent: o.transparent ?? false, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide,
      vertexColors: o.vertexColors ?? false,
    });
    cache.set(key, m);
  }
  return m;
}

const outlineCache = new Map<string, THREE.ShaderMaterial>();
/** Ink outline: the back faces pushed out along their normals (object-space thickness), fogged like the scene. */
export function outlineMat(thickness = 0.04, color: number = PALETTE.ink): THREE.ShaderMaterial {
  const key = `${thickness}|${color}`;
  let m = outlineCache.get(key);
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { color: { value: new THREE.Color(color) }, thickness: { value: thickness } }]),
      vertexShader: /* glsl */ `
        #include <common>
        #include <fog_pars_vertex>
        uniform float thickness;
        void main() {
          vec3 p = position + normal * thickness;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <fog_pars_fragment>
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
          #include <fog_fragment>
        }`,
      side: THREE.BackSide,
      fog: true,
    });
    outlineCache.set(key, m);
  }
  return m;
}

/** Adds an ink outline to a mesh (a child sharing its geometry). Returns the outline mesh. */
export function addOutline(mesh: THREE.Mesh, thickness = 0.04, color: number = PALETTE.ink): THREE.Mesh {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(thickness, color));
  o.name = 'outline';
  o.castShadow = false;
  o.receiveShadow = false;
  mesh.add(o);
  return o;
}

/**
 * Turns every MeshStandardMaterial under root into a toon material of the same colour, and outlines each mesh
 * (used for the shared gnome model). Transparent parts (glasses lenses) keep their transparency and get no outline.
 */
export function toonify(root: THREE.Object3D, thickness = 0.018): void {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name !== 'outline') meshes.push(o as THREE.Mesh);
  });
  for (const mesh of meshes) {
    const src = mesh.material as THREE.MeshStandardMaterial;
    if (!src || !(src as THREE.MeshStandardMaterial).isMeshStandardMaterial) continue;
    const transparent = src.transparent;
    mesh.material = toonMat(src.color.getHex(), { transparent, opacity: src.opacity });
    if (!transparent) addOutline(mesh, thickness);
  }
}
