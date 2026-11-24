import { describe, expect, it, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createWaveUniforms, updateWaveUniforms } from './waveShader';
import { resetWaves, waveShaderState, waveVisualComponents, WAVE_COMPONENTS } from './waves';

describe('waveShader uniforms', () => {
  beforeEach(() => resetWaves());

  it('updateWaveUniforms fills the vec4s from waveShaderState', () => {
    const u = createWaveUniforms();
    updateWaveUniforms(u, 123.4);
    const ref = new Float32Array(4 * WAVE_COMPONENTS);
    waveShaderState(123.4, ref, waveVisualComponents());
    for (let i = 0; i < WAVE_COMPONENTS; i++) {
      const v = u.uWaves.value[i];
      expect(v.x).toBeCloseTo(ref[4 * i], 5);
      expect(v.y).toBeCloseTo(ref[4 * i + 1], 5);
      expect(v.z).toBeCloseTo(ref[4 * i + 2], 5);
      expect(v.w).toBeCloseTo(ref[4 * i + 3], 5);
    }
    expect(u.uWaveAmp.value).toBeGreaterThan(0);
  });

  it('makes no new Vector4 objects on update', () => {
    const u = createWaveUniforms();
    const before = u.uWaves.value.slice();
    updateWaveUniforms(u, 123.4);
    updateWaveUniforms(u, 500.0);
    expect(u.uWaves.value.length).toBe(WAVE_COMPONENTS);
    u.uWaves.value.forEach((v, i) => {
      expect(v).toBe(before[i]);
      expect(v).toBeInstanceOf(THREE.Vector4);
    });
  });
});
