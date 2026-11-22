// Cel shading, Jet Set Radio style: flat 3-band toon materials and thick ink outlines (inverted hull).
// Every view module builds its materials through these, so the whole world shares one look.
import * as THREE from 'three';
import { PALETTE } from '../config';

/** Three hard bands: shadow, mid, lit. */
export const GRADIENT: THREE.DataTexture = (() => {
  const data = new Uint8Array([40, 40, 40, 255, 145, 145, 145, 255, 255, 255, 255, 255]);
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
          vec4 mvPosition = vec4(p, 1.0);
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
          #endif
          mvPosition = modelViewMatrix * mvPosition;
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

export interface ToonifyOpts {
  includeBasic?: boolean;
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

/**
 * Turns every MeshStandardMaterial or MeshLambertMaterial (and optionally MeshBasicMaterial) under root into a toon
 * material (keeping vertexColors and instancing), and outlines each mesh (used for the shared gnome model and
 * @lawn/prefabs props). Transparent parts (glasses lenses) keep their transparency and get no outline.
 */
export function toonify(root: THREE.Object3D, thickness = 0.018, opts: ToonifyOpts = {}): void {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name !== 'outline') meshes.push(o as THREE.Mesh);
  });
  for (const mesh of meshes) {
    const src = mesh.material as THREE.MeshStandardMaterial & THREE.MeshLambertMaterial & THREE.MeshBasicMaterial;
    const isBasic = Boolean(src?.isMeshBasicMaterial);
    if (!src || (!src.isMeshStandardMaterial && !src.isMeshLambertMaterial && !(isBasic && (opts.includeBasic || opts.emissive !== undefined)))) {
      continue;
    }
    const transparent = src.transparent;
    const color = opts.color ?? (isBasic && opts.emissive !== undefined ? opts.emissive : src.color.getHex());
    const useVertexColors =
      opts.color === undefined &&
      !(isBasic && opts.emissive !== undefined) &&
      Boolean(src.vertexColors && mesh.geometry.getAttribute('color'));
    mesh.material = toonMat(color, {
      transparent,
      opacity: src.opacity,
      vertexColors: useVertexColors,
      emissive: opts.emissive,
      emissiveIntensity: opts.emissiveIntensity,
    });
    if (transparent) continue;
    if (mesh instanceof THREE.InstancedMesh) {
      const o = new THREE.InstancedMesh(mesh.geometry, outlineMat(thickness), mesh.count);
      o.name = 'outline';
      o.instanceMatrix = mesh.instanceMatrix;
      o.castShadow = false;
      o.receiveShadow = false;
      o.frustumCulled = mesh.frustumCulled;
      if (mesh.boundingSphere) o.boundingSphere = mesh.boundingSphere.clone();
      mesh.add(o);
    } else {
      addOutline(mesh, thickness);
    }
  }
}
