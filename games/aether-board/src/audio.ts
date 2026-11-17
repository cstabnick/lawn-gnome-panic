// Sound: wind and board hiss by speed, pops, landings, grinds, bails, boost, plus the music.
// Everything is WebAudio made in code, plus a generated track from @lawn/music. No files.
import { BOARD_TRICKS, type PhysEvent, type Player } from './config';
import { buildTrickyTrack, playSong, setMusicVolume, setMuteKey, type TrickyHooks } from '@lawn/music';
import { volume } from './volume';

export interface Audio {
  /** Call from a user gesture (the click that starts the game). Starts the music. */
  unlock(): void;
  update(p: Player, dt: number, events: PhysEvent[]): void;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const SMOOTH = 0.05;

interface Loops {
  windFilter: BiquadFilterNode;
  windGain: GainNode;
  hissGain: GainNode;
  grindGain: GainNode;
  leyGain: GainNode;
}

interface Shape { type: BiquadFilterType; f0: number; f1: number; q?: number }

interface VoiceOpts { attack?: number; release?: number; shape?: Shape; when?: number }

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let loops: Loops | null = null;
let started = false;
/** Bed levels (playtest: wind and snow hiss were too loud under the music). */
const WIND_GAIN = 0.26;
const HISS_GAIN = 0.09;

// What the music reacts to (SSX style): muffled in the air, slammed back on landing, scratches on tricks, wide open on
// boost, more layers as your flow builds. The track reads these each 16th; the hooks fire one-shots.
const musicState = { air: false, boost: false, hype: 0 };
const musicHooks: Partial<TrickyHooks> = {};
let lastScratch = 0;
let grindLey = false;
let prevSpeed = 0;

/** White noise, two seconds, shared by every noise source. */
function makeNoise(c: AudioContext): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function loopNoise(c: AudioContext): AudioBufferSourceNode {
  const s = c.createBufferSource();
  s.buffer = noise;
  s.loop = true;
  s.start();
  return s;
}

function smooth(param: AudioParam, value: number, c: AudioContext): void {
  param.setTargetAtTime(value, c.currentTime, SMOOTH);
}

/** Looping beds: wind, board hiss, grind (rail and ley-line). Gains are driven from update(). */
function startLoops(c: AudioContext, out: AudioNode): Loops {
  const src = loopNoise(c);

  const windFilter = c.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 300;
  windFilter.Q.value = 0.8;
  const windGain = c.createGain();
  windGain.gain.value = 0;
  src.connect(windFilter).connect(windGain).connect(out);

  const hissFilter = c.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 1800;
  const hissGain = c.createGain();
  hissGain.gain.value = 0;
  src.connect(hissFilter).connect(hissGain).connect(out);

  // Rail grind: noise scrape plus a low sawtooth growl. One gain for both.
  const grindGain = c.createGain();
  grindGain.gain.value = 0;
  grindGain.connect(out);
  const grindNoise = c.createBiquadFilter();
  grindNoise.type = 'bandpass';
  grindNoise.frequency.value = 2800;
  grindNoise.Q.value = 3;
  src.connect(grindNoise).connect(grindGain);
  const saw = c.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = 90;
  const sawLow = c.createBiquadFilter();
  sawLow.type = 'lowpass';
  sawLow.frequency.value = 400;
  saw.connect(sawLow).connect(grindGain);
  saw.start();

  // Ley-line: two shimmering sines with a 7 Hz tremolo.
  const leyGain = c.createGain();
  leyGain.gain.value = 0;
  leyGain.connect(out);
  const trem = c.createGain();
  trem.gain.value = 0.5;
  trem.connect(leyGain);
  const lfo = c.createOscillator();
  lfo.frequency.value = 7;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 0.5;
  lfo.connect(lfoDepth).connect(trem.gain);
  lfo.start();
  for (const f of [659, 988]) {
    const o = c.createOscillator();
    o.frequency.value = f;
    o.connect(trem);
    o.start();
  }

  return { windFilter, windGain, hissGain, grindGain, leyGain };
}

/** One-shot oscillator or noise voice with an optional swept filter, into dest. */
function voice(
  c: AudioContext, dest: AudioNode, src: AudioScheduledSourceNode, dur: number, peak: number, opts: VoiceOpts = {},
): void {
  const t = c.currentTime + (opts.when ?? 0);
  const attack = Math.min(opts.attack ?? 0.01, dur * 0.5);
  let node: AudioNode = src;
  if (opts.shape) {
    const f = c.createBiquadFilter();
    f.type = opts.shape.type;
    f.Q.value = opts.shape.q ?? 1;
    f.frequency.setValueAtTime(opts.shape.f0, t);
    if (opts.shape.f1 !== opts.shape.f0) f.frequency.exponentialRampToValueAtTime(opts.shape.f1, t + dur);
    node.connect(f);
    node = f;
  }
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  const rel = opts.release ?? dur - attack;
  if (rel < dur - attack) g.gain.setValueAtTime(peak, t + dur - rel); // hold, then release
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g).connect(dest);
  src.start(t);
  src.stop(t + dur + 0.05);
}

