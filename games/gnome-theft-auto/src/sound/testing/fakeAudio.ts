// A tiny fake AudioContext for unit tests: records every source node and when it is told to stop.
// Supports the nodes recipes may use: Gain, Oscillator, BufferSource, BiquadFilter, StereoPanner, Delay, WaveShaper.

export interface FakeSource { kind: string; started: number | null; stopped: number | null }

class FakeParam {
  value = 0;
  setValueAtTime(v: number): this { this.value = v; return this; }
  linearRampToValueAtTime(v: number): this { this.value = v; return this; }
  exponentialRampToValueAtTime(v: number): this {
    if (!(v > 0)) throw new RangeError('exponentialRampToValueAtTime needs a positive value');
    this.value = v;
    return this;
  }
  setTargetAtTime(v: number): this { this.value = v; return this; }
  cancelScheduledValues(): this { return this; }
  setValueCurveAtTime(): this { return this; }
}

class FakeNode {
  connect<T>(n: T): T { return n; }
  disconnect(): void {}
}

export function createFakeAudio(): { ctx: AudioContext; sources: FakeSource[] } {
  const sources: FakeSource[] = [];
  const source = (kind: string) => {
    const rec: FakeSource = { kind, started: null, stopped: null };
    sources.push(rec);
    return Object.assign(new FakeNode(), {
      onended: null as null | (() => void),
      start(t = 0) { rec.started = t; },
      stop(t = 0) { rec.stopped = t; },
    });
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    destination: new FakeNode(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBiquadFilter: () => Object.assign(new FakeNode(), { type: 'lowpass', frequency: new FakeParam(), Q: new FakeParam(), gain: new FakeParam() }),
    createStereoPanner: () => Object.assign(new FakeNode(), { pan: new FakeParam() }),
    createDelay: () => Object.assign(new FakeNode(), { delayTime: new FakeParam() }),
    createWaveShaper: () => Object.assign(new FakeNode(), { curve: null as Float32Array | null, oversample: 'none' }),
    createOscillator: () => Object.assign(source('osc'), { type: 'sine', frequency: new FakeParam(), detune: new FakeParam() }),
    createBufferSource: () => Object.assign(source('buffer'), { buffer: null, loop: false, playbackRate: new FakeParam() }),
    createBuffer: (_ch: number, len: number) => {
      const data = new Float32Array(len);
      return { length: len, getChannelData: () => data };
    },
  };
  return { ctx: ctx as unknown as AudioContext, sources };
}
