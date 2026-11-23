// The audio controller (phase 1 of docs/design/dayg/soundscape): the only audio integration point. The pure logic lives in
// settings, voices, surfaces, bed and synth; this file wires it to one Web Audio context and to the game bus.
// Nothing here touches the sim or the worker. The context is created inside the first user gesture (mobile needs that).
import type { Bus } from '../game/bus';
import type { DistrictId, Trait, WeatherKind } from '../sim/types';
import { bedFor } from './bed';
import { type AudioSettings, clampSettings, loadSettings, saveSettings } from './settings';
import { surfaceFor, type Surface } from './surfaces';
import { renderStep, renderUi, rng, type UiSound } from './synth';
import { createVoiceBudget, type VoiceBudget, type VoiceKind } from './voices';

// Bus levels in dB (music-ui-and-tech.md 3.2). Ambience and world SFX share the "sfx" slider in phase 1.
const DB = { ui: -14, sfx: -10, ambience: -18 } as const;
const lin = (db: number): number => Math.pow(10, db / 20);
const BED_SECONDS = 4;
const CONTROL_EVERY = 0.25;   // seconds between control-rate updates (the design samples at 4 Hz)

export interface AudioInfo { district: DistrictId | null; traits: readonly Trait[]; night: boolean; weather: WeatherKind }

export interface Audio {
  /** Call inside a user gesture: creates or resumes the context. */
  unlock(): void;
  /** Frame loop: the bed follows the player's district, traits, time of day and weather. */
  tick(dt: number, info: AudioInfo): void;
  /** A UI sound, through the UI bus. */
  ui(kind: UiSound): void;
  getSettings(): AudioSettings;
  setSettings(settings: AudioSettings): void;
  /** Plays a test tap and a footstep, for the settings panel. */
  test(): void;
  running(): boolean;
}

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  ui: GainNode;
  sfx: GainNode;
  bedFilter: BiquadFilterNode;
  bedGain: GainNode;
  lfoGain: GainNode;
}

export function createAudio(deps: { bus: Bus; store?: Parameters<typeof loadSettings>[0] }): Audio {
  let settings: AudioSettings = loadSettings(deps.store);
  let graph: Graph | null = null;
  const budget: VoiceBudget = createVoiceBudget();
  const buffers = new Map<string, AudioBuffer>();
  const live = new Map<number, AudioBufferSourceNode>();
  let nextId = 1;
  let info: AudioInfo = { district: null, traits: [], night: false, weather: 'clear' };
  let acc = 0;

  function build(ctx: AudioContext): Graph {
    const master = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();   // the master limiter: keeps a busy fight under 0 dBFS
    limiter.threshold.value = -1;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    master.connect(limiter);
    limiter.connect(ctx.destination);

    const ui = ctx.createGain();
    ui.connect(master);
    const sfx = ctx.createGain();
    sfx.connect(master);

    // The wind bed: looping noise through a lowpass whose cutoff has a slow swell (an LFO on the filter frequency).
    const sr = ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, sr * BED_SECONDS, sr);
    const data = noiseBuf.getChannelData(0);
    const rand = rng(7);
    for (let i = 0; i < data.length; i++) data[i] = rand() * 0.5;
    const bedSource = ctx.createBufferSource();
    bedSource.buffer = noiseBuf;
    bedSource.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.Q.value = 0.7;
    bedFilter.frequency.value = 800;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0;
    bedSource.connect(bedFilter);
    bedFilter.connect(bedGain);
    bedGain.connect(sfx);
    bedSource.start();

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0;
    lfo.connect(lfoGain);
    lfoGain.connect(bedFilter.frequency);
    lfo.start();

    const g: Graph = { ctx, master, ui, sfx, bedFilter, bedGain, lfoGain };
    applyGains(g);
    return g;
  }

  function applyGains(g: Graph): void {
    const now = g.ctx.currentTime;
    const on = settings.muted ? 0 : 1;
    g.master.gain.setTargetAtTime((settings.master / 100) * on, now, 0.05);
    g.ui.gain.setTargetAtTime(lin(DB.ui) * (settings.ui / 100), now, 0.05);
    g.sfx.gain.setTargetAtTime(lin(DB.sfx) * (settings.sfx / 100), now, 0.05);
  }

  function buffer(key: string, render: (sr: number) => Float32Array): AudioBuffer | null {
    if (!graph) return null;
    const cached = buffers.get(key);
    if (cached) return cached;
    const sr = graph.ctx.sampleRate;
    const samples = render(sr);
    const buf = graph.ctx.createBuffer(1, samples.length, sr);
    buf.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    buffers.set(key, buf);
    return buf;
  }

  function play(buf: AudioBuffer | null, bus: AudioNode, kind: VoiceKind, gain = 1): void {
    if (!graph || !buf || graph.ctx.state !== 'running') return;
    const id = nextId++;
    const r = budget.request(kind, id);
    if (!r.ok) return;
    if (r.stolen !== null) {
      const victim = live.get(r.stolen);
      live.delete(r.stolen);
      try { victim?.stop(); } catch { /* already ended */ }
    }
    const ctx = graph.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (gain !== 1) {
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(g);
      g.connect(bus);
    } else {
      src.connect(bus);
    }
    src.onended = () => { budget.release(id); live.delete(id); };
    live.set(id, src);
    src.start();
  }

  function unlock(): void {
    if (!graph) {
      if (typeof window === 'undefined') return;
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try { graph = build(new Ctor()); } catch { graph = null; return; }
    }
    if (graph.ctx.state !== 'running') void graph.ctx.resume().catch(() => { /* try again on the next gesture */ });
  }

  // Unlock on any real gesture. Capture phase, so the first tap on a panel or the stick counts too.
  if (typeof window !== 'undefined') {
    for (const type of ['pointerup', 'touchend', 'keydown'] as const) {
      window.addEventListener(type, unlock, { capture: true, passive: true });
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) unlock(); });
  }

  // Footsteps: the game's own step noise. The surface comes from the player's region traits.
  deps.bus.on('noise', (e) => {
    if (e.source !== 'step' || !graph) return;
    const surface: Surface = surfaceFor(info.traits);
    const loud = Math.min(1, Math.max(0.2, e.radius / 25));
    play(buffer(`step:${surface}`, (sr) => renderStep(surface, sr, 1)), graph.sfx, 'step', loud);
  });

  const uiSound = (kind: UiSound): void => {
    if (!graph) return;
    play(buffer(`ui:${kind}`, (sr) => renderUi(kind, sr)), graph.ui, 'ui');
  };

  return {
    unlock,
    tick(dt, next) {
      info = next;
      acc += dt;
      if (acc < CONTROL_EVERY || !graph) return;
      acc = 0;
      const g = graph;
      const p = bedFor(info.district, info.traits, info.night, info.weather);
      const now = g.ctx.currentTime;
      g.bedFilter.frequency.setTargetAtTime(p.cutoff, now, 1.5);
      g.lfoGain.gain.setTargetAtTime(p.cutoff * p.gust * 0.5, now, 1.5);
      g.bedGain.gain.setTargetAtTime(p.gain, now, 1.5);
    },
    ui: uiSound,
    getSettings: () => ({ ...settings }),
    setSettings(next) {
      settings = clampSettings(next);
      saveSettings(settings, deps.store);
      if (graph) applyGains(graph);
    },
    test() {
      uiSound('tap');
      if (graph) play(buffer('step:grass', (sr) => renderStep('grass', sr, 1)), graph.sfx, 'step', 0.8);
    },
    running: () => graph?.ctx.state === 'running',
  };
}