/** A sine or other oscillator from f0 to f1 over dur. */
function osc(c: AudioContext, type: OscillatorType, f0: number, f1: number, dur: number, when = 0): OscillatorNode {
  const o = c.createOscillator();
  o.type = type;
  const t = c.currentTime + when;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  return o;
}

function noiseOnce(c: AudioContext): AudioBufferSourceNode {
  const s = c.createBufferSource();
  s.buffer = noise;
  return s;
}

function oneShot(c: AudioContext, e: PhysEvent, dest: AudioNode): void {
  switch (e.e) {
    case 'pop': {
      voice(c, dest, noiseOnce(c), 0.03, 0.4, { shape: { type: 'bandpass', f0: 1800, f1: 1800, q: 1.5 } });
      voice(c, dest, osc(c, 'sine', 140, 70, 0.08), 0.08, 0.4);
      break;
    }
    case 'land': {
      const peak = Math.min(0.8, Math.max(0.2, e.impact / 25));
      voice(c, dest, osc(c, 'sine', 90, 40, 0.18), 0.18, peak);
      if (e.perfect) {
        [880, 1320, 1760].forEach((f, i) => {
          const o = c.createOscillator();
          o.type = 'triangle';
          o.frequency.value = f;
          voice(c, dest, o, 0.2, 0.25, { when: i * 0.05, attack: 0.003 });
        });
      }
      break;
    }
    case 'trickDone': {
      const sweep = noiseOnce(c);
      voice(c, dest, sweep, 0.25, 0.25, {
        shape: { type: 'bandpass', f0: 800, f1: 3000, q: 1.2 }, attack: 0.05,
      });
      const ding = 600 * 2 ** ((BOARD_TRICKS[e.trick].points - 50) / 250);
      voice(c, dest, osc(c, 'sine', ding, ding, 0.5), 0.5, 0.3, { attack: 0.003 });
      break;
    }
    case 'grabStart': {
      voice(c, dest, noiseOnce(c), 0.15, 0.2, {
        shape: { type: 'bandpass', f0: 1000, f1: 2500, q: 1 }, attack: 0.04,
      });
      break;
    }
    case 'bail': {
      voice(c, dest, noiseOnce(c), 0.35, 0.5, { shape: { type: 'bandpass', f0: 800, f1: 800, q: 0.7 } });
      voice(c, dest, osc(c, 'sawtooth', 400, 90, 0.6), 0.6, 0.35, {
        shape: { type: 'lowpass', f0: 1800, f1: 200, q: 2 }, attack: 0.02,
      });
      break;
    }
    case 'boostStart': {
      voice(c, dest, osc(c, 'sawtooth', 200, 1600, 0.35), 0.35, 0.25, {
        shape: { type: 'lowpass', f0: 4000, f1: 4000, q: 1 }, attack: 0.02,
      });
      break;
    }
    case 'warp': {
      // C major swell: two detuned saws per note, filter opening up, slow attack.
      for (const f of [262, 330, 392, 523]) {
        for (const cents of [-8, 8]) {
          const o = osc(c, 'sawtooth', f, f, 3);
          o.detune.value = cents;
          voice(c, dest, o, 3, 0.06, {
            attack: 1, release: 0.9, shape: { type: 'lowpass', f0: 400, f1: 5000, q: 0.8 },
          });
        }
      }
      break;
    }
    case 'grindStart': {
      for (const [f, when] of [[1200, 0], [1700, 0.05]] as const) {
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.value = f;
        voice(c, dest, o, 0.05, 0.2, { when, attack: 0.002 });
      }
      break;
    }
    default:
      break;
  }
}

