import type { MonsterState, SimEvent, SimState } from './sim/types';
import { volume } from './volume';

// Everything here is synthesized with WebAudio: oscillators for tones, filtered noise for breath, scrapes and drips.
// Three buses: `master` (the gnome's own sounds: heartbeat, footsteps, lantern, monsters' chatter), `ambient` (the house:
// its drone, creaks, drips and clock, which the Hush silences by ducking it), and the Hush's own ring.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let ringGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

let nextHeartbeatAt = 0;
let lastStepPhase = 0;
let nextCreakAt = 4;
let nextBreathAt = 2;
let nextDripAt = 1;
let nextScrapeAt = 1;
let nextTickAt = 1;

function effectiveGain(): number {
  return 0.55 * volume.effective('sounds');
}

function applyVolume(): void {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(effectiveGain(), ctx.currentTime, 0.02);
}

volume.subscribe(applyVolume);

export function initAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    try {
      ctx = new AudioContext({ sampleRate: 48000 });
    } catch {
      ctx = new AudioContext();
    }
    master = ctx.createGain();
    master.gain.value = effectiveGain();
    master.connect(ctx.destination);

    ambient = ctx.createGain();
    ambient.gain.value = 1;
    ambient.connect(master);

    // Subtle low subterranean house drone
    droneOsc = ctx.createOscillator();
    droneGain = ctx.createGain();
    droneOsc.type = 'triangle';
    droneOsc.frequency.value = 46;
    droneGain.gain.value = 0.08;
    droneOsc.connect(droneGain);
    droneGain.connect(ambient);
    droneOsc.start();

    // The Hush's ring: a thin high whine in the ears when it stands close. Not part of the house, so it is not ducked.
    const ring = ctx.createOscillator();
    ringGain = ctx.createGain();
    ring.type = 'sine';
    ring.frequency.value = 4700;
    ringGain.gain.value = 0;
    ring.connect(ringGain);
    ringGain.connect(master);
    ring.start();
  } catch {
    ctx = null;
    master = null;
    ambient = null;
  }
}

interface OscOpts {
  f0: number;
  f1?: number;
  dur: number;
  type: OscillatorType;
  vol: number;
  delay?: number;
  pan?: number;
  dest?: AudioNode;
}

/** A pitched blip with an exponential fall or rise and a fade out. */
function osc(o: OscOpts): void {
  if (!ctx || !master) return;
  const now = ctx.currentTime + (o.delay ?? 0);
  const node = ctx.createOscillator();
  const g = ctx.createGain();
  node.type = o.type;
  node.frequency.setValueAtTime(Math.max(20, o.f0), now);
  node.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1 ?? o.f0), now + o.dur);
  g.gain.setValueAtTime(o.vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + o.dur);
  node.connect(g);
  connectOut(g, o.pan, o.dest);
  node.start(now);
  node.stop(now + o.dur);
}

function tone(
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  delay = 0,
): void {
  osc({ f0, f1, dur, type, vol, delay });
}

interface NoiseOpts {
  dur: number;
  vol: number;
  type?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  q?: number;
  delay?: number;
  pan?: number;
  dest?: AudioNode;
  attack?: number;
}

