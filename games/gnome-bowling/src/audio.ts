// Sound effects and gnome voices, all generated in code (WebAudio + speech synthesis).
// Add `#mute` to the URL to silence everything.
import type { BallResult, Ctx, Phase, ResultKind, SimEvent, System } from './config';

/** UI and one-shot sounds other systems may trigger. */
export type SfxName = 'click' | 'tick' | 'swoosh' | 'thud';

// =====================================================================
// Context and helpers
// =====================================================================

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let whiteBuf: AudioBuffer | null = null;
let brownBuf: AudioBuffer | null = null;

/** One-shots (pin hits, yelps) that are still sounding; capped so a big crash cannot flood the mix. */
let active = 0;
const MAX_ONESHOTS = 12;

function muted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

/** True once audio is unlocked and not muted. */
function live(): boolean {
  return ac !== null && master !== null && !muted();
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function makeNoise(seconds: number, brown: boolean): AudioBuffer {
  const a = ac!;
  const n = Math.floor(a.sampleRate * seconds);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = w;
    }
  }
  return buf;
}

function noiseSrc(brown = false, loop = false): AudioBufferSourceNode {
  const s = ac!.createBufferSource();
  s.buffer = brown ? brownBuf : whiteBuf;
  s.loop = loop;
  return s;
}

function oneshotSlot(): boolean {
  return active < MAX_ONESHOTS;
}

/** Counts a one-shot as sounding until it ends. */
function track(node: AudioScheduledSourceNode): void {
  active++;
  node.onended = () => {
    active--;
  };
}

/** Attack-then-exponential-decay envelope on a gain param. */
function env(g: AudioParam, t: number, peak: number, attack: number, dur: number): void {
  const p = Math.max(0.0001, peak);
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(p, t + Math.max(0.001, attack));
  g.exponentialRampToValueAtTime(0.0001, t + dur);
}

