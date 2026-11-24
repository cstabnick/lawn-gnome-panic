import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSavedWaveDetail, initWaveDetail, parseWaveParam } from './waveOptions';
import { resetWaves, waveDetail } from './waves';

describe('wave options', () => {
  beforeEach(() => resetWaves());
  afterEach(() => vi.unstubAllGlobals());

  it('parses ?waves=', () => {
    expect(parseWaveParam('?waves=0')).toBe('off');
    expect(parseWaveParam('?waves=off')).toBe('off');
    expect(parseWaveParam('?waves=low')).toBe('low');
    expect(parseWaveParam('?waves=1')).toBe('high');
    expect(parseWaveParam('?waves=HIGH')).toBe('high');
    expect(parseWaveParam('?waves=banana')).toBeNull();
    expect(parseWaveParam('?other=1')).toBeNull();
  });

  it('the URL wins and sets the detail', () => {
    initWaveDetail('?waves=0');
    expect(waveDetail()).toBe('off');
  });

  it('falls back to high when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } });
    expect(getSavedWaveDetail()).toBe('high');
    initWaveDetail('');
    expect(waveDetail()).toBe('high');
  });
});
