// The water surface shader (docs/roadmaps/gta-water-waves.md, issue 1.2): the water meshes are drawn displaced by exactly
// waves.ts' field, with matching normals, whitecaps on the crests and a colour shift by height. The CPU writes a few
// vec4 uniforms a frame (updateWaveUniforms); the per-vertex aWaveScale attribute (waveAmplitudeScale) keeps the shores
// flat and the rivers nearly still.
import * as THREE from 'three';
import { WAVE_COMPONENTS, waveFoamOn, waveShaderState, waveVisualComponents } from './waves';

export interface WaveUniforms {
  /** One vec4 per component: x = kx, y = kz, z = phase, w = amplitude * sea gain. */
  uWaves: { value: THREE.Vector4[] };
  /** 1 when whitecaps and the height colour shift are on. */
  uWaveFoam: { value: number };
  /** Sum of the amplitudes (the largest possible height at scale 1); the height colour is relative to it. */
  uWaveAmp: { value: number };
}

const N = WAVE_COMPONENTS;
const MIN_AMP = 0.0001;
const scratch = new Float32Array(4 * N);

/** The uniforms, made once and shared by every water material. */
export function createWaveUniforms(): WaveUniforms {
  const vecs: THREE.Vector4[] = [];
  for (let i = 0; i < N; i++) vecs.push(new THREE.Vector4());
  return { uWaves: { value: vecs }, uWaveFoam: { value: 0 }, uWaveAmp: { value: MIN_AMP } };
}

/** Fill the uniforms for time t. No allocation: the Vector4s are reused. */
export function updateWaveUniforms(u: WaveUniforms, t: number): void {
  waveShaderState(t, scratch, waveVisualComponents());
  const vecs = u.uWaves.value;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const kx = scratch[4 * i], kz = scratch[4 * i + 1], ph = scratch[4 * i + 2], amp = scratch[4 * i + 3];
    vecs[i].set(kx, kz, ph, amp);
    sum += amp;
  }
  u.uWaveFoam.value = waveFoamOn() ? 1 : 0;
  u.uWaveAmp.value = Math.max(MIN_AMP, sum);
}

/**
 * Patches a MeshStandardMaterial so its surface is displaced by the wave field. The material needs an `aWaveScale`
 * vertex attribute (waterMesh.ts sets it). Vertex: height and analytic normal from the same sines as waves.ts.
 * Fragment: a colour shift by height and whitecaps on the crests.
 */
export function applyWaveShader(mat: THREE.MeshStandardMaterial, u: WaveUniforms): void {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec4 uWaves[${N}];
attribute float aWaveScale;
varying float vWaveH;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `float wh = 0.0;
    vec2 wg = vec2(0.0);
    for (int i = 0; i < ${N}; i++) {
      vec4 c = uWaves[i];
      float a = c.w * aWaveScale;
      float ph = c.x * position.x + c.y * position.z - c.z;
      wh += a * sin(ph);
      wg += a * cos(ph) * c.xy;
    }
    vWaveH = wh;
    vec3 objectNormal = normalize(vec3(-wg.x, 1.0, -wg.y));
    #ifdef USE_TANGENT
      vec3 objectTangent = vec3( tangent.xyz );
    #endif`,
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y += wh;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uWaveFoam;\nuniform float uWaveAmp;\nvarying float vWaveH;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  float hn = clamp(vWaveH / uWaveAmp, -1.0, 1.0);
  diffuseColor.rgb *= 1.0 + 0.18 * hn;
  if (uWaveFoam > 0.5) {
    float crest = smoothstep(0.32, 0.7, hn) * smoothstep(0.08, 0.3, uWaveAmp);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 0.95), crest * 0.7);
  }`,
      );
  };
  const own = Object.prototype.hasOwnProperty.call(mat, 'customProgramCacheKey') ? mat.customProgramCacheKey : null;
  mat.customProgramCacheKey = () => (own ? `${own.call(mat)}|gta-waves` : 'gta-waves');
}