export function createAudio(): Audio {
  return {
    unlock() {
      if (started) return;
      started = true;
      const muteByHash = (() => {
        try { return location.hash.toLowerCase().includes('mute'); } catch { return false; }
      })();

      try {
        const c = new AudioContext();
        ctx = c;
        void c.resume().catch(() => {});

        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 10;
        comp.ratio.value = 4;
        comp.attack.value = 0.003;
        comp.release.value = 0.25;
        comp.connect(c.destination);

        const m = c.createGain();
        m.connect(comp);
        master = m;
        noise = makeNoise(c);
        loops = startLoops(c, m);

        const syncVolume = (): void => {
          if (master && ctx) {
            smooth(master.gain, muteByHash ? 0 : volume.effective('sounds'), ctx);
          }
          setMusicVolume(volume.effective('music'));
        };
        syncVolume();
        volume.subscribe(syncVolume);
      } catch {
        return; // no audio device: the game still plays
      }

      if (!muteByHash) {
        setMuteKey('aether-board-music-muted');
        setMusicVolume(volume.effective('music'));
        playSong((T, keep, out) => buildTrickyTrack(T, keep, out, (Date.now() & 0xffff) + 1, {
          air: () => musicState.air,
          boost: () => musicState.boost,
          hype: () => musicState.hype,
          hooks: musicHooks,
        }));
      }
    },

    update(p, dt, events) {
      // The music follows the run even before the sound effects are unlocked.
      musicState.air = p.mode === 'air' && p.airT > 0.15;
      musicState.boost = p.boosting;
      musicState.hype = p.flow;
      for (const e of events) {
        if (e.e === 'land' || e.e === 'grindStart') musicHooks.land?.(e.e === 'land' && (e.airT > 0.9 || e.perfect));
        if (e.e === 'bail' || e.e === 'skyfall' || e.e === 'respawn') musicHooks.land?.(false);
        if ((e.e === 'trickDone' || e.e === 'grindSwitch') && p.t - lastScratch > 0.5) {
          lastScratch = p.t;
          musicHooks.scratch?.();
        }
      }
      const c = ctx;
      const lp = loops;
      if (!c || !lp) return;
      const out = master;

      for (const e of events) {
        if (e.e === 'grindStart') grindLey = e.ley;
        else if (e.e === 'grindEnd') grindLey = false;
        if (out) oneShot(c, e, out);
      }

      const sp = p.vel.length();
      const air = p.mode === 'air';
      const ground = p.mode === 'ground';
      const decel = dt > 0 ? (prevSpeed - sp) / dt : 0;
      prevSpeed = sp;
      const braking = ground && decel > 12;

      // Wind: rises with speed, louder in the air.
      smooth(lp.windFilter.frequency, 300 + sp * 22, c);
      smooth(lp.windGain.gain, WIND_GAIN * clamp01(sp / 50) ** 1.5 * (air ? 1.3 : 1), c);

      // Board hiss on the ground, a little more while braking hard.
      const hiss = ground ? HISS_GAIN * clamp01(sp / 30) + (braking ? HISS_GAIN * 0.6 : 0) : 0;
      smooth(lp.hissGain.gain, hiss, c);

      // Grinds: rail growl, or the ley-line shimmer.
      const grinding = p.mode === 'grind';
      smooth(lp.grindGain.gain, grinding && !grindLey ? 0.25 : 0, c);
      smooth(lp.leyGain.gain, grinding && grindLey ? 0.12 : 0, c);
    },
  };
}
