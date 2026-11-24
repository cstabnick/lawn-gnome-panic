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

/** Shared raking directional sun vector (~29 deg elevation) so terrain slopes cross cel bands. */
export const SUN_DIR = new THREE.Vector3(0.82, 0.48, 0.32).normalize();

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
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide,
      fog: true,
    });
    outlineCache.set(key, m);
  }
  return m;
}

const groundCache = new Map<boolean, THREE.ShaderMaterial>();
/**
 * High-contrast 3-band cel-shaded terrain material with crisp ink perimeter borders, curvature/cliff creases,
 * and subtle anti-aliased elevation contour lines.
 */
export function groundToonMat(snow: boolean): THREE.ShaderMaterial {
  const existing = groundCache.get(snow);
  if (existing) return existing;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        sunDir: { value: SUN_DIR.clone() },
        inkColor: { value: new THREE.Color(PALETTE.ink) },
        shadowTint: { value: new THREE.Color(snow ? 0x3b4d8a : 0x3a1878) },
        contourStep: { value: 7.0 },
        snowMode: { value: snow ? 1.0 : 0.0 },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 color;
      attribute float aEdge;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vEdge;
      void main() {
        vColor = color;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vEdge = aEdge;
        vec4 mvPosition = viewMatrix * worldPos;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 sunDir;
      uniform vec3 inkColor;
      uniform vec3 shadowTint;
      uniform float contourStep;
      uniform float snowMode;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vEdge;
      void main() {
        vec3 n = normalize(vNormal);
        float ndl = dot(n, normalize(sunDir));
        float fw = max(fwidth(ndl), 0.002);
        float b1 = smoothstep(0.36 - fw, 0.36 + fw, ndl);
        float b2 = smoothstep(0.60 - fw, 0.60 + fw, ndl);

        vec3 shadowCol = mix(vColor * 0.42, shadowTint * 0.62, 0.42);
        vec3 midCol = vColor * 0.80;
        vec3 litCol = min(vColor * 1.08, vec3(1.0));
        vec3 col = mix(mix(shadowCol, midCol, b1), litCol, b2);

        float dist = length(cameraPosition - vWorldPos);
        float nearFade = 1.0 - smoothstep(120.0, 320.0, dist);
        float bandLine = (1.0 - smoothstep(0.0, fw * 1.6 + 0.01, abs(ndl - 0.36))) * 0.35;

        // Perimeter ink border & rim shoulder
        float efw = max(fwidth(vEdge), 0.002);
        float rimShade = smoothstep(0.87 - efw, 0.88 + efw, vEdge);
        col = mix(col, shadowCol, rimShade * 0.55);
        float innerRimLine = (1.0 - smoothstep(0.0, efw * 1.5 + 0.008, abs(vEdge - 0.88))) * 0.55 * nearFade;
        float outerRimInk = smoothstep(0.955 - efw, 0.965 + efw, vEdge);

        // Curvature / ridge / cliff-lip ink creases
        float curv = length(dFdx(n)) + length(dFdy(n));
        float creaseInk = smoothstep(0.09, 0.22, curv) * 0.85 * nearFade;

        // Cliff / steep-slope ink edge
        float steep = 1.0 - n.y;
        float sfw = max(fwidth(steep), 0.003);
        float cliffEdge = (1.0 - smoothstep(0.0, sfw * 1.8 + 0.015, abs(steep - 0.28))) * 0.75 * nearFade;

        // Anti-aliased topographic elevation contour lines
        float h = vWorldPos.y / contourStep;
        float hfw = fwidth(h);
        float cLine = 1.0 - smoothstep(0.0, max(hfw * 1.35, 0.012), abs(fract(h + 0.5) - 0.5));
        float contourInk = cLine * 0.38 * (1.0 - smoothstep(90.0, 260.0, dist)) * (1.0 - smoothstep(0.18, 0.40, hfw));

        float ink = clamp(
          max(max(outerRimInk, innerRimLine), max(max(creaseInk, cliffEdge), max(contourInk, bandLine * nearFade))),
          0.0,
          1.0
        );
        col = mix(col, inkColor, ink);

        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.FrontSide,
    fog: true,
  });
  groundCache.set(snow, mat);
  return mat;
}

/** Adds an ink outline to a mesh (a child sharing its geometry). Returns the outline mesh. */
export function addOutline(mesh: THREE.Mesh, thickness = 0.04, color: number = PALETTE.ink): THREE.Mesh {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(thickness, color));
  o.name = 'outline';
  o.castShadow = false;
  o.receiveShadow = false;
  // BackSide inverted-hull shares geometry with its parent and extrudes in the vertex shader, so CPU coplanar audits see gap 0.
  o.userData.zfightOk = true;
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
      // BackSide inverted-hull shares geometry with its parent and extrudes in the vertex shader, so CPU coplanar audits see gap 0.
      o.userData.zfightOk = true;
      mesh.add(o);
    } else {
      addOutline(mesh, thickness);
    }
  }
}