function filt(type: BiquadFilterType, freq: number, q = 1): BiquadFilterNode {
  const f = ac!.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** A decaying sine tone from f0 to f1. `when` is seconds from now. */
function tone(f0: number, f1: number, dur: number, peak: number, when = 0, type: OscillatorType = 'sine'): OscillatorNode {
  const a = ac!;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain();
  env(g.gain, t, peak, 0.003, dur);
  o.connect(g);
  g.connect(master!);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

/** A short filtered noise burst. Optional freqEnd sweeps the filter. */
function burst(
  dur: number,
  peak: number,
  when: number,
  type: BiquadFilterType,
  freq: number,
  q: number,
  freqEnd?: number,
): AudioBufferSourceNode {
  const a = ac!;
  const t = a.currentTime + when;
  const s = noiseSrc();
  const f = filt(type, freq, q);
  if (freqEnd !== undefined) {
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  }
  const g = a.createGain();
  env(g.gain, t, peak, Math.min(0.005, dur * 0.2), dur);
  s.connect(f);
  f.connect(g);
  g.connect(master!);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
  return s;
}

// =====================================================================
// Gnome gibberish: sawtooth through two formant filters, syllable by syllable
// =====================================================================

/** Vowel formant pairs (F1, F2) for a, o, u, e. */
const VOWELS: [number, number][] = [
  [800, 1200],
  [500, 900],
  [350, 800],
  [500, 1900],
];

/**
 * Gnome gibberish. `when` seconds from now, `dur` seconds long, `syll` syllables,
 * `f0` base pitch in Hz, `glide` pitch ratio at each syllable's end (>1 up, <1 down), `level` 0..1.
 */
function gibber(
  when: number,
  dur: number,
  syll: number,
  f0: number,
  glide: number,
  level: number,
  wave: OscillatorType = 'sawtooth',
): OscillatorNode {
  const a = ac!;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  osc.type = wave;
  const vg = a.createGain();
  vg.gain.value = 0.0001;
  const f1 = filt('bandpass', 800, 5);
  const f2 = filt('bandpass', 1200, 7);
  const mix = a.createGain();
  mix.gain.value = level;
  osc.connect(vg);
  vg.connect(f1);
  vg.connect(f2);
  f1.connect(mix);
  f2.connect(mix);
  mix.connect(master!);

  const seg = dur / syll;
  for (let i = 0; i < syll; i++) {
    const s = t0 + i * seg;
    const e = s + seg;
    const v = VOWELS[Math.floor(Math.random() * VOWELS.length)];
    f1.frequency.setValueAtTime(v[0], s);
    f2.frequency.setValueAtTime(v[1], s);
    const p0 = f0 * rand(0.92, 1.08);
    osc.frequency.setValueAtTime(p0, s);
    osc.frequency.linearRampToValueAtTime(p0 * glide, e);
    vg.gain.setValueAtTime(0.0001, s);
    vg.gain.exponentialRampToValueAtTime(1, s + seg * 0.25);
    vg.gain.exponentialRampToValueAtTime(0.0001, e);
  }
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  return osc;
}

// =====================================================================
// Speech (Web Speech API), layered on top of the gibberish
// =====================================================================

function say(text: string, pitch: number): void {
  if (!live() || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = pitch;
    u.rate = rand(1.15, 1.3);
    u.volume = 1;
    const en = synth.getVoices().find((v) => v.lang.startsWith('en'));
    if (en) u.voice = en;
    synth.speak(u);
  } catch {
    // speech unavailable: the gibberish still plays
  }
}

/** Stable per-player speech pitch, 1.5 to 2.0. */
function pitchFor(idx: number): number {
  return 1.5 + ((idx * 0.17) % 0.5);
}

// =====================================================================
// Public sfx
// =====================================================================

/** Unlocks audio; call from any pointerdown / keydown handler. Safe to call many times. */
export function startAudio(): void {
  try {
    if (!ac) {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ac = new Ctor();
      master = ac.createGain();
      master.gain.value = 0.8;
      master.connect(ac.destination);
      whiteBuf = makeNoise(2, false);
      brownBuf = makeNoise(4, true);
    }
    if (ac.state === 'suspended') void ac.resume();
  } catch {
    // no audio support: every sound stays a no-op
  }
}

/** Plays a one-shot sound. volume 0..1 (default 1). */
export function sfx(name: SfxName, volume = 1): void {
  if (!live()) return;
  const v = volume;
  switch (name) {
    case 'click':
      tone(1400, 900, 0.035, 0.25 * v);
      break;
    case 'tick':
      tone(2200, 1800, 0.02, 0.12 * v);
      break;
    case 'swoosh':
      burst(0.25, 0.35 * v, 0, 'bandpass', 400, 1.2, 2000);
      break;
    case 'thud':
      tone(80, 40, 0.22, 0.6 * v);
      burst(0.08, 0.3 * v, 0, 'lowpass', 200, 0.7);
      break;
  }
}

// =====================================================================
// Rolling rumble (looping brown noise + a low sine that follows ball speed)
// =====================================================================

interface Rumble {
  src: AudioBufferSourceNode;
  osc: OscillatorNode;
  lfo: OscillatorNode;
  gLow: GainNode;
  gGut: GainNode;
}

let rumble: Rumble | null = null;

function startRumble(): void {
  if (!live() || rumble) return;
  const a = ac!;
  const t = a.currentTime;
  const src = noiseSrc(true, true);
  const lp = filt('lowpass', 180, 0.7);
  const bp = filt('bandpass', 320, 2.5);
  const osc = a.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 40;
  const gLow = a.createGain();
  gLow.gain.value = 0;
  const gGut = a.createGain();
  gGut.gain.value = 0;
  // Gutter rattle: an amplitude wobble on the hollow band.
  const rattle = a.createGain();
  rattle.gain.value = 0.5;
  const lfo = a.createOscillator();
  lfo.frequency.value = 14;
  const lfoAmp = a.createGain();
  lfoAmp.gain.value = 0.5;

  src.connect(lp);
  lp.connect(gLow);
  osc.connect(gLow);
  gLow.connect(master!);
  src.connect(bp);
  bp.connect(gGut);
  gGut.connect(rattle);
  rattle.connect(master!);
  lfo.connect(lfoAmp);
  lfoAmp.connect(rattle.gain);

  src.start(t, Math.random() * 2);
  osc.start(t);
  lfo.start(t);
  rumble = { src, osc, lfo, gLow, gGut };
}

function updateRumble(speed: number, gutter: boolean): void {
  if (!rumble || !ac) return;
  const t = ac.currentTime;
  const amp = Math.min(1, speed / 10);
  rumble.gLow.gain.setTargetAtTime(gutter ? 0 : 0.35 * amp, t, 0.05);
  rumble.gGut.gain.setTargetAtTime(gutter ? 0.3 * amp : 0, t, 0.05);
  rumble.osc.frequency.setTargetAtTime(30 + Math.min(speed, 10) * 3, t, 0.05);
}

function stopRumble(): void {
  if (!rumble || !ac) return;
  const r = rumble;
  rumble = null;
  const t = ac.currentTime;
  r.gLow.gain.setTargetAtTime(0, t, 0.05);
  r.gGut.gain.setTargetAtTime(0, t, 0.05);
  r.src.stop(t + 0.4);
  r.osc.stop(t + 0.4);
  r.lfo.stop(t + 0.4);
}

// =====================================================================
// Pin and lane sounds
// =====================================================================

function crash(): void {
  burst(0.6, 0.6, 0, 'lowpass', 3000, 0.7);
  burst(0.6, 0.45, 0, 'bandpass', 700, 0.8);
  burst(0.3, 0.2, 0, 'highpass', 4000, 0.7);
  track(tone(90, 40, 0.5, 0.5));
}

function cheer(): void {
  const a = ac!;
  const t = a.currentTime;
  const s = noiseSrc();
  const f = filt('bandpass', 1200, 0.7);
  const g = a.createGain();
  env(g.gain, t, 0.25, 0.4, 2.2);
  s.connect(f);
  f.connect(g);
  g.connect(master!);
  s.start(t, Math.random() * 1.5);
  s.stop(t + 2.4);
  for (let i = 0; i < 3; i++) {
    const f0 = rand(350, 550);
    tone(f0, f0 * 2, 0.5, 0.1, rand(0.2, 1.8), 'triangle');
  }
}

function awww(): void {
  burst(1.2, 0.25, 0, 'bandpass', 1000, 0.8, 400);
  tone(500, 250, 1.0, 0.1, 0, 'triangle');
}

function pinsetter(): void {
  burst(0.8, 0.12, 0, 'bandpass', 400, 2, 1200);
  tone(150, 60, 0.12, 0.35, 0.8, 'triangle');
}

/** Gnome yelp from a pin: one short, high, squeaky syllable. */
function yelp(): void {
  if (!oneshotSlot()) return;
  track(gibber(0, rand(0.12, 0.2), 1, rand(700, 1100), rand(1.05, 1.25), 0.5));
}

let yelpCount = 0;
let lastYelpT = -Infinity;
let crashed = false;

/** Pins yelp on the first few hits of a throw, at least 0.08 s apart. */
function maybeYelp(t: number): void {
  if (yelpCount >= 4 || t - lastYelpT < 0.08) return;
  yelpCount++;
  lastYelpT = t;
  yelp();
}

function onRollEvent(e: SimEvent): void {
  if (!live()) return;
  switch (e.kind) {
    case 'ballPin': {
      const v = 0.3 + 0.5 * e.strength;
      if (oneshotSlot()) track(tone(600, 560, 0.12, 0.3 * v));
      burst(0.05, 0.6 * v, 0, 'bandpass', 1800, 3);
      maybeYelp(e.t);
      if (e.strength > 0.5 && !crashed) {
        crashed = true;
        crash();
      }
      break;
    }
    case 'pinPin': {
      if (!oneshotSlot()) break;
      const v = 0.2 + 0.3 * e.strength;
      track(burst(0.04, 0.25 * v, 0, 'bandpass', 2500, 4));
      break;
    }
    case 'pinFall': {
      if (!oneshotSlot()) break;
      const v = 0.3 + 0.4 * e.strength;
      track(tone(120, 60, 0.15, 0.4 * v));
      burst(0.1, 0.25 * v, 0, 'lowpass', 400, 0.7);
      maybeYelp(e.t);
      break;
    }
    case 'gutter':
      tone(200, 120, 0.12, 0.25);
      burst(0.08, 0.35, 0, 'lowpass', 500, 0.7);
      break;
    case 'pit':
      tone(90, 40, 0.25, 0.3);
      break;
    case 'release':
      break;
  }
}

// =====================================================================
// Result lines
// =====================================================================

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

const LINES: Record<ResultKind, string[]> = {
  strike: ['Strike!', 'Steee-rike!', 'Gnome-tastic!', 'All the gnomes are down!', 'Bowl-cut power!'],
  double: ['Double!', 'Two in a row!', 'Double trouble!'],
  turkey: ['Turkey!', 'Gobble gobble, turkey!', 'Three strikes, baby!'],
  hambone: ['Hambone!', 'Somebody stop this gnome!', 'On fire!'],
  spare: ['Spare!', 'Picked it up!', 'Clean-up crew!', 'Nice spare!'],
  gutter: ['Gutter ball!', 'Oh no!', 'Into the ditch!', 'Ugh, gutter!', 'My beard is ashamed.'],
  miss: ['Missed!', 'Not even one?', 'Whoopsie!'],
  split: ['Split!', 'Ooh, a split!', "That's a big gap!"],
  nine: ['So close!', 'Nine! Argh!', 'One stubborn gnome!'],
  pins: ['Meh.', 'Okay…'],
};

const lastLine = new Map<string, string>();

/** A random line for this key, never the same one twice in a row. */
function pickLine(key: string, lines: string[]): string {
  let pool = lines.filter((l) => l !== lastLine.get(key));
  if (pool.length === 0) pool = lines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  lastLine.set(key, line);
  return line;
}

const EXCITED: ResultKind[] = ['strike', 'double', 'turkey', 'hambone', 'spare'];
const SAD: ResultKind[] = ['gutter', 'miss'];
const STRIKE_KINDS: ResultKind[] = ['strike', 'double', 'turkey', 'hambone'];

/** The gnome shouts the result: gibberish always, speech on top when it exists. */
function resultVoice(r: BallResult): void {
  if (!live()) return;
  const kind = r.kind;
  let line: string;
  if (kind === 'pins' && r.count >= 7) {
    line = `${WORDS[r.count] ?? r.count}! Nice!`;
  } else if (kind === 'pins') {
    line = pickLine('pins', [...LINES.pins, `${r.count}.`]);
  } else {
    line = pickLine(kind, LINES[kind]);
  }

  const up = EXCITED.includes(kind) || (kind === 'pins' && r.count >= 7);
  const down = SAD.includes(kind);
  const glide = up ? 1.35 : down ? 0.7 : 1.0;
  const idx = r.player;
  const f0 = 280 + ((idx * 70) % 240);
  const syll = Math.floor(rand(3, 7));
  gibber(0, rand(0.3, 0.8), syll, f0, glide, 0.8);
  say(line, pitchFor(idx));

  if (STRIKE_KINDS.includes(kind)) cheer();
  else if (SAD.includes(kind)) awww();
}

// =====================================================================
// The system: reads state every frame and plays everything itself
// =====================================================================

/** Reads state every frame and plays rolling, pin crashes and the voices by itself. */
export function createAudio(ctx: Ctx): System {
  const s = ctx.state;
  let prev: Phase | null = null;
  let lastRollTime = -1;
  let lastSerial = -1;
  let pending: BallResult | null = null;

  return {
    update() {
      const ph = s.phase;

      if (prev !== ph) {
        if (prev === 'approach' && ph === 'roll') {
          // Release: thud on the lane and a bowler grunt.
          sfx('thud');
          if (live()) gibber(0, 0.25, 1, rand(200, 300), 1.0, 0.7);
        }
        if (ph === 'roll') {
          lastRollTime = -1;
          yelpCount = 0;
          lastYelpT = -Infinity;
          crashed = false;
        }
        if (prev === 'roll') stopRumble();
        if (prev === 'result' && (ph === 'aim' || ph === 'intro')) {
          // Pinsetter resets the rack.
          if (live()) pinsetter();
        }
        if (ph !== 'result') pending = null;
      }

      if (ph === 'roll' && s.sim) {
        const sim = s.sim;
        const rt = s.rollTime;
        const idx = Math.min(Math.floor(rt / sim.sampleDt), sim.ball.length - 1);
        const b = sim.ball[idx];
        const pb = sim.ball[Math.max(0, idx - 1)];
        const speed = idx > 0 ? Math.hypot(b.x - pb.x, b.y - pb.y, b.z - pb.z) / sim.sampleDt : 0;
        const gutter = sim.events.some((e) => e.kind === 'gutter' && e.t <= rt);
        const pit = sim.events.some((e) => e.kind === 'pit' && e.t <= rt);
        const fading = pit || rt >= sim.duration;

        if (fading) {
          stopRumble();
        } else {
          startRumble();
          updateRumble(speed, gutter);
        }

        for (const e of sim.events) {
          if (e.t > lastRollTime && e.t <= rt) onRollEvent(e);
        }
        lastRollTime = rt;
      }

      if (ph === 'result') {
        const r = s.result;
        if (r && r.serial !== lastSerial) {
          lastSerial = r.serial;
          pending = r;
        }
        if (pending && s.phaseTime >= 0.15) {
          const r2 = pending;
          pending = null;
          resultVoice(r2);
        }
      }

      prev = ph;
    },
  };
}

// Unlock audio on the first real user gesture, even if no UI calls startAudio().
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => startAudio(), { once: true });
  window.addEventListener('keydown', () => startAudio(), { once: true });
}