/** Filtered white noise with an envelope. The filter can sweep from `freq` to `freqEnd`. */
function noise(o: NoiseOpts): void {
  if (!ctx || !master) return;
  if (!noiseBuf) {
    const len = Math.floor(ctx.sampleRate * 0.4);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const now = ctx.currentTime + (o.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = o.type ?? 'lowpass';
  filter.frequency.setValueAtTime(o.freq ?? 900, now);
  if (o.freqEnd !== undefined) filter.frequency.exponentialRampToValueAtTime(o.freqEnd, now + o.dur);
  filter.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const attack = o.attack ?? 0.004;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(o.vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.001, now + o.dur);
  src.connect(filter);
  filter.connect(g);
  connectOut(g, o.pan, o.dest);
  src.start(now);
  src.stop(now + o.dur + 0.02);
}

function noiseBurst(dur: number, vol: number, lowpass = 900): void {
  noise({ dur, vol, type: 'lowpass', freq: lowpass });
}

function connectOut(node: AudioNode, pan: number | undefined, dest: AudioNode | undefined): void {
  if (!ctx) return;
  const target = dest ?? master;
  if (!target) return;
  if (pan !== undefined && typeof ctx.createStereoPanner === 'function') {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    node.connect(p);
    p.connect(target);
  } else {
    node.connect(target);
  }
}

// --- Where things are, relative to the gnome ---------------------------------------------------------------

function stereoPan(state: SimState, x: number, z: number): { pan: number; dist: number } {
  const p = state.player;
  const dx = x - p.x;
  const dz = z - p.z;
  const dist = Math.hypot(dx, dz);
  // The gnome's right-hand direction, as the engine has it: (cos yaw, -sin yaw)
  const rightX = Math.cos(p.yaw);
  const rightZ = -Math.sin(p.yaw);
  const pan = dist > 0.001 ? ((dx * rightX + dz * rightZ) / dist) * 0.85 : 0;
  return { pan, dist };
}

function nearestOf(state: SimState, pick: (m: MonsterState) => boolean): MonsterState | undefined {
  let best: MonsterState | undefined;
  let bestD = Infinity;
  for (const m of state.monsters) {
    if (!pick(m)) continue;
    const d = Math.hypot(m.x - state.player.x, m.z - state.player.z);
    if (d < bestD) {
      bestD = d;
      best = m;
    }
  }
  return best;
}

function monsterByName(state: SimState, name: string | undefined): MonsterState | undefined {
  return state.monsters.find((m) => m.name === name);
}

// --- The house -----------------------------------------------------------------------------------------------

function creak(state: SimState): void {
  const pan = (Math.random() * 2 - 1) * 0.7;
  noise({
    dur: 1.1 + Math.random() * 0.5,
    vol: 0.05 + Math.random() * 0.03,
    type: 'bandpass',
    freq: 200,
    freqEnd: 460,
    q: 6,
    pan,
    dest: ambient ?? undefined,
    attack: 0.25,
  });
  if (Math.random() < 0.35) {
    // A thump far away in the house
    tone(42, 30, 0.7, 'sine', 0.1, 0.15 + Math.random() * 0.3);
  }
  nextCreakAt = state.time + 5 + Math.random() * 6;
}

function drip(state: SimState, x: number, z: number, dist: number, range: number): void {
  const { pan } = stereoPan(state, x, z);
  const vol = 0.12 * Math.max(0, 1 - dist / range);
  osc({ f0: 1500, f1: 640, dur: 0.07, type: 'sine', vol, pan, dest: ambient ?? undefined });
  osc({ f0: 2100, f1: 1900, dur: 0.03, type: 'sine', vol: vol * 0.5, delay: 0.035, pan, dest: ambient ?? undefined });
}

function clockTick(state: SimState, x: number, z: number, dist: number): void {
  const { pan } = stereoPan(state, x, z);
  const vol = 0.07 * Math.max(0, 1 - dist / 14);
  // Tick, then tock half a second later
  noise({ dur: 0.012, vol: vol * 0.6, type: 'highpass', freq: 3000, pan, dest: ambient ?? undefined });
  osc({ f0: 1500, f1: 1450, dur: 0.02, type: 'triangle', vol: vol * 0.7, delay: 0.5, pan, dest: ambient ?? undefined });
}

// --- The gnome -----------------------------------------------------------------------------------------------

function breath(state: SimState): void {
  const intensity = Math.min(1, (state.director.tension - 0.45) / 0.5);
  noise({
    dur: 0.9,
    vol: 0.03 + intensity * 0.05,
    type: 'bandpass',
    freq: 650,
    freqEnd: 420,
    q: 1.2,
    attack: 0.3,
  });
  nextBreathAt = state.time + 3.4 - intensity * 1.2 + Math.random() * 1.1;
}

function playEvent(ev: SimEvent, state: SimState): void {
  switch (ev.kind) {
    case 'shard_pickup':
      tone(540, 920, 0.22, 'sine', 0.16);
      tone(810, 1220, 0.24, 'triangle', 0.1, 0.06);
      break;
    case 'kiln_shatter':
      noiseBurst(0.35, 0.34, 2400);
      tone(320, 95, 0.4, 'sawtooth', 0.18);
      break;
    case 'acorn_pickup':
      tone(220, 310, 0.14, 'triangle', 0.16);
      break;
    case 'snare_sprung':
      noiseBurst(0.22, 0.38, 1800);
      tone(190, 55, 0.25, 'square', 0.2);
      break;
    case 'snare_hurt':
      noiseBurst(0.25, 0.42, 2000);
      tone(160, 48, 0.3, 'sawtooth', 0.24);
      break;
    case 'bell_rung':
      tone(660, 654, 1.1, 'sine', 0.22);
      tone(990, 982, 0.9, 'sine', 0.12, 0.02);
      break;
    case 'exit_unlocked':
      tone(440, 660, 0.35, 'sine', 0.18);
      tone(660, 880, 0.45, 'sine', 0.16, 0.14);
      break;
    case 'escaped':
      tone(523, 784, 0.4, 'triangle', 0.2);
      tone(784, 1046, 0.6, 'sine', 0.18, 0.18);
      break;
    case 'monster_alert': {
      const m = monsterByName(state, ev.detail);
      const kind = m?.kind;
      if (kind === 'lamplighter') {
        // A match struck on the brass, then the flame catching
        noise({ dur: 0.09, vol: 0.28, type: 'highpass', freq: 3000 });
        tone(1500, 700, 0.12, 'square', 0.04, 0.01);
      } else if (kind === 'hush') {
        // A breath drawn in, sharp and close
        noise({ dur: 0.35, vol: 0.1, type: 'bandpass', freq: 1200, freqEnd: 2000, q: 2, attack: 0.1 });
      } else if (kind === 'crawler') {
        // Claws finding the floorboards
        noise({ dur: 0.18, vol: 0.12, type: 'highpass', freq: 2200 });
        noise({ dur: 0.18, vol: 0.1, type: 'highpass', freq: 2600, delay: 0.09 });
      } else {
        tone(110, 290, 0.42, 'sawtooth', 0.16);
        tone(118, 275, 0.45, 'triangle', 0.12, 0.04);
      }
      break;
    }
    case 'hurt':
    case 'caught':
      noiseBurst(0.28, 0.35, 1100);
      tone(140, 45, 0.35, 'sawtooth', 0.25);
      break;
    case 'lantern_toggle':
      tone(ev.detail === 'on' ? 420 : 240, ev.detail === 'on' ? 580 : 140, 0.08, 'triangle', 0.1);
      break;
    case 'lantern_gutter':
      // A wet fizzle and a pop as the flame goes out
      noise({ dur: 0.16, vol: 0.2, type: 'lowpass', freq: 1100, freqEnd: 300 });
      tone(520, 150, 0.22, 'triangle', 0.13);
      tone(90, 60, 0.12, 'sine', 0.18, 0.08);
      break;
    case 'lantern_relit':
      // A tiny strike and a rising catch
      noise({ dur: 0.03, vol: 0.14, type: 'highpass', freq: 4000 });
      tone(180, 620, 0.18, 'triangle', 0.1, 0.02);
      break;
    case 'hush_brush': {
      // Something soft goes past close by: a breath with no voice in it
      const { pan } = stereoPan(state, ev.x, ev.z);
      noise({ dur: 0.7, vol: 0.12, type: 'bandpass', freq: 1800, freqEnd: 900, q: 1.5, pan, attack: 0.2 });
      break;
    }
  }
}

export function updateAudio(state: SimState): void {
  if (!ctx || !master || !ambient || ctx.state !== 'running') return;

  for (const ev of state.events) {
    playEvent(ev, state);
  }

  // Modulate drone with Director tension & Dream Drag
  if (droneOsc && droneGain) {
    const targetFreq = 44 + state.director.tension * 22 - state.director.dreamDrag * 10;
    const targetVol = 0.05 + state.director.tension * 0.12;
    droneOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
    droneGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
  }

  // The Hush: the house goes quiet around it, and a thin ring creeps in when it is very close
  const hush = nearestOf(state, (m) => m.kind === 'hush');
  const hushDist = hush ? Math.hypot(hush.x - state.player.x, hush.z - state.player.z) : Infinity;
  const duck = hushDist < 6 ? 0.03 : hushDist < 12 ? 0.35 : 1;
  ambient.gain.setTargetAtTime(duck, ctx.currentTime, 0.35);
  if (ringGain) ringGain.gain.setTargetAtTime(hushDist < 4.5 ? 0.012 : 0, ctx.currentTime, 0.25);

  // Heartbeat driven by Director heartbeatRate
  if (state.director.tension > 0.25 && state.time >= nextHeartbeatAt) {
    const period = 60 / Math.max(55, state.director.heartbeatRate);
    nextHeartbeatAt = state.time + period;
    const vol = Math.min(0.26, 0.06 + state.director.tension * 0.2);
    tone(68, 36, 0.12, 'sine', vol);
    tone(58, 32, 0.1, 'sine', vol * 0.7, 0.14);
  }

  // The player's own breath, when the house is tense
  if (state.director.tension > 0.45 && state.time >= nextBreathAt) breath(state);

  // House creaks: settling timber, now and then a distant thump
  if (state.time >= nextCreakAt) creak(state);

  // The Dripping Nanny: drips and claws on the boards, from where it is
  const crawler = nearestOf(state, (m) => m.kind === 'crawler');
  if (crawler) {
    const dist = Math.hypot(crawler.x - state.player.x, crawler.z - state.player.z);
    if (dist < 14 && state.time >= nextDripAt) {
      drip(state, crawler.x, crawler.z, dist, 14);
      nextDripAt = state.time + 0.9 + Math.random() * 0.9;
    }
    if (dist < 9 && crawler.speed > 0.3 && state.time >= nextScrapeAt) {
      const { pan } = stereoPan(state, crawler.x, crawler.z);
      noise({ dur: 0.03, vol: 0.05 * (1 - dist / 9), type: 'highpass', freq: 2600, pan, dest: ambient ?? undefined });
      nextScrapeAt = state.time + 0.16 + Math.random() * 0.12;
    }
  }

  // The grandfather clock in the room: the nearest one ticks at you across the house
  let clock: { x: number; z: number; dist: number } | undefined;
  for (const f of state.furniture) {
    if (f.prefabId !== 'grandfather-clock') continue;
    const dist = Math.hypot(f.x - state.player.x, f.z - state.player.z);
    if (dist < 14 && (!clock || dist < clock.dist)) clock = { x: f.x, z: f.z, dist };
  }
  if (clock && state.time >= nextTickAt) {
    clockTick(state, clock.x, clock.z, clock.dist);
    nextTickAt = state.time + 1;
  }

  // Soft floorboard footstep on stepPhase wrap
  const stepCount = Math.floor(state.player.stepPhase / Math.PI);
  if (stepCount !== lastStepPhase) {
    lastStepPhase = stepCount;
    noiseBurst(0.06, state.player.crouching ? 0.03 : 0.07, 420);
  }
}
